import React, { useMemo } from 'react';
import { clients } from '../data/clients';
import { Shield, ShieldAlert, Heart, Calendar, CheckCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';

const Protection = () => {
    // --- Analysis Logic ---
    const criticalGaps = useMemo(() => {
        return clients.flatMap(client => {
            const gaps = [];
            const risks = client.risks || [];

            risks.forEach(risk => {
                if (risk.text.toLowerCase().includes('protection') || risk.text.toLowerCase().includes('cover')) {
                    gaps.push({
                        client: client.name,
                        risk: risk.text,
                        level: risk.type
                    });
                }
            });

            // Implicit logic from brief: Checking strictly for "No Income Protection"
            if (client.risks.some(r => r.text.includes('NO Income Protection'))) {
                // Already captured above usually, but good to be explicit if needed
            }

            return gaps;
        }).sort((a, b) => (a.level === 'critical' ? -1 : 1));
    }, []);

    const expiringPolicies = useMemo(() => {
        // Mocking some policy data structure extracted from the description text
        const policies = [
            { client: "David Chen", type: "Life + CI", amount: "£750k", expiry: "2035" },
            { client: "Sarah Chen", type: "Life", amount: "£400k", expiry: "2038" },
            { client: "Brian Potter", type: "Life", amount: "£100k", expiry: "2027" },
            { client: "Keith Lard", type: "Life", amount: "£200k", expiry: "2028" },
            { client: "Maureen Lard", type: "Life", amount: "£150k", expiry: "2030" },
            { client: "Lisa Rahman", type: "Life + CI", amount: "£300k", expiry: "2045" },
            { client: "Ahmed Rahman", type: "Life", amount: "£300k", expiry: "2043" },
            { client: "Priya Patel", type: "Life", amount: "£400k", expiry: "2044" },
            { client: "Anil Patel", type: "Life + CI", amount: "£400k", expiry: "2043" },
            { client: "Emma Thompson", type: "Life", amount: "£250k", expiry: "2041" },
        ].sort((a, b) => parseInt(a.expiry) - parseInt(b.expiry));

        return policies;
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Overview Cards */}
            <div className="grid grid-dashboard gap-6">
                <div className="glass-card p-6 bg-red-500/10 border-red-500/20">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-red-300 text-sm font-medium mb-1">Critical Gaps</p>
                            <h3 className="text-3xl font-bold text-white mb-2">{criticalGaps.filter(g => g.level === 'critical').length}</h3>
                            <p className="text-red-400 text-xs">Immediate action required</p>
                        </div>
                        <ShieldAlert className="w-12 h-12 text-red-500 opacity-50" />
                    </div>
                </div>

                <div className="glass-card p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-medium mb-1">Policies Monitored</p>
                            <h3 className="text-3xl font-bold text-white mb-2">{expiringPolicies.length}</h3>
                            <p className="text-slate-500 text-xs">Life, CI & IP policies</p>
                        </div>
                        <Shield className="w-12 h-12 text-blue-500 opacity-50" />
                    </div>
                </div>

                <div className="glass-card p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-slate-400 text-sm font-medium mb-1">Upcoming Expiries</p>
                            <h3 className="text-3xl font-bold text-white mb-2">
                                {expiringPolicies.filter(p => parseInt(p.expiry) <= 2028).length}
                            </h3>
                            <p className="text-slate-500 text-xs">Within next 3 years</p>
                        </div>
                        <Calendar className="w-12 h-12 text-purple-500 opacity-50" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Critical Gaps Feed */}
                <div className="glass-panel p-6 lg:col-span-1 border-red-500/30">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <ShieldAlert className="text-red-500 w-5 h-5" />
                        Unprotected Risks
                    </h3>
                    <div className="space-y-4">
                        {criticalGaps.map((gap, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-red-500/50 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-semibold text-white">{gap.client}</span>
                                    {gap.level === 'critical' && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Critical</span>}
                                </div>
                                <p className="text-red-300 text-sm flex items-start gap-2">
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                                    {gap.risk}
                                </p>
                                <button className="mt-4 w-full py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold transition-all uppercase tracking-wide">
                                    Generate Quote
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline View */}
                <div className="glass-panel p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold text-white mb-6">Policy Maturity Timeline</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead>
                                <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-500">
                                    <th className="pb-3 pl-2">Client</th>
                                    <th className="pb-3">Coverage Type</th>
                                    <th className="pb-3">Sum Assured</th>
                                    <th className="pb-3">Expiry Year</th>
                                    <th className="pb-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {expiringPolicies.map((policy, idx) => {
                                    const expiryYear = parseInt(policy.expiry);
                                    const isSoon = expiryYear <= 2028;

                                    return (
                                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 pl-2 font-medium text-slate-200">{policy.client}</td>
                                            <td className="py-4 flex items-center gap-2">
                                                <Heart className="w-4 h-4 text-pink-500" />
                                                {policy.type}
                                            </td>
                                            <td className="py-4 font-mono">{policy.amount}</td>
                                            <td className={`py-4 font-bold ${isSoon ? 'text-orange-400' : 'text-slate-500'}`}>
                                                {policy.expiry}
                                            </td>
                                            <td className="py-4">
                                                {isSoon ? (
                                                    <span className="inline-flex items-center gap-1 text-orange-400 text-xs bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                                                        Review
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                                        <CheckCircle className="w-3 h-3" /> OK
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Protection;
