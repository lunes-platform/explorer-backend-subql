import {
  SubstrateBlock,
} from "@subql/types";
import {
  createBlock,
  createEvent,
  createExtrinsic,
  ensureAccount,
  wrapExtrinsics,
  createTransfer,
  createAssetTransfer,
  handlePsp22Transfer,
  handlePsp22Approval,
  handlePsp34Transfer,
  handlePsp34Mint,
  handlePsp37TransferSingle,
  handlePsp37TransferBatch,
  handlePsp37Mint,
  handleContractCall,
  handleContractEvent,
  handleContractInstantiated,
  detectContractStandard,
  handleStakingEvent,
} from "../handlers";
import { Event, Transfer } from "../types";
import { SubstrateEvent, SubstrateExtrinsic } from "@subql/types";

// Handler for individual events (used by event filters)
export async function handleEvent(event: SubstrateEvent): Promise<void> {
  const { event: { section, method } } = event;
  const blockNumber = event.block.block.header.number.toBigInt();
  const eventIndex = event.idx;
  const eventRecord = event as any; // Cast to compatible type
  
  logger.info(`Handling filtered event: ${section}.${method} at block ${blockNumber}`);
  
  try {
    // Handle specific event types
    if (section === "balances" && method === "Transfer") {
      createTransfer(blockNumber, eventIndex, eventRecord);
    }
    else if (section === "assets" && method === "Transferred") {
      await createAssetTransfer(blockNumber, eventIndex, eventRecord);
    }
    else if (section === "contracts" && method === "ContractEmitted") {
      await handleContractEvent(blockNumber, eventIndex, eventRecord);
      
      // Detectar eventos PSP baseado na estrutura dos dados
      try {
        await detectAndHandlePspEvent(blockNumber, eventIndex, eventRecord);
      } catch (error) {
        logger.warn(`Error parsing PSP event: ${error}`);
      }
    }
    else if (section === "contracts" && method === "Instantiated") {
      await handleContractInstantiated(blockNumber, eventIndex, eventRecord);
    }
    else if (section === "uniques" && method === "Transferred") {
      await handlePsp34Transfer(blockNumber, eventIndex, eventRecord);
    }
    
    // Create generic event record
    createEvent(blockNumber, eventIndex, eventRecord);
    
  } catch (error) {
    logger.error(`Error handling event ${section}.${method}: ${error}`);
  }
}

// Handler for individual calls (used by call filters)
export async function handleCall(call: SubstrateExtrinsic): Promise<void> {
  const { extrinsic: { method: { section, method } } } = call;
  const blockNumber = call.block.block.header.number.toBigInt();
  
  logger.info(`Handling filtered call: ${section}.${method} at block ${blockNumber}`);
  
  try {
    if (section === "contracts") {
      await handleContractCall(blockNumber, call);
    }
    
    // Create generic extrinsic record
    createExtrinsic(blockNumber, call);
    
  } catch (error) {
    logger.error(`Error handling call ${section}.${method}: ${error}`);
  }
}

export async function handleBlock(block: SubstrateBlock): Promise<void> {
  // Create block record
  await createBlock(block);
  
  logger.info(`Processing block #${block.block.header.number.toString()} with ${block.events.length} events`);

  // Process all events in block
  const events: Event[] = [];
  const transfers: Transfer[] = [];
  
  for (let idx = 0; idx < block.events.length; idx++) {
    const evt = block.events[idx];
    const { event: { section, method } } = evt;
    
    // Create generic event record
    const eventRecord = createEvent(
      block.block.header.number.toBigInt(),
      idx,
      evt
    );
    events.push(eventRecord);
    
    // Handle specific event types
    try {
      // Native balance transfers
      if (section === "balances" && method === "Transfer") {
        const transfer = createTransfer(
          block.block.header.number.toBigInt(),
          idx,
          evt
        );
        transfers.push(transfer);
      }
      
      // Asset transfers (generic assets module)
      else if (section === "assets" && method === "Transferred") {
        await createAssetTransfer(
          block.block.header.number.toBigInt(),
          idx,
          evt
        );
      }
      
      // Contract Events (including PSP tokens)
      else if (section === "contracts" && method === "ContractEmitted") {
        await handleContractEvent(
          block.block.header.number.toBigInt(),
          idx,
          evt
        );
        
        // Detectar e processar eventos PSP
        try {
          await detectAndHandlePspEvent(
            block.block.header.number.toBigInt(),
            idx,
            evt
          );
        } catch (error) {
          logger.warn(`Error parsing PSP event: ${error}`);
        }
      }
      
      // Contract instantiation
      else if (section === "contracts" && method === "Instantiated") {
        await handleContractInstantiated(
          block.block.header.number.toBigInt(),
          idx,
          evt
        );
      }
      
      // Generic contract events
      else if (section === "contracts") {
        await handleContractEvent(
          block.block.header.number.toBigInt(),
          idx,
          evt
        );
      }
      
    } catch (error) {
      logger.error(`Error processing event ${section}.${method} at ${idx}: ${error}`);
    }
  }

  // Process all extrinsics in block
  const extrinsics = wrapExtrinsics(block);
  
  for (const ext of extrinsics) {
    try {
      // Create extrinsic record
      createExtrinsic(block.block.header.number.toBigInt(), ext);
      
      // Handle contract calls
      if (ext.extrinsic.method.section === "contracts") {
        await handleContractCall(
          block.block.header.number.toBigInt(),
          ext
        );
      }
    } catch (error) {
      logger.error(`Error processing extrinsic ${ext.idx}: ${error}`);
    }
  }

  // Update account balances
  const accountIDs = new Set<string>();
  extrinsics.forEach((e) => {
    if (e.extrinsic.signer) {
      accountIDs.add(e.extrinsic.signer.toString());
    }
  });
  
  transfers.forEach((t) => {
    accountIDs.add(t.fromId);
    accountIDs.add(t.toId);
  });

  // Update native token balances
  for (const accountId of accountIDs) {
    try {
      const data = await api.query.system.account(accountId);
      await ensureAccount(accountId, BigInt(data.data.free.toString()));
    } catch (error) {
      logger.warn(`Error querying account ${accountId}: ${error}`);
    }
  }
  
  logger.info(`Processed block #${block.block.header.number.toString()}: ${events.length} events, ${transfers.length} transfers, ${extrinsics.length} extrinsics`);
}

