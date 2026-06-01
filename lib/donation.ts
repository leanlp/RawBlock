/** Fixed on-chain donation receive address (mainnet, bech32 P2WPKH). */
export const DONATION_BTC_ADDRESS = "bc1qpu2z5yccfuv9tz83xsk8jzu20d3z0cn684xhqe";

/** BIP21 URI scanned by most wallets (matches typical "Receive" QR payloads). */
export const DONATION_BIP21_URI = `bitcoin:${DONATION_BTC_ADDRESS}`;

export const DONATION_MEMPOOL_ADDRESS_URL = `https://mempool.space/address/${DONATION_BTC_ADDRESS}`;
