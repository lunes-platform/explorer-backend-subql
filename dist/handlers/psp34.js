"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensurePsp34Collection = exports.handlePsp34Mint = exports.handlePsp34Transfer = void 0;
const types_1 = require("../types");
const metadata_1 = require("./metadata");
// Handler para NFTs PSP34
async function handlePsp34Transfer(blockNumber, index, event) {
    const { event: { data: [contractAddress, from, to, tokenId], }, } = event;
    const collectionAddress = contractAddress.toString();
    const fromAddress = from ? from.toString() : null;
    const toAddress = to.toString();
    const nftTokenId = tokenId.toString();
    logger.info(`PSP34 Transfer: Token ${nftTokenId} from ${fromAddress} to ${toAddress} on collection ${collectionAddress}`);
    // Ensure collection exists
    await ensurePsp34Collection(collectionAddress, blockNumber);
    // Ensure token exists
    await ensurePsp34Token(collectionAddress, nftTokenId, toAddress, blockNumber);
    // Create transfer record
    const transfer = types_1.Psp34Transfer.create({
        id: `${blockNumber.toString()}-${index.toString()}`,
        collectionId: collectionAddress,
        tokenId: nftTokenId,
        fromId: fromAddress || "0x0000000000000000000000000000000000000000",
        toId: toAddress,
        blockNumber: blockNumber,
        timestamp: BigInt(Date.now()),
        eventIndex: index,
    });
    await transfer.save();
    // Update NFT account balances
    if (fromAddress) {
        await updateNftAccountBalance(collectionAddress, fromAddress, false);
    }
    await updateNftAccountBalance(collectionAddress, toAddress, true);
}
exports.handlePsp34Transfer = handlePsp34Transfer;
async function handlePsp34Mint(blockNumber, index, event) {
    const { event: { data: [contractAddress, to, tokenId], }, } = event;
    const collectionAddress = contractAddress.toString();
    const toAddress = to.toString();
    const nftTokenId = tokenId.toString();
    logger.info(`PSP34 Mint: Token ${nftTokenId} minted to ${toAddress} on collection ${collectionAddress}`);
    await ensurePsp34Collection(collectionAddress, blockNumber);
    await ensurePsp34Token(collectionAddress, nftTokenId, toAddress, blockNumber);
}
exports.handlePsp34Mint = handlePsp34Mint;
async function ensurePsp34Collection(contractAddress, blockNumber) {
    let collection = await types_1.Psp34Collection.get(contractAddress);
    if (!collection) {
        // Buscar metadados da coleção
        const metadata = await (0, metadata_1.fetchPsp34Metadata)(contractAddress);
        collection = types_1.Psp34Collection.create({
            id: contractAddress,
            contractAddress: contractAddress,
            name: metadata.name || "Unknown PSP34 Collection",
            symbol: metadata.symbol || "UNK34",
            creator: "Unknown",
            createdAt: BigInt(Date.now()),
            createdAtBlock: blockNumber,
            totalSupply: BigInt(0),
            standard: "PSP34",
            metadata: JSON.stringify(metadata),
            verified: false,
        });
        await collection.save();
        // Also create SmartContract record
        await ensureSmartContract(contractAddress, "PSP34", blockNumber);
        // Atualizar metadados do contrato
        await (0, metadata_1.updateContractMetadata)(contractAddress, "PSP34");
    }
    return collection;
}
exports.ensurePsp34Collection = ensurePsp34Collection;
async function ensurePsp34Token(collectionAddress, tokenId, ownerAddress, blockNumber) {
    const tokenEntityId = `${collectionAddress}-${tokenId}`;
    let token = await types_1.Psp34Token.get(tokenEntityId);
    if (!token) {
        token = types_1.Psp34Token.create({
            id: tokenEntityId,
            collectionId: collectionAddress,
            tokenId: tokenId,
            ownerId: ownerAddress,
            mintedAt: BigInt(Date.now()),
            mintedAtBlock: blockNumber,
        });
        await token.save();
    }
    else {
        // Update owner
        token.ownerId = ownerAddress;
        await token.save();
    }
    return token;
}
async function updateNftAccountBalance(collectionAddress, accountAddress, isIncoming) {
    const accountId = `${collectionAddress}-${accountAddress}`;
    let nftAccount = await types_1.NftAccount.get(accountId);
    if (!nftAccount) {
        nftAccount = types_1.NftAccount.create({
            id: accountId,
            collectionId: collectionAddress,
            accountId: accountAddress,
            tokenCount: 0,
        });
    }
    // Atualizar contagem de tokens baseado na transferência
    if (isIncoming) {
        nftAccount.tokenCount += 1;
    }
    else {
        nftAccount.tokenCount -= 1;
        // Garantir que a contagem não fique negativa
        if (nftAccount.tokenCount < 0) {
            nftAccount.tokenCount = 0;
        }
    }
    logger.info(`Updated PSP34 token count for ${accountAddress} on collection ${collectionAddress}: ${nftAccount.tokenCount}`);
    await nftAccount.save();
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
