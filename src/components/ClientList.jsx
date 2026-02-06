import React, { useMemo, useState } from 'react';
import mammoth from 'mammoth';
import { Search, Filter, ChevronDown, ChevronUp, Pencil, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchClients, fetchClientData } from '../lib/db';
import { aiSchemaPrompt } from '../data/aiSchemaPrompt';

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



const ClientList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedClientId, setExpandedClientId] = useState(null);
    const [clientSections, setClientSections] = useState({});
    const [detailLoading, setDetailLoading] = useState(false);
    const [editClientId, setEditClientId] = useState(null);
    const [editForm, setEditForm] = useState(emptyNote);
    const [newNote, setNewNote] = useState(emptyNote);
    const [showNewNote, setShowNewNote] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [docxStatus, setDocxStatus] = useState(null);
    const [docxPreview, setDocxPreview] = useState(null);
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8787';
    const groqApiKey = localStorage.getItem('jarvis_groq_key') || '';

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
        return clients.filter((client) =>
            (client.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.client_id || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);

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
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search clients by name or ID..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors">
                        <Filter className="w-4 h-4" />
                        <span>Filter</span>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">Showing {filteredClients.length} clients</span>
                    <button className="ml-3 px-3 py-2 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => setShowNewNote(true)}>Add Client</button>
                </div>
            </div>

            {statusMessage && (
                <div className={`p-3 rounded-lg text-sm border ${statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : statusMessage.type === 'loading'
                        ? 'bg-slate-800/60 border-slate-700 text-slate-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}
                >
                    {statusMessage.message}
                </div>
            )}

            {showNewNote && (
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
                                    <label className="px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-2">
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
            )}

            <div className="grid grid-cols-1 gap-4">
                {filteredClients.map((client) => (
                    <div key={client.client_id} className="glass-card">
                        <div
                            className="flex items-center gap-6 group hover:bg-slate-800/40 transition-all cursor-pointer p-4 rounded-xl"
                            onClick={() => loadDetails(client.client_id)}
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600 group-hover:border-blue-500/50 transition-colors">
                                <span className="font-bold text-slate-300 group-hover:text-blue-400">
                                    {client.client_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </span>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                <div>
                                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{client.client_name}</h3>
                                    <p className="text-xs text-slate-500">{client.client_id} • {client.status}</p>
                                </div>

                                <div className="hidden md:block">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Next Review</p>
                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                        <div className={`w-2 h-2 rounded-full ${client.next_review_date && new Date(client.next_review_date) < new Date('2026-04-01') ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                                        {client.next_review_date || 'TBD'}
                                    </div>
                                </div>

                                <div className="hidden md:block">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Net Worth</p>
                                    <p className="text-sm font-mono text-slate-300">
                                        £{Number(client.net_worth || 0).toLocaleString()}
                                    </p>
                                </div>

                                <div className="md:col-span-1 flex justify-end">
                                    {client.has_urgent_items ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-full mr-4">
                                            Critical Action
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            {expandedClientId === client.client_id ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                        </div>

                        {expandedClientId === client.client_id && (
                            <div className="p-4 border-t border-slate-800 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs uppercase tracking-wider text-slate-500">Client Details</p>
                                    {editClientId === client.client_id ? (
                                        <div className="flex gap-2">
                                            <button className="px-3 py-1 text-xs rounded-full bg-emerald-600 text-white" onClick={saveEdit}><Save className="w-4 h-4" /></button>
                                            <button className="px-3 py-1 text-xs rounded-full border border-slate-700 text-slate-300" onClick={() => setEditClientId(null)}><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <button className="px-3 py-1 text-xs rounded-full border border-slate-700 text-slate-300" onClick={() => startEdit(client)}><Pencil className="w-4 h-4" /></button>
                                    )}
                                </div>

                                {detailLoading ? (
                                    <p className="text-sm text-slate-400">Loading details...</p>
                                ) : editClientId === client.client_id ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input className="input" value={editForm.client_name} onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })} />
                                        <input className="input" value={editForm.adviser_name} onChange={(e) => setEditForm({ ...editForm, adviser_name: e.target.value })} />
                                        <input className="input" value={editForm.combined_income} onChange={(e) => setEditForm({ ...editForm, combined_income: e.target.value })} />
                                        <input className="input" value={editForm.net_worth} onChange={(e) => setEditForm({ ...editForm, net_worth: e.target.value })} />
                                        <input className="input" value={editForm.next_review_date} onChange={(e) => setEditForm({ ...editForm, next_review_date: e.target.value })} />
                                        <input className="input" value={editForm.isa_allowance_remaining} onChange={(e) => setEditForm({ ...editForm, isa_allowance_remaining: e.target.value })} />
                                        <textarea className="textarea" value={editForm.protection_gaps} onChange={(e) => setEditForm({ ...editForm, protection_gaps: e.target.value })} />
                                        <textarea className="textarea" value={editForm.urgent_items} onChange={(e) => setEditForm({ ...editForm, urgent_items: e.target.value })} />
                                        {SECTION_TYPES.map((section) => (
                                            <textarea key={section} className="textarea" value={editForm.sections[section]} onChange={(e) => setEditForm({ ...editForm, sections: { ...editForm.sections, [section]: e.target.value } })} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-300">
                                        {(clientSections[client.client_id] || []).map((section) => (
                                            <div key={section.data_id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                                                <p className="text-xs text-slate-500 uppercase">{section.section_type.replace(/_/g, ' ')}</p>
                                                <p className="text-xs text-slate-300 line-clamp-2">{textFromData(section.data)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientList;
