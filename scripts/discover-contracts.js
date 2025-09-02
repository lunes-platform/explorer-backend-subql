const { ApiPromise, WsProvider } = require('@polkadot/api');

async function discoverContracts() {
  console.log('🔍 Descobrindo contratos na rede Lunes...');
  
  // Conectar à rede Lunes
  const wsProvider = new WsProvider('wss://ws-archive.lunes.io');
  const api = await ApiPromise.create({ provider: wsProvider });
  
  console.log('✅ Conectado à rede Lunes');
  console.log(`📊 Chain: ${await api.rpc.system.chain()}`);
  console.log(`🏷️  Version: ${await api.rpc.system.version()}`);
  
  try {
    // Obter informações da chain
    const chainInfo = await api.rpc.system.properties();
    console.log('🔗 Propriedades da chain:', chainInfo.toHuman());
    
    // Obter bloco atual
    const latestBlock = await api.rpc.chain.getBlock();
    const blockNumber = latestBlock.block.header.number.toNumber();
    console.log(`📦 Bloco atual: ${blockNumber}`);
    
    // Buscar contratos através de eventos de instantiation
    console.log('\n🔍 Buscando contratos instantiados...');
    
    const contracts = new Set();
    const contractEvents = [];
    
    // Buscar nos últimos 1000 blocos por eventos de contrato
    const startBlock = Math.max(1, blockNumber - 1000);
    console.log(`📊 Analisando blocos ${startBlock} até ${blockNumber}...`);
    
    for (let i = startBlock; i <= blockNumber; i += 100) {
      const endBlock = Math.min(i + 99, blockNumber);
      console.log(`🔄 Processando blocos ${i}-${endBlock}...`);
      
      try {
        const blockHash = await api.rpc.chain.getBlockHash(i);
        const block = await api.rpc.chain.getBlock(blockHash);
        
        // Processar eventos do bloco
        const events = await api.query.system.events.at(blockHash);
        
        events.forEach((record) => {
          const { event } = record;
          
          // Buscar eventos de contratos
          if (event.section === 'contracts') {
            const eventInfo = {
              block: i,
              section: event.section,
              method: event.method,
              data: event.data.toString()
            };
            
            contractEvents.push(eventInfo);
            
            // Extrair endereços de contratos dos eventos
            if (event.method === 'Instantiated' || event.method === 'ContractEmitted') {
              const data = event.data;
              if (data && data.length > 0) {
                const contractAddress = data[0].toString();
                contracts.add(contractAddress);
              }
            }
          }
        });
        
      } catch (error) {
        console.log(`⚠️  Erro no bloco ${i}: ${error.message}`);
      }
    }
    
    console.log(`\n📋 Contratos encontrados: ${contracts.size}`);
    console.log(`📋 Eventos de contratos: ${contractEvents.length}`);
    
    // Listar contratos encontrados
    if (contracts.size > 0) {
      console.log('\n📝 Lista de contratos:');
      Array.from(contracts).forEach((address, index) => {
        console.log(`${index + 1}. ${address}`);
      });
    }
    
    // Analisar tipos de eventos
    const eventTypes = {};
    contractEvents.forEach(event => {
      const key = `${event.section}.${event.method}`;
      eventTypes[key] = (eventTypes[key] || 0) + 1;
    });
    
    console.log('\n📊 Tipos de eventos encontrados:');
    Object.entries(eventTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} eventos`);
    });
    
    // Tentar identificar padrões PSP
    console.log('\n🔍 Analisando padrões PSP...');
    
    const pspContracts = {
      PSP22: [],
      PSP34: [],
      PSP37: [],
      Unknown: []
    };
    
    for (const contractAddress of contracts) {
      try {
        // Verificar se o contrato ainda existe
        const contractInfo = await api.query.contracts.contractInfoOf(contractAddress);
        
        if (contractInfo.isSome) {
          console.log(`✅ Contrato ativo: ${contractAddress}`);
          
          // Analisar eventos específicos deste contrato
          const contractSpecificEvents = contractEvents.filter(e => 
            e.data.includes(contractAddress)
          );
          
          let detectedType = 'Unknown';
          
          // Detectar padrão baseado nos eventos
          const hasTransfer = contractSpecificEvents.some(e => 
            e.data.includes('Transfer') && !e.data.includes('TokenId')
          );
          const hasTokenId = contractSpecificEvents.some(e => 
            e.data.includes('TokenId')
          );
          const hasTransferSingle = contractSpecificEvents.some(e => 
            e.data.includes('TransferSingle')
          );
          
          if (hasTransferSingle) {
            detectedType = 'PSP37';
          } else if (hasTokenId) {
            detectedType = 'PSP34';
          } else if (hasTransfer) {
            detectedType = 'PSP22';
          }
          
          pspContracts[detectedType].push({
            address: contractAddress,
            events: contractSpecificEvents.length
          });
          
        } else {
          console.log(`❌ Contrato inativo: ${contractAddress}`);
        }
        
      } catch (error) {
        console.log(`⚠️  Erro ao verificar contrato ${contractAddress}: ${error.message}`);
        pspContracts.Unknown.push({
          address: contractAddress,
          events: 0,
          error: error.message
        });
      }
    }
    
    // Resumo final
    console.log('\n📊 RESUMO DOS CONTRATOS ENCONTRADOS:');
    console.log('=====================================');
    
    Object.entries(pspContracts).forEach(([type, contracts]) => {
      if (contracts.length > 0) {
        console.log(`\n${type} (${contracts.length} contratos):`);
        contracts.forEach((contract, index) => {
          console.log(`  ${index + 1}. ${contract.address} (${contract.events} eventos)`);
          if (contract.error) {
            console.log(`     ⚠️  Erro: ${contract.error}`);
          }
        });
      }
    });
    
    // Salvar resultados em arquivo
    const results = {
      timestamp: new Date().toISOString(),
      blockRange: `${startBlock}-${blockNumber}`,
      totalContracts: contracts.size,
      totalEvents: contractEvents.length,
      contracts: Array.from(contracts),
      events: contractEvents,
      pspAnalysis: pspContracts
    };
    
    require('fs').writeFileSync(
      'lunes-contracts-discovery.json', 
      JSON.stringify(results, null, 2)
    );
    
    console.log('\n💾 Resultados salvos em: lunes-contracts-discovery.json');
    
  } catch (error) {
    console.error('❌ Erro durante a descoberta:', error);
  } finally {
    await api.disconnect();
    console.log('🔌 Desconectado da rede Lunes');
  }
}

// Executar descoberta
discoverContracts().catch(console.error);
