"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectContractStandard = exports.handleContractInstantiated = exports.handleContractEvent = exports.handleContractCall = void 0;
const types_1 = require("../types");
async function ensureAccountExists(address) {
    if (!address || address === 'Unknown')
        return;
    let account = await types_1.Account.get(address);
    if (!account) {
        account = new types_1.Account(address, BigInt(0), 0, 0);
        await account.save();
    }
}
// Handler para chamadas de contratos
async function handleContractCall(blockNumber, extrinsic) {
    var _a, _b, _c;
    if (extrinsic.extrinsic.method.section !== "contracts") {
        return;
    }
    const method = extrinsic.extrinsic.method.method;
    const callerId = ((_a = extrinsic.extrinsic.signer) === null || _a === void 0 ? void 0 : _a.toString()) || "Unknown";
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
                contractAddress = ((_b = argsArray[0]) === null || _b === void 0 ? void 0 : _b.toString()) || "Unknown";
            }
            if (argsArray.length > 1) {
                value = BigInt(((_c = argsArray[1]) === null || _c === void 0 ? void 0 : _c.toString()) || "0");
            }
            if (argsArray.length > 3) {
                methodName = "contract_call";
                args = JSON.stringify(argsArray.slice(3));
            }
        }
        else if (method === "instantiate_with_code") {
            methodName = "deploy";
            contractAddress = "new_contract";
        }
    }
    catch (error) {
        logger.warn(`Error parsing contract call: ${error}`);
    }
    // Ensure caller Account exists (FK: caller: Account!)
    await ensureAccountExists(callerId);
    // Ensure contract exists (FK: contract: SmartContract!)
    // Skip saving ContractCall if we can't resolve a valid contract address
    if (contractAddress === "Unknown" || contractAddress === "new_contract") {
        return;
    }
    await ensureSmartContract(contractAddress, "Unknown", blockNumber, callerId);
    // Create contract call record
    const contractCall = types_1.ContractCall.create({
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
    await updateContractInteractionCount(contractAddress);
}
exports.handleContractCall = handleContractCall;
async function handleContractEvent(blockNumber, index, event) {
    var _a;
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
            contractAddress = ((_a = event.event.data[0]) === null || _a === void 0 ? void 0 : _a.toString()) || "Unknown";
        }
    }
    catch (error) {
        logger.warn(`Error parsing contract event: ${error}`);
    }
    // Create contract event record
    const contractEvent = types_1.ContractEvent.create({
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
exports.handleContractEvent = handleContractEvent;
// ink! selectors = blake2_256("Trait::method")[0..4]
// PSP22Metadata::token_name   = 0x3d261bd4
// PSP22Metadata::token_symbol = 0x34205be5
// PSP22Metadata::token_decimals = 0x7271b782
// PSP22::total_supply         = 0x162df8c2
// PSP34::collection_id        = 0xffa27a5f
const PSP22_TOKEN_NAME_SELECTOR = '0x3d261bd4'; // PSP22Metadata::token_name
const PSP22_TOTAL_SUPPLY_SELECTOR = '0x162df8c2'; // PSP22::total_supply (fallback)
const PSP34_COLLECTION_ID_SELECTOR = '0xffa27a5f'; // PSP34::collection_id
async function tryContractCall(contractAddress, selector) {
    var _a;
    try {
        const result = await api.rpc.contracts.call({
            origin: contractAddress,
            dest: contractAddress,
            value: 0,
            gasLimit: { refTime: 5000000000, proofSize: 131072 },
            storageDepositLimit: null,
            inputData: selector,
        });
        const res = result.toHuman ? result.toHuman() : result;
        return ((_a = res === null || res === void 0 ? void 0 : res.result) === null || _a === void 0 ? void 0 : _a.Ok) !== undefined;
    }
    catch (_b) {
        return false;
    }
}
async function detectInkStandard(contractAddress) {
    // Try PSP22Metadata::token_name first, then PSP22::total_supply as fallback
    const isPsp22 = await tryContractCall(contractAddress, PSP22_TOKEN_NAME_SELECTOR)
        || await tryContractCall(contractAddress, PSP22_TOTAL_SUPPLY_SELECTOR);
    if (isPsp22) {
        logger.info(`[Instantiated] Detected PSP22 for ${contractAddress.slice(0, 10)}...`);
        return 'PSP22';
    }
    const isPsp34 = await tryContractCall(contractAddress, PSP34_COLLECTION_ID_SELECTOR);
    if (isPsp34) {
        logger.info(`[Instantiated] Detected PSP34 for ${contractAddress.slice(0, 10)}...`);
        return 'PSP34';
    }
    return 'Unknown';
}
async function handleContractInstantiated(blockNumber, index, event) {
    try {
        const { event: { data: [deployer, contractAddress], }, } = event;
        const deployerAddress = deployer.toString();
        const newContractAddress = contractAddress.toString();
        logger.info(`[Instantiated] Contract ${newContractAddress.slice(0, 10)}... by ${deployerAddress.slice(0, 10)}...`);
        await ensureAccountExists(deployerAddress);
        let contract = await types_1.SmartContract.get(newContractAddress);
        if (!contract) {
            // Auto-detect PSP standard via dry-run calls
            const standard = await detectInkStandard(newContractAddress);
            contract = types_1.SmartContract.create({
                id: newContractAddress,
                contractAddress: newContractAddress,
                deployerId: deployerAddress,
                standard,
                deployedAt: BigInt(Date.now()),
                deployedAtBlock: blockNumber,
                isVerified: false,
                callCount: 0,
            });
            await contract.save();
            logger.info(`[Instantiated] Registered ${newContractAddress.slice(0, 10)}... as ${standard}`);
        }
    }
    catch (error) {
        logger.warn(`[Instantiated] Error: ${error}`);
    }
}
exports.handleContractInstantiated = handleContractInstantiated;
async function ensureSmartContract(contractAddress, standard, blockNumber, deployerAddress) {
    let contract = await types_1.SmartContract.get(contractAddress);
    if (!contract) {
        // Use provided deployer or create a placeholder account for the contract itself
        const deployerId = deployerAddress || contractAddress;
        await ensureAccountExists(deployerId);
        contract = types_1.SmartContract.create({
            id: contractAddress,
            contractAddress: contractAddress,
            deployerId: deployerId,
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
async function updateContractInteractionCount(contractAddress) {
    const contract = await types_1.SmartContract.get(contractAddress);
    if (contract) {
        contract.callCount += 1;
        contract.lastInteraction = BigInt(Date.now());
        await contract.save();
    }
}
// Handler para detectar padrão de contrato baseado em eventos
async function detectContractStandard(contractAddress, eventName) {
    let standard = "Unknown";
    // Detect based on event patterns
    if (eventName.includes("Transfer") || eventName.includes("Approval")) {
        if (eventName.includes("TokenId")) {
            standard = "PSP34"; // NFT
        }
        else {
            standard = "PSP22"; // Fungible token
        }
    }
    else if (eventName.includes("TransferSingle") || eventName.includes("TransferBatch")) {
        standard = "PSP37"; // Multi-token
    }
    if (standard !== "Unknown") {
        const contract = await types_1.SmartContract.get(contractAddress);
        if (contract && contract.standard === "Unknown") {
            contract.standard = standard;
            await contract.save();
            logger.info(`Detected contract standard: ${contractAddress} is ${standard}`);
        }
    }
}
exports.detectContractStandard = detectContractStandard;
