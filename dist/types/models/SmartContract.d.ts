import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type SmartContractProps = Omit<SmartContract, NonNullable<FunctionPropertyNames<SmartContract>> | '_name'>;
export declare class SmartContract implements Entity {
    constructor(id: string, contractAddress: string, deployedAt: bigint, deployedAtBlock: bigint, isVerified: boolean, callCount: number);
    id: string;
    contractAddress: string;
    deployerId?: string;
    codeHash?: string;
    standard?: string;
    name?: string;
    version?: string;
    deployedAt: bigint;
    deployedAtBlock: bigint;
    isVerified: boolean;
    sourceCode?: string;
    abi?: string;
    metadata?: string;
    lastInteraction?: bigint;
    callCount: number;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<SmartContract | undefined>;
    static getByDeployerId(deployerId: string): Promise<SmartContract[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<SmartContractProps>[], options?: GetOptions<SmartContractProps>): Promise<SmartContract[]>;
    static create(record: SmartContractProps): SmartContract;
}
