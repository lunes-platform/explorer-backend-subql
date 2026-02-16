// AI Explanation service for Pilar C (Intelligence)
// Supports OpenRouter LLM integration with local deterministic fallback

import { getAIConfig } from './aiConfigStore.ts';

export async function generateExplanation(type, data) {
  const config = getAIConfig();

  // Try LLM if enabled and configured
  if (config.enabled && config.apiKey && config.provider === 'openrouter') {
    try {
      const llmResult = await callOpenRouter(config, type, data);
      if (llmResult) return llmResult;
    } catch (err) {
      console.error('[AI] OpenRouter error, falling back to local:', err.message);
    }
  }

  // Local deterministic fallback
  return generateLocalExplanation(type, data);
}

function generateLocalExplanation(type, data) {
  switch (type) {
    case 'transaction':
      return explainTransaction(data);
    case 'account':
      return explainAccount(data);
    case 'block':
      return explainBlock(data);
    case 'extrinsic':
      return explainExtrinsic(data);
    default:
      return 'Unable to generate explanation for this data type.';
  }
}

async function callOpenRouter(config, type, data) {
  const userPrompt = buildPrompt(type, data);

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_PUBLIC_URL || 'https://explorer.lunes.io',
      'X-Title': 'Lunes Explorer AI',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${errBody}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenRouter');
  return content.trim();
}

function buildPrompt(type, data) {
  switch (type) {
    case 'transaction': {
      const { from, to, amountFormatted, blockNumber, timestamp, success } = data;
      return `Explique esta transação na blockchain Lunes:\n- De: ${from}\n- Para: ${to}\n- Valor: ${amountFormatted?.toFixed(4) || '?'} LUNES\n- Bloco: #${blockNumber}\n- Status: ${success ? 'sucesso' : 'falhou'}\n- Quando: ${timestamp ? new Date(timestamp).toISOString() : 'recente'}`;
    }
    case 'account': {
      const { address, totalFormatted, freeFormatted, reservedFormatted, nonce } = data;
      return `Explique esta conta na blockchain Lunes:\n- Endereço: ${address}\n- Saldo total: ${totalFormatted?.toFixed(4) || '0'} LUNES\n- Disponível: ${freeFormatted?.toFixed(4) || '0'} LUNES\n- Reservado: ${reservedFormatted?.toFixed(4) || '0'} LUNES\n- Nonce: ${nonce || 0}`;
    }
    case 'block': {
      const { number, extrinsicCount, eventCount, timestamp } = data;
      return `Explique este bloco na blockchain Lunes:\n- Número: #${number}\n- Extrinsics: ${extrinsicCount}\n- Eventos: ${eventCount}\n- Produzido em: ${timestamp ? new Date(timestamp).toISOString() : 'recente'}`;
    }
    case 'extrinsic': {
      const { section, method, signer, success, blockNumber } = data;
      return `Explique esta operação na blockchain Lunes:\n- Tipo: ${section}.${method}\n- Assinante: ${signer || 'anônimo'}\n- Status: ${success ? 'sucesso' : 'falhou'}\n- Bloco: #${blockNumber}`;
    }
    default:
      return `Explique estes dados da blockchain Lunes: ${JSON.stringify(data)}`;
  }
}

function explainTransaction(tx) {
  const { from, to, amountFormatted, blockNumber, timestamp, success } = tx;
  const amount = amountFormatted?.toFixed(4) || 'unknown';
  const timeAgo = timestamp ? formatTimeAgo(timestamp) : 'recently';
  const status = success ? 'successful' : 'failed';
  
  let explanation = `This is a ${status} transfer of ${amount} LUNES `;
  explanation += `from ${shortenAddress(from)} to ${shortenAddress(to)}. `;
  explanation += `Executed ${timeAgo} in block #${blockNumber}.`;
  
  if (amountFormatted > 1000000) {
    explanation += ' This is whale activity.';
  } else if (amountFormatted < 0.001) {
    explanation += ' This appears to be a dust transaction.';
  }
  
  return explanation;
}

function explainAccount(account) {
  const { address, totalFormatted, freeFormatted, reservedFormatted, nonce } = account;
  const total = totalFormatted?.toFixed(4) || '0';
  const free = freeFormatted?.toFixed(4) || '0';
  
  let explanation = `Account holds ${total} LUNES total (${free} available). `;
  explanation += `Has sent ${nonce || 0} transactions.`;
  
  if (totalFormatted > 1000000) {
    explanation += ' This is a whale account.';
  }
  
  return explanation;
}

function explainBlock(block) {
  const { number, extrinsicCount, eventCount, timestamp } = block;
  const timeAgo = timestamp ? formatTimeAgo(timestamp) : 'recently';
  
  return `Block #${number} produced ${timeAgo} with ${extrinsicCount} extrinsics and ${eventCount} events.`;
}

function explainExtrinsic(ext) {
  const { section, method, signer, success, blockNumber } = ext;
  const status = success ? 'successful' : 'failed';
  
  return `${status} ${section}.${method} from ${signer ? shortenAddress(signer) : 'anonymous'} in block #${blockNumber}.`;
}

function shortenAddress(addr) {
  if (!addr || addr.length < 14) return addr || 'unknown';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTimeAgo(timestamp) {
  const now = Date.now();
  const ts = typeof timestamp === 'number' ? timestamp : Number(timestamp);
  const diff = Math.floor((now - ts) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
