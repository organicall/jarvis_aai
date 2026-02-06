import React from 'react';
import { LayoutDashboard, Users, PieChart, ShieldAlert, FileText, Settings, Sparkles, BrainCircuit } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'clients', label: 'Clients', icon: Users },
        { id: 'meeting-prep', label: 'Meeting Prep', icon: BrainCircuit },
        { id: 'investments', label: 'Investments', icon: PieChart },
        { id: 'protection', label: 'Protection', icon: ShieldAlert },
        { id: 'compliance', label: 'Compliance', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-50 glass-panel square-corners">
            <div className="p-6 flex items-center gap-3 border-b border-slate-800/50">
                <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">JARVIS</h1>
                    <p className="text-xs text-slate-400">Advisor AI v2.0</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                        <span className="font-medium text-sm">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800/50">
                <div className="glass-card p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900">
                    <p className="text-xs text-slate-400 mb-2">Consumer Duty Status</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-semibold text-green-400">Compliant</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
