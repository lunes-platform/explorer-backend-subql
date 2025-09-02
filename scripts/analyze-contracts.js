const { ApiPromise, WsProvider } = require('@polkadot/api');

async function analyzeContracts() {
  console.log('🔍 Analisando contratos da rede Lunes...');
  
  const wsProvider = new WsProvider('wss://ws-archive.lunes.io');
  const api = await ApiPromise.create({ provider: wsProvider });
  
  console.log('✅ Conectado à rede Lunes');
  
  // Contratos encontrados na busca anterior
  const contracts = [
    '5FvVZvbGau6Ec7d8qPCdesbBp8JdUFfzR6frko1QUG5RCnjf',
    '5HMbbcEXJTY7ek4UrhNYuKyjP4zQKfqBfhCMVujxq7rBz8nx',
    '5EJNfbBhBFws7n2EVykQfigK3U2XjkE6kd27NnPFN1rYseNQ',
    '5DfVHWSb2w7x1qaALsmUbrRcgfQ3MqJnNgD2mKXq3aKVGp7W',
    '5FNPC1CB4kZpoVYjbj9Pv82xZg6WGDDSaHoH9nppvtamNpar',
    '5Ebt6yiZEKYFwRxGgBU8wyHg7b2X1e19wvfcn7F9SbH8QXTh',
    '5Gx2WbBHnfMEFnpqQcmyGZ6Z9WY6LZqQJ9CUtoxZUELtjKAf',
    '5CNUWeLmycyEoGmsMZdbgbTq5tmFkfDQKTaj2jV9zcaSyFds',
    '5D6XpyPLmy1zP2vFNwysdYpCWTqk4z4s7Yw7V2iJGry6r8ZW'
  ];
  
  const contractAnalysis = [];
  
  try {
    console.log(`\n📊 Analisando ${contracts.length} contratos...\n`);
    
    for (let i = 0; i < contracts.length; i++) {
      const contractAddress = contracts[i];
      console.log(`🔍 Analisando contrato ${i + 1}/${contracts.length}: ${contractAddress}`);
      
      try {
        // Obter informações básicas do contrato
        const contractInfo = await api.query.contracts.contractInfoOf(contractAddress);
        
        if (contractInfo.isSome) {
          const info = contractInfo.unwrap();
          
          const analysis = {
            address: contractAddress,
            index: i + 1,
            isActive: true,
            info: {
              trieId: info.trieId?.toString() || 'N/A',
              codeHash: info.codeHash?.toString() || 'N/A',
              storageDeposit: info.storageDeposit?.toString() || 'N/A'
            },
            metadata: {},
            events: [],
            detectedType: 'Unknown'
          };
          
          // Tentar obter metadados do contrato
          try {
            // Tentar chamar métodos comuns de PSP22
            console.log('  🔍 Testando padrão PSP22...');
            
            // Método token_name
            try {
              const nameResult = await api.call.contractsApi.call(
                contractAddress,
                contractAddress,
                0,
                null,
                null,
                '0x6a6d1a0e' // selector para token_name
              );
              
              if (nameResult.isOk && nameResult.asOk.flags.isEmpty) {
                analysis.metadata.name = 'PSP22 Token';
                analysis.detectedType = 'PSP22';
                console.log('    ✅ Responde a token_name - PSP22 detectado');
              }
            } catch (e) {
              // Método não existe ou erro
            }
            
            // Método token_symbol
            try {
              const symbolResult = await api.call.contractsApi.call(
                contractAddress,
                contractAddress,
                0,
                null,
                null,
                '0x34205be5' // selector para token_symbol
              );
              
              if (symbolResult.isOk && symbolResult.asOk.flags.isEmpty) {
                analysis.metadata.symbol = 'PSP22 Symbol';
                analysis.detectedType = 'PSP22';
                console.log('    ✅ Responde a token_symbol - PSP22 detectado');
              }
            } catch (e) {
              // Método não existe ou erro
            }
            
            // Tentar PSP34
            if (analysis.detectedType === 'Unknown') {
              console.log('  🔍 Testando padrão PSP34...');
              
              try {
                const collectionIdResult = await api.call.contractsApi.call(
                  contractAddress,
                  contractAddress,
                  0,
                  null,
                  null,
                  '0xffa27a5f' // selector para collection_id
                );
                
                if (collectionIdResult.isOk && collectionIdResult.asOk.flags.isEmpty) {
                  analysis.detectedType = 'PSP34';
                  console.log('    ✅ Responde a collection_id - PSP34 detectado');
                }
              } catch (e) {
                // Método não existe ou erro
              }
            }
            
            // Tentar PSP37
            if (analysis.detectedType === 'Unknown') {
              console.log('  🔍 Testando padrão PSP37...');
              
              try {
                const balanceOfResult = await api.call.contractsApi.call(
                  contractAddress,
                  contractAddress,
                  0,
                  null,
                  null,
                  '0x3d261bd4' // selector para balance_of com token_id
                );
                
                if (balanceOfResult.isOk) {
                  analysis.detectedType = 'PSP37';
                  console.log('    ✅ Responde a balance_of - PSP37 detectado');
                }
              } catch (e) {
                // Método não existe ou erro
              }
            }
            
          } catch (error) {
            console.log(`    ⚠️  Erro ao testar métodos: ${error.message}`);
          }
          
          // Buscar eventos históricos deste contrato
          console.log('  🔍 Buscando eventos históricos...');
          
          try {
            const latestBlock = await api.rpc.chain.getBlock();
            const blockNumber = latestBlock.block.header.number.toNumber();
            const startBlock = Math.max(1, blockNumber - 5000);
            
            let eventCount = 0;
            
            for (let j = startBlock; j <= blockNumber && eventCount < 10; j += 100) {
              try {
                const blockHash = await api.rpc.chain.getBlockHash(j);
                const events = await api.query.system.events.at(blockHash);
                
                events.forEach((record) => {
                  const { event } = record;
                  
                  if (event.section === 'contracts') {
                    const eventData = event.data.map(d => d.toString());
                    
                    // Verificar se o evento está relacionado a este contrato
                    if (eventData.some(data => data.includes(contractAddress))) {
                      analysis.events.push({
                        block: j,
                        section: event.section,
                        method: event.method,
                        data: eventData
                      });
                      eventCount++;
                    }
                  }
                });
                
              } catch (e) {
                // Continuar mesmo com erros
              }
            }
            
            console.log(`    📋 Encontrados ${analysis.events.length} eventos`);
            
          } catch (error) {
            console.log(`    ⚠️  Erro ao buscar eventos: ${error.message}`);
          }
          
          // Tentar obter código do contrato
          try {
            const codeHash = analysis.info.codeHash;
            if (codeHash && codeHash !== 'N/A') {
              const code = await api.query.contracts.pristineCode(codeHash);
              if (code.isSome) {
                analysis.info.codeSize = code.unwrap().length;
                console.log(`    📦 Tamanho do código: ${analysis.info.codeSize} bytes`);
              }
            }
          } catch (error) {
            console.log(`    ⚠️  Erro ao obter código: ${error.message}`);
          }
          
          contractAnalysis.push(analysis);
          console.log(`    ✅ Tipo detectado: ${analysis.detectedType}\n`);
          
        } else {
          console.log(`    ❌ Contrato não encontrado ou inativo\n`);
        }
        
      } catch (error) {
        console.log(`    ❌ Erro ao analisar contrato: ${error.message}\n`);
      }
    }
    
    // Resumo da análise
    console.log('\n📊 RESUMO DA ANÁLISE DOS CONTRATOS:');
    console.log('====================================');
    
    const typeCount = {};
    contractAnalysis.forEach(contract => {
      typeCount[contract.detectedType] = (typeCount[contract.detectedType] || 0) + 1;
    });
    
    console.log('\n📈 Distribuição por tipo:');
    Object.entries(typeCount).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} contratos`);
    });
    
    console.log('\n📝 Lista detalhada:');
    contractAnalysis.forEach(contract => {
      console.log(`\n${contract.index}. ${contract.address}`);
      console.log(`   Tipo: ${contract.detectedType}`);
      console.log(`   Code Hash: ${contract.info.codeHash.substring(0, 20)}...`);
      console.log(`   Eventos: ${contract.events.length}`);
      if (contract.info.codeSize) {
        console.log(`   Tamanho: ${contract.info.codeSize} bytes`);
      }
    });
    
    // Salvar análise completa
    const results = {
      timestamp: new Date().toISOString(),
      totalContracts: contractAnalysis.length,
      typeDistribution: typeCount,
      contracts: contractAnalysis
    };
    
    require('fs').writeFileSync(
      'lunes-contract-analysis.json', 
      JSON.stringify(results, null, 2)
    );
    
    console.log('\n💾 Análise completa salva em: lunes-contract-analysis.json');
    
  } catch (error) {
    console.error('❌ Erro durante a análise:', error);
  } finally {
    await api.disconnect();
    console.log('🔌 Desconectado da rede Lunes');
  }
}

analyzeContracts().catch(console.error);