// Função para detectar e processar eventos PSP baseado na estrutura dos dados
async function detectAndHandlePspEvent(blockNumber: bigint, eventIndex: number, eventRecord: any): Promise<void> {
  try {
    const eventData = eventRecord.event.data;
    
    // Verificar se é um evento de contrato com dados suficientes
    if (!eventData || eventData.length < 2) {
      return;
    }

    // Tentar detectar o tipo de evento PSP baseado no número e tipo de parâmetros
    const dataLength = eventData.length;
    
    // PSP22 Transfer: contractAddress, from, to, value (4 parâmetros)
    if (dataLength === 4) {
      const [contractAddress, from, to, value] = eventData;
      
      // Verificar se parece com transferência PSP22 (endereços + valor)
      if (contractAddress && to && value) {
        logger.info(`Detected potential PSP22 Transfer event`);
        await handlePsp22Transfer(blockNumber, eventIndex, eventRecord);
        return;
      }
    }
    
    // PSP34 Transfer: contractAddress, from, to, tokenId (4 parâmetros)
    // PSP22 Approval: contractAddress, owner, spender, value (4 parâmetros)
    else if (dataLength === 4) {
      const [contractAddress, param1, param2, param3] = eventData;
      
      // Tentar detectar se é PSP34 baseado na presença de tokenId
      try {
        const tokenIdStr = param3.toString();
        // Se o terceiro parâmetro parece ser um ID de token (não um valor muito grande)
        if (tokenIdStr.length < 20 && !tokenIdStr.includes('.')) {
          logger.info(`Detected potential PSP34 Transfer event`);
          await handlePsp34Transfer(blockNumber, eventIndex, eventRecord);
          return;
        }
      } catch (error) {
        // Se falhar, pode ser PSP22 Approval
        logger.info(`Detected potential PSP22 Approval event`);
        await handlePsp22Approval(blockNumber, eventIndex, eventRecord);
      }
    }
    
    // PSP37 TransferSingle: contractAddress, operator, from, to, tokenId, value (6 parâmetros)
    else if (dataLength === 6) {
      logger.info(`Detected potential PSP37 TransferSingle event`);
      await handlePsp37TransferSingle(blockNumber, eventIndex, eventRecord);
      return;
    }
    
    // PSP37 TransferBatch: contractAddress, operator, from, to, tokenIds[], values[] (6 parâmetros com arrays)
    else if (dataLength >= 6) {
      const [contractAddress, operator, from, to, tokenIds, values] = eventData;
      
      // Verificar se tokenIds e values são arrays
      if (Array.isArray(tokenIds) || Array.isArray(values)) {
        logger.info(`Detected potential PSP37 TransferBatch event`);
        await handlePsp37TransferBatch(blockNumber, eventIndex, eventRecord);
        return;
      }
    }
    
    // PSP34 Mint: contractAddress, to, tokenId (3 parâmetros)
    else if (dataLength === 3) {
      logger.info(`Detected potential PSP34 Mint event`);
      await handlePsp34Mint(blockNumber, eventIndex, eventRecord);
      return;
    }
    
  } catch (error) {
    logger.warn(`Error in PSP event detection: ${error}`);
  }
}