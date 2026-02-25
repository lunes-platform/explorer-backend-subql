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
export declare function fetchPsp22Metadata(contractAddress: string): Promise<Partial<ContractMetadata>>;
export declare function fetchPsp34Metadata(contractAddress: string): Promise<Partial<ContractMetadata>>;
export declare function fetchPsp37Metadata(contractAddress: string): Promise<Partial<ContractMetadata>>;
export declare function fetchContractMetadata(contractAddress: string, standard?: string): Promise<Partial<ContractMetadata>>;
export declare function updateContractMetadata(contractAddress: string, standard?: string): Promise<void>;
export declare function needsMetadataUpdate(contractAddress: string): Promise<boolean>;
