import { SmartContract } from "../types";

// Interface para metadados de contratos PSP
export interface ContractMetadata {
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: bigint;
  version?: string;
  description?: string;
  image?: string;
  external_url?: string;
  attributes?: any[];
}

// Função para detectar padrão PSP baseado nos métodos disponíveis
async function detectContractStandardFromMetadata(contractAddress: string): Promise<string> {
  try {
    // Por enquanto, retornar "Unknown" - pode ser melhorado com chamadas reais ao contrato
    logger.info(`Detecting contract standard for ${contractAddress}`);
    return "Unknown";
  } catch (error) {
    logger.warn(`Error detecting contract standard for ${contractAddress}: ${error}`);
    return "Unknown";
  }
}

// ink! selectors (blake2_256("Trait::method")[0..4])
const SEL_TOKEN_NAME     = '0x3d261bd4'; // PSP22Metadata::token_name
const SEL_TOKEN_SYMBOL   = '0x34205be5'; // PSP22Metadata::token_symbol
const SEL_TOKEN_DECIMALS = '0x7271b782'; // PSP22Metadata::token_decimals
const SEL_TOTAL_SUPPLY   = '0x162df8c2'; // PSP22::total_supply

const GAS_LIMIT = { refTime: 5_000_000_000, proofSize: 131_072 };

async function contractDryRun(contractAddress: string, selector: string): Promise<Uint8Array | null> {
  try {
    const result = await (api as any).rpc.contracts.call({
      origin: contractAddress,
      dest: contractAddress,
      value: 0,
      gasLimit: GAS_LIMIT,
      storageDepositLimit: null,
      inputData: selector,
    });
    const res: any = result.toJSON ? result.toJSON() : result;
    // result.result.Ok.data contains the SCALE-encoded return value
    const dataHex: string | undefined = res?.result?.Ok?.data ?? res?.result?.ok?.data;
    if (!dataHex) return null;
    const buf = Buffer.from(dataHex.replace(/^0x/, ''), 'hex');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  } catch {
    return null;
  }
}

// Decode SCALE Option<Vec<u8>> or Vec<u8> as UTF-8 string
function decodeScaleString(bytes: Uint8Array): string | null {
  try {
    if (!bytes || bytes.length === 0) return null;
    let offset = 0;
    // Skip Ok/Some prefix byte if present (0x00 = Ok, 0x01 = Some)
    if (bytes[0] === 0x00 || bytes[0] === 0x01) offset = 1;
    // SCALE compact length
    const firstByte = bytes[offset];
    const mode = firstByte & 0x03;
    let len = 0;
    if (mode === 0) { len = firstByte >> 2; offset += 1; }
    else if (mode === 1) { len = ((bytes[offset + 1] << 6) | (firstByte >> 2)); offset += 2; }
    else if (mode === 2) { len = (bytes[offset + 3] << 22) | (bytes[offset + 2] << 14) | (bytes[offset + 1] << 6) | (firstByte >> 2); offset += 4; }
    if (len === 0 || offset + len > bytes.length) return null;
    return Buffer.from(bytes.slice(offset, offset + len)).toString('utf8');
  } catch {
    return null;
  }
}

// Decode SCALE u8 (decimals)
function decodeScaleU8(bytes: Uint8Array): number | null {
  try {
    if (!bytes || bytes.length === 0) return null;
    let offset = 0;
    if (bytes[0] === 0x00 || bytes[0] === 0x01) offset = 1;
    return bytes[offset] ?? null;
  } catch {
    return null;
  }
}

// Decode SCALE u128 (total supply)
function decodeScaleU128(bytes: Uint8Array): bigint | null {
  try {
    if (!bytes || bytes.length < 16) return null;
    let offset = 0;
    if (bytes[0] === 0x00 || bytes[0] === 0x01) offset = 1;
    if (bytes.length < offset + 16) return null;
    return api.registry.createType('u128', bytes.slice(offset, offset + 16)).toBigInt();
  } catch {
    return null;
  }
}

