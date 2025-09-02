import { Psp37Contract, Psp37Token, Psp37Transfer, Psp37Account, SmartContract } from "../types";
import { EventRecord, Balance } from "@polkadot/types/interfaces";
import { fetchPsp37Metadata, updateContractMetadata } from "./metadata";

// Handler para tokens PSP37 (Multi-Token)
export async function handlePsp37TransferSingle(
  blockNumber: bigint,
  index: number,
  event: EventRecord
): Promise<void> {
  const {
    event: {
      data: [contractAddress, operator, from, to, tokenId, value],
    },
  } = event;

  const contractAddr = contractAddress.toString();
  const fromAddress = from ? from.toString() : null;
  const toAddress = to.toString();
  const nftTokenId = tokenId.toString();
  const amount = (value as Balance).toBigInt();

  logger.info(`PSP37 Single Transfer: ${amount} of token ${nftTokenId} from ${fromAddress} to ${toAddress} on contract ${contractAddr}`);

  await ensurePsp37Contract(contractAddr, blockNumber);
  await ensurePsp37Token(contractAddr, nftTokenId, blockNumber);

  // Create transfer record
  const transfer = Psp37Transfer.create({
    id: `${blockNumber.toString()}-${index.toString()}`,
    contractId: contractAddr,
    tokenId: nftTokenId,
    fromId: fromAddress || "0x0000000000000000000000000000000000000000",
    toId: toAddress,
    amount: amount,
    blockNumber: blockNumber,
    timestamp: BigInt(Date.now()),
    eventIndex: index,
  });

  await transfer.save();

  // Update account balances
  if (fromAddress) {
    await updatePsp37AccountBalance(contractAddr, nftTokenId, fromAddress, amount, false);
  }
  await updatePsp37AccountBalance(contractAddr, nftTokenId, toAddress, amount, true);
}

export async function handlePsp37TransferBatch(
  blockNumber: bigint,
  index: number,
  event: EventRecord
): Promise<void> {
  const {
    event: {
      data: [contractAddress, operator, from, to, tokenIds, values],
    },
  } = event;

  const contractAddr = contractAddress.toString();
  const fromAddress = from ? from.toString() : null;
  const toAddress = to.toString();
  
  logger.info(`PSP37 Batch Transfer from ${fromAddress} to ${toAddress} on contract ${contractAddr}`);

  await ensurePsp37Contract(contractAddr, blockNumber);

  // Processar arrays de tokenIds e values
  try {
    const tokenIdArray = Array.isArray(tokenIds) ? tokenIds : [tokenIds];
    const valueArray = Array.isArray(values) ? values : [values];

    for (let i = 0; i < tokenIdArray.length && i < valueArray.length; i++) {
      const tokenId = tokenIdArray[i].toString();
      const amount = (valueArray[i] as Balance).toBigInt();

      await ensurePsp37Token(contractAddr, tokenId, blockNumber);

      // Criar registro de transferência individual para cada token
      const transfer = Psp37Transfer.create({
        id: `${blockNumber.toString()}-${index.toString()}-${i.toString()}`,
        contractId: contractAddr,
        tokenId: tokenId,
        fromId: fromAddress || "0x0000000000000000000000000000000000000000",
        toId: toAddress,
        amount: amount,
        blockNumber: blockNumber,
        timestamp: BigInt(Date.now()),
        eventIndex: index,
      });

      await transfer.save();

      // Atualizar saldos das contas
      if (fromAddress) {
        await updatePsp37AccountBalance(contractAddr, tokenId, fromAddress, amount, false);
      }
      await updatePsp37AccountBalance(contractAddr, tokenId, toAddress, amount, true);
    }
  } catch (error) {
    logger.error(`Error processing PSP37 batch transfer: ${error}`);
  }
}

