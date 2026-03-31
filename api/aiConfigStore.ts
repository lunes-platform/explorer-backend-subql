import prisma from './prismaClient.ts';

export interface AIConfig {
  provider: 'none' | 'openrouter';
  apiKey: string;
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
  lastUpdated: string;
  updatedBy: string;
}

const DEFAULT_CONFIG: AIConfig = {
  provider: 'none',
  apiKey: '',
  model: 'google/gemma-3-1b-it:free',
  systemPrompt: `You are an expert blockchain analyst for the Lunes Network (a Substrate-based blockchain). 
Provide clear, concise explanations in Portuguese (pt-BR) about blockchain data.
Focus on: what happened, who is involved, amounts, and any notable patterns.
Keep responses under 200 words. Be factual and precise.`,
  maxTokens: 300,
  temperature: 0.3,
  enabled: false,
  lastUpdated: '1970-01-01T00:00:00.000Z',
  updatedBy: 'system',
};

function maskApiKey(apiKey: string): string {
  return apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : '';
}

function toAIConfig(row: {
  provider: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  enabled: boolean;
  lastUpdated: Date;
  updatedBy: string;
}): AIConfig {
  return {
    provider: row.provider as AIConfig['provider'],
    apiKey: row.apiKey,
    model: row.model,
    systemPrompt: row.systemPrompt,
    maxTokens: row.maxTokens,
    temperature: row.temperature,
    enabled: row.enabled,
    lastUpdated: row.lastUpdated.toISOString(),
    updatedBy: row.updatedBy,
  };
}

async function ensureAIConfig(): Promise<AIConfig> {
  const existing = await prisma.aIConfig.findUnique({ where: { id: 1 } });
  if (existing) {
    return toAIConfig(existing);
  }

  const created = await prisma.aIConfig.create({
    data: {
      id: 1,
      provider: DEFAULT_CONFIG.provider,
      apiKey: DEFAULT_CONFIG.apiKey,
      model: DEFAULT_CONFIG.model,
      systemPrompt: DEFAULT_CONFIG.systemPrompt,
      maxTokens: DEFAULT_CONFIG.maxTokens,
      temperature: DEFAULT_CONFIG.temperature,
      enabled: DEFAULT_CONFIG.enabled,
      updatedBy: DEFAULT_CONFIG.updatedBy,
    },
  });

  return toAIConfig(created);
}

export async function getAIConfig(): Promise<AIConfig> {
  return ensureAIConfig();
}

export async function getAIConfigSafe(): Promise<Omit<AIConfig, 'apiKey'> & { apiKey: string }> {
  const config = await ensureAIConfig();
  return {
    ...config,
    apiKey: maskApiKey(config.apiKey),
  };
}

export async function updateAIConfig(updates: Partial<AIConfig>, updatedBy: string): Promise<Omit<AIConfig, 'apiKey'> & { apiKey: string }> {
  const current = await ensureAIConfig();

  // Don't overwrite apiKey with masked value sent by client
  const incomingApiKey = updates.apiKey && updates.apiKey.includes('...') ? current.apiKey : updates.apiKey;

  const updated = await prisma.aIConfig.update({
    where: { id: 1 },
    data: {
      provider: updates.provider,
      apiKey: incomingApiKey,
      model: updates.model,
      systemPrompt: updates.systemPrompt,
      maxTokens: updates.maxTokens,
      temperature: updates.temperature,
      enabled: updates.enabled,
      updatedBy,
      lastUpdated: new Date(),
    },
  });

  const config = toAIConfig(updated);
  return {
    ...config,
    apiKey: maskApiKey(config.apiKey),
  };
}

export function testAPIKey(apiKey: string): Promise<{ success: boolean; message: string; models?: string[] }> {
  return fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })
    .then(async (res) => {
      if (!res.ok) {
        return { success: false, message: `API retornou status ${res.status}` };
      }
      const data = await res.json();
      const freeModels = (data.data || [])
        .filter((m: any) => {
          const pricing = m.pricing || {};
          return pricing.prompt === '0' && pricing.completion === '0';
        })
        .map((m: any) => m.id)
        .slice(0, 30);
      return { success: true, message: `Conectado! ${freeModels.length} modelos gratuitos disponíveis.`, models: freeModels };
    })
    .catch((err) => ({ success: false, message: `Erro de conexão: ${err.message}` }));
}

// Available free models on OpenRouter (fallback list)
export const FREE_MODELS = [
  { id: 'google/gemma-3-1b-it:free', name: 'Google Gemma 3 1B' },
  { id: 'google/gemma-3-4b-it:free', name: 'Google Gemma 3 4B' },
  { id: 'google/gemma-3-12b-it:free', name: 'Google Gemma 3 12B' },
  { id: 'google/gemma-3-27b-it:free', name: 'Google Gemma 3 27B' },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Meta Llama 3.1 8B' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct' },
  { id: 'qwen/qwen3-8b:free', name: 'Qwen 3 8B' },
  { id: 'qwen/qwen3-14b:free', name: 'Qwen 3 14B' },
  { id: 'qwen/qwen3-30b-a3b:free', name: 'Qwen 3 30B' },
  { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1' },
  { id: 'microsoft/mai-ds-r1:free', name: 'Microsoft MAI DS R1' },
  { id: 'moonshotai/kimi-k2:free', name: 'Moonshot Kimi K2' },
];
