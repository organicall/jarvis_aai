import React, { useEffect, useState, useMemo } from 'react';
import { Shield, ShieldAlert, Heart, Calendar, CheckCircle, Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { createPortal } from 'react-dom';
import SectionInfo from './SectionInfo.jsx';

// --- Mock Data Initialization ---
const INITIAL_POLICIES = [
    { id: 1, client: "David Chen", type: "Level Term Assurance", provider: "Aviva", cover: 500000, premium: 45, term: 20, expiry: 2045, status: "Active" },
    { id: 2, client: "David Chen", type: "Income Protection", provider: "L&G", cover: 2500, premium: 62, term: 20, expiry: 2045, status: "Active" },
    { id: 3, client: "Sarah Chen", type: "Critical Illness", provider: "Vitality", cover: 150000, premium: 85, term: 15, expiry: 2040, status: "Active" },
];

const STORAGE_KEY = 'jarvis_protection_policies_v1';

const Protection = ({ clients = [] }) => {
    // --- State ---
    const [policies, setPolicies] = useState(INITIAL_POLICIES);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState(null); // null = adding new
    const [formData, setFormData] = useState({
        client: '',
        type: 'Level Term Assurance',
        provider: '',
        cover: '',
        premium: '',
        expiry: ''
    });
    const [formError, setFormError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    const clientOptions = useMemo(() => {
        const names = [
            ...clients.map((c) => c.name || c.client_name),
            ...policies.map((p) => p.client)
        ].filter(Boolean);
        return [...new Set(names)];
    }, [clients, policies]);

    const getEmptyFormData = () => ({
        client: clientOptions[0] || '',
        type: 'Level Term Assurance',
        provider: '',
        cover: '',
        premium: '',
        expiry: ''
    });

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return;
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                setPolicies(parsed);
            }
        } catch (err) {
            console.warn('Failed to load persisted protection policies', err);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
        } catch (err) {
            console.warn('Failed to persist protection policies', err);
        }
    }, [policies]);

    // --- Derived Metrics (Dynamic Coverage Adequacy) ---
    const calculateTotalCover = (typeKeyword) => {
        return policies.reduce((acc, p) => {
            if (p.type.toLowerCase().includes(typeKeyword.toLowerCase()) && p.status === 'Active') {
                return acc + Number(p.cover);
            }
            return acc;
        }, 0);
    };

    const lifeCoverTotal = calculateTotalCover('Term') + calculateTotalCover('Life');
    const ciCoverTotal = calculateTotalCover('Critical') + calculateTotalCover('CI');
    const ipCoverTotal = calculateTotalCover('Income');

    // Hardcoded targets for demo purposes (ideally would come from client needs analysis)
    const TARGETS = { life: 1200000, ci: 200000, ip: 4000 };

    const lifeGap = TARGETS.life - lifeCoverTotal;
    const lifePercentage = Math.min(100, Math.round((lifeCoverTotal / TARGETS.life) * 100));

    const ciPercentage = Math.min(100, Math.round((ciCoverTotal / TARGETS.ci) * 100));

    const ipGap = TARGETS.ip - ipCoverTotal;
    const ipPercentage = Math.min(100, Math.round((ipCoverTotal / TARGETS.ip) * 100));


    // --- Handlers ---
    const handleOpenModal = (policy = null) => {
        setFormError('');
        if (policy) {
            setEditingPolicy(policy);
            setFormData(policy);
        } else {
            setEditingPolicy(null);
            setFormData(getEmptyFormData());
        }
        setIsModalOpen(true);
    };

    const handleAddPolicyClick = () => {
        handleOpenModal(null);
    };

    const handleSave = () => {
        const cover = Number(formData.cover);
        const premium = Number(formData.premium);
        const expiry = Number(formData.expiry);

        if (!formData.client || !formData.type || !formData.provider) {
            setFormError('Client, policy type, and provider are required.');
            return;
        }
        if (!Number.isFinite(cover) || cover <= 0) {
            setFormError('Cover amount must be a positive number.');
            return;
        }
        if (!Number.isFinite(premium) || premium < 0) {
            setFormError('Premium must be 0 or more.');
            return;
        }
        if (!Number.isFinite(expiry) || expiry < new Date().getFullYear()) {
            setFormError('Expiry year must be this year or later.');
            return;
        }

        setFormError('');
        if (editingPolicy) {
            setPolicies((currentPolicies) => currentPolicies.map((p) => (
                p.id === editingPolicy.id
                    ? { ...formData, id: p.id, cover, premium, expiry, status: p.status || 'Active' }
                    : p
            )));
            setStatusMessage('Policy updated.');
        } else {
            setPolicies((currentPolicies) => [...currentPolicies, { ...formData, id: Date.now(), cover, premium, expiry, status: 'Active' }]);
            setStatusMessage('Policy added.');
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this policy?')) {
            setPolicies(policies.filter(p => p.id !== id));
            setStatusMessage('Policy deleted.');
        }
    };

    const handleResolveGap = (gap) => {
        const recommendedType = gap.risk.toLowerCase().includes('income')
            ? 'Income Protection'
            : gap.risk.toLowerCase().includes('critical')
                ? 'Critical Illness Cover'
                : 'Level Term Assurance';

        setEditingPolicy(null);
        setFormError('');
        setFormData({
            client: gap.client || clientOptions[0] || '',
            type: recommendedType,
            provider: '',
            cover: '',
            premium: '',
            expiry: String(new Date().getFullYear() + 20)
        });
        setIsModalOpen(true);
    };

    // --- Analysis Logic (Existing but updated to use policies state) ---
    const expiringPolicies = useMemo(() => {
        return policies
            .map(p => ({
                client: p.client,
                type: p.type,
                amount: p.type.includes('Income') ? `£${p.cover}/pm` : `£${(p.cover / 1000).toFixed(0)}k`,
                expiry: p.expiry.toString()
            }))
            .sort((a, b) => parseInt(a.expiry) - parseInt(b.expiry));
    }, [policies]);

    const criticalGaps = useMemo(() => {
        // Simple gap detection logic based on totals
        const gaps = [];
        if (lifePercentage < 50) gaps.push({ client: "David Chen", risk: "Significant Life Cover Shortfall", level: "critical" });
        if (ipPercentage < 70) gaps.push({ client: "David Chen", risk: "Income Protection Gap", level: "medium" });
        return gaps;
    }, [lifePercentage, ipPercentage]);


    return (
        <div className="space-y-6 animate-fade-in">
            {statusMessage && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-300">
                    {statusMessage}
                </div>
            )}
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
                            <h3 className="text-3xl font-bold text-white mb-2">{policies.length}</h3>
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
                                {policies.filter(p => parseInt(p.expiry) <= 2028).length}
                            </h3>
                            <p className="text-slate-500 text-xs">Within next 3 years</p>
                        </div>
                        <Calendar className="w-12 h-12 text-purple-500 opacity-50" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* --- Row 1: Policy Inventory --- */}
                <div className="glass-panel p-6 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-400" />
                            Policy Inventory
                            <SectionInfo text="Manage existing protection policies. Add, edit, or remove cover to update the gap analysis in real-time." />
                        </h3>
                        <button
                            type="button"
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium shadow-lg shadow-blue-900/20"
                            onClick={handleAddPolicyClick}
                        >
                            <Plus className="w-3 h-3" /> Add Policy
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900/50 text-xs uppercase font-semibold text-slate-500 rounded-t-lg">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Type</th>
                                    <th className="px-4 py-3">Provider</th>
                                    <th className="px-4 py-3 text-right">Cover</th>
                                    <th className="px-4 py-3 text-right">Premium</th>
                                    <th className="px-4 py-3 text-center">Expiry</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right rounded-tr-lg">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {policies.map((policy) => (
                                    <tr key={policy.id} className="group hover:bg-slate-800/40 transition-colors">
                                        <td className="px-4 py-3 text-white font-medium">{policy.type}</td>
                                        <td className="px-4 py-3 flex items-center gap-2">
                                            {policy.provider}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono text-emerald-400 font-bold">
                                            {policy.type.includes('Income') ? `£${policy.cover}/pm` : `£${(policy.cover).toLocaleString()}`}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-300">£{policy.premium}/pm</td>
                                        <td className={`px-4 py-3 text-center ${policy.expiry <= 2028 ? 'text-orange-400 font-bold' : 'text-slate-400'}`}>{policy.expiry}</td>
                                        <td className="px-4 py-3 text-center"><span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{policy.status}</span></td>
                                        <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenModal(policy)}
                                                className="text-slate-500 hover:text-white transition-colors p-1" title="Edit">
                                                <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(policy.id)}
                                                className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Delete">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {policies.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-4 py-8 text-center text-slate-500 italic">No policies found. Add one to start analysis.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Critical Gaps Feed (Right Column) */}
                <div className="glass-panel p-6 lg:col-span-1 border-red-500/20 bg-gradient-to-br from-slate-900 to-red-900/10">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <ShieldAlert className="text-red-500 w-5 h-5" />
                        Unprotected Risks
                        <SectionInfo text="Lists uncovered or weak protection areas per client so you can prioritize risk-mitigation actions." />
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {criticalGaps.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-xs text-balance">
                                No critical gaps detected. Coverage is sufficient!
                            </div>
                        ) : (
                            criticalGaps.map((gap, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-red-500/40 transition-all group shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-semibold text-white text-sm">{gap.client}</span>
                                        {gap.level === 'critical' && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide shadow-red-500/20 shadow-md">Critical</span>}
                                    </div>
                                    <p className="text-red-300 text-xs flex items-start gap-2 leading-tight">
                                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse"></span>
                                        {gap.risk}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => handleResolveGap(gap)}
                                        className="mt-3 w-full py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 rounded text-[10px] font-bold transition-all uppercase tracking-wide"
                                    >
                                        Resolve Gap
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* --- Row 2: Coverage Adequacy --- */}
                <div className="glass-panel p-6 lg:col-span-3">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        Coverage Adequacy Engine
                        <SectionInfo text="Compares current cover against calculated need (e.g. Mortgage + 10x Income). Highlights shortfalls." />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Life Cover Gap */}
                        <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-700/50 relative overflow-hidden group hover:bg-slate-900/60 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Life Cover</span>
                                <div className={`p-1.5 rounded-lg ${lifePercentage < 80 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                                    {lifePercentage < 80 ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                </div>
                            </div>
                            <div className="flex items-end gap-2 mb-1">
                                <span className="text-3xl font-bold text-white">£{(lifeCoverTotal / 1000).toFixed(0)}k</span>
                                <span className="text-xs text-slate-500 mb-1.5 font-medium">Have</span>
                            </div>
                            <div className="text-xs text-slate-400 mb-4 flex justify-between">
                                <span>Target: £{(TARGETS.life / 1000000).toFixed(1)}M</span>
                                <span className={lifePercentage < 80 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>{lifePercentage}% Covered</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                                <div className={`h-full rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-1000 ${lifePercentage < 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${lifePercentage}%` }}></div>
                            </div>
                            <div className={`py-2 px-3 border rounded text-[11px] font-medium text-center ${lifePercentage < 80 ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
                                {lifePercentage < 80 ? `Critical Gap: £${(lifeGap / 1000).toFixed(0)}k Shortfall` : 'Coverage meets recommended levels'}
                            </div>
                        </div>

                        {/* CI Cover Gap */}
                        <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-700/50 relative overflow-hidden group hover:bg-slate-900/60 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Critical Illness</span>
                                <div className={`p-1.5 rounded-lg ${ciPercentage < 80 ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                                    {ciPercentage < 80 ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                </div>
                            </div>
                            <div className="flex items-end gap-2 mb-1">
                                <span className="text-3xl font-bold text-white">£{(ciCoverTotal / 1000).toFixed(0)}k</span>
                                <span className="text-xs text-slate-500 mb-1.5 font-medium">Have</span>
                            </div>
                            <div className="text-xs text-slate-400 mb-4 flex justify-between">
                                <span>Target: £{(TARGETS.ci / 1000).toFixed(0)}k</span>
                                <span className={ciPercentage < 80 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>{ciPercentage}% Covered</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                                <div className={`h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000 ${ciPercentage < 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${ciPercentage}%` }}></div>
                            </div>
                            <div className={`py-2 px-3 border rounded text-[11px] font-medium text-center ${ciPercentage < 80 ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
                                {ciPercentage < 80 ? 'Underinsured' : 'Coverage meets recommended levels'}
                            </div>
                        </div>

                        {/* IP Cover Gap */}
                        <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-700/50 relative overflow-hidden group hover:bg-slate-900/60 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Income Protection</span>
                                <div className={`p-1.5 rounded-lg ${ipPercentage < 80 ? 'bg-orange-500/10' : 'bg-emerald-500/10'}`}>
                                    {ipPercentage < 80 ? <ShieldAlert className="w-4 h-4 text-orange-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                </div>
                            </div>
                            <div className="flex items-end gap-2 mb-1">
                                <span className="text-3xl font-bold text-white">£{(ipCoverTotal / 1000).toFixed(1)}k</span>
                                <span className="text-xs text-slate-500 mb-1.5 font-medium">/ month</span>
                            </div>
                            <div className="text-xs text-slate-400 mb-4 flex justify-between">
                                <span>Target: £{(TARGETS.ip / 1000).toFixed(0)}k/pm</span>
                                <span className={ipPercentage < 80 ? "text-orange-400 font-bold" : "text-emerald-400 font-bold"}>{ipPercentage}% Covered</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                                <div className={`h-full rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-1000 ${ipPercentage < 80 ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${ipPercentage}%` }}></div>
                            </div>
                            <div className={`py-2 px-3 border rounded text-[11px] font-medium text-center ${ipPercentage < 80 ? 'bg-orange-500/10 border-orange-500/20 text-orange-300' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'}`}>
                                {ipPercentage < 80 ? `Partial Gap: £${((TARGETS.ip - ipCoverTotal)).toFixed(0)}/pm Shortfall` : 'Full Income Secured'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Row 3: Timeline --- */}
                <div className="glass-panel p-6 lg:col-span-3">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center">
                        Policy Maturity Timeline
                        <SectionInfo text="Tracks policy expiry years to plan renewals, replacements, and review timing before cover lapses." />
                    </h3>

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
                                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                                        Review Due
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                                        <CheckCircle className="w-3 h-3" /> Active
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

            {/* --- Add/Edit Policy Modal --- */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl animate-fade-in-up">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                {editingPolicy ? <Edit className="w-5 h-5 text-blue-400" /> : <Plus className="w-5 h-5 text-blue-400" />}
                                {editingPolicy ? 'Edit Policy' : 'Add New Policy'}
                            </h3>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Client</label>
                                <input
                                    list="protection-client-options"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                                    placeholder="Select or type client name"
                                    value={formData.client}
                                    onChange={e => setFormData({ ...formData, client: e.target.value })}
                                />
                                <datalist id="protection-client-options">
                                    {clientOptions.map((name) => (
                                        <option key={name} value={name} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Policy Type</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option>Level Term Assurance</option>
                                        <option>Decreasing Term</option>
                                        <option>Critical Illness Cover</option>
                                        <option>Income Protection</option>
                                        <option>Whole of Life</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Provider</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. Aviva"
                                        value={formData.provider}
                                        onChange={e => setFormData({ ...formData, provider: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Cover Amount (£)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                                        placeholder="500000"
                                        value={formData.cover}
                                        onChange={e => setFormData({ ...formData, cover: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Monthly Premium</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                                        placeholder="45"
                                        value={formData.premium}
                                        onChange={e => setFormData({ ...formData, premium: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">Expiry Year</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none"
                                    placeholder="2045"
                                    value={formData.expiry}
                                    onChange={e => setFormData({ ...formData, expiry: e.target.value })}
                                />
                            </div>

                            {formError && (
                                <div className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                                    {formError}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-700 bg-slate-800/30 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-900/20 flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                Save Policy
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Protection;
