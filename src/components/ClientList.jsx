import React, { useMemo, useState } from 'react';
import mammoth from 'mammoth';
import { Search, Filter, ChevronDown, ChevronUp, Pencil, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchClients, fetchClientData } from '../lib/db';
import { aiSchemaPrompt } from '../data/aiSchemaPrompt';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';

const renderActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
        <g>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 8}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={outerRadius + 10}
                outerRadius={outerRadius + 12}
                fill={fill}
            />
        </g>
    );
};

const SECTION_TYPES = [
    'personal_details',
    'financial_summary',
    'assets',
    'pensions',
    'protection',
    'goals',
    'recommendations',
    'opportunities',
    'risks',
    'recent_changes',
    'tax_position',
    'communication_log',
    'other'
];


const emptyNote = {
    client_id: '',
    client_name: '',
    adviser_name: '',
    combined_income: '',
    net_worth: '',
    next_review_date: '',
    isa_allowance_remaining: '',
    has_protection_gaps: false,
    has_urgent_items: false,
    review_overdue: false,
    status: 'active',
    protection_gaps: '',
    urgent_items: '',
    sections: SECTION_TYPES.reduce((acc, key) => {
        acc[key] = '';
        return acc;
    }, {})
};


const normalizeClientId = (clientId, clientName) => {
    if (clientId && String(clientId).trim() !== '') return clientId;
    const fallback = (clientName || 'CLIENT').split(' ').slice(-1)[0].toUpperCase();
    const suffix = String(Date.now()).slice(-4);
    return `${fallback}_${suffix}`;
};


const listFromText = (value) => {
    if (!value) return [];
    return value
        .split(/\r?\n/)
        .map((v) => v.trim())
        .filter(Boolean);
};


const textFromData = (data) => {
    if (!data) return '';
    if (Array.isArray(data)) return data.join('\n');
    if (typeof data === 'string') return data;
    if (typeof data === 'object') {
        if (Array.isArray(data.items)) return data.items.join('\n');
        if (Array.isArray(data.gaps)) return data.gaps.join('\n');
        if (data.text) return data.text;
        return JSON.stringify(data, null, 2);
    }
    return String(data);
};

const buildSectionPayload = (formData) => {
    const sections = [];

    // Protection section
    if (formData.protection_gaps) {
        sections.push({
            section_type: 'protection',
            data: { gaps: listFromText(formData.protection_gaps) }
        });
    }

    // Other section (urgent items)
    if (formData.urgent_items) {
        sections.push({
            section_type: 'other',
            data: { urgent_items: listFromText(formData.urgent_items) }
        });
    }

    // All other section types
    SECTION_TYPES.forEach((sectionType) => {
        const text = formData.sections?.[sectionType];
        if (text && text.trim()) {
            const lines = listFromText(text);
            sections.push({
                section_type: sectionType,
                data: lines.length === 1 ? lines[0] : lines
            });
        }
    });

    return sections;
};



