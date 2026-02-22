import { IncidentEvent } from '../components/forensics/LiveIncidentFeed';

export interface IncidentStudy {
    id: string;
    name: string;
    description: string;
    events: IncidentEvent[];
    rootNodeId: string;
}

export const INCIDENT_STUDIES: Record<string, IncidentStudy> = {
    'bitfinex-hack': {
        id: 'bitfinex-hack',
        name: 'Bitfinex Hack (2016)',
        description: 'Tracking the movement of the 119k BTC stolen from Bitfinex in 2016.',
        rootNodeId: '1LsPb3D1o1Z7CzZ8HXmHNZkGjs6n26qveb', // The consolidated hacker address
        events: [
            {
                id: '1',
                timestamp: '2022-02-01T10:00:00Z',
                status: 'investigating',
                description: 'Massive movement detected from dormant 2016 Bitfinex hack wallet. 94,643 BTC moving across 23 transactions.',
                txid: '3a41b2... (simulated)' // In a real app we'd load the real consolidation tx
            },
             {
                id: '2',
                timestamp: '2022-02-01T10:15:00Z',
                status: 'detected',
                description: 'Funds splitting into smaller 10 BTC UTXOs. Likely preparing for peel chains or mixing.',
            },
            {
                id: '3',
                timestamp: '2022-02-08T12:00:00Z',
                status: 'resolved',
                description: 'DOJ announces seizure of $3.6B in crypto linked to the hack, recovering 94k BTC. Ilya Lichtenstein and Heather Morgan arrested.',
                txid: 'bc1...seized'
            }
        ]
    },
    'poly-network': {
         id: 'poly-network',
         name: 'Poly Network Exploit',
         description: 'Cross-chain interoperability protocol hacked for $600M across multiple chains.',
         rootNodeId: 'bc1qxxx...poly',
         events: [
              {
                id: '4',
                timestamp: '2021-08-10T14:00:00Z',
                status: 'detected',
                description: 'Anomaly detected: Massive unexplained peg-out from Poly Network bridge contracts.',
            },
            {
                id: '5',
                timestamp: '2021-08-10T15:30:00Z',
                status: 'investigating',
                description: 'Attacker identified. Cross-chain communication compromised. Waiting to see if funds hit centralized exchanges.',
            },
            {
                id: '6',
                timestamp: '2021-08-13T09:00:00Z',
                status: 'resolved',
                description: 'Attacker ("Mr. White Hat") returns nearly all funds. Offered a $500k bug bounty.',
            }
         ]
    },
    'lazarus-ofac': {
        id: 'lazarus-ofac',
        name: 'OFAC Sanction: Lazarus Group',
        description: 'Tracking UTXOs tainted by the North Korean state-sponsored hacking collective (SDN List).',
        rootNodeId: '1bc1q_lazarus_core_wallet',
        events: [
            {
                id: '7',
                timestamp: '2023-04-14T08:00:00Z',
                status: 'detected',
                description: 'WARNING: 3 Wallets added to the OFAC Specially Designated Nationals (SDN) List linked to Lazarus Group.',
            },
            {
                id: '8',
                timestamp: '2023-04-15T12:00:00Z',
                status: 'investigating',
                description: 'Funds observed moving through intermediate hops towards high-liquidity Asian exchanges avoiding KYC borders.',
                txid: '7b82f9...ofac_hop'
            },
            {
                id: '9',
                timestamp: '2023-04-18T16:30:00Z',
                status: 'investigating',
                description: 'Attempted Coinjoin transaction detected. Tracing entropy breakdown. High risk of peel chain execution.',
            }
        ]
    }
};
