/**
 * Bootstrap pallet-assets + nfts pallet data into SubQuery PostgreSQL.
 * Outputs SQL to stdout — pipe to psql:
 *   node scripts/bootstrap-assets.mjs | psql postgresql://postgres:postgres@localhost:5432/postgres
 */
import { ApiPromise, WsProvider } from '@polkadot/api';

const WS_ENDPOINT = 'wss://ws-archive.lunes.io';
function esc(s) {
  if (s === null || s === undefined) return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
}

async function main() {
  process.stderr.write('[Bootstrap] Connecting to chain...\n');
  const provider = new WsProvider(WS_ENDPOINT);
  const api = await ApiPromise.create({ provider });
  process.stderr.write('[Bootstrap] Connected.\n');

  const sql = [];
  sql.push('BEGIN;');

  // ── 1. pallet-assets ──────────────────────────────────────────────────────
  const assetKeys = await api.query.assets.asset.keys();
  const assetIds = assetKeys.map(k => k.args[0].toString());
  process.stderr.write(`[Bootstrap] ${assetIds.length} pallet-assets: ${assetIds.join(', ')}\n`);

  for (const assetId of assetIds) {
    const metaRaw = await api.query.assets.metadata(assetId);
    const meta = metaRaw.toHuman();
    const detailRaw = await api.query.assets.asset(assetId);
    const detail = (detailRaw).isSome ? (detailRaw).unwrap().toHuman() : {};

    const name = meta?.name || `Asset #${assetId}`;
    const symbol = meta?.symbol || `AST${assetId}`;
    const decimals = meta?.decimals ? Number(String(meta.decimals).replace(/,/g,'')) : 0;
    const supply = detail?.supply ? String(detail.supply).replace(/,/g,'') : '0';

    process.stderr.write(`  Asset #${assetId}: ${name} (${symbol}) decimals=${decimals} supply=${supply}\n`);

    sql.push(`
INSERT INTO app.assets (id, asset_type, contract_address, name, symbol, decimals, total_supply, metadata, verified)
VALUES (${esc(assetId)}, 'Native', NULL, ${esc(name)}, ${esc(symbol)}, ${decimals}, ${supply}, ${esc(JSON.stringify(meta))}, false)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, symbol=EXCLUDED.symbol, decimals=EXCLUDED.decimals, total_supply=EXCLUDED.total_supply, asset_type='Native';`);

    // Account balances
    const acctKeys = await api.query.assets.account.keys(assetId);
    process.stderr.write(`    ${acctKeys.length} holders\n`);
    for (const key of acctKeys) {
      const acctId = key.args[1].toString();
      const balRaw = await api.query.assets.account(assetId, acctId);
      if (!(balRaw).isSome) continue;
      const balData = (balRaw).unwrap().toHuman();
      const balance = String(balData.balance).replace(/,/g,'');
      const rid = `${acctId}-${assetId}`;
      sql.push(`INSERT INTO app.accounts (id, balance, sent_transfers_count, received_transfers_count) VALUES (${esc(acctId)}, 0, 0, 0) ON CONFLICT (id) DO NOTHING;`);
      sql.push(`INSERT INTO app.asset_accounts (id, asset_id, account_id, balance) VALUES (${esc(rid)}, ${esc(assetId)}, ${esc(acctId)}, ${balance}) ON CONFLICT (id) DO UPDATE SET balance=EXCLUDED.balance;`);
    }
  }

  // ── 2. nfts pallet (PSP34) ────────────────────────────────────────────────
  if (api.query.nfts) {
    const collKeys = await api.query.nfts.collection.keys();
    process.stderr.write(`[Bootstrap] ${collKeys.length} NFT collections\n`);

    for (const key of collKeys) {
      const collId = key.args[0].toString();
      const collRaw = await api.query.nfts.collection(collId);
      if (!(collRaw).isSome) continue;
      const coll = (collRaw).unwrap().toHuman();
      const owner = coll.owner || 'Unknown';
      const items = Number(String(coll.items || '0').replace(/,/g,''));

      // Try to get collection metadata
      let collName = `Collection #${collId}`;
      let collSymbol = `NFT${collId}`;
      try {
        const metaRaw = await api.query.nfts.collectionMetadataOf(collId);
        if ((metaRaw).isSome) {
          const metaData = (metaRaw).unwrap().toHuman();
          const dataStr = metaData.data || '';
          try { const parsed = JSON.parse(dataStr); collName = parsed.name || collName; collSymbol = parsed.symbol || collSymbol; } catch {}
        }
      } catch {}

      process.stderr.write(`  Collection #${collId}: ${collName} owner=${owner.slice(0,8)} items=${items}\n`);

      // Ensure owner account
      if (owner !== 'Unknown') {
        sql.push(`INSERT INTO app.accounts (id, balance, sent_transfers_count, received_transfers_count) VALUES (${esc(owner)}, 0, 0, 0) ON CONFLICT (id) DO NOTHING;`);
      }

      // Upsert psp34_collection
      sql.push(`
INSERT INTO app.psp34_collections (id, contract_address, name, symbol, total_supply, creator, created_at, created_at_block, standard, metadata, verified)
VALUES (${esc(collId)}, ${esc(collId)}, ${esc(collName)}, ${esc(collSymbol)}, ${items}, ${esc(owner)}, ${Date.now()}, 0, 'PSP34', NULL, false)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, symbol=EXCLUDED.symbol, total_supply=EXCLUDED.total_supply;`);

      // Enumerate NFT items in this collection
      const itemKeys = await api.query.nfts.item.keys(collId);
      process.stderr.write(`    ${itemKeys.length} items\n`);
      for (const iKey of itemKeys) {
        const tokenId = iKey.args[1].toString();
        const itemRaw = await api.query.nfts.item(collId, tokenId);
        if (!(itemRaw).isSome) continue;
        const item = (itemRaw).unwrap().toHuman();
        const itemOwner = item.owner || 'Unknown';
        const tokenRecordId = `${collId}-${tokenId}`;

        if (itemOwner !== 'Unknown') {
          sql.push(`INSERT INTO app.accounts (id, balance, sent_transfers_count, received_transfers_count) VALUES (${esc(itemOwner)}, 0, 0, 0) ON CONFLICT (id) DO NOTHING;`);
        }

        // Upsert psp34_token
        sql.push(`INSERT INTO app.psp34_tokens (id, collection_id, token_id, owner_id, metadata, token_uri, minted_at, minted_at_block) VALUES (${esc(tokenRecordId)}, ${esc(collId)}, ${esc(tokenId)}, ${esc(itemOwner)}, NULL, NULL, ${Date.now()}, 0) ON CONFLICT (id) DO UPDATE SET owner_id=EXCLUDED.owner_id;`);

        // Upsert nft_account
        const nftAcctId = `${collId}-${itemOwner}`;
        sql.push(`
INSERT INTO app.nft_accounts (id, collection_id, account_id, token_count)
VALUES (${esc(nftAcctId)}, ${esc(collId)}, ${esc(itemOwner)}, 1)
ON CONFLICT (id) DO UPDATE SET token_count = app.nft_accounts.token_count + 1;`);
      }
    }
  } else {
    process.stderr.write('[Bootstrap] nfts pallet not available on this chain\n');
  }

  // ── 3. Known PSP22 ink! contracts ─────────────────────────────────────────
  // Add known contracts here — they are bootstrapped because they were deployed
  // before the SubQuery startBlock and won't be caught by event indexing.
  const KNOWN_PSP22 = [
    {
      address: '5Gbyik8Ciu86LN8cL7s4S4AS7jEi8LhpvcuZ1KZHVq1Gsiry',
      name: 'LUNES DOLLAR',
      symbol: 'LUSDT',
      decimals: 18,
      description: 'LUSDT Stablecoin - ink! PSP22 contract',
    },
  ];

  process.stderr.write(`[Bootstrap] ${KNOWN_PSP22.length} known PSP22 contracts\n`);
  for (const token of KNOWN_PSP22) {
    process.stderr.write(`  PSP22: ${token.symbol} @ ${token.address.slice(0, 12)}...\n`);
    sql.push(`INSERT INTO app.accounts (id, balance, sent_transfers_count, received_transfers_count) VALUES (${esc(token.address)}, 0, 0, 0) ON CONFLICT (id) DO NOTHING;`);
    sql.push(`INSERT INTO app.smart_contracts (id, contract_address, deployer_id, standard, deployed_at, deployed_at_block, is_verified, call_count) VALUES (${esc(token.address)}, ${esc(token.address)}, ${esc(token.address)}, 'PSP22', 0, 0, false, 0) ON CONFLICT (id) DO UPDATE SET standard = 'PSP22';`);
    sql.push(`INSERT INTO app.psp22_tokens (id, contract_address, name, symbol, decimals, total_supply, creator, created_at, created_at_block, standard, metadata, verified) VALUES (${esc(token.address)}, ${esc(token.address)}, ${esc(token.name)}, ${esc(token.symbol)}, ${token.decimals}, 0, ${esc(token.address)}, 0, 0, 'PSP22', ${esc(JSON.stringify({ description: token.description }))}, false) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, symbol=EXCLUDED.symbol, decimals=EXCLUDED.decimals;`);
  }

  sql.push('COMMIT;');
  process.stdout.write(sql.join('\n') + '\n');
  process.stderr.write('[Bootstrap] SQL generated. Pipe to psql to apply.\n');
  await api.disconnect();
}

main().catch(err => {
  console.error('[Bootstrap] Error:', err);
  process.exit(1);
});
