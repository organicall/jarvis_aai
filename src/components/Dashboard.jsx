import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { fetchClients, updateClient } from '../lib/db.js';
import {
    AlertTriangle,
    TrendingUp,
    Calendar,
    DollarSign,
    Users,
    ArrowRight,
    Shield,
    Edit,
    FileText,
    Plus,
    X,
    Save
} from 'lucide-react';

const Dashboard = ({ onNavigateToClient, onAddClient, onGenerateReport }) => {
    const [meetingModalOpen, setMeetingModalOpen] = useState(false);
    const [selectedMeetingClient, setSelectedMeetingClient] = useState(null);
    const [meetingDate, setMeetingDate] = useState('');
    const [meetingNote, setMeetingNote] = useState('');
    const [savingMeeting, setSavingMeeting] = useState(false);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await fetchClients();
            setClients(data);
            setError(null);
        } catch (err) {
            console.error('Failed to load clients:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    // Calculate real metrics from database
    const stats = useMemo(() => {
        if (!clients.length) return {
            totalAUM: 0,
            totalClients: 0,
            criticalActions: 0,
            upcomingReviews: 0
        };

        const totalAUM = clients.reduce((acc, c) => acc + (c.net_worth || 0), 0);
        const criticalActions = clients.filter(c => c.has_urgent_items).length;

        // Calculate upcoming reviews (next 30 days)
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const upcomingReviews = clients.filter(c => {
            if (!c.next_review_date) return false;
            const reviewDate = new Date(c.next_review_date);
            return reviewDate >= today && reviewDate <= thirtyDaysFromNow;
        }).length;

        return {
            totalAUM,
            totalClients: clients.length,
            criticalActions,
            upcomingReviews
        };
    }, [clients]);

    // Get clients with urgent items
    const urgentClients = useMemo(() => {
        return clients
            .filter(c => c.has_urgent_items)
            .map(c => ({
                id: c.client_id,
                name: c.client_name,
                items: c.urgent_items || 'No details provided'
            }));
    }, [clients]);

    // Get upcoming reviews
    const upcomingReviewClients = useMemo(() => {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        return clients
            .filter(c => {
                if (!c.next_review_date) return false;
                const reviewDate = new Date(c.next_review_date);
                return reviewDate >= today && reviewDate <= thirtyDaysFromNow;
            })
            .sort((a, b) => new Date(a.next_review_date) - new Date(b.next_review_date))
            .slice(0, 5);
    }, [clients]);

    // Calculate ISA utilization
    const isaStats = useMemo(() => {
        if (!clients.length) return { avgUtilization: 0, clientsWithGaps: 0 };

        const clientsWithISAData = clients.filter(c => c.isa_allowance_used != null && c.isa_allowance_remaining != null);

        if (!clientsWithISAData.length) return { avgUtilization: 0, clientsWithGaps: 0 };

        const totalUtilization = clientsWithISAData.reduce((acc, c) => {
            const total = c.isa_allowance_used + c.isa_allowance_remaining;
            return acc + (total > 0 ? (c.isa_allowance_used / total) * 100 : 0);
        }, 0);

        const avgUtilization = Math.round(totalUtilization / clientsWithISAData.length);
        const clientsWithGaps = clientsWithISAData.filter(c => c.isa_allowance_remaining > 1000).length;

        return { avgUtilization, clientsWithGaps };
    }, [clients]);

    // Calculate protection gaps
    const protectionGaps = useMemo(() => {
        return clients.filter(c => c.protection_gaps && c.protection_gaps.trim().length > 0).length;
    }, [clients]);

    // Calculate days until tax year end (April 5)
    const daysUntilTaxYearEnd = useMemo(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        let taxYearEnd = new Date(currentYear, 3, 5); // April 5

        if (today > taxYearEnd) {
            taxYearEnd = new Date(currentYear + 1, 3, 5);
        }

        const diffTime = taxYearEnd - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }, []);

    const openScheduleModal = (client = null) => {
        setSelectedMeetingClient(client);
        if (client) {
            setMeetingDate(client.next_review_date || '');
            setMeetingNote(client.next_review_note || ''); // Load existing note
        } else {
            setMeetingDate('');
            setMeetingNote('');
        }
        setMeetingModalOpen(true);
    };

    const handleSaveMeeting = async () => {
        if (!selectedMeetingClient && !meetingDate) return;

        try {
            setSavingMeeting(true);
            const updates = {
                next_review_date: meetingDate,
                next_review_note: meetingNote  // Save the note
            };

            await updateClient(selectedMeetingClient.client_id, updates);
            await loadData(); // Refresh data
            setMeetingModalOpen(false);
        } catch (err) {
            console.error('Failed to update meeting:', err);
            setError('Failed to save meeting details');
        } finally {
            setSavingMeeting(false);
        }
    };

    const StatCard = ({ icon: Icon, label, value, subtext, color, onClick }) => (
        <div
            className={`glass-card flex items-start justify-between group ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
                <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
                {subtext && <p className="text-slate-500 text-xs">{subtext}</p>}
            </div>
            <div className="flex items-center justify-center">
                <Icon className="w-10 h-10 text-slate-500 group-hover:text-slate-400 transition-colors" strokeWidth={1.5} />
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-slate-400">Loading dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-red-400">{error}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* KPI Cards - Horizontal Layout */}
            <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[240px]">
                    <StatCard
                        icon={DollarSign}
                        label="Total AUM"
                        value={`£${(stats.totalAUM / 1000000).toFixed(2)}M`}
                        subtext={`${stats.totalClients} clients`}
                        color="bg-emerald-500"
                    />
                </div>
                <div className="flex-1 min-w-[240px]">
                    <StatCard
                        icon={Users}
                        label="Total Clients"
                        value={stats.totalClients}
                        subtext="Active portfolios"
                        color="bg-blue-500"
                    />
                </div>
                <div className="flex-1 min-w-[240px]">
                    <StatCard
                        icon={AlertTriangle}
                        label="Critical Actions"
                        value={stats.criticalActions}
                        subtext="Require immediate attention"
                        color="bg-red-500"
                    />
                </div>
                <div className="flex-1 min-w-[240px]">
                    <StatCard
                        icon={Calendar}
                        label="Upcoming Reviews"
                        value={stats.upcomingReviews}
                        subtext="Next 30 days"
                        color="bg-purple-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Feed: Priority Actions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Urgent Items */}
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <AlertTriangle className="text-red-400 w-5 h-5" />
                            Priority Actions Required
                        </h3>

                        {urgentClients.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <p>No urgent actions at the moment</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {urgentClients.map((client) => (
                                    <div
                                        key={client.id}
                                        className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors group cursor-pointer"
                                    >
                                        <div className="mt-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                                                    {client.name}
                                                </h4>
                                                <span className="text-[10px] px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400 uppercase tracking-wider">
                                                    CRITICAL
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-400">{client.items}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (onNavigateToClient) {
                                                    onNavigateToClient(client.id);
                                                }
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-white"
                                        >
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="glass-panel p-6 bg-gradient-to-b from-blue-900/20 to-slate-900/50 border-blue-500/10">
                        <h4 className="text-sm font-bold text-blue-100 uppercase tracking-wider mb-4">Quick Actions</h4>
                        <div className="space-y-2">
                            <button
                                onClick={onAddClient}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                            >
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
                        <p className="text-slate-400 text-sm mb-4">{daysUntilTaxYearEnd} days remaining to utilize allowances.</p>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-300">Avg ISA Utilization</span>
                                    <span className="text-emerald-400">{isaStats.avgUtilization}%</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${isaStats.avgUtilization}%` }}></div>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{isaStats.clientsWithGaps} clients with available allowance</p>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-300">Protection Gaps</span>
                                    <span className="text-orange-400">{protectionGaps} clients</span>
                                </div>
                                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-orange-500"
                                        style={{ width: `${clients.length > 0 ? (protectionGaps / clients.length) * 100 : 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Reviews & Scheduling */}
                    <div className="glass-panel p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="text-blue-400 w-4 h-4" />
                                Upcoming Reviews
                            </h3>
                            <button
                                onClick={() => openScheduleModal(null)}
                                className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-white"
                                title="Schedule New Meeting"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>

                        {upcomingReviewClients.length === 0 ? (
                            <div className="text-center py-4 text-slate-500 text-xs">
                                <p>No reviews scheduled</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingReviewClients.map((client) => (
                                    <div
                                        key={client.client_id}
                                        className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                                                    {client.client_name}
                                                </h4>
                                                <p className="text-[10px] text-slate-500 font-mono">
                                                    {client.next_review_date}
                                                </p>
                                                {client.next_review_note && (
                                                    <p className="text-xs text-slate-400 mt-1 italic">
                                                        {client.next_review_note}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openScheduleModal(client); }}
                                                className="text-slate-500 hover:text-blue-400 transition-colors p-1"
                                                title="Edit Meeting"
                                            >
                                                <Edit className="w-3 h-3" />
                                            </button>
                                        </div>

                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => onGenerateReport && onGenerateReport(client.client_id)}
                                                className="flex-1 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors flex items-center justify-center gap-1 border border-slate-600"
                                            >
                                                <FileText className="w-3 h-3" />
                                                Prep Report
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Schedule/Edit Modal */}
            {meetingModalOpen && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
                            <h3 className="text-lg font-semibold text-white">
                                {selectedMeetingClient ? 'Edit Meeting' : 'Schedule New Meeting'}
                            </h3>
                            <button
                                onClick={() => setMeetingModalOpen(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {!selectedMeetingClient && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Select Client</label>
                                    <select
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        onChange={(e) => {
                                            const client = clients.find(c => c.client_id === e.target.value);
                                            setSelectedMeetingClient(client || null);
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Choose a client...</option>
                                        {clients.map(c => (
                                            <option key={c.client_id} value={c.client_id}>{c.client_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedMeetingClient && (
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                                    <p className="text-sm text-blue-300 font-medium">{selectedMeetingClient.client_name}</p>
                                    <p className="text-xs text-blue-400/70">{selectedMeetingClient.client_id}</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Meeting Date</label>
                                <input
                                    type="date"
                                    value={meetingDate}
                                    onChange={(e) => setMeetingDate(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none hover:bg-slate-800/80 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Add Note (Optional)</label>
                                <textarea
                                    value={meetingNote}
                                    onChange={(e) => setMeetingNote(e.target.value)}
                                    rows={3}
                                    placeholder="Agenda items, key updates..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-700 bg-slate-800/30 flex justify-end gap-3">
                            <button
                                onClick={() => setMeetingModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveMeeting}
                                disabled={savingMeeting || !selectedMeetingClient || !meetingDate}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {savingMeeting ? (
                                    <span>Saving...</span>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Meeting
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Dashboard;
