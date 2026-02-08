import React, { useMemo } from 'react';
// import { clients } from '../data/clients';
import { FileText, CheckCircle, Clock, AlertTriangle, Search, FileCheck } from 'lucide-react';
import SectionInfo from './SectionInfo.jsx';

const Compliance = ({ clients = [] }) => {
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
        <div className="space-y-6 animate-fade-in">

            {/* Search Filter */}
            <div className="glass-panel p-4 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search recommendation history or documents..."
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">
                    New Suitability Report
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Pending Documentation */}
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

                {/* Recent Activity / Audit Trail */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <FileCheck className="text-emerald-400 w-5 h-5" />
                        Recent Suitability Reports
                        <SectionInfo text="Timeline of recent suitability outputs used as a quick audit trail and recommendation history reference." />
                    </h3>
                    <div className="relative border-l border-slate-700 ml-3 space-y-6">
                        {recentSuitabilityReports.map((report, idx) => (
                            <div key={idx} className="pl-6 relative">
                                <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-emerald-500"></div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-sm font-semibold text-white">{report.client}</h4>
                                        <p className="text-sm text-slate-400">{report.reason}</p>
                                        <p className="text-xs text-slate-500 mt-1">{report.date}</p>
                                    </div>
                                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                        {report.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

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
    );
};

export default Compliance;
