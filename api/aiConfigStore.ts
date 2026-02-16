import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'ai-config.json');

export interface AIConfig {
  provider: 'openrouter' | 'none';
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
  lastUpdated: new Date().toISOString(),
  updatedBy: 'system',
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadConfig(): AIConfig {
  ensureDataDir();
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('[AI Config] Error loading config:', e);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config: AIConfig) {
  ensureDataDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getAIConfig(): AIConfig {
  return loadConfig();
}

export function getAIConfigSafe(): Omit<AIConfig, 'apiKey'> & { apiKey: string } {
  const config = loadConfig();
  return {
    ...config,
    apiKey: config.apiKey ? `${config.apiKey.slice(0, 8)}...${config.apiKey.slice(-4)}` : '',
  };
}

export function updateAIConfig(updates: Partial<AIConfig>, updatedBy: string): AIConfig {
  const current = loadConfig();
  const updated: AIConfig = {
    ...current,
    ...updates,
    lastUpdated: new Date().toISOString(),
    updatedBy,
  };
  // Don't overwrite apiKey with masked version
  if (updates.apiKey && updates.apiKey.includes('...')) {
    updated.apiKey = current.apiKey;
  }
  saveConfig(updated);
  return {
    ...updated,
    apiKey: updated.apiKey ? `${updated.apiKey.slice(0, 8)}...${updated.apiKey.slice(-4)}` : '',
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
