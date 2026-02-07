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
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-mark">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1>JARVIS</h1>
                    <p>Advisor AI</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                    >
                        <item.icon className="nav-icon" />
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="status-card">
                    <p>Consumer Duty</p>
                    <div className="status-row">
                        <span className="status-dot" />
                        <span>Compliant</span>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
