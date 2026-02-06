import React, { useState, useMemo } from 'react';
import { clients } from '../data/clients';
import {
    AlertTriangle,
    TrendingUp,
    Calendar,
    CheckCircle2,
    ArrowRight,
    DollarSign,
    Briefcase
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const Dashboard = () => {
    // --- Analytics ---
    const stats = useMemo(() => {
        return {
            totalClients: clients.length,
            totalAUM: clients.reduce((acc, c) => acc + (c.financials.netWorth || 0), 0),
            urgentRisks: clients.reduce((acc, c) => acc + c.risks.filter(r => r.type === 'critical').length, 0),
            openOpportunities: clients.reduce((acc, c) => acc + c.opportunities.length, 0)
        };
    }, []);

    const criticalRisks = useMemo(() => {
        return clients.flatMap(c => c.risks
            .filter(r => r.type === 'critical' || r.type === 'high')
            .map(r => ({ client: c.name, ...r }))
        );
    }, []);

    const isaGapData = useMemo(() => {
        return clients.map(c => ({
            name: c.name.split(' ')[0], // First name for brevity
            used: ((c.financials.assets.isa || 0) / 40000) * 100, // Roughly generalized for viz
            unused: ((Object.values(c.financials.isaAllowance).reduce((a, b) => a + b, 0)) / 40000) * 100 // Very rough approx for viz
        })).slice(0, 5);
    }, []);

    // --- Components ---

    const StatCard = ({ icon: Icon, label, value, trend, color, subtext }) => (
        <div className="glass-card flex items-start justify-between relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon className="w-24 h-24" />
            </div>
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
                <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
                {subtext && <p className="text-slate-500 text-xs">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl bg-opacity-20 ${color} bg-white backdrop-blur-sm`}>
                <Icon className={`w-6 h-6 ${color.replace('text-', '')} text-white`} />
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Search / Context Bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Ask Jarvis: 'Who has available ISA allowance?'"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-4 px-6 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
                <div className="absolute right-4 top-4 bg-slate-700 text-xs font-mono px-2 py-1 rounded text-slate-400 border border-slate-600">
                    CMD + K
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-dashboard gap-6">
                <StatCard
                    icon={DollarSign}
                    label="Total AUM"
                    value={`£${(stats.totalAUM / 1000000).toFixed(2)}M`}
                    subtext="+2.4% vs last month"
                    color="bg-emerald-500"
                />
                <StatCard
                    icon={AlertTriangle}
                    label="Critical Risks"
                    value={stats.urgentRisks}
                    subtext="Requires immediate action"
                    color="bg-red-500"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Opportunities"
                    value={stats.openOpportunities}
                    subtext="Unused allowances & tax efficiency"
                    color="bg-blue-500"
                />
                <StatCard
                    icon={Calendar}
                    label="Upcoming Reviews"
                    value="2"
                    subtext="Next 30 days"
                    color="bg-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Feed: Critical Actions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <AlertTriangle className="text-red-400 w-5 h-5" />
                            Priority Actions Required
                        </h3>

                        <div className="space-y-4">
                            {criticalRisks.map((risk, idx) => (
                                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                    <div className={`mt-1 w-2 h-2 rounded-full ${risk.type === 'critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-orange-500'}`} />
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                                                {risk.client}
                                            </h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider ${risk.type === 'critical'
                                                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                                                    : 'border-orange-500/30 bg-orange-500/10 text-orange-400'
                                                }`}>
                                                {risk.type}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400">{risk.text}</p>
                                    </div>
                                    <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-white">
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Calendar className="text-blue-400 w-5 h-5" />
                            Review Schedule
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead>
                                    <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-500">
                                        <th className="pb-3 pl-2">Client</th>
                                        <th className="pb-3 text-center">Status</th>
                                        <th className="pb-3">Next Review</th>
                                        <th className="pb-3">Last Contact</th>
                                        <th className="pb-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {clients.slice(0, 5).map((client) => (
                                        <tr key={client.id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 pl-2 font-medium text-slate-200">{client.name}</td>
                                            <td className="py-4 text-center">
                                                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/20">Active</span>
                                            </td>
                                            <td className="py-4 font-mono text-xs">{client.nextReview}</td>
                                            <td className="py-4">{client.lastReview}</td>
                                            <td className="py-4">
                                                <button className="text-blue-400 hover:text-blue-300 text-xs font-semibold hover:underline">Prepare</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="glass-panel p-6 bg-gradient-to-b from-blue-900/20 to-slate-900/50 border-blue-500/10">
                        <h4 className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-4">Quick Actions</h4>
                        <div className="space-y-2">
                            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                                <span>Add New Client</span>
                            </button>
                            <button className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 p-3 rounded-lg text-sm font-medium transition-all border border-slate-700">
                                Generate Reports
                            </button>
                        </div>
                    </div>

                    {/* Tax Year End Countdown */}
                    <div className="glass-panel p-6 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
                        <h3 className="text-lg font-bold text-white mb-2">Tax Year End</h3>
                        <p className="text-slate-400 text-sm mb-4">58 days remaining to utilize allowances.</p>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-300">Used ISA Allowances (Portfolio Avg)</span>
                                    <span className="text-emerald-400">72%</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[72%]"></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-300">Pension Carry Forward Analysis</span>
                                    <span className="text-blue-400">4 Pending</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[30%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Market Sentiment / News Placeholder */}
                    <div className="glass-panel p-6">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Market Context</h3>
                        <div className="space-y-3">
                            <div className="p-3 bg-slate-800/50 rounded-lg border-l-2 border-green-500">
                                <p className="text-xs text-slate-300 leading-relaxed">BoE holds rates at 5.25%. Inflation outlook stable.</p>
                            </div>
                            <div className="p-3 bg-slate-800/50 rounded-lg border-l-2 border-blue-500">
                                <p className="text-xs text-slate-300 leading-relaxed">FTSE 100 sees tech rally, up 1.2% today.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
