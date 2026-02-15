import { LUNES_DECIMALS, LUNES_INITIAL_SUPPLY } from '../data/tokenomics';

export interface SanityResult {
    valid: boolean;
    warnings: string[];
}

/**
 * Validates that supply values from RPC are within sane bounds.
 * BL-TRUST-002: Estado corrente (supply) deve usar RPC como fonte primária.
 * BL-TRUST-005: Todas as métricas devem mostrar Fonte + Última atualização.
 */
export function validateSupply(totalIssuanceFormatted: number): SanityResult {
    const warnings: string[] = [];

    if (totalIssuanceFormatted <= 0) {
        warnings.push('Total issuance is zero or negative — RPC may be returning invalid data.');
    }

    if (totalIssuanceFormatted > LUNES_INITIAL_SUPPLY * 1.01) {
        warnings.push(
            `Total issuance (${totalIssuanceFormatted.toLocaleString()}) exceeds initial supply (${LUNES_INITIAL_SUPPLY.toLocaleString()}) by >1%. Possible decimals mismatch.`
        );
    }

    if (totalIssuanceFormatted < LUNES_INITIAL_SUPPLY * 0.5) {
        warnings.push(
            `Total issuance (${totalIssuanceFormatted.toLocaleString()}) is less than 50% of initial supply. Verify burn data or decimals.`
        );
    }

    return { valid: warnings.length === 0, warnings };
}

/**
 * Validates that token decimals from RPC match expected configuration.
 */
export function validateDecimals(chainDecimals: number): SanityResult {
    const warnings: string[] = [];

    if (chainDecimals !== LUNES_DECIMALS) {
        warnings.push(
            `Chain reports ${chainDecimals} decimals but config expects ${LUNES_DECIMALS}. Values may be displayed incorrectly.`
        );
    }

    if (chainDecimals < 0 || chainDecimals > 18) {
        warnings.push(`Unusual decimal value: ${chainDecimals}. Expected 0-18.`);
    }

    return { valid: warnings.length === 0, warnings };
}

/**
 * Validates block number sanity (should always increase).
 */
export function validateBlockNumber(blockNumber: number): SanityResult {
    const warnings: string[] = [];

    if (blockNumber <= 0) {
        warnings.push('Block number is zero or negative.');
    }

    return { valid: warnings.length === 0, warnings };
}

/**
 * Runs all sanity checks and returns combined result.
 */
export function runAllChecks(params: {
    totalIssuanceFormatted: number;
    chainDecimals: number;
    latestBlock: number;
}): SanityResult {
    const results = [
        validateSupply(params.totalIssuanceFormatted),
        validateDecimals(params.chainDecimals),
        validateBlockNumber(params.latestBlock),
    ];

    const warnings = results.flatMap(r => r.warnings);
    return { valid: warnings.length === 0, warnings };
}
