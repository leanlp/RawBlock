export const BRIDGE_DATA = {
    'Liquid Network': [
        { timestamp: '2023-10-01T00:00:00Z', pegInVolume: 120, pegOutVolume: 80, tvl: 3500 },
        { timestamp: '2023-10-02T00:00:00Z', pegInVolume: 150, pegOutVolume: 90, tvl: 3560 },
        { timestamp: '2023-10-03T00:00:00Z', pegInVolume: 80, pegOutVolume: 200, tvl: 3440 },
        { timestamp: '2023-10-04T00:00:00Z', pegInVolume: 300, pegOutVolume: 110, tvl: 3630 },
        { timestamp: '2023-10-05T00:00:00Z', pegInVolume: 110, pegOutVolume: 95, tvl: 3645 },
        { timestamp: '2023-10-06T00:00:00Z', pegInVolume: 90, pegOutVolume: 210, tvl: 3525 },
        { timestamp: '2023-10-07T00:00:00Z', pegInVolume: 400, pegOutVolume: 150, tvl: 3775 }, // Healthy growth
    ],
    'Rootstock (RSK)': [
        { timestamp: '2023-10-01T00:00:00Z', pegInVolume: 50, pegOutVolume: 30, tvl: 2800 },
        { timestamp: '2023-10-02T00:00:00Z', pegInVolume: 60, pegOutVolume: 40, tvl: 2820 },
        { timestamp: '2023-10-03T00:00:00Z', pegInVolume: 45, pegOutVolume: 35, tvl: 2830 },
        { timestamp: '2023-10-04T00:00:00Z', pegInVolume: 55, pegOutVolume: 40, tvl: 2845 },
        { timestamp: '2023-10-05T00:00:00Z', pegInVolume: 20, pegOutVolume: 1500, tvl: 1365 }, // ANOMALY: Massive peg-out! (Exploit simulation)
        { timestamp: '2023-10-06T00:00:00Z', pegInVolume: 5, pegOutVolume: 200, tvl: 1170 }, 
        { timestamp: '2023-10-07T00:00:00Z', pegInVolume: 0, pegOutVolume: 50, tvl: 1120 },
    ]
};

export const DEX_VOLUME_DATA = [
    { name: 'Bisq', volume24h: 340.5, change24h: 5.2, activeOffers: 1240 },
    { name: 'Robosats', volume24h: 120.3, change24h: 12.4, activeOffers: 850 },
    { name: 'HodlHodl', volume24h: 210.8, change24h: -2.1, activeOffers: 920 },
    { name: 'Peach Bitcoin', volume24h: 45.2, change24h: 18.5, activeOffers: 310 }
];
