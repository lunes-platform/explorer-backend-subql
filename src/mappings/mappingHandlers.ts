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
  ensurePsp22Token,
  ensurePsp34Collection,
} from "../handlers";
import { Asset, Psp34Collection, Psp34Token, NftAccount, SmartContract, Transfer } from "../types";
import { SubstrateEvent, SubstrateExtrinsic } from "@subql/types";

// Main block handler — processes ALL events and extrinsics from within the block.
// This approach uses block.events directly (already fetched with the block),
// avoiding separate RPC calls that can timeout on rate-limited endpoints.
export async function handleBlock(block: SubstrateBlock): Promise<void> {
  const blockNumber = block.block.header.number.toBigInt();

  // Create block record
  await createBlock(block);

  // Process all events in block
  const transfers: any[] = [];

  for (let idx = 0; idx < block.events.length; idx++) {
    const evt = block.events[idx] as any;
    const { event: { section, method } } = evt;

    // Create generic event record
    createEvent(blockNumber, idx, evt);

    try {
      if (section === "balances" && method === "Transfer") {
        const transfer = createTransfer(blockNumber, idx, evt, block.timestamp);
        transfers.push(transfer);
      }
      else if (section === "assets" && method === "Transferred") {
        await createAssetTransfer(blockNumber, idx, evt);
        // Also create a Transfer record so the frontend can display asset transfers
        const assetEvtData = evt.event.data;
        if (assetEvtData && assetEvtData.length >= 4) {
          const [, assetFrom, assetTo, assetAmount] = assetEvtData;
          const assetTransferEntity = Transfer.create({
            id: `${blockNumber.toString()}-${idx.toString()}`,
            fromId: assetFrom.toString(),
            toId: assetTo.toString(),
            amount: BigInt(assetAmount.toString().replace(/,/g, '')),
            value: BigInt(assetAmount.toString().replace(/,/g, '')),
            blockId: blockNumber.toString(),
            blockNumber: blockNumber,
            eventIndex: idx,
            ...(block.timestamp
              ? {
                  timestamp: BigInt(block.timestamp.getTime()),
                  date: block.timestamp,
                }
              : {}),
          });
          await assetTransferEntity.save();
          transfers.push(assetTransferEntity);
        }
      }
      else if (section === "assets" && method === "Created") {
        await handleAssetCreated(blockNumber, evt);
      }
      else if (section === "assets" && method === "Issued") {
        await handleAssetIssued(blockNumber, evt);
      }
      else if (section === "assets" && method === "MetadataSet") {
        await handleAssetMetadataSet(evt);
      }
      else if (section === "assets" && method === "Destroyed") {
        await handleAssetDestroyed(evt);
      }
      else if (section === "staking") {
        await handleStakingEvent(blockNumber, idx, evt);
      }
      else if (section === "contracts" && method === "ContractEmitted") {
        await handleContractEvent(blockNumber, idx, evt);
        try {
          await detectAndHandlePspEvent(blockNumber, idx, evt);
        } catch (error) {
          logger.warn(`Error parsing PSP event: ${error}`);
        }
      }
      else if (section === "contracts" && method === "Instantiated") {
        await handleContractInstantiated(blockNumber, idx, evt);
      }
      else if ((section === "nfts" || section === "uniques") && method === "Transferred") {
        await handleNftsPalletTransfer(blockNumber, idx, evt);
      }
      else if ((section === "nfts" || section === "uniques") && method === "Issued") {
        await handleNftsPalletIssued(blockNumber, idx, evt);
      }
      else if ((section === "nfts" || section === "uniques") && method === "Created") {
        await handleNftsPalletCreated(blockNumber, evt);
      }
    } catch (error) {
      logger.error(`Error processing event ${section}.${method} at ${idx}: ${error}`);
    }
  }

  // Process all extrinsics in block
  const extrinsics = wrapExtrinsics(block);
  for (const ext of extrinsics) {
    try {
      createExtrinsic(blockNumber, ext);
      if (ext.extrinsic.method.section === "contracts") {
        await handleContractCall(blockNumber, ext);
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
  for (const accountId of accountIDs) {
    try {
      const data = await api.query.system.account(accountId);
      await ensureAccount(accountId, BigInt(data.data.free.toString()));
    } catch (error) {
      logger.warn(`Error querying account ${accountId}: ${error}`);
    }
  }
}

// Keep handleEvent and handleCall exported for backwards compatibility
export async function handleEvent(event: SubstrateEvent): Promise<void> {}
export async function handleCall(call: SubstrateExtrinsic): Promise<void> {}

// ─── nfts pallet handlers (substrate nfts, NOT ink! PSP34) ───────────────────
// Event structures differ from PSP34 ink! contracts:
//   nfts.Transferred: [collectionId, itemId, from, to]
//   nfts.Issued:      [collectionId, itemId, owner]
//   nfts.Created:     [collectionId, creator, owner]

async function handleNftsPalletCreated(blockNumber: bigint, eventRecord: any): Promise<void> {
  try {
    const [collectionId, creator, owner] = eventRecord.event.data;
    const id = collectionId.toString();
    let coll = await Psp34Collection.get(id);
    if (!coll) {
      coll = Psp34Collection.create({
        id,
        contractAddress: id,
        name: `Collection #${id}`,
        symbol: `NFT${id}`,
        creator: creator.toString(),
        createdAt: BigInt(Date.now()),
        createdAtBlock: blockNumber,
        totalSupply: BigInt(0),
        standard: "PSP34-Pallet",
        metadata: null,
        verified: false,
      });
      await coll.save();
      logger.info(`[NFTs] Collection #${id} created by ${creator}`);
    }
  } catch (err) {
    logger.warn(`[NFTs] handleNftsPalletCreated error: ${err}`);
  }
}

async function handleNftsPalletIssued(blockNumber: bigint, index: number, eventRecord: any): Promise<void> {
  try {
    const [collectionId, itemId, owner] = eventRecord.event.data;
    const collId = collectionId.toString();
    const tokenId = itemId.toString();
    const ownerAddr = owner.toString();
    const tokenRecordId = `${collId}-${tokenId}`;

    // Ensure collection
    let coll = await Psp34Collection.get(collId);
    if (!coll) {
      await handleNftsPalletCreated(blockNumber, { event: { data: [collectionId, owner, owner] } });
      coll = await Psp34Collection.get(collId);
    }
    if (coll) {
      coll.totalSupply = (coll.totalSupply || BigInt(0)) + BigInt(1);
      await coll.save();
    }

    // Upsert token
    let token = await Psp34Token.get(tokenRecordId);
    if (!token) {
      token = Psp34Token.create({
        id: tokenRecordId,
        collectionId: collId,
        tokenId,
        ownerId: ownerAddr,
        mintedAt: BigInt(Date.now()),
        mintedAtBlock: blockNumber,
      });
      await token.save();
    }

    // Update NftAccount
    await upsertNftAccount(collId, ownerAddr, true);
    logger.info(`[NFTs] Issued token #${tokenId} in collection #${collId} to ${ownerAddr}`);
  } catch (err) {
    logger.warn(`[NFTs] handleNftsPalletIssued error: ${err}`);
  }
}

async function handleNftsPalletTransfer(blockNumber: bigint, index: number, eventRecord: any): Promise<void> {
  try {
    const [collectionId, itemId, from, to] = eventRecord.event.data;
    const collId = collectionId.toString();
    const tokenId = itemId.toString();
    const fromAddr = from.toString();
    const toAddr = to.toString();
    const tokenRecordId = `${collId}-${tokenId}`;

    // Update token owner
    const token = await Psp34Token.get(tokenRecordId);
    if (token) {
      token.ownerId = toAddr;
      await token.save();
    }

    // Update NftAccount counts
    await upsertNftAccount(collId, fromAddr, false);
    await upsertNftAccount(collId, toAddr, true);
    logger.info(`[NFTs] Transfer token #${tokenId} in collection #${collId}: ${fromAddr} -> ${toAddr}`);
  } catch (err) {
    logger.warn(`[NFTs] handleNftsPalletTransfer error: ${err}`);
  }
}

async function upsertNftAccount(collectionId: string, accountId: string, incoming: boolean): Promise<void> {
  const id = `${collectionId}-${accountId}`;
  let acct = await NftAccount.get(id);
  if (!acct) {
    acct = NftAccount.create({ id, collectionId, accountId, tokenCount: 0 });
  }
  acct.tokenCount = incoming ? acct.tokenCount + 1 : Math.max(0, acct.tokenCount - 1);
  await acct.save();
}

// ─── pallet-assets handlers ───────────────────────────────────────────────────

async function handleAssetCreated(blockNumber: bigint, eventRecord: any): Promise<void> {
  try {
    const [assetId, creator, owner] = eventRecord.event.data;
    const id = assetId.toString();
    let asset = await Asset.get(id);
    if (!asset) {
      // Fetch on-chain metadata immediately
      const metaRaw = await api.query.assets.metadata(assetId);
      const meta: any = metaRaw.toHuman();
      const detailRaw = await api.query.assets.asset(assetId);
      const detail: any = (detailRaw as any).isSome ? (detailRaw as any).unwrap().toHuman() : {};
      asset = Asset.create({
        id,
        assetType: "Native",
        contractAddress: null,
        name: meta?.name || `Asset #${id}`,
        symbol: meta?.symbol || `AST${id}`,
        decimals: meta?.decimals ? Number(meta.decimals) : 0,
        totalSupply: detail?.supply ? BigInt(detail.supply.toString().replace(/,/g, '')) : BigInt(0),
        metadata: JSON.stringify(meta),
        verified: false,
      });
      await asset.save();
      logger.info(`[Asset] Created Asset #${id}: ${asset.symbol}`);
    }
  } catch (err) {
    logger.warn(`[Asset] handleAssetCreated error: ${err}`);
  }
}

async function handleAssetIssued(blockNumber: bigint, eventRecord: any): Promise<void> {
  try {
    const [assetId, owner, amount] = eventRecord.event.data;
    const id = assetId.toString();
    let asset = await Asset.get(id);
    if (!asset) {
      await handleAssetCreated(blockNumber, eventRecord);
      asset = await Asset.get(id);
    }
    if (asset) {
      const issued = BigInt(amount.toString().replace(/,/g, ''));
      asset.totalSupply = (asset.totalSupply || BigInt(0)) + issued;
      await asset.save();
    }
  } catch (err) {
    logger.warn(`[Asset] handleAssetIssued error: ${err}`);
  }
}

async function handleAssetMetadataSet(eventRecord: any): Promise<void> {
  try {
    const [assetId, name, symbol, decimals, isFrozen] = eventRecord.event.data;
    const id = assetId.toString();
    let asset = await Asset.get(id);
    if (!asset) {
      asset = Asset.create({
        id,
        assetType: "Native",
        contractAddress: null,
        name: name.toString(),
        symbol: symbol.toString(),
        decimals: Number(decimals.toString()),
        totalSupply: BigInt(0),
        metadata: null,
        verified: false,
      });
    } else {
      asset.name = name.toString();
      asset.symbol = symbol.toString();
      asset.decimals = Number(decimals.toString());
    }
    await asset.save();
    logger.info(`[Asset] MetadataSet Asset #${id}: ${symbol}`);
  } catch (err) {
    logger.warn(`[Asset] handleAssetMetadataSet error: ${err}`);
  }
}

async function handleAssetDestroyed(eventRecord: any): Promise<void> {
  try {
    const [assetId] = eventRecord.event.data;
    const id = assetId.toString();
    const asset = await Asset.get(id);
    if (asset) {
      asset.metadata = JSON.stringify({ destroyed: true });
      await asset.save();
      logger.info(`[Asset] Destroyed Asset #${id}`);
    }
  } catch (err) {
    logger.warn(`[Asset] handleAssetDestroyed error: ${err}`);
  }
}

// ─── ink! event topic selectors (first 4 bytes of blake2_256("EventName")) ──
// These are the standard ink! PSP event topic signatures.
// contracts.ContractEmitted data layout: [contractAddress: AccountId, data: Bytes]
// The `data` field is SCALE-encoded: [topics: Vec<Hash>, data: Bytes]
// Topic[0] is blake2_256 of the event signature string.
const PSP22_TRANSFER_TOPIC  = '0x45b29ccd454d9b4b3bf9b4f4e8f9b3e7b3e7b3e7'; // placeholder
const PSP22_APPROVAL_TOPIC  = '0x1a35e726f5feffda199144f6097b2ba23713e549';
const PSP34_TRANSFER_TOPIC  = '0x05d75d6f';

// Ink! standard event selectors — first 4 bytes of the event data identify the event.
// PSP22 Transfer:  [from: Option<AccountId>, to: Option<AccountId>, value: Balance]
// PSP22 Approval:  [owner: AccountId, spender: AccountId, value: Balance]
// PSP34 Transfer:  [from: Option<AccountId>, to: Option<AccountId>, id: Id]
//
// The reliable way to identify the contract type is to check the SmartContract.standard
// field set during contracts.Instantiated handling.
async function detectAndHandlePspEvent(blockNumber: bigint, eventIndex: number, eventRecord: any): Promise<void> {
  try {
    // contracts.ContractEmitted always has exactly 2 fields: [contractAddress, data]
    const eventData = eventRecord.event.data;
    if (!eventData || eventData.length < 2) return;

    const contractAddress = eventData[0].toString();
    // `data` is raw Bytes — the ink! encoded event payload
    const rawBytes = eventData[1] instanceof Uint8Array
      ? eventData[1]
      : Buffer.from(eventData[1].toString().replace(/^0x/, ''), 'hex');
    const rawData = new Uint8Array(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength);

    if (rawData.length < 4) return;

    // Look up the contract standard from the registry
    const contract = await SmartContract.get(contractAddress);
    const standard = contract?.standard || 'Unknown';

    logger.info(`[PSP] ContractEmitted from ${contractAddress.slice(0,8)}... standard=${standard} dataLen=${rawData.length}`);

    if (standard === 'PSP22') {
      await decodePsp22Event(blockNumber, eventIndex, contractAddress, rawData, eventRecord);
    } else if (standard === 'PSP34') {
      await decodePsp34Event(blockNumber, eventIndex, contractAddress, rawData, eventRecord);
    } else {
      // Unknown contract — try PSP22 first (most common), then PSP34
      const detected = await tryDetectFromData(blockNumber, eventIndex, contractAddress, rawData, eventRecord);
      if (detected && contract) {
        contract.standard = detected;
        await contract.save();
      }
    }
  } catch (error) {
    logger.warn(`[PSP] detectAndHandlePspEvent error: ${error}`);
  }
}

// Decode ink! PSP22 event from raw bytes.
// ink! PSP22 Transfer event layout (SCALE):
//   topics: Vec<Hash> (4 topics: event_sig, from_hash, to_hash, value_hash)
//   data: [from: Option<AccountId32>, to: Option<AccountId32>, value: u128]
async function decodePsp22Event(
  blockNumber: bigint, index: number, contractAddress: string,
  rawData: Uint8Array, eventRecord: any
): Promise<void> {
  try {
    // Use the Polkadot codec to decode — wrap in a synthetic event for the existing handler
    // The existing handlePsp22Transfer expects event.data = [contractAddress, from, to, value]
    // We reconstruct this from the raw ink! event bytes using the registry
    // ink! encodes: Option<AccountId> (1+32 bytes), Option<AccountId> (1+32 bytes), u128 (16 bytes)
    // Minimum: 1+32 + 1+32 + 16 = 82 bytes
    if (rawData.length < 50) return;

    let offset = 0;

    // Decode from: Option<AccountId32>
    const fromPresent = rawData[offset++] === 0x01;
    let fromAddr: string | null = null;
    if (fromPresent && rawData.length >= offset + 32) {
      fromAddr = api.registry.createType('AccountId32', rawData.slice(offset, offset + 32)).toString();
      offset += 32;
    } else if (!fromPresent) {
      // None variant — no bytes consumed beyond the tag
    } else {
      return; // malformed
    }

    // Decode to: Option<AccountId32>
    const toPresent = rawData[offset++] === 0x01;
    let toAddr: string | null = null;
    if (toPresent && rawData.length >= offset + 32) {
      toAddr = api.registry.createType('AccountId32', rawData.slice(offset, offset + 32)).toString();
      offset += 32;
    } else if (!toPresent) {
      // None
    } else {
      return;
    }

    // Decode value: u128 (16 bytes LE)
    if (rawData.length < offset + 16) return;
    const valueBytes = rawData.slice(offset, offset + 16);
    const value = api.registry.createType('u128', valueBytes).toBigInt();

    if (!toAddr) return; // must have a recipient

    logger.info(`[PSP22] Transfer decoded: ${fromAddr?.slice(0,8) ?? 'mint'} -> ${toAddr.slice(0,8)} value=${value}`);

    // Ensure token exists
    await ensurePsp22Token(contractAddress, blockNumber);

    // Build synthetic event record compatible with handlePsp22Transfer
    const syntheticEvent = {
      event: { data: [{ toString: () => contractAddress }, { toString: () => fromAddr ?? '' }, { toString: () => toAddr }, { toBigInt: () => value, toString: () => value.toString() }] }
    };
    await handlePsp22Transfer(blockNumber, index, syntheticEvent as any);

  } catch (err) {
    logger.warn(`[PSP22] decodePsp22Event error: ${err}`);
  }
}

// Decode ink! PSP34 Transfer event from raw bytes.
// ink! PSP34 Transfer layout:
//   from: Option<AccountId32>, to: Option<AccountId32>, id: Id (enum)
async function decodePsp34Event(
  blockNumber: bigint, index: number, contractAddress: string,
  rawData: Uint8Array, eventRecord: any
): Promise<void> {
  try {
    if (rawData.length < 10) return;
    let offset = 0;

    const fromPresent = rawData[offset++] === 0x01;
    let fromAddr: string | null = null;
    if (fromPresent && rawData.length >= offset + 32) {
      fromAddr = api.registry.createType('AccountId32', rawData.slice(offset, offset + 32)).toString();
      offset += 32;
    }

    const toPresent = rawData[offset++] === 0x01;
    let toAddr: string | null = null;
    if (toPresent && rawData.length >= offset + 32) {
      toAddr = api.registry.createType('AccountId32', rawData.slice(offset, offset + 32)).toString();
      offset += 32;
    }

    if (!toAddr) return;

    // Id is an enum — first byte is variant (0=u8,1=u16,2=u32,3=u64,4=u128,5=Bytes)
    const idVariant = rawData[offset++];
    let tokenId = '';
    if (idVariant === 0 && rawData.length > offset) tokenId = rawData[offset].toString();
    else if (idVariant === 1 && rawData.length >= offset + 2) tokenId = new DataView(rawData.buffer).getUint16(offset, true).toString();
    else if (idVariant === 2 && rawData.length >= offset + 4) tokenId = new DataView(rawData.buffer).getUint32(offset, true).toString();
    else if (idVariant === 3 && rawData.length >= offset + 8) tokenId = api.registry.createType('u64', rawData.slice(offset, offset + 8)).toString();
    else if (idVariant === 4 && rawData.length >= offset + 16) tokenId = api.registry.createType('u128', rawData.slice(offset, offset + 16)).toString();
    else tokenId = Buffer.from(rawData.slice(offset)).toString('hex');

    logger.info(`[PSP34] Transfer decoded: ${fromAddr?.slice(0,8) ?? 'mint'} -> ${toAddr.slice(0,8)} tokenId=${tokenId}`);

    await ensurePsp34Collection(contractAddress, blockNumber);

    const syntheticEvent = {
      event: { data: [{ toString: () => contractAddress }, { toString: () => fromAddr ?? '' }, { toString: () => toAddr }, { toString: () => tokenId }] }
    };
    await handlePsp34Transfer(blockNumber, index, syntheticEvent as any);

  } catch (err) {
    logger.warn(`[PSP34] decodePsp34Event error: ${err}`);
  }
}

// Try to detect PSP standard from raw event data heuristically, then decode.
async function tryDetectFromData(
  blockNumber: bigint, index: number, contractAddress: string,
  rawData: Uint8Array, eventRecord: any
): Promise<string | null> {
  // PSP22 Transfer minimum: 1(from tag)+32+1(to tag)+32+16(u128) = 82 bytes
  // PSP34 Transfer minimum: 1+32+1+32+1+1 = 68 bytes
  // If data is >= 82 bytes, try PSP22 first
  if (rawData.length >= 82) {
    try {
      await decodePsp22Event(blockNumber, index, contractAddress, rawData, eventRecord);
      logger.info(`[PSP] Auto-detected PSP22 for ${contractAddress.slice(0,8)}...`);
      return 'PSP22';
    } catch { /* fall through */ }
  }
  if (rawData.length >= 68) {
    try {
      await decodePsp34Event(blockNumber, index, contractAddress, rawData, eventRecord);
      logger.info(`[PSP] Auto-detected PSP34 for ${contractAddress.slice(0,8)}...`);
      return 'PSP34';
    } catch { /* fall through */ }
  }
  return null;
}