const ClientList = ({ selectedClientId, addClientTrigger }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedClientId, setExpandedClientId] = useState(null);
    const [clientSections, setClientSections] = useState({});
    const [detailLoading, setDetailLoading] = useState(false);
    const [editClientId, setEditClientId] = useState(null);
    const [activeIndex, setActiveIndex] = useState(0); // State for Pie Chart hover
    const [editForm, setEditForm] = useState(emptyNote);
    const [newNote, setNewNote] = useState(emptyNote);
    const [showNewNote, setShowNewNote] = useState(false);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
    const [filterUrgency, setFilterUrgency] = useState('all'); // 'all', 'urgent'

    // Close filter menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (showFilterMenu && !event.target.closest('.filter-menu-container')) {
                setShowFilterMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showFilterMenu]);

    // Trigger "Add Client" modal when prompted by parent (e.g. Dashboard)
    React.useEffect(() => {
        if (addClientTrigger) {
            setShowNewNote(true);
        }
    }, [addClientTrigger]);
    const [statusMessage, setStatusMessage] = useState(null);
    const [docxStatus, setDocxStatus] = useState(null);
    const [docxPreview, setDocxPreview] = useState(null);
    const apiBase = import.meta.env.VITE_API_BASE || '';
    const groqApiKey = localStorage.getItem('jarvis_groq_key') || '';

    // Auto-expand and scroll to selected client from search
    React.useEffect(() => {
        if (selectedClientId && clients.length > 0) {
            setExpandedClientId(selectedClientId);
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                const element = document.getElementById(`client-${selectedClientId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [selectedClientId, clients]);

    React.useEffect(() => {
        let ignore = false;
        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchClients();
                if (!ignore) setClients(data);
            } catch (err) {
                console.warn('Failed to load clients', err.message);
            } finally {
                if (!ignore) setLoading(false);
            }
        };
        load();
        return () => { ignore = true; };
    }, []);

    const filteredClients = useMemo(() => {
        let filtered = clients;

        // Apply search filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter((c) => {
                const name = (c.client_name || '').toLowerCase();
                const id = (c.client_id || '').toLowerCase();
                return name.includes(lower) || id.includes(lower);
            });
        }

        // Apply status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter((c) => c.status === filterStatus);
        }

        // Apply urgency filter
        if (filterUrgency === 'urgent') {
            filtered = filtered.filter((c) => c.has_urgent_items);
        }

        return filtered;
    }, [clients, searchTerm, filterStatus, filterUrgency]);

    const loadDetails = async (clientId) => {
        setExpandedClientId((prev) => (prev === clientId ? null : clientId));
        if (expandedClientId === clientId) return;
        setDetailLoading(true);
        try {
            const sections = await fetchClientData(clientId);
            setClientSections((prev) => ({ ...prev, [clientId]: sections }));
        } catch (err) {
            console.warn('Failed to load client sections', err.message);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleNewNoteSubmit = async () => {
        setStatusMessage({ type: 'loading', message: 'Saving client...' });
        try {
            const clientId = normalizeClientId(newNote.client_id, newNote.client_name);
            const clientRecord = {
                client_id: clientId,
                client_name: newNote.client_name,
                adviser_name: newNote.adviser_name || null,
                combined_income: newNote.combined_income ? Number(newNote.combined_income) : null,
                net_worth: newNote.net_worth ? Number(newNote.net_worth) : null,
                next_review_date: newNote.next_review_date || null,
                isa_allowance_remaining: newNote.isa_allowance_remaining ? Number(newNote.isa_allowance_remaining) : null,
                has_protection_gaps: newNote.has_protection_gaps,
                has_urgent_items: newNote.has_urgent_items,
                review_overdue: newNote.review_overdue,
                status: newNote.status
            };

            const { error } = await supabase.from('clients').insert([clientRecord]);
            if (error) throw error;

            const sections = buildSectionPayload(newNote);
            if (sections.length) {
                const { error: dataError } = await supabase.from('client_data').insert(
                    sections.map((section) => ({
                        client_id: clientId,
                        section_type: section.section_type,
                        data: section.data
                    }))
                );
                if (dataError) throw dataError;
            }

            const refreshed = await fetchClients();
            setClients(refreshed);
            setNewNote(emptyNote);
            setStatusMessage({ type: 'success', message: `Client ${clientId} saved.` });
        } catch (err) {
            setStatusMessage({ type: 'error', message: err.message || 'Failed to save client.' });
        }
    };

    const startEdit = (client) => {
        const sections = clientSections[client.client_id] || [];
        const sectionMap = sections.reduce((acc, item) => {
            acc[item.section_type] = item.data;
            return acc;
        }, {});
        setEditClientId(client.client_id);
        setEditForm({
            client_id: client.client_id,
            client_name: client.client_name,
            adviser_name: client.adviser_name || '',
            combined_income: client.combined_income || '',
            net_worth: client.net_worth || '',
            next_review_date: client.next_review_date || '',
            isa_allowance_remaining: client.isa_allowance_remaining || '',
            has_protection_gaps: client.has_protection_gaps,
            has_urgent_items: client.has_urgent_items,
            review_overdue: client.review_overdue,
            status: client.status || 'active',
            protection_gaps: textFromData(sectionMap.protection?.gaps),
            urgent_items: textFromData(sectionMap.other?.urgent_items),
            sections: SECTION_TYPES.reduce((acc, key) => {
                acc[key] = textFromData(sectionMap[key]);
                return acc;
            }, {})
        });
    };

    const saveEdit = async () => {
        setStatusMessage({ type: 'loading', message: 'Updating client...' });
        try {
            const clientRecord = {
                client_name: editForm.client_name,
                adviser_name: editForm.adviser_name || null,
                combined_income: editForm.combined_income ? Number(editForm.combined_income) : null,
                net_worth: editForm.net_worth ? Number(editForm.net_worth) : null,
                next_review_date: editForm.next_review_date || null,
                isa_allowance_remaining: editForm.isa_allowance_remaining ? Number(editForm.isa_allowance_remaining) : null,
                has_protection_gaps: editForm.has_protection_gaps,
                has_urgent_items: editForm.has_urgent_items,
                review_overdue: editForm.review_overdue,
                status: editForm.status
            };

            const { error } = await supabase.from('clients').update(clientRecord).eq('client_id', editForm.client_id);
            if (error) throw error;

            const sections = buildSectionPayload(editForm);
            if (sections.length) {
                const { error: dataError } = await supabase.from('client_data').upsert(
                    sections.map((section) => ({
                        client_id: editForm.client_id,
                        section_type: section.section_type,
                        data: section.data
                    })),
                    { onConflict: 'client_id,section_type' }
                );
                if (dataError) throw dataError;
            }

            const refreshed = await fetchClients();
            setClients(refreshed);
            setEditClientId(null);
            setStatusMessage({ type: 'success', message: `Client ${editForm.client_id} updated.` });
        } catch (err) {
            setStatusMessage({ type: 'error', message: err.message || 'Failed to update client.' });
        }
    };

    const handleDocxUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setDocxStatus({ type: 'loading', message: 'Parsing document with AI...' });
        setDocxPreview(null);
        try {
            const buffer = await file.arrayBuffer();
            const { value: rawText } = await mammoth.extractRawText({ arrayBuffer: buffer });
            if (!rawText || rawText.trim().length < 20) {
                setDocxStatus({ type: 'error', message: 'Could not extract readable text from DOCX.' });
                return;
            }
            const response = await fetch(`${apiBase}/api/groq`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(groqApiKey && groqApiKey.startsWith('gsk_') ? { 'x-groq-key': groqApiKey } : {})
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.2,
                    max_tokens: 3500,
                    response_format: { type: 'json_object' },
                    messages: [
                        { role: 'system', content: aiSchemaPrompt },
                        { role: 'user', content: rawText }
                    ]
                })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error?.message || 'Groq parsing failed');
            }
            const data = await response.json();
            let content = data.choices?.[0]?.message?.content || '{}';
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                content = content.slice(jsonStart, jsonEnd + 1);
            }
            const parsed = JSON.parse(content);
            setDocxPreview({ parsed, rawText, filename: file.name, fileSize: file.size });
            setDocxStatus({ type: 'success', message: 'Parsed successfully. Review and insert below.' });
        } catch (err) {
            setDocxStatus({ type: 'error', message: err.message || 'Parsing failed.' });
        } finally {
            event.target.value = '';
        }
    };

    const insertParsedData = async () => {
        if (!docxPreview?.parsed) return;
        setDocxStatus({ type: 'loading', message: 'Inserting parsed data...' });
        try {
            const clientId = await insertParsedDataInternal(docxPreview.parsed, docxPreview.rawText, docxPreview.filename, docxPreview.fileSize);
            const refreshed = await fetchClients();
            setClients(refreshed);
            setDocxStatus({ type: 'success', message: `Inserted data for ${clientId}.` });
            setShowNewNote(false);
        } catch (err) {
            setDocxStatus({ type: 'error', message: err.message || 'Insert failed.' });
        }
    };

    const insertParsedDataInternal = async (payload, rawText, filename, fileSize) => {
        if (!payload?.client) throw new Error('No client data found in parsed payload.');
        const now = new Date();
        const todayIso = now.toISOString().slice(0, 10);
        const nextReview = payload.client.next_review_date || null;
        const reviewOverdue = nextReview ? new Date(nextReview) < new Date(todayIso) : false;
        const protectionGaps = payload.protection?.gaps || [];
        const urgentItems = payload.urgent_items || [];
        const clientRecord = {
            client_id: normalizeClientId(payload.client.client_id, payload.client.client_name),
            client_name: payload.client.client_name,
            adviser_name: payload.client.adviser_name || null,
            combined_income: payload.client.combined_income ?? null,
            net_worth: payload.client.net_worth ?? null,
            last_updated: payload.client.last_updated || todayIso,
            next_review_date: nextReview,
            has_protection_gaps: protectionGaps.length > 0,
            has_urgent_items: urgentItems.length > 0,
            review_overdue: reviewOverdue,
            isa_allowance_remaining: payload.client.isa_allowance_remaining ?? null,
            status: 'active'
        };
        const { error: clientError } = await supabase.from('clients').insert([clientRecord]);
        if (clientError) throw clientError;
        const clientId = clientRecord.client_id;
        const sections = [
            { section_type: 'personal_details', data: payload.personal_details },
            { section_type: 'financial_summary', data: payload.financial_summary },
            { section_type: 'assets', data: payload.assets },
            { section_type: 'pensions', data: payload.pensions },
            { section_type: 'protection', data: payload.protection },
            { section_type: 'goals', data: payload.goals },
            { section_type: 'recommendations', data: payload.recommendations },
            { section_type: 'opportunities', data: payload.opportunities },
            { section_type: 'risks', data: payload.risks },
            { section_type: 'recent_changes', data: payload.recent_changes },
            { section_type: 'tax_position', data: payload.tax_position },
            { section_type: 'communication_log', data: payload.communication_log },
            { section_type: 'other', data: { urgent_items: urgentItems } }
        ].filter((section) => section.data !== undefined);
        if (sections.length) {
            const { error: dataError } = await supabase.from('client_data').insert(
                sections.map((section) => ({
                    client_id: clientId,
                    section_type: section.section_type,
                    data: section.data
                }))
            );
            if (dataError) throw dataError;
        }
        const { error: docError } = await supabase.from('parsed_documents').insert([{
            client_id: clientId,
            filename: filename || 'upload.docx',
            file_size: fileSize || null,
            raw_text: rawText,
            structured_json: payload,
            parse_status: 'completed',
            ai_model_used: 'llama-3.3-70b-versatile'
        }]);
        if (docError) throw docError;
        return clientId;
    };

    return (
        <div className="space-y-4 animate-fade-in px-6">
            <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-lg">
                        <div className="flex items-center gap-2 rounded-full px-4 py-2.5" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
                            <Search className="text-slate-400 w-4 h-4 flex-shrink-0" strokeWidth={2.5} />
                            <input
                                type="text"
                                placeholder="Search clients by name or ID..."
                                className="flex-1 bg-transparent border-none text-sm text-slate-200 placeholder-slate-500 focus:outline-none"
                                style={{ backgroundColor: 'transparent' }}
                                autoComplete="off"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="relative filter-menu-container">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className={`flex items-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border rounded-lg text-slate-300 text-sm transition-all ${showFilterMenu || filterStatus !== 'all' || filterUrgency !== 'all'
                                ? 'border-blue-500 bg-slate-700'
                                : 'border-slate-700'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            <span>Filter</span>
                            {(filterStatus !== 'all' || filterUrgency !== 'all') && (
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            )}
                        </button>
                        {showFilterMenu && (
                            <div className="absolute top-full mt-2 right-0 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden animate-fade-in">
                                <div className="p-3 border-b border-slate-800">
                                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Filter Clients</p>
                                </div>
                                <div className="p-3 space-y-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-2 font-medium">Status</label>
                                        <div className="space-y-1.5">
                                            {[{ value: 'all', label: 'All Clients' }, { value: 'active', label: 'Active Only' }, { value: 'inactive', label: 'Inactive Only' }].map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setFilterStatus(option.value)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterStatus === option.value
                                                        ? 'bg-blue-600 text-white font-medium'
                                                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-2 font-medium">Urgency</label>
                                        <div className="space-y-1.5">
                                            {[{ value: 'all', label: 'Show All' }, { value: 'urgent', label: 'Critical Action Only' }].map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => setFilterUrgency(option.value)}
                                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${filterUrgency === option.value
                                                        ? 'bg-blue-600 text-white font-medium'
                                                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-slate-800">
                                        <button
                                            onClick={() => {
                                                setFilterStatus('all');
                                                setFilterUrgency('all');
                                            }}
                                            className="w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                        >
                                            Clear All Filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors" onClick={() => setShowNewNote(true)}>Add Client</button>
                </div>
            </div>

            {
                statusMessage && (
                    <div className={`p-3 rounded-lg text-sm border ${statusMessage.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : statusMessage.type === 'loading'
                            ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                            : 'bg-red-500/10 border-red-500/30 text-red-300'
                        }`}
                    >
                        {statusMessage.message}
                    </div>
                )
            }

            {
                showNewNote && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md pt-2 pb-4 px-4">
                        <div
                            className="bg-slate-950 border-2 border-slate-700 rounded-xl shadow-2xl overflow-y-auto overflow-x-hidden"
                            style={{ width: '80vw', height: '65vh', maxHeight: 'calc(100vh - 340px)' }}
                        >
                            {/* Header - Sticky */}
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4 sticky top-0 bg-slate-950 z-10 p-8">
                                <div>
                                    <h2 className="text-xl font-bold text-white">Add New Client</h2>
                                    <p className="text-sm text-slate-400 mt-1">Fill in client details or upload a DOCX document for AI parsing</p>
                                </div>
                                <button
                                    className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition-all"
                                    onClick={() => {
                                        setShowNewNote(false);
                                        setDocxPreview(null);
                                        setDocxStatus(null);
                                    }}
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="p-8 space-y-6">

                                {/* AI Upload Section - Prominent */}
                                <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                                AI Document Parser
                                            </h3>
                                            <p className="text-sm text-slate-400 mt-1">Upload a .docx file and let AI extract all client data automatically</p>
                                        </div>
                                        <label className="px-6 py-3 rounded-lg bg-white text-blue-600 font-semibold hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            Upload DOCX
                                            <input type="file" accept=".docx" className="hidden" onChange={handleDocxUpload} />
                                        </label>
                                    </div>

                                    {docxStatus && (
                                        <div className={`p-4 rounded-lg text-sm border ${docxStatus.type === 'success'
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                            : docxStatus.type === 'loading'
                                                ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                                                : 'bg-red-500/10 border-red-500/30 text-red-300'
                                            }`}>
                                            {docxStatus.message}
                                        </div>
                                    )}

                                    {docxPreview && (
                                        <div className="mt-4 bg-slate-950/60 border border-slate-700 rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">
                                                        {docxPreview.parsed?.client?.client_name || 'Unnamed Client'}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Goals: {docxPreview.parsed?.goals?.length || 0} •
                                                        Opportunities: {docxPreview.parsed?.opportunities?.length || 0} •
                                                        Risks: {docxPreview.parsed?.risks?.length || 0}
                                                    </p>
                                                </div>
                                                <button
                                                    className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-slate-200 transition-colors"
                                                    onClick={insertParsedData}
                                                >
                                                    Insert Parsed Data
                                                </button>
                                            </div>
                                            <details className="text-xs">
                                                <summary className="cursor-pointer text-slate-400 hover:text-slate-300">View parsed JSON</summary>
                                                <pre className="mt-2 p-3 bg-black/50 rounded-lg overflow-auto max-h-48 text-slate-300 text-[11px]">
                                                    {JSON.stringify(docxPreview.parsed, null, 2)}
                                                </pre>
                                            </details>
                                        </div>
                                    )}
                                </div>

                                {/* Manual Entry Divider */}
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-px bg-slate-800"></div>
                                    <span className="text-xs uppercase tracking-wider text-slate-500">Or Enter Manually</span>
                                    <div className="flex-1 h-px bg-slate-800"></div>
                                </div>

                                {/* Basic Info */}
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-3">Basic Information</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input
                                            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-white"
                                            placeholder="Client ID (optional)"
                                            value={newNote.client_id}
                                            onChange={(e) => setNewNote({ ...newNote, client_id: e.target.value })}
                                        />
                                        <input
                                            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-white"
                                            placeholder="Client Name"
                                            value={newNote.client_name}
                                            onChange={(e) => setNewNote({ ...newNote, client_name: e.target.value })}
                                        />
                                        <input
                                            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-white"
                                            placeholder="Adviser Name"
                                            value={newNote.adviser_name}
                                            onChange={(e) => setNewNote({ ...newNote, adviser_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Financial Info */}
                                <div>
                                    <h4 className="text-sm font-semibold text-white mb-3">Financial Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <input
                                            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-white"
                                            placeholder="Combined Income"
                                            value={newNote.combined_income}
                                            onChange={(e) => setNewNote({ ...newNote, combined_income: e.target.value })}
                                        />
                                        <input
                                            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-white"
                                            placeholder="Net Worth"
                                            value={newNote.net_worth}
                                            onChange={(e) => setNewNote({ ...newNote, net_worth: e.target.value })}
                                        />
                                        <input
                                            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-white"
                                            placeholder="Next Review (YYYY-MM-DD)"
                                            value={newNote.next_review_date}
                                            onChange={(e) => setNewNote({ ...newNote, next_review_date: e.target.value })}
                                        />
                                        <input
                                            className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-white"
                                            placeholder="ISA Allowance Remaining"
                                            value={newNote.isa_allowance_remaining}
                                            onChange={(e) => setNewNote({ ...newNote, isa_allowance_remaining: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Flags */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white">
                                        <input
                                            type="checkbox"
                                            checked={newNote.has_protection_gaps}
                                            onChange={(e) => setNewNote({ ...newNote, has_protection_gaps: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        Protection Gaps
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white">
                                        <input
                                            type="checkbox"
                                            checked={newNote.has_urgent_items}
                                            onChange={(e) => setNewNote({ ...newNote, has_urgent_items: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        Urgent Items
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white">
                                        <input
                                            type="checkbox"
                                            checked={newNote.review_overdue}
                                            onChange={(e) => setNewNote({ ...newNote, review_overdue: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        Review Overdue
                                    </label>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                    <button
                                        className="px-6 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                                        onClick={() => {
                                            setShowNewNote(false);
                                            setDocxPreview(null);
                                            setDocxStatus(null);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                                        onClick={async () => {
                                            await handleNewNoteSubmit();
                                            setShowNewNote(false);
                                        }}
                                    >
                                        Save Client
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="grid grid-cols-1 gap-3">
                {filteredClients.map((client) => (
                    <div key={client.client_id} id={`client-${client.client_id}`} className="glass-card">
                        <div
                            className="flex items-center gap-4 group hover:bg-slate-800/40 transition-all cursor-pointer p-3 rounded-xl"
                            onClick={() => loadDetails(client.client_id)}
                        >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600 group-hover:border-blue-500/50 transition-colors flex-shrink-0">
                                <span className="font-bold text-sm text-slate-300 group-hover:text-blue-400">
                                    {client.client_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </span>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                                <div>
                                    <h3 className="font-semibold text-base text-white group-hover:text-blue-400 transition-colors">{client.client_name}</h3>
                                    <p className="text-xs text-slate-400">{client.client_id} • {client.status}</p>
                                </div>

                                <div className="hidden md:block">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Next Review</p>
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <div className={`w-1.5 h-1.5 rounded-full ${client.next_review_date && new Date(client.next_review_date) < new Date('2026-04-01') ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                                        {client.next_review_date || 'TBD'}
                                    </div>
                                </div>

                                <div className="hidden md:block">
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Net Worth</p>
                                    <p className="text-sm font-mono text-slate-300">
                                        £{Number(client.net_worth || 0).toLocaleString()}
                                    </p>
                                </div>

                                <div className="md:col-span-1 flex justify-end">
                                    {client.has_urgent_items ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-full mr-2">
                                            Critical Action
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            {expandedClientId === client.client_id ? (
                                <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                        </div>

                        {expandedClientId === client.client_id && (
                            <div className="p-4 border-t border-slate-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs uppercase tracking-wider text-slate-500">Client Details</p>
                                    {editClientId === client.client_id ? (
                                        <div className="flex gap-2">
                                            <button
                                                className="px-4 py-1.5 text-xs rounded-full text-white flex items-center gap-2 transition-opacity"
                                                onClick={saveEdit}
                                                style={{ backgroundColor: '#10b981', cursor: 'pointer' }}
                                            >
                                                <Save className="w-3 h-3" />
                                                <span>Save</span>
                                            </button>
                                            <button
                                                className="px-4 py-1.5 text-xs rounded-full text-white flex items-center gap-2 transition-opacity"
                                                onClick={() => setEditClientId(null)}
                                                style={{ backgroundColor: '#ef4444', cursor: 'pointer' }}
                                            >
                                                <X className="w-3 h-3" />
                                                <span>Cancel</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className="px-4 py-1.5 text-xs rounded-full text-white flex items-center gap-2 transition-opacity"
                                            onClick={() => startEdit(client)}
                                            style={{ backgroundColor: '#3b82f6', cursor: 'pointer' }}
                                        >
                                            <Pencil className="w-3 h-3" />
                                            <span>Edit Client</span>
                                        </button>
                                    )}
                                </div>

                                {detailLoading ? (
                                    <p className="text-sm text-slate-400">Loading details...</p>
                                ) : editClientId === client.client_id ? (
                                    <div className="space-y-4">
                                        {/* Basic Information */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Basic Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1.5">Client Name *</label>
                                                    <input
                                                        className="input"
                                                        placeholder="Enter client full name"
                                                        value={editForm.client_name}
                                                        onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1.5">Adviser Name</label>
                                                    <input
                                                        className="input"
                                                        placeholder="Assigned adviser name"
                                                        value={editForm.adviser_name}
                                                        onChange={(e) => setEditForm({ ...editForm, adviser_name: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial Information */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Financial Details</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1.5">Combined Income (£)</label>
                                                    <input
                                                        className="input"
                                                        type="number"
                                                        placeholder="Annual combined income"
                                                        value={editForm.combined_income}
                                                        onChange={(e) => setEditForm({ ...editForm, combined_income: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1.5">Net Worth (£)</label>
                                                    <input
                                                        className="input"
                                                        type="number"
                                                        placeholder="Total net worth"
                                                        value={editForm.net_worth}
                                                        onChange={(e) => setEditForm({ ...editForm, net_worth: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1.5">ISA Allowance Remaining (£)</label>
                                                    <input
                                                        className="input"
                                                        type="number"
                                                        placeholder="Remaining ISA allowance"
                                                        value={editForm.isa_allowance_remaining}
                                                        onChange={(e) => setEditForm({ ...editForm, isa_allowance_remaining: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Review Information */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Review Schedule</h4>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1.5">Next Review Date</label>
                                                <input
                                                    className="input"
                                                    type="date"
                                                    value={editForm.next_review_date}
                                                    onChange={(e) => setEditForm({ ...editForm, next_review_date: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {/* Action Items */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Action Items</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1.5">Protection Gaps</label>
                                                    <textarea
                                                        className="textarea h-24"
                                                        placeholder="List any protection coverage gaps (one per line)"
                                                        value={editForm.protection_gaps}
                                                        onChange={(e) => setEditForm({ ...editForm, protection_gaps: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-slate-400 mb-1.5">Urgent Items</label>
                                                    <textarea
                                                        className="textarea h-24"
                                                        placeholder="List urgent action items (one per line)"
                                                        value={editForm.urgent_items}
                                                        onChange={(e) => setEditForm({ ...editForm, urgent_items: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Notes */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Additional Notes</h4>
                                            <div className="grid grid-cols-1 gap-3">
                                                {SECTION_TYPES.map((section) => (
                                                    <div key={section}>
                                                        <label className="block text-xs text-slate-400 mb-1.5 capitalize">
                                                            {section.replace(/_/g, ' ')}
                                                        </label>
                                                        <textarea
                                                            className="textarea h-24"
                                                            placeholder={`Enter ${section.replace(/_/g, ' ')} details...`}
                                                            value={editForm.sections[section]}
                                                            onChange={(e) => setEditForm({ ...editForm, sections: { ...editForm.sections, [section]: e.target.value } })}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Quick Stats Overview - Compact Single Row */}
                                        <div className="flex gap-1.5">
                                            <div className="flex-1 p-2 rounded-lg bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-700/30">
                                                <p className="text-[9px] text-blue-300 uppercase tracking-wide mb-0.5">Net Worth</p>
                                                <p className="text-lg font-bold text-white leading-tight">£{(client.net_worth / 1000000).toFixed(2)}M</p>
                                                <p className="text-[9px] text-blue-200/60 mt-0.5">Portfolio Value</p>
                                            </div>
                                            <div className="flex-1 p-2 rounded-lg bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/30">
                                                <p className="text-[9px] text-emerald-300 uppercase tracking-wide mb-0.5">Income</p>
                                                <p className="text-lg font-bold text-white leading-tight">£{(client.combined_income / 1000).toFixed(0)}k</p>
                                                <p className="text-[9px] text-emerald-200/60 mt-0.5">Annual Combined</p>
                                            </div>
                                            <div className="flex-1 p-2 rounded-lg bg-gradient-to-br from-purple-900/40 to-purple-800/20 border border-purple-700/30">
                                                <p className="text-[9px] text-purple-300 uppercase tracking-wide mb-0.5">Next Review</p>
                                                <p className="text-sm font-bold text-white leading-tight">{client.next_review_date || 'TBD'}</p>
                                                <p className="text-[9px] text-purple-200/60 mt-0.5">Scheduled Date</p>
                                            </div>
                                            <div className="flex-1 p-2 rounded-lg bg-gradient-to-br from-orange-900/40 to-orange-800/20 border border-orange-700/30">
                                                <p className="text-[9px] text-orange-300 uppercase tracking-wide mb-0.5">Status</p>
                                                <p className="text-sm font-bold text-white capitalize leading-tight">{client.status}</p>
                                                {client.has_urgent_items && <p className="text-[9px] text-orange-300 mt-0.5">⚠️ Urgent Items</p>}
                                            </div>
                                        </div>

                                        {/* Visual Charts Section - 3 Columns */}
                                        <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}> {/* Forced 3 columns, Side by Side */}
                                            {/* 1. ISA Allowance Progress */}
                                            <div className="p-6 rounded-xl border border-slate-800 flex flex-col justify-center h-full" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}> {/* Increased padding to p-6 */}
                                                <p className="text-sm font-semibold text-white mb-4">ISA Allowance</p>
                                                <div className="space-y-3">
                                                    {(() => {
                                                        const maxAllowance = 20000; // UK ISA limit
                                                        const used = maxAllowance - (client.isa_allowance_remaining || 0);
                                                        const percentage = (used / maxAllowance) * 100;
                                                        return (
                                                            <>
                                                                <div className="flex justify-between text-xs text-slate-400">
                                                                    <span>Used: £{used.toLocaleString()}</span>
                                                                    <span>Remaining: £{(client.isa_allowance_remaining || 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="w-full h-4 bg-slate-800 rounded-full" style={{ overflow: 'hidden' }}>
                                                                    <div
                                                                        className="h-full transition-all duration-500"
                                                                        style={{
                                                                            width: `${percentage}%`,
                                                                            backgroundImage: 'linear-gradient(to right, #10b981, #3b82f6)',
                                                                            position: 'relative'
                                                                        }}
                                                                    >
                                                                        <div className="absolute inset-0 bg-white/10" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}></div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-center mt-2">
                                                                    <span className="text-xs text-slate-500">Utilization</span>
                                                                    <span className="text-sm font-bold text-slate-200">{percentage.toFixed(0)}%</span>
                                                                </div>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>

                                            {/* 2. Portfolio Composition Donut Chart */}
                                            <div className="p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center h-full" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
                                                <p className="text-sm font-semibold text-white mb-4 w-full text-left">Portfolio Split</p>
                                                <div className="w-full" style={{ height: '180px' }}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                activeIndex={activeIndex}
                                                                activeShape={renderActiveShape}
                                                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                                                data={[
                                                                    { name: 'Equities', value: 40 },
                                                                    { name: 'Fixed Income', value: 30 },
                                                                    { name: 'Property', value: 20 },
                                                                    { name: 'Cash', value: 10 },
                                                                ]}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius="50%"
                                                                outerRadius="70%"
                                                                paddingAngle={4}
                                                                dataKey="value"
                                                            >
                                                                {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'].map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                isAnimationActive={false}
                                                                content={({ active, payload }) => {
                                                                    if (active && payload && payload.length) {
                                                                        return (
                                                                            <div className="bg-slate-900/90 border border-slate-700 p-2 rounded-lg shadow-xl backdrop-blur-sm z-50">
                                                                                <p className="text-slate-300 text-xs font-medium">{payload[0].name}</p>
                                                                                <p className="text-white text-sm font-bold">
                                                                                    {payload[0].value}%
                                                                                </p>
                                                                            </div>
                                                                        );
                                                                    }
                                                                    return null;
                                                                }}
                                                            />
                                                            <Legend
                                                                verticalAlign="middle"
                                                                align="right"
                                                                layout="vertical"
                                                                iconType="circle"
                                                                iconSize={8}
                                                                wrapperStyle={{ fontSize: '10px', right: 0 }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* 3. Protection Coverage Visual */}
                                            <div className="p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center h-full text-center" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
                                                <p className="text-sm font-semibold text-white mb-4 w-full text-left">Protection</p>
                                                <div className="flex flex-col items-center justify-center flex-1">
                                                    {client.has_protection_gaps ? (
                                                        <>
                                                            <div
                                                                className="rounded-full border-2 flex items-center justify-center mb-3"
                                                                style={{
                                                                    width: '4rem',
                                                                    height: '4rem',
                                                                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                                                                    borderColor: 'rgba(249, 115, 22, 0.5)',
                                                                    boxShadow: '0 0 15px rgba(249,115,22,0.2)'
                                                                }}
                                                            >
                                                                <svg style={{ width: '2rem', height: '2rem', color: 'rgb(249, 115, 22)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                                </svg>
                                                            </div>
                                                            <p className="text-orange-400 font-semibold text-sm">Gaps Identified</p>
                                                            <p className="text-xs text-slate-500 mt-1">{client.protection_gaps || 'Coverage review required'}</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div
                                                                className="rounded-full border-2 flex items-center justify-center mb-3"
                                                                style={{
                                                                    width: '4rem',
                                                                    height: '4rem',
                                                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                                    borderColor: 'rgba(16, 185, 129, 0.5)',
                                                                    boxShadow: '0 0 15px rgba(16,185,129,0.2)'
                                                                }}
                                                            >
                                                                <svg style={{ width: '2rem', height: '2rem', color: 'rgb(16, 185, 129)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                                </svg>
                                                            </div>
                                                            <p className="text-emerald-400 font-semibold text-sm">Fully Protected</p>
                                                            <p className="text-xs text-slate-500 mt-1">No gaps found in analysis</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Client Sections Data */}
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Detailed Information</p>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-300">
                                                {(clientSections[client.client_id] || []).map((section) => (
                                                    <div key={section.data_id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors">
                                                        <p className="text-xs text-slate-500 uppercase mb-1">{section.section_type.replace(/_/g, ' ')}</p>
                                                        <p className="text-xs text-slate-300 line-clamp-2">{textFromData(section.data)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div >
    );
};

export default ClientList;
