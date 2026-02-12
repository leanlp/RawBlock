export const BITCOIN_BLOCK_TIME_SECONDS = 600;
export const BITCOIN_BLOCK_TIME_MINUTES = BITCOIN_BLOCK_TIME_SECONDS / 60;
export const BITCOIN_HALVING_INTERVAL_BLOCKS = 210_000;
export const BITCOIN_MAX_SUPPLY_BTC = 21_000_000;
export const BITCOIN_BASE_LAYER_TPS_ESTIMATE = 7;
export const BITCOIN_INITIAL_SUBSIDY_BTC = 50;

const SATOSHIS_PER_BTC = 100_000_000;
const INITIAL_SUBSIDY_SATS = BigInt(BITCOIN_INITIAL_SUBSIDY_BTC * SATOSHIS_PER_BTC);

export function getBlockSubsidy(height: number): number {
  if (!Number.isFinite(height) || height < 0) {
    return 0;
  }

  const halvingEpoch = Math.floor(height / BITCOIN_HALVING_INTERVAL_BLOCKS);
  const subsidySats = INITIAL_SUBSIDY_SATS >> BigInt(halvingEpoch);

  return Number(subsidySats) / SATOSHIS_PER_BTC;
}