// Buscar metadados específicos do PSP22 via contracts.call RPC
export async function fetchPsp22Metadata(contractAddress: string): Promise<Partial<ContractMetadata>> {
  const metadata: Partial<ContractMetadata> = {};
  const short = contractAddress.slice(-8);

  try {
    logger.info(`[Metadata] Fetching PSP22 metadata for ${contractAddress.slice(0, 10)}...`);

    const [nameBytes, symbolBytes, decimalsBytes, supplyBytes] = await Promise.all([
      contractDryRun(contractAddress, SEL_TOKEN_NAME),
      contractDryRun(contractAddress, SEL_TOKEN_SYMBOL),
      contractDryRun(contractAddress, SEL_TOKEN_DECIMALS),
      contractDryRun(contractAddress, SEL_TOTAL_SUPPLY),
    ]);

    metadata.name    = (nameBytes    && decodeScaleString(nameBytes))    || `Token ${short}`;
    metadata.symbol  = (symbolBytes  && decodeScaleString(symbolBytes))  || `TKN`;
    metadata.decimals = (decimalsBytes && decodeScaleU8(decimalsBytes))  ?? 18;
    metadata.totalSupply = (supplyBytes && decodeScaleU128(supplyBytes)) ?? BigInt(0);

    logger.info(`[Metadata] PSP22 ${contractAddress.slice(0,10)}: name=${metadata.name} symbol=${metadata.symbol} decimals=${metadata.decimals}`);
  } catch (error) {
    logger.warn(`[Metadata] fetchPsp22Metadata error for ${contractAddress}: ${error}`);
    metadata.name = `Token ${short}`;
    metadata.symbol = `TKN`;
    metadata.decimals = 18;
    metadata.totalSupply = BigInt(0);
  }

  return metadata;
}

// Buscar metadados específicos do PSP34 via contracts.call RPC
export async function fetchPsp34Metadata(contractAddress: string): Promise<Partial<ContractMetadata>> {
  const metadata: Partial<ContractMetadata> = {};
  const short = contractAddress.slice(-8);

  try {
    logger.info(`[Metadata] Fetching PSP34 metadata for ${contractAddress.slice(0, 10)}...`);

    // PSP34 Metadata extension selectors
    const SEL_COLLECTION_NAME   = '0x6914a9b2'; // PSP34Metadata::get_attribute for "name"
    // Fallback: use contract address suffix as name
    metadata.name = `Collection ${short}`;
    metadata.symbol = `NFT`;
    metadata.description = 'NFT Collection';

    // Try to get name via attribute (key = b"name")
    // PSP34Metadata::get_attribute(id: Id, key: Vec<u8>) — complex to call without ABI
    // Use collection_id as identifier for now
    logger.info(`[Metadata] PSP34 ${contractAddress.slice(0,10)}: using default metadata`);
  } catch (error) {
    logger.warn(`[Metadata] fetchPsp34Metadata error for ${contractAddress}: ${error}`);
    metadata.name = `Collection ${short}`;
    metadata.symbol = `NFT`;
  }

  return metadata;
}

// Buscar metadados específicos do PSP37
export async function fetchPsp37Metadata(contractAddress: string): Promise<Partial<ContractMetadata>> {
  return {
    name: `Multi-Token ${contractAddress.slice(-8)}`,
    description: 'PSP37 Multi-Token Contract',
    version: '1.0.0',
  };
}

// Buscar metadados de contrato baseado no padrão detectado
export async function fetchContractMetadata(contractAddress: string, standard?: string): Promise<Partial<ContractMetadata>> {
  let detectedStandard = standard;
  
  if (!detectedStandard) {
    detectedStandard = await detectContractStandardFromMetadata(contractAddress);
  }
  
  switch (detectedStandard) {
    case "PSP22":
      return await fetchPsp22Metadata(contractAddress);
    case "PSP34":
      return await fetchPsp34Metadata(contractAddress);
    case "PSP37":
      return await fetchPsp37Metadata(contractAddress);
    default:
      return {
        name: `Smart Contract ${contractAddress.slice(-8)}`,
        description: "Unknown contract type",
        version: "1.0.0"
      };
  }
}

// Atualizar metadados de um contrato existente
export async function updateContractMetadata(contractAddress: string, standard?: string): Promise<void> {
  try {
    const contract = await SmartContract.get(contractAddress);
    if (!contract) {
      logger.warn(`Contract ${contractAddress} not found for metadata update`);
      return;
    }

    const metadata = await fetchContractMetadata(contractAddress, standard);
    
    // Atualizar campos do contrato com os metadados
    if (metadata.name) contract.name = metadata.name;
    if (metadata.version) contract.version = metadata.version;
    if (!contract.standard || contract.standard === "Unknown") {
      contract.standard = standard || await detectContractStandardFromMetadata(contractAddress);
    }
    
    // Salvar metadados como JSON
    contract.metadata = JSON.stringify(metadata);
    
    await contract.save();
    logger.info(`Updated metadata for contract ${contractAddress}`);
    
  } catch (error) {
    logger.error(`Error updating contract metadata for ${contractAddress}: ${error}`);
  }
}

// Verificar se um contrato precisa de atualização de metadados
export async function needsMetadataUpdate(contractAddress: string): Promise<boolean> {
  try {
    const contract = await SmartContract.get(contractAddress);
    if (!contract) return true;
    
    // Verificar se tem metadados básicos
    return !contract.metadata || !contract.name || contract.standard === "Unknown";
  } catch (error) {
    return true;
  }
}
