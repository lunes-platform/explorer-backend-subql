export interface KnownContract {
    address: string;
    name: string;
    type: 'DEX' | 'Social' | 'Token' | 'System' | 'Other';
    icon?: string;
    verified: boolean;
}

export const KNOWN_CONTRACTS: Record<string, KnownContract> = {
    // DEX Contracts (Placeholders - to be updated with real addresses)
    '5G...DEX': {
        address: '5G...DEX',
        name: 'Lunes DEX Router',
        type: 'DEX',
        verified: true
    },
    '5H...Pool': {
        address: '5H...Pool',
        name: 'LUNES/USDT Pool',
        type: 'DEX',
        verified: true
    },

    // Social / dApps
    '5F...Pid': {
        address: '5F...Pid',
        name: 'PidChat Protocol',
        type: 'Social',
        verified: true
    },

    // System
    '5C...Gov': {
        address: '5C...Gov',
        name: 'Lunes Governance',
        type: 'System',
        verified: true
    }
};

export const getContractInfo = (address: string): KnownContract | undefined => {
    return KNOWN_CONTRACTS[address];
};
