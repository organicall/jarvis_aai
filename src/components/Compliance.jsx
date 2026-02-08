import React, { useMemo, useState } from 'react';
// import { clients } from '../data/clients';
import { FileText, CheckCircle, Clock, AlertTriangle, Search, FileCheck, XCircle, ChevronRight, PenTool } from 'lucide-react';
import SectionInfo from './SectionInfo.jsx';

// Helper Icon for Modal
const SparklesIcon = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.813 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.813-1.912a2 2 0 001.272-1.272L12 3z" />
    </svg>
);

const Compliance = ({ clients = [] }) => {
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedClientForReport, setSelectedClientForReport] = useState('');

    // --- Data Logic ---
    const pendingDocuments = useMemo(() => {
        // Extract items marked as "pending" or "re-quote" from status/risks
        const items = [];
        clients.forEach(c => {
            const risks = c.risks || []; // Ensure risks is array
            // Check risks for "pending" keywords
            if (Array.isArray(risks)) {
                risks.forEach(r => {
                    const rText = typeof r === 'string' ? r : (r.text || '');
                    if (rText?.toLowerCase().includes('pending') || rText?.toLowerCase().includes('quote')) {
                        items.push({
                            client: c.name,
                            id: c.id,
                            docName: rText, // Simplified for mock
                            status: 'Pending',
                            date: 'Jan 2026', // Mock date, normally derived from c.updatedAt
                            type: 'Evidence'
                        });
                    }
                });
            }

            // Check implicit "opportunities" that need paperwork
            const opportunities = c.opportunities || [];
            if (Array.isArray(opportunities)) {
                opportunities.forEach(o => {
                    const oText = typeof o === 'string' ? o : (o.text || '');
                    if (oText?.includes('Transfer') || oText?.includes('ISA')) {
                        // items.push({...}) - keeping it simple for this view
                    }
                });
            }
        });

        // Add specific hardcoded examples from the brief for richness
        items.push(
            { client: "Sarah Chen", id: "C003", docName: "Critical Illness Re-quote (Hypertension)", status: "Overdue", date: "Jan 2025", type: "Quote" },
            { client: "Brian Potter", id: "C009", docName: "Margaret's ISA Transfer Forms", status: "Pending", date: "Jan 2026", type: "Transfer" },
            { client: "Keith Lard", id: "C011", docName: "SIPP Drawdown Strategy Letter", status: "Drafting", date: "Feb 2026", type: "Suitability" },
            { client: "All Clients", id: "-", docName: "Annual Review Packs (Consumer Duty)", status: "Complete", date: "Dec 2025", type: "System" }
        );

        return items;
    }, [clients]);

    const recentSuitabilityReports = [
        { client: "Emma Thompson", date: "Nov 2025", reason: "Pension Contribution Increase (Tax)", status: "Sent" },
        { client: "David Chen", date: "Oct 2025", reason: "Annual Review & Bonus Strategy", status: "Signed" },
        { client: "Priya Patel", date: "Jan 2025", reason: "Partnership Share Increase", status: "Signed" }
    ];

    return (
        <div className="space-y-6 animate-fade-in relative">

            {/* Modal Overlay for Suitability Report Builder */}
            {showReportModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <PenTool className="w-5 h-5 text-blue-400" />
                                    Suitability Report Builder
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">Generate a compliant suitability letter based on client data.</p>
                            </div>
                            <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Step 1: Client Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Select Client</label>
                                <select
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={selectedClientForReport}
                                    onChange={(e) => setSelectedClientForReport(e.target.value)}
                                >
                                    <option value="">-- Choose Client --</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            {/* Step 2: Sections */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-300">Report Sections</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Executive Summary', 'Current Position', 'Risk Profile Analysis', 'Recommendations', 'Product Charges', 'Tax Implications', 'Why Not Other Options?'].map((section) => (
                                        <label key={section} className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 bg-slate-800/30 cursor-pointer hover:bg-slate-800/60 transition-colors">
                                            <input type="checkbox" defaultChecked className="rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-offset-slate-900" />
                                            <span className="text-sm text-slate-200">{section}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Step 3: AI Context */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">AI Context Instructions</label>
                                <textarea
                                    className="w-full h-24 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                    placeholder="e.g. emphasize that the client prioritizes ethical funds over maximum growth..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-700 bg-slate-800/30 flex justify-end gap-3">
                            <button onClick={() => setShowReportModal(false)} className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white">Cancel</button>
                            <button className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-900/20 flex items-center gap-2">
                                <SparklesIcon className="w-4 h-4" />
                                Generate Draft
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Toolbar */}
            <div className="glass-panel p-4 flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search recommendation history or documents..."
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <button
                    onClick={() => setShowReportModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
                >
                    <PenTool className="w-4 h-4" />
                    New Suitability Report
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Left Column: Checklist & Pending */}
                <div className="space-y-6">
                    {/* Pre-submit Checklist (New Feature) */}
                    <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <FileCheck className="text-emerald-400 w-5 h-5" />
                            Pre-submit Compliance Checklist
                            <SectionInfo text="Live validation of active files against regulatory requirements before submission." />
                        </h3>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                <span className="text-sm text-slate-300 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> KYC / AML Documents</span>
                                <span className="text-xs font-bold text-emerald-500">PASS</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                <span className="text-sm text-slate-300 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Risk Profile Signed</span>
                                <span className="text-xs font-bold text-emerald-500">PASS</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                <span className="text-sm text-slate-300 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" /> Replacement Business Form</span>
                                <span className="text-xs font-bold text-orange-500">MISSING</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                                <span className="text-sm text-slate-300 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Fee Agreement</span>
                                <span className="text-xs font-bold text-emerald-500">PASS</span>
                            </div>
                        </div>
                        <button className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors border border-slate-600 cursor-not-allowed opacity-50">
                            Run Full System Audit
                        </button>
                    </div>

                    {/* Pending Documentation (Existing) */}
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Clock className="text-orange-400 w-5 h-5" />
                            Pending Documentation
                            <SectionInfo text="Operational queue of outstanding paperwork, overdue evidence, and draft items that still need completion." />
                        </h3>
                        <div className="space-y-3">
                            {pendingDocuments.map((doc, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700 hover:bg-slate-800 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 p-1.5 rounded-full ${doc.status === 'Overdue' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-200">{doc.docName}</h4>
                                            <p className="text-xs text-slate-500">{doc.client} • {doc.date}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded border ${doc.status === 'Overdue'
                                        ? 'border-red-500/30 text-red-400 bg-red-500/10'
                                        : 'border-orange-500/30 text-orange-400 bg-orange-500/10'
                                        }`}>
                                        {doc.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: History & Evidence */}
                <div className="space-y-6">
                    {/* Recent Activity / Audit Trail */}
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <FileCheck className="text-emerald-400 w-5 h-5" />
                            Recent Suitability Reports
                            <SectionInfo text="Timeline of recent suitability outputs used as a quick audit trail and recommendation history reference." />
                        </h3>
                        <div className="relative border-l border-slate-700 ml-3 space-y-6">
                            {recentSuitabilityReports.map((report, idx) => (
                                <div key={idx} className="pl-6 relative group">
                                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-emerald-500 group-hover:bg-emerald-500 transition-colors"></div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors cursor-pointer">{report.client}</h4>
                                            <p className="text-sm text-slate-400">{report.reason}</p>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {report.date}
                                            </p>
                                        </div>
                                        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                            {report.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="mt-6 w-full py-2 flex items-center justify-center gap-2 text-slate-400 hover:text-white text-xs uppercase tracking-wider font-semibold hover:bg-slate-800 rounded-lg transition-colors">
                            View All History <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Consumer Duty Evidence Block */}
                    <div className="glass-panel p-6 border border-blue-500/30 bg-blue-500/5">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-xl">
                                <CheckCircle className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1 flex items-center">
                                    Consumer Duty: Detailed Evidence
                                    <SectionInfo text="Consumer Duty evidence helps show that advice quality, value, and outcomes are monitored consistently across active clients." />
                                </h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    Automated analysis confirms <span className="text-white font-bold">100%</span> of active clients have received a fair value assessment in the last 12 months.
                                </p>
                                <div className="flex gap-3">
                                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-600 transition-colors">
                                        Download Evidence Pack
                                    </button>
                                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-600 transition-colors">
                                        View Gap Analysis
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

        </div>
    );
};

export default Compliance;
