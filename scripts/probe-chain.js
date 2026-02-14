const { ApiPromise, WsProvider } = require('@polkadot/api');

async function probeChain() {
  console.log('Connecting to Lunes blockchain...');
  const provider = new WsProvider('wss://ws-archive.lunes.io');
  const api = await ApiPromise.create({ provider });

  console.log('\n=== CHAIN INFO ===');
  const chain = await api.rpc.system.chain();
  const name = await api.rpc.system.name();
  const version = await api.rpc.system.version();
  const header = await api.rpc.chain.getHeader();
  console.log(`Chain: ${chain}`);
  console.log(`Node: ${name} v${version}`);
  console.log(`Latest block: #${header.number.toNumber()}`);

  console.log('\n=== RUNTIME PALLETS/MODULES ===');
  const metadata = await api.rpc.state.getMetadata();
  const pallets = metadata.asLatest.pallets.map(p => p.name.toString());
  console.log('Available pallets:', pallets.join(', '));

  console.log('\n=== KEY PALLET CHECKS ===');

  // Check balances
  if (api.query.balances) {
    const total = await api.query.balances.totalIssuance();
    console.log(`[balances] Total issuance: ${total.toString()}`);
  }

  // Check assets pallet
  if (api.query.assets) {
    console.log('[assets] Pallet exists');
    try {
      const assetKeys = await api.query.assets.asset.keys();
      console.log(`[assets] Number of registered assets: ${assetKeys.length}`);
      if (assetKeys.length > 0) {
        for (const key of assetKeys.slice(0, 5)) {
          const assetId = key.args[0].toString();
          const asset = await api.query.assets.asset(assetId);
          const metadata = await api.query.assets.metadata(assetId);
          console.log(`  Asset #${assetId}: name=${metadata.name.toHuman()}, symbol=${metadata.symbol.toHuman()}, supply=${asset.unwrapOrDefault().supply.toString()}`);
        }
      }
    } catch (e) {
      console.log(`[assets] Error querying: ${e.message}`);
    }
  } else {
    console.log('[assets] Pallet NOT available');
  }

  // Check contracts pallet
  if (api.query.contracts) {
    console.log('[contracts] Pallet exists');
    try {
      const contractKeys = await api.query.contracts.contractInfoOf.keys();
      console.log(`[contracts] Number of deployed contracts: ${contractKeys.length}`);
      if (contractKeys.length > 0) {
        for (const key of contractKeys.slice(0, 5)) {
          console.log(`  Contract: ${key.args[0].toString()}`);
        }
      }
    } catch (e) {
      console.log(`[contracts] Error querying: ${e.message}`);
    }
  } else {
    console.log('[contracts] Pallet NOT available');
  }

  // Check staking pallet
  if (api.query.staking) {
    console.log('[staking] Pallet exists');
    try {
      const era = await api.query.staking.currentEra();
      const validators = await api.query.staking.validators.keys();
      const nominators = await api.query.staking.nominators.keys();
      console.log(`  Current era: ${era.unwrapOrDefault().toString()}`);
      console.log(`  Validators: ${validators.length}`);
      console.log(`  Nominators: ${nominators.length}`);
    } catch (e) {
      console.log(`[staking] Error: ${e.message}`);
    }
  } else {
    console.log('[staking] Pallet NOT available');
  }

  // Check uniques pallet (NFTs)
  if (api.query.uniques) {
    console.log('[uniques] Pallet exists');
    try {
      const classKeys = await api.query.uniques.class.keys();
      console.log(`[uniques] NFT collections: ${classKeys.length}`);
    } catch (e) {
      console.log(`[uniques] Error: ${e.message}`);
    }
  } else {
    console.log('[uniques] Pallet NOT available');
  }

  // Check nfts pallet 
  if (api.query.nfts) {
    console.log('[nfts] Pallet exists');
  } else {
    console.log('[nfts] Pallet NOT available');
  }

  // Check session
  if (api.query.session) {
    const validators = await api.query.session.validators();
    console.log(`[session] Active validators: ${validators.length}`);
    if (validators.length > 0) {
      validators.slice(0, 3).forEach(v => console.log(`  Validator: ${v.toString()}`));
    }
  }

  // Check system
  const accountCount = await api.query.system.account.keys();
  console.log(`\n[system] Total accounts on chain: ${accountCount.length > 1000 ? '1000+ (limited)' : accountCount.length}`);

  // Check identity
  if (api.query.identity) {
    console.log('[identity] Pallet exists');
  } else {
    console.log('[identity] Pallet NOT available');
  }

  // Check democracy / governance
  if (api.query.democracy) console.log('[democracy] Pallet exists');
  if (api.query.treasury) console.log('[treasury] Pallet exists');
  if (api.query.council) console.log('[council] Pallet exists');

  console.log('\n=== QUERY EXAMPLES ===');
  
  // Sample account balance
  try {
    const testAddr = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'; // Alice
    const { data: balance } = await api.query.system.account(testAddr);
    console.log(`Alice balance: free=${balance.free.toString()}, reserved=${balance.reserved.toString()}`);
  } catch (e) {
    console.log(`Balance query error: ${e.message}`);
  }

  console.log('\nDone!');
  await api.disconnect();
  process.exit(0);
}

probeChain().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
