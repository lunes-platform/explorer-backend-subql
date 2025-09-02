import { SmartContract, ContractCall, ContractEvent } from "../types";
import { SubstrateEvent, SubstrateExtrinsic } from "@subql/types";
import { EventRecord } from "@polkadot/types/interfaces";

// Handler para chamadas de contratos
export async function handleContractCall(
  blockNumber: bigint,
  extrinsic: SubstrateExtrinsic
): Promise<void> {
  if (extrinsic.extrinsic.method.section !== "contracts") {
    return;
  }

  const method = extrinsic.extrinsic.method.method;
  const callerId = extrinsic.extrinsic.signer?.toString() || "Unknown";
  
  logger.info(`Contract call: ${method} by ${callerId} at block ${blockNumber}`);

  let contractAddress = "Unknown";
  let methodName = method;
  let args = "{}";
  let value = BigInt(0);

  try {
    // Extract contract address and other details from extrinsic data
    if (method === "call" && extrinsic.extrinsic.method.args) {
      const argsArray = extrinsic.extrinsic.method.args;
      if (argsArray.length > 0) {
        contractAddress = argsArray[0]?.toString() || "Unknown";
      }
      if (argsArray.length > 1) {
        value = BigInt(argsArray[1]?.toString() || "0");
      }
      if (argsArray.length > 3) {
        methodName = "contract_call";
        args = JSON.stringify(argsArray.slice(3));
      }
    } else if (method === "instantiate_with_code") {
      methodName = "deploy";
      contractAddress = "new_contract";
    }
  } catch (error) {
    logger.warn(`Error parsing contract call: ${error}`);
  }

  // Ensure contract exists (for known contracts)
  if (contractAddress !== "Unknown" && contractAddress !== "new_contract") {
    await ensureSmartContract(contractAddress, "Unknown", blockNumber);
  }

  // Create contract call record
  const contractCall = ContractCall.create({
    id: `${blockNumber.toString()}-${extrinsic.idx}`,
    contractId: contractAddress,
    callerId: callerId,
    method: methodName,
    args: args,
    success: extrinsic.success || false,
    value: value,
    blockNumber: blockNumber,
    timestamp: BigInt(Date.now()),
    extrinsicIndex: extrinsic.idx,
  });

  await contractCall.save();

  // Update contract interaction count
  if (contractAddress !== "Unknown" && contractAddress !== "new_contract") {
    await updateContractInteractionCount(contractAddress);
  }
}

export async function handleContractEvent(
  blockNumber: bigint,
  index: number,
  event: EventRecord
): Promise<void> {
  const section = event.event.section;
  const method = event.event.method;
  
  if (section !== "contracts") {
    return;
  }

  logger.info(`Contract event: ${section}.${method} at block ${blockNumber}`);

  let contractAddress = "Unknown";
  let eventData = JSON.stringify(event.event.data);

  try {
    // Extract contract address from event data
    if (event.event.data && event.event.data.length > 0) {
      // First parameter is often the contract address
      contractAddress = event.event.data[0]?.toString() || "Unknown";
    }
  } catch (error) {
    logger.warn(`Error parsing contract event: ${error}`);
  }

  // Create contract event record
  const contractEvent = ContractEvent.create({
    id: `${blockNumber.toString()}-${index.toString()}`,
    contractId: contractAddress !== "Unknown" ? contractAddress : null,
    eventName: `${section}.${method}`,
    eventData: eventData,
    blockNumber: blockNumber,
    timestamp: BigInt(Date.now()),
    eventIndex: index,
  });

  await contractEvent.save();
}

export async function handleContractInstantiated(
  blockNumber: bigint,
  index: number,
  event: EventRecord
): Promise<void> {
  try {
    const {
      event: {
        data: [deployer, contractAddress],
      },
    } = event;

    const deployerAddress = deployer.toString();
    const newContractAddress = contractAddress.toString();

    logger.info(`Contract instantiated: ${newContractAddress} by ${deployerAddress}`);

    // Create smart contract record
    const contract = SmartContract.create({
      id: newContractAddress,
      contractAddress: newContractAddress,
      deployerId: deployerAddress,
      standard: "Unknown",
      deployedAt: BigInt(Date.now()),
      deployedAtBlock: blockNumber,
      isVerified: false,
      callCount: 0,
    });

    await contract.save();

  } catch (error) {
    logger.warn(`Error handling contract instantiation: ${error}`);
  }
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

async function updateContractInteractionCount(contractAddress: string): Promise<void> {
  const contract = await SmartContract.get(contractAddress);
  
  if (contract) {
    contract.callCount += 1;
    contract.lastInteraction = BigInt(Date.now());
    await contract.save();
  }
}

// Handler para detectar padrão de contrato baseado em eventos
export async function detectContractStandard(contractAddress: string, eventName: string): Promise<void> {
  let standard = "Unknown";
  
  // Detect based on event patterns
  if (eventName.includes("Transfer") || eventName.includes("Approval")) {
    if (eventName.includes("TokenId")) {
      standard = "PSP34"; // NFT
    } else {
      standard = "PSP22"; // Fungible token
    }
  } else if (eventName.includes("TransferSingle") || eventName.includes("TransferBatch")) {
    standard = "PSP37"; // Multi-token
  }

  if (standard !== "Unknown") {
    const contract = await SmartContract.get(contractAddress);
    if (contract && contract.standard === "Unknown") {
      contract.standard = standard;
      await contract.save();
      
      logger.info(`Detected contract standard: ${contractAddress} is ${standard}`);
    }
  }
}