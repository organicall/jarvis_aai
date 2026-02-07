import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import ClientList from './components/ClientList.jsx';
import Investments from './components/Investments.jsx';
import Protection from './components/Protection.jsx';
import Compliance from './components/Compliance.jsx';
import MeetingPrep from './components/MeetingPrep.jsx';
import { fetchClients } from './lib/db.js';
import { LayoutDashboard, Users, PieChart, ShieldAlert, FileText, Settings, Sparkles, BrainCircuit } from 'lucide-react';

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
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [clients, setClients] = useState([]);
  const [addClientTrigger, setAddClientTrigger] = useState(0);

  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const title = TAB_LABELS[activeTab] || 'Jarvis';
  const activeFlow = ACTIVE_FLOW_BY_TAB[activeTab] || 'review';

  // Fetch clients from Supabase
  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await fetchClients();
        setClients(data);
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      }
    };
    loadClients();
  }, []);

  // Filter clients based on search query
  const filteredClients = searchQuery.trim()
    ? clients.filter(client =>
      client.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)  // Show max 5 results
    : [];

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setSelectedIndex(0);
    setShowDropdown(true);
  };

  // Handle client selection
  const handleSelectClient = (client) => {
    setSelectedClientId(client.client_id);
    setActiveTab('clients');
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Keyboard navigation for search dropdown
  const handleSearchKeyDown = (e) => {
    if (!showDropdown || filteredClients.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredClients.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredClients[selectedIndex]) {
          handleSelectClient(filteredClients[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSearchQuery('');
        searchInputRef.current?.blur();
        break;
    }
  };

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddClient = () => {
    setActiveTab('clients');
    setAddClientTrigger(Date.now());
  };

  const handleGenerateReport = (clientId) => {
    setSelectedClientId(clientId);
    setActiveTab('meeting-prep');
  };

  return (
    <div className="app-shell-horizontal">
      {/* Top Navigation Bar */}
      <header className="top-nav-bar">
        {/* JARVIS Branding */}
        <div className="nav-brand">
          <div className="brand-mark">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="brand-text">
            <h1>JARVIS</h1>
            <p>Advisor AI</p>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <nav className="horizontal-nav">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard className="nav-icon" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`nav-tab ${activeTab === 'clients' ? 'active' : ''}`}
          >
            <Users className="nav-icon" />
            <span>Clients</span>
          </button>
          <button
            onClick={() => setActiveTab('meeting-prep')}
            className={`nav-tab ${activeTab === 'meeting-prep' ? 'active' : ''}`}
          >
            <BrainCircuit className="nav-icon" />
            <span>Meeting Prep</span>
          </button>
          <button
            onClick={() => setActiveTab('investments')}
            className={`nav-tab ${activeTab === 'investments' ? 'active' : ''}`}
          >
            <PieChart className="nav-icon" />
            <span>Investments</span>
          </button>
          <button
            onClick={() => setActiveTab('protection')}
            className={`nav-tab ${activeTab === 'protection' ? 'active' : ''}`}
          >
            <ShieldAlert className="nav-icon" />
            <span>Protection</span>
          </button>
          <button
            onClick={() => setActiveTab('compliance')}
            className={`nav-tab ${activeTab === 'compliance' ? 'active' : ''}`}
          >
            <FileText className="nav-icon" />
            <span>Compliance</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings className="nav-icon" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Right Side Actions */}
        <div className="nav-actions">
          <div className="search" style={{ position: 'relative' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search client, note, task..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => searchQuery && setShowDropdown(true)}
            />
            <span className="search-hint">⌘K</span>

            {/* Search Dropdown */}
            {showDropdown && filteredClients.length > 0 && (
              <div
                ref={dropdownRef}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  zIndex: 1000,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}
              >
                {filteredClients.map((client, index) => (
                  <div
                    key={client.client_id}
                    onClick={() => handleSelectClient(client)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: index === selectedIndex ? '#1e3a5f' : 'transparent',
                      borderBottom: index < filteredClients.length - 1 ? '1px solid #1e293b' : 'none',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div style={{ color: '#fff', fontWeight: '500', marginBottom: '4px' }}>
                      {client.client_name}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                      {client.client_id} • Portfolio: £{(client.net_worth / 1000000).toFixed(2)}M
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            className="action-btn"
            onClick={() => window.open('https://docs.google.com/document/create', '_blank')}
            title="Create a new Google Doc"
          >
            New Note
          </button>
          <div className="avatar-glow" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content-horizontal">

        <div className="content-area">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigateToClient={(clientId) => {
                setSelectedClientId(clientId);
                setActiveTab('clients');
              }}
              onAddClient={handleAddClient}
              onGenerateReport={handleGenerateReport}
            />
          )}
          {activeTab === 'clients' && <ClientList selectedClientId={selectedClientId} addClientTrigger={addClientTrigger} />}
          {activeTab === 'meeting-prep' && <MeetingPrep initialClientId={selectedClientId} />}
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
