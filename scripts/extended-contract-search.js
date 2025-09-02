const { ApiPromise, WsProvider } = require('@polkadot/api');

async function extendedContractSearch() {
  console.log('🔍 Busca estendida por contratos na rede Lunes...');
  
  const wsProvider = new WsProvider('wss://ws-archive.lunes.io');
  const api = await ApiPromise.create({ provider: wsProvider });
  
  console.log('✅ Conectado à rede Lunes');
  
  try {
    const latestBlock = await api.rpc.chain.getBlock();
    const blockNumber = latestBlock.block.header.number.toNumber();
    console.log(`📦 Bloco atual: ${blockNumber}`);
    
    const contracts = new Set();
    const contractEvents = [];
    
    // Buscar em períodos maiores - últimos 10.000 blocos
    const startBlock = Math.max(1, blockNumber - 10000);
    console.log(`📊 Analisando blocos ${startBlock} até ${blockNumber}...`);
    
    // Buscar em intervalos maiores para cobrir mais terreno
    for (let i = startBlock; i <= blockNumber; i += 500) {
      const endBlock = Math.min(i + 499, blockNumber);
      console.log(`🔄 Processando blocos ${i}-${endBlock}...`);
      
      try {
        // Buscar eventos em lote
        for (let j = i; j <= endBlock; j += 50) {
          const batchEnd = Math.min(j + 49, endBlock);
          
          try {
            const blockHash = await api.rpc.chain.getBlockHash(j);
            const events = await api.query.system.events.at(blockHash);
            
            events.forEach((record) => {
              const { event } = record;
              
              // Capturar todos os eventos relacionados a contratos
              if (event.section === 'contracts' || 
                  event.section === 'balances' || 
                  event.section === 'system') {
                
                const eventInfo = {
                  block: j,
                  section: event.section,
                  method: event.method,
                  data: event.data.map(d => d.toString())
                };
                
                contractEvents.push(eventInfo);
                
                // Extrair endereços que parecem ser contratos
                if (event.method === 'Instantiated' || 
                    event.method === 'ContractEmitted' ||
                    event.method === 'Called') {
                  
                  event.data.forEach(data => {
                    const str = data.toString();
                    // Procurar por endereços que começam com padrões conhecidos
                    if (str.length > 40 && (str.startsWith('5') || str.startsWith('1'))) {
                      contracts.add(str);
                    }
                  });
                }
              }
            });
            
          } catch (error) {
            // Continuar mesmo com erros em blocos específicos
          }
        }
        
      } catch (error) {
        console.log(`⚠️  Erro no intervalo ${i}-${endBlock}: ${error.message}`);
      }
    }
    
    console.log(`\n📋 Possíveis contratos encontrados: ${contracts.size}`);
    console.log(`📋 Eventos analisados: ${contractEvents.length}`);
    
    // Verificar se os endereços encontrados são realmente contratos
    const validContracts = [];
    const invalidAddresses = [];
    
    console.log('\n🔍 Validando endereços encontrados...');
    
    for (const address of contracts) {
      try {
        // Verificar se é um contrato válido
        const contractInfo = await api.query.contracts.contractInfoOf(address);
        
        if (contractInfo.isSome) {
          validContracts.push(address);
          console.log(`✅ Contrato válido: ${address}`);
        } else {
          // Pode ser uma conta normal, não um contrato
          invalidAddresses.push(address);
        }
        
      } catch (error) {
        invalidAddresses.push(address);
      }
    }
    
    console.log(`\n📊 Contratos válidos: ${validContracts.length}`);
    console.log(`📊 Endereços inválidos: ${invalidAddresses.length}`);
    
    // Se não encontramos contratos, vamos tentar uma abordagem diferente
    if (validContracts.length === 0) {
      console.log('\n🔍 Tentando abordagem alternativa...');
      
      // Verificar se o módulo de contratos está ativo
      const metadata = await api.rpc.state.getMetadata();
      const modules = metadata.asLatest.pallets;
      
      const contractsModule = modules.find(m => m.name.toString() === 'Contracts');
      
      if (contractsModule) {
        console.log('✅ Módulo Contracts encontrado na runtime');
        
        // Listar todas as storage keys relacionadas a contratos
        const contractKeys = await api.query.contracts.contractInfoOf.keys();
        console.log(`📋 Chaves de contratos no storage: ${contractKeys.length}`);
        
        if (contractKeys.length > 0) {
          console.log('\n📝 Contratos encontrados no storage:');
          
          for (let i = 0; i < Math.min(contractKeys.length, 10); i++) {
            const key = contractKeys[i];
            const address = key.args[0].toString();
            console.log(`${i + 1}. ${address}`);
            validContracts.push(address);
          }
        }
        
      } else {
        console.log('❌ Módulo Contracts não encontrado na runtime');
      }
    }
    
    // Analisar eventos por tipo
    const eventTypes = {};
    contractEvents.forEach(event => {
      const key = `${event.section}.${event.method}`;
      eventTypes[key] = (eventTypes[key] || 0) + 1;
    });
    
    console.log('\n📊 Tipos de eventos encontrados:');
    Object.entries(eventTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count} eventos`);
      });
    
    // Salvar resultados
    const results = {
      timestamp: new Date().toISOString(),
      blockRange: `${startBlock}-${blockNumber}`,
      searchMethod: 'extended',
      totalAddressesFound: contracts.size,
      validContracts: validContracts.length,
      invalidAddresses: invalidAddresses.length,
      totalEvents: contractEvents.length,
      contracts: validContracts,
      eventSummary: eventTypes,
      sampleEvents: contractEvents.slice(0, 50) // Primeiros 50 eventos como amostra
    };
    
    require('fs').writeFileSync(
      'lunes-extended-search.json', 
      JSON.stringify(results, null, 2)
    );
    
    console.log('\n💾 Resultados salvos em: lunes-extended-search.json');
    
    // Resumo final
    console.log('\n📊 RESUMO DA BUSCA ESTENDIDA:');
    console.log('===============================');
    console.log(`🔍 Blocos analisados: ${blockNumber - startBlock + 1}`);
    console.log(`📋 Eventos processados: ${contractEvents.length}`);
    console.log(`✅ Contratos válidos: ${validContracts.length}`);
    
    if (validContracts.length > 0) {
      console.log('\n📝 Contratos encontrados:');
      validContracts.forEach((address, index) => {
        console.log(`  ${index + 1}. ${address}`);
      });
    } else {
      console.log('\n❌ Nenhum contrato encontrado na rede Lunes');
      console.log('   Possíveis razões:');
      console.log('   - A rede ainda não tem contratos implantados');
      console.log('   - Os contratos estão em blocos mais antigos');
      console.log('   - O módulo de contratos pode não estar ativo');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a busca estendida:', error);
  } finally {
    await api.disconnect();
    console.log('🔌 Desconectado da rede Lunes');
  }
}

extendedContractSearch().catch(console.error);
