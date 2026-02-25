"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensurePsp22Token = exports.handlePsp22Approval = exports.handlePsp22Transfer = void 0;
const types_1 = require("../types");
const metadata_1 = require("./metadata");
// Handler para tokens PSP22
async function handlePsp22Transfer(blockNumber, index, event) {
    const { event: { data: [contractAddress, from, to, value], }, } = event;
    const tokenAddress = contractAddress.toString();
    const fromAddress = from ? from.toString() : null;
    const toAddress = to.toString();
    const amount = value.toBigInt();
    logger.info(`PSP22 Transfer: ${amount} from ${fromAddress} to ${toAddress} on token ${tokenAddress}`);
    // Ensure token exists
    await ensurePsp22Token(tokenAddress, blockNumber);
    // Create transfer record
    const transfer = types_1.Psp22Transfer.create({
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
exports.handlePsp22Transfer = handlePsp22Transfer;
async function handlePsp22Approval(blockNumber, index, event) {
    const { event: { data: [contractAddress, owner, spender, value], }, } = event;
    logger.info(`PSP22 Approval: ${value} from ${owner} to ${spender} on token ${contractAddress}`);
    // Could implement Psp22Allowance handling here
}
exports.handlePsp22Approval = handlePsp22Approval;
async function ensurePsp22Token(contractAddress, blockNumber) {
    let token = await types_1.Psp22Token.get(contractAddress);
    if (!token) {
        // Buscar metadados do contrato
        const metadata = await (0, metadata_1.fetchPsp22Metadata)(contractAddress);
        token = types_1.Psp22Token.create({
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
        await (0, metadata_1.updateContractMetadata)(contractAddress, "PSP22");
    }
    return token;
}
exports.ensurePsp22Token = ensurePsp22Token;
async function updatePsp22AccountBalance(tokenAddress, accountAddress, amountChange, isIncoming) {
    const accountId = `${tokenAddress}-${accountAddress}`;
    let psp22Account = await types_1.Psp22Account.get(accountId);
    if (!psp22Account) {
        psp22Account = types_1.Psp22Account.create({
            id: accountId,
            tokenId: tokenAddress,
            accountId: accountAddress,
            balance: BigInt(0),
        });
    }
    // Atualizar saldo baseado na transferência
    if (isIncoming) {
        psp22Account.balance = psp22Account.balance + amountChange;
    }
    else {
        psp22Account.balance = psp22Account.balance - amountChange;
        // Garantir que o saldo não fique negativo
        if (psp22Account.balance < 0) {
            psp22Account.balance = BigInt(0);
        }
    }
    logger.info(`Updated PSP22 balance for ${accountAddress} on token ${tokenAddress}: ${psp22Account.balance}`);
    await psp22Account.save();
}
async function ensureSmartContract(contractAddress, standard, blockNumber) {
    let contract = await types_1.SmartContract.get(contractAddress);
    if (!contract) {
        contract = types_1.SmartContract.create({
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
