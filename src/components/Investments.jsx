import React, { useMemo } from 'react';
// import { clients } from '../data/clients';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, DollarSign, Activity, AlertCircle } from 'lucide-react';
import SectionInfo from './SectionInfo.jsx';

const Investments = ({ clients = [] }) => {
    const toNumber = (value) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    };

    // --- Data Aggregation ---
    const assetAllocationData = useMemo(() => {
        const allocation = {
            'Pensions': 0,
            'ISAs': 0,
            'Property': 0,
            'Cash & Savings': 0,
            'Other (Bonds/Wine/etc)': 0
        };

        if (clients.length === 0) return []; // Handle empty state

        clients.forEach(client => {
            const a = client.financials?.assets || client.assets || {};
            // Simplified aggregation - ensure values are numbers
            allocation['Pensions'] += toNumber(a.pensions);

            allocation['ISAs'] += toNumber(a.isa) + toNumber(a.juniorIsa) + toNumber(a.inheritedIsa);
            allocation['Property'] += toNumber(a.propertyMain) + toNumber(a.propertyHoliday);
            allocation['Cash & Savings'] += toNumber(a.savings) + toNumber(a.emergency) + toNumber(a.companyReserves);
            allocation['Other (Bonds/Wine/etc)'] += toNumber(a.premiumBonds) + toNumber(a.shareOptions) + toNumber(a.wine) + toNumber(a.investments);
        });

        return Object.keys(allocation).map(key => ({
            name: key,
            value: allocation[key]
        })).sort((a, b) => b.value - a.value);
    }, [clients]);

    const defaultPortfolioSplit = useMemo(() => ([
        { name: 'Equities', value: 40 },
        { name: 'Fixed Income', value: 30 },
        { name: 'Property', value: 20 },
        { name: 'Cash', value: 10 }
    ]), []);

    const hasRealAllocationData = useMemo(
        () => assetAllocationData.some((item) => item.value > 0),
        [assetAllocationData]
    );

    const chartData = hasRealAllocationData ? assetAllocationData : defaultPortfolioSplit;

    const topClientsByAUM = useMemo(() => {
        return [...clients]
            .sort((a, b) => ((b.financials?.netWorth || b.net_worth || 0) - (a.financials?.netWorth || a.net_worth || 0)))
            .slice(0, 5);
    }, [clients]);

    // Colors for charts
    const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
                    <p className="text-slate-200 font-medium">{payload[0].name}</p>
                    {hasRealAllocationData ? (
                        <p className="text-blue-400">£{(payload[0].value / 1000000).toFixed(2)}M</p>
                    ) : (
                        <p className="text-blue-400">{payload[0].value}%</p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-fade-in">

            {/* KPI Cards Row */}
            <div className="grid grid-dashboard gap-6">
                <div className="glass-card p-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5">
                        <TrendingUp className="w-24 h-24 text-blue-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Total Assets Under Management</p>
                    <h3 className="text-3xl font-bold text-white mb-2">
                        £{((clients.reduce((acc, c) => acc + (c.financials?.netWorth || c.net_worth || 0), 0)) / 1000000).toFixed(2)}M
                    </h3>
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                        <TrendingUp className="w-3 h-3" />
                        <span>+4.2% YTD</span>
                    </div>
                </div>

                <div className="glass-card p-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5">
                        <Activity className="w-24 h-24 text-emerald-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Avg. Portfolio Performance</p>
                    <h3 className="text-3xl font-bold text-white mb-2">5.8%</h3>
                    <p className="text-slate-500 text-xs">Weighted average (12mo)</p>
                </div>

                <div className="glass-card p-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-4 opacity-5">
                        <AlertCircle className="w-24 h-24 text-orange-500" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium mb-1">Cash Drag</p>
                    <h3 className="text-3xl font-bold text-white mb-2">
                        £{(clients.reduce((acc, c) => acc + (c.financials?.assets?.savings || c.assets?.savings || 0), 0) / 1000).toFixed(0)}k
                    </h3>
                    <p className="text-orange-400 text-xs">High cash holdings identified (~4.5%)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Asset Allocation Chart */}
                <div className="glass-panel p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center">
                            Aggregated Asset Allocation
                            <SectionInfo text="Portfolio mix across all loaded clients. If live allocation fields are empty, a demo split is shown so the chart still helps explain allocation concepts." />
                        </h3>
                        <button className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-full text-slate-300 transition-colors">
                            {hasRealAllocationData ? 'View by Client' : 'Demo Split'}
                        </button>
                    </div>

                    <div style={{ height: 300, width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} isAnimationActive={false} animationDuration={0} />
                                <Legend
                                    verticalAlign="middle"
                                    align="right"
                                    layout="vertical"
                                    iconType="circle"
                                    iconSize={8}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Clients Table */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        Top Clients by Net Worth
                        <SectionInfo text="Ranks highest-net-worth clients to highlight concentration, service priority, and planning impact." />
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead>
                                <tr className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-500">
                                    <th className="pb-3 pl-2">Client</th>
                                    <th className="pb-3 text-right">Net Worth</th>
                                    <th className="pb-3 text-right">Liquidity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {topClientsByAUM.map((client) => (
                                    <tr key={client.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 pl-2 font-medium text-slate-200">
                                            <div>{client.name}</div>
                                            <div className="text-[10px] text-slate-500">{client.profile?.location || 'Unknown Location'}</div>
                                        </td>
                                        <td className="py-3 text-right font-mono text-emerald-400">
                                            £{((client.financials?.netWorth || client.net_worth || 0) / 1000000).toFixed(2)}M
                                        </td>
                                        <td className="py-3 text-right font-mono text-slate-300">
                                            £{((client.financials?.assets?.savings || client.assets?.savings || 0) / 1000).toFixed(0)}k
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Model Portfolio Performance (Static Mock) */}
            <div className="glass-panel p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                    Model Portfolios vs Benchmarks
                    <SectionInfo text="Compares model strategy returns against benchmarks to support suitability and performance conversations." />
                </h3>
                <div style={{ height: 250, width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={[
                                { name: 'Balanced (60/40)', portfolio: 12.4, benchmark: 10.1 },
                                { name: 'Growth (80/20)', portfolio: 15.8, benchmark: 14.2 },
                                { name: 'Cautious (40/60)', portfolio: 6.2, benchmark: 5.5 },
                                { name: 'Income', portfolio: 4.8, benchmark: 4.1 },
                            ]}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} unit="%" />
                            <Tooltip
                                cursor={{ fill: '#1e293b' }}
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                            />
                            <Legend iconType="circle" />
                            <Bar dataKey="portfolio" name="Jarvis Model" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            <Bar dataKey="benchmark" name="Benchmark" fill="#64748b" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Investments;
