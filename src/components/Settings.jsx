import React, { useState } from 'react';
import { Settings as SettingsIcon, Users, Key, Bell, Shield, Database, Workflow, CheckCircle } from 'lucide-react';
import SectionInfo from './SectionInfo.jsx';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('workspace');
    const [apiKey, setApiKey] = useState('sk-groq-************************');

    const tabs = [
        { id: 'workspace', label: 'Workspace', icon: Database },
        { id: 'users', label: 'Team & Roles', icon: Users },
        { id: 'api', label: 'API & Integrations', icon: Key },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security & Audit', icon: Shield },
        { id: 'automation', label: 'Workflows', icon: Workflow },
    ];

    return (
        <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex flex-col">

            {/* Settings Layout with Sidebar */}
            <div className="flex flex-1 gap-6 overflow-hidden">

                {/* Settings Sidebar */}
                <div className="w-64 flex-shrink-0 glass-panel p-0 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-700/50">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <SettingsIcon className="w-5 h-5 text-slate-400" />
                            Configuration
                        </h3>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                    }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-slate-700/50 bg-slate-900/30">
                        <div className="text-xs text-slate-500 font-mono">
                            Version 2.4.0 (Build 892)<br />
                            Environment: Production
                        </div>
                    </div>
                </div>

                {/* Settings Content Area */}
                <div className="flex-1 glass-panel p-8 overflow-y-auto">

                    {/* -- WORKSPACE TAB -- */}
                    {activeTab === 'workspace' && (
                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">Workspace Settings</h2>
                                <p className="text-slate-400 text-sm">Manage global preferences for your firm's environment.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Firm Name</label>
                                    <input type="text" defaultValue="Jarvis Financial Planning Ltd" className="input-field w-full" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Base Currency</label>
                                        <select className="input-field w-full">
                                            <option>GBP (£)</option>
                                            <option>USD ($)</option>
                                            <option>EUR (€)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">Date Format</label>
                                        <select className="input-field w-full">
                                            <option>DD/MM/YYYY</option>
                                            <option>MM/DD/YYYY</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-700">
                                <h3 className="text-lg font-medium text-white mb-4">Branding</h3>
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-xl bg-slate-800 border border-slate-600 flex items-center justify-center">
                                        <span className="text-xs text-slate-500">Logo</span>
                                    </div>
                                    <button className="btn-secondary text-xs">Upload New Logo</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* -- API TAB -- */}
                    {activeTab === 'api' && (
                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">API & Integrations</h2>
                                <p className="text-slate-400 text-sm">Manage external connections and API keys securely.</p>
                            </div>

                            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-500/20 rounded-lg">
                                            <Database className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-sm">Groq LLM API</h4>
                                            <p className="text-xs text-slate-400">Used for meeting intelligence & document parsing</p>
                                        </div>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">CONNECTED</span>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-slate-500 uppercase">API Key</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            value={apiKey}
                                            readOnly
                                            className="input-field flex-1 font-mono text-xs tracking-widest text-slate-400 bg-slate-950"
                                        />
                                        <button className="btn-secondary text-xs px-4">Rotate</button>
                                    </div>
                                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Key last validated 2 mins ago
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-xl flex justify-between items-center opacity-75">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <Database className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">Supabase Database</h4>
                                        <p className="text-xs text-slate-400">Primary client data store</p>
                                    </div>
                                </div>
                                <button className="btn-primary text-xs bg-slate-700 hover:bg-slate-600">Configure</button>
                            </div>
                        </div>
                    )}

                    {/* Placeholder for others */}
                    {['users', 'notifications', 'security', 'automation'].includes(activeTab) && (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="p-4 bg-slate-800/50 rounded-full mb-4">
                                <Workflow className="w-8 h-8 text-slate-500" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Coming Soon</h3>
                            <p className="text-slate-400 text-sm max-w-xs">
                                This configuration module is part of the Phase 2 rollout. Check the implementation roadmap for details.
                            </p>
                            <button
                                className="mt-6 btn-secondary text-xs"
                                onClick={() => setActiveTab('workspace')}
                            >
                                Return to Workspace
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Settings;
