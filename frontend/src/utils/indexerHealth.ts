export type DegradedLevel = 'warning' | 'critical' | 'offline';

export function getIndexerDegradedLevel(
    rpcBlock: number,
    indexerBlock: number,
    queryError: boolean
): DegradedLevel | null {
    if (queryError) return 'offline';
    if (rpcBlock <= 0 || indexerBlock <= 0) return null;
    const lag = rpcBlock - indexerBlock;
    if (lag > 100) return 'critical';
    if (lag > 20) return 'warning';
    return null;
}

export function degradedToHealth(level: DegradedLevel | null): 'healthy' | 'delayed' | 'lagging' | 'disconnected' {
    if (level === 'critical') return 'lagging';
    if (level === 'warning') return 'delayed';
    if (level === 'offline') return 'disconnected';
    return 'healthy';
}
