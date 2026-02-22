import React from 'react';
import PrivacyReport from '../PrivacyReport';
import UTXOClusterChart from './UTXOClusterChart';
import { PrivacyAnalysisResult } from '../../utils/privacy';

interface EntityForensicsDashboardProps {
    entityId: string;
    entityType: 'address' | 'transaction';
    utxos: any[];
    privacyReport?: PrivacyAnalysisResult;
    onClose?: () => void;
}

export default function EntityForensicsDashboard({
    entityId,
    entityType,
    utxos,
    privacyReport,
    onClose
}: EntityForensicsDashboardProps) {

    return (
        <div className="w-full flex flex-col gap-6">
            <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <div>
                    <h2 className="text-lg font-bold text-white">Entity Forensics Profile</h2>
                    <p className="text-xs font-mono text-slate-400 mt-1">{entityId}</p>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        Close
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <UTXOClusterChart utxos={utxos} entityName={entityId.substring(0, 12) + '...'} />
                </div>

                <div>
                    {privacyReport ? (
                        <PrivacyReport report={privacyReport} />
                    ) : (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 h-full flex items-center justify-center text-slate-500 text-sm">
                            <p>No privacy heuristic report generated for this entity.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
