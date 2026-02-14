export const LUNES_DECIMALS = 8;
export const LUNES_INITIAL_SUPPLY = 200_000_000;
export const LUNES_CURRENT_SUPPLY = 150_730_000;
export const LUNES_BURN_TARGET = 50_000_000;

export const LUNES_TOTAL_BURNED = Math.max(0, LUNES_INITIAL_SUPPLY - LUNES_CURRENT_SUPPLY);

export const formatLunesAmount = (amount: number | string): string => {
  const num = typeof amount === 'string' ? Number(amount) / 1e8 : amount;
  return num.toLocaleString('en-US');
};

// Format large numbers in abbreviated form (200M, 150.7M, 50M)
export const formatAbbreviatedNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toLocaleString('en-US');
};
