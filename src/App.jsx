import React, { useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import ClientList from './components/ClientList.jsx';
import Investments from './components/Investments.jsx';
import Protection from './components/Protection.jsx';
import Compliance from './components/Compliance.jsx';
import MeetingPrep from './components/MeetingPrep.jsx';

const TAB_LABELS = {
  dashboard: 'Command Center',
  clients: 'Client Database',
  'meeting-prep': 'Meeting Intelligence',
  investments: 'Investment Analysis',
  protection: 'Risk & Protection',
  compliance: 'Compliance & Audit',
  settings: 'Settings'
};

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const title = TAB_LABELS[activeTab] || 'Jarvis';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 ml-64 min-h-screen">
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800">
          <div className="px-8 py-6 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Jarvis Advisory Suite</p>
              <h1 className="text-2xl font-semibold text-white">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-xs uppercase tracking-widest rounded-full border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition">
                New Note
              </button>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-emerald-400 shadow-lg shadow-blue-500/30"></div>
            </div>
          </div>
        </div>

        <div className="px-8 py-8">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'clients' && <ClientList />}
          {activeTab === 'meeting-prep' && <MeetingPrep />}
          {activeTab === 'investments' && <Investments />}
          {activeTab === 'protection' && <Protection />}
          {activeTab === 'compliance' && <Compliance />}

          {activeTab === 'settings' && (
            <div className="glass-panel p-8 border border-slate-800/70">
              <h2 className="text-lg font-semibold text-white mb-2">Settings</h2>
              <p className="text-sm text-slate-400">
                Settings will live here. For now, configure API keys in Meeting Prep and manage workflows in the sidebar.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
