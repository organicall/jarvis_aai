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

const FLOW_STAGES = [
  { id: 'review', label: 'Annual Review Email' },
  { id: 'updates', label: 'Client Updates' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'notes', label: 'Post-Meeting Notes' },
  { id: 'suitability', label: 'Suitability' },
  { id: 'implement', label: 'Implement Advice' },
  { id: 'close', label: 'Close Task' }
];

const ACTIVE_FLOW_BY_TAB = {
  dashboard: 'review',
  clients: 'updates',
  'meeting-prep': 'meeting',
  investments: 'implement',
  protection: 'implement',
  compliance: 'suitability',
  settings: 'close'
};

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const title = TAB_LABELS[activeTab] || 'Jarvis';
  const activeFlow = ACTIVE_FLOW_BY_TAB[activeTab] || 'review';

  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            <p className="eyebrow">Jarvis Advisory Suite</p>
            <h1>{title}</h1>
          </div>
          <div className="topbar-actions">
            <div className="search">
              <input type="text" placeholder="Search client, note, task..." />
              <span className="search-hint">⌘K</span>
            </div>
            <button
              className="action-btn"
              onClick={() => window.open('https://docs.google.com/document/create', '_blank')}
              title="Create a new Google Doc"
            >
              New Note
            </button>
            <button
              className="action-btn primary"
              onClick={() => {
                // Navigate to Meeting Prep and show review checklist
                setActiveTab('meeting');
                // TODO: Open review workflow modal or panel
                alert('Start Review functionality:\n\n• Generate AI-powered meeting brief\n• Review client portfolio\n• Prepare recommendations\n• Create action items\n\nThis will be implemented next!');
              }}
              title="Start annual review workflow"
            >
              Start Review
            </button>
            <div className="avatar-glow" />
          </div>
        </header>

        <section className="flow-strip">
          <div className="flow-label">
            <p>Client Journey</p>
            <span>Annual review workflow</span>
          </div>
          <div className="flow-rail">
            {FLOW_STAGES.map((stage) => (
              <div
                key={stage.id}
                className={`flow-step ${activeFlow === stage.id ? 'active' : ''}`}
              >
                <div className="flow-dot" />
                <span>{stage.label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="content-area">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'clients' && <ClientList />}
          {activeTab === 'meeting-prep' && <MeetingPrep />}
          {activeTab === 'investments' && <Investments />}
          {activeTab === 'protection' && <Protection />}
          {activeTab === 'compliance' && <Compliance />}

          {activeTab === 'settings' && (
            <div className="panel">
              <h2>Settings</h2>
              <p>
                Configure API keys in Meeting Prep. Workflow configuration and automation settings will live here.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
