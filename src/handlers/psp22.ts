import { Psp22Token, Psp22Transfer, Psp22Account, SmartContract } from "../types";
import { EventRecord, Balance } from "@polkadot/types/interfaces";
import { fetchPsp22Metadata, updateContractMetadata } from "./metadata";

// Handler para tokens PSP22
export async function handlePsp22Transfer(
  blockNumber: bigint,
  index: number,
  event: EventRecord
): Promise<void> {
  const {
    event: {
      data: [contractAddress, from, to, value],
    },
  } = event;

  const tokenAddress = contractAddress.toString();
  const fromAddress = from ? from.toString() : null;
  const toAddress = to.toString();
  const amount = (value as Balance).toBigInt();

  logger.info(`PSP22 Transfer: ${amount} from ${fromAddress} to ${toAddress} on token ${tokenAddress}`);

  // Ensure token exists
  await ensurePsp22Token(tokenAddress, blockNumber);

  // Create transfer record
  const transfer = Psp22Transfer.create({
    id: `${blockNumber.toString()}-${index.toString()}`,
    tokenId: tokenAddress,
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
    await updatePsp22AccountBalance(tokenAddress, fromAddress, amount, false);
  }
  await updatePsp22AccountBalance(tokenAddress, toAddress, amount, true);
}

export async function handlePsp22Approval(
  blockNumber: bigint,
  index: number,
  event: EventRecord
): Promise<void> {
  const {
    event: {
      data: [contractAddress, owner, spender, value],
    },
  } = event;

  logger.info(`PSP22 Approval: ${value} from ${owner} to ${spender} on token ${contractAddress}`);
  
  // Could implement Psp22Allowance handling here
}

export async function ensurePsp22Token(contractAddress: string, blockNumber: bigint): Promise<Psp22Token> {
  let token = await Psp22Token.get(contractAddress);
  
  if (!token) {
    // Buscar metadados do contrato
    const metadata = await fetchPsp22Metadata(contractAddress);
    
    token = Psp22Token.create({
      id: contractAddress,
      contractAddress: contractAddress,
      name: metadata.name || "Unknown PSP22",
      symbol: metadata.symbol || "UNK",
      decimals: metadata.decimals || 18,
      totalSupply: metadata.totalSupply || BigInt(0),
      creator: "Unknown",
      createdAt: BigInt(Date.now()),
      createdAtBlock: blockNumber,
      standard: "PSP22",
      metadata: JSON.stringify(metadata),
      verified: false,
    });

    await token.save();

    // Also create SmartContract record
    await ensureSmartContract(contractAddress, "PSP22", blockNumber);
    
    // Atualizar metadados do contrato
    await updateContractMetadata(contractAddress, "PSP22");
  }

  return token;
}

async function updatePsp22AccountBalance(tokenAddress: string, accountAddress: string, amountChange: bigint, isIncoming: boolean): Promise<void> {
  const accountId = `${tokenAddress}-${accountAddress}`;
  let psp22Account = await Psp22Account.get(accountId);

  if (!psp22Account) {
    psp22Account = Psp22Account.create({
      id: accountId,
      tokenId: tokenAddress,
      accountId: accountAddress,
      balance: BigInt(0),
    });
  }

  // Atualizar saldo baseado na transferência
  if (isIncoming) {
    psp22Account.balance = psp22Account.balance + amountChange;
  } else {
    psp22Account.balance = psp22Account.balance - amountChange;
    // Garantir que o saldo não fique negativo
    if (psp22Account.balance < 0) {
      psp22Account.balance = BigInt(0);
    }
  }

  logger.info(`Updated PSP22 balance for ${accountAddress} on token ${tokenAddress}: ${psp22Account.balance}`);
  await psp22Account.save();
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