export async function handlePsp37Mint(
  blockNumber: bigint,
  index: number,
  event: EventRecord
): Promise<void> {
  const {
    event: {
      data: [contractAddress, to, tokenId, value],
    },
  } = event;

  const contractAddr = contractAddress.toString();
  const toAddress = to.toString();
  const nftTokenId = tokenId.toString();
  const amount = (value as Balance).toBigInt();

  logger.info(`PSP37 Mint: ${amount} of token ${nftTokenId} minted to ${toAddress} on contract ${contractAddr}`);

  await ensurePsp37Contract(contractAddr, blockNumber);
  await ensurePsp37Token(contractAddr, nftTokenId, blockNumber);
  await updatePsp37AccountBalance(contractAddr, nftTokenId, toAddress, amount, true);
}

export async function ensurePsp37Contract(contractAddress: string, blockNumber: bigint): Promise<Psp37Contract> {
  let contract = await Psp37Contract.get(contractAddress);
  
  if (!contract) {
    // Buscar metadados do contrato
    const metadata = await fetchPsp37Metadata(contractAddress);

    contract = Psp37Contract.create({
      id: contractAddress,
      contractAddress: contractAddress,
      name: metadata.name || "Unknown PSP37 Contract",
      creator: "Unknown",
      createdAt: BigInt(Date.now()),
      createdAtBlock: blockNumber,
      standard: "PSP37",
      metadata: JSON.stringify(metadata),
      verified: false,
    });

    await contract.save();

    // Also create SmartContract record
    await ensureSmartContract(contractAddress, "PSP37", blockNumber);
    
    // Atualizar metadados do contrato
    await updateContractMetadata(contractAddress, "PSP37");
  }

  return contract;
}

async function ensurePsp37Token(contractAddress: string, tokenId: string, blockNumber: bigint): Promise<Psp37Token> {
  const tokenEntityId = `${contractAddress}-${tokenId}`;
  let token = await Psp37Token.get(tokenEntityId);
  
  if (!token) {
    // Determine token type based on token ID or other logic
    let tokenType = "Fungible"; // or "NonFungible"
    
    try {
      // Could query contract to determine token type
      const tokenIdNum = parseInt(tokenId);
      if (tokenIdNum > 1000000) {
        tokenType = "NonFungible";
      }
    } catch (error) {
      // Default to fungible
    }

    token = Psp37Token.create({
      id: tokenEntityId,
      contractId: contractAddress,
      tokenId: tokenId,
      tokenType: tokenType,
      totalSupply: BigInt(0),
      createdAt: BigInt(Date.now()),
      createdAtBlock: blockNumber,
    });

    await token.save();
  }

  return token;
}

async function updatePsp37AccountBalance(contractAddress: string, tokenId: string, accountAddress: string, amountChange: bigint, isIncoming: boolean): Promise<void> {
  const accountId = `${contractAddress}-${tokenId}-${accountAddress}`;
  let psp37Account = await Psp37Account.get(accountId);

  if (!psp37Account) {
    psp37Account = Psp37Account.create({
      id: accountId,
      contractId: contractAddress,
      tokenId: tokenId,
      accountId: accountAddress,
      balance: BigInt(0),
    });
  }

  // Atualizar saldo baseado na transferência
  if (isIncoming) {
    psp37Account.balance = psp37Account.balance + amountChange;
  } else {
    psp37Account.balance = psp37Account.balance - amountChange;
    // Garantir que o saldo não fique negativo
    if (psp37Account.balance < 0) {
      psp37Account.balance = BigInt(0);
    }
  }

  logger.info(`Updated PSP37 balance for ${accountAddress} on token ${contractAddress}:${tokenId}: ${psp37Account.balance}`);
  await psp37Account.save();
}

async function ensureSmartContract(contractAddress: string, standard: string, blockNumber: bigint): Promise<SmartContract> {
  let contract = await SmartContract.get(contractAddress);
  
  if (!contract) {
    contract = SmartContract.create({
      id: contractAddress,
      contractAddress: contractAddress,
      deployerId: "Unknown",
      standard: standard,
      deployedAt: BigInt(Date.now()),
      deployedAtBlock: blockNumber,
      isVerified: false,
      callCount: 0,
    });

    await contract.save();
  }

  return contract;
}