import React, { useState, useEffect } from 'react';
import { fetchClients, fetchClientData, fetchLatestParsedDoc } from '../lib/db';
import {
    AlertTriangle,
    Lightbulb,
    TrendingUp,
    MessageSquare,
    FileText,
    Mail,
    Clock,
    Zap,
    Settings,
    BrainCircuit,
    Mic,
    SendHorizontal,
    Target,
    ShieldAlert,
    CalendarDays
} from 'lucide-react';
import SectionInfo from './SectionInfo.jsx';

const MEETING_TYPES = [
    'Annual Review',
    'Initial Onboarding',
    'Ad-hoc / Urgent',
    'Pre-Retirement Planning'
];

const QUICK_PROMPTS = [
    'Top 3 risks to discuss first',
    'Tax efficiency moves for this client',
    'Retirement readiness questions',
    '30-day action plan after meeting'
];

const PRIORITY_STYLES = {
    Critical: 'text-red-200 border-red-400/40 bg-red-500/15',
    High: 'text-amber-200 border-amber-400/40 bg-amber-500/15',
    Medium: 'text-blue-200 border-blue-400/40 bg-blue-500/15'
};

const MeetingPrep = ({ initialClientId }) => {
    const [selectedClientId, setSelectedClientId] = useState(initialClientId || '');
    const [clients, setClients] = useState([]);
    const [meetingType, setMeetingType] = useState('Annual Review');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedBrief, setGeneratedBrief] = useState(null);
    const [error, setError] = useState(null);
    const [apiSettingsOpen, setApiSettingsOpen] = useState(false);
    const [groqApiKey, setGroqApiKey] = useState(localStorage.getItem('jarvis_groq_key') || '');
    const [clientSections, setClientSections] = useState([]);
    const [latestParsedDoc, setLatestParsedDoc] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatError, setChatError] = useState(null);

    const apiBase = import.meta.env.VITE_API_BASE || '';
    const selectedClient = clients.find((c) => c.client_id === selectedClientId);

    useEffect(() => {
        if (initialClientId) setSelectedClientId(initialClientId);
    }, [initialClientId]);

    useEffect(() => {
        let ignore = false;
        const loadClients = async () => {
            try {
                const data = await fetchClients();
                if (!ignore) setClients(data);
            } catch (err) {
                console.warn('Failed to load clients', err.message);
            }
        };

        loadClients();
        return () => {
            ignore = true;
        };
    }, []);

    useEffect(() => {
        let ignore = false;

        const loadContext = async () => {
            if (!selectedClientId) {
                setClientSections([]);
                setLatestParsedDoc(null);
                setGeneratedBrief(null);
                setChatMessages([]);
                return;
            }

            try {
                const [sections, parsedDoc] = await Promise.all([
                    fetchClientData(selectedClientId),
                    fetchLatestParsedDoc(selectedClientId)
                ]);

                if (!ignore) {
                    setClientSections(sections || []);
                    setLatestParsedDoc(parsedDoc || null);
                }
            } catch (err) {
                console.warn('Failed to load context', err.message);
                if (!ignore) {
                    setClientSections([]);
                    setLatestParsedDoc(null);
                }
            }
        };

        loadContext();
        return () => {
            ignore = true;
        };
    }, [selectedClientId]);

    useEffect(() => {
        if (!selectedClient) {
            setChatMessages([]);
            return;
        }

        setChatMessages([
            {
                role: 'assistant',
                content: `Finance Copilot is ready for ${selectedClient.client_name}. Ask about risks, tax efficiency, cashflow, and meeting talking points.`
            }
        ]);
        setChatInput('');
        setChatError(null);
    }, [selectedClientId, selectedClient]);

    const handleSaveKey = () => {
        localStorage.setItem('jarvis_groq_key', groqApiKey);
        setApiSettingsOpen(false);
    };

    const callGroqChat = async ({ messages, temperature = 0.3, maxTokens = 1600 }) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const endpoints = [];

        if (apiBase) endpoints.push(`${apiBase}/api/groq`);
        endpoints.push('/api/groq');

        let response = null;
        let lastNetworkError = null;

        for (const endpoint of endpoints) {
            try {
                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(groqApiKey && groqApiKey.startsWith('gsk_') ? { 'x-groq-key': groqApiKey } : {})
                    },
                    signal: controller.signal,
                    body: JSON.stringify({
                        messages,
                        model: 'llama-3.3-70b-versatile',
                        temperature,
                        max_tokens: maxTokens
                    })
                });

                if (response) break;
            } catch (err) {
                lastNetworkError = err;
                if (err.name === 'AbortError') {
                    clearTimeout(timeoutId);
                    throw new Error('Request timed out after 30 seconds');
                }
            }
        }

        clearTimeout(timeoutId);

        if (!response) {
            if (lastNetworkError?.message?.includes('Failed to fetch')) {
                throw new Error('AI proxy is unreachable. Start `npm run server` or run `npm run dev:all`.');
            }
            throw lastNetworkError || new Error('Failed to connect to AI backend');
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`Groq API Error: ${response.status} - ${errData.error?.message || errData.error || 'Unknown Error'}`);
        }

        const data = await response.json();
        return data?.choices?.[0]?.message?.content || '';
    };

    const generateBriefWithAI = async (client) => {
        const systemPrompt = `
You are Jarvis, an elite AI assistant for UK financial advisors.
Role: Proactive, strategic, and data-driven advisor assistant.
You must output strictly VALID JSON matching the schema, with no markdown wrappers.
`;

        const userPrompt = `
CLIENT DATA:
${JSON.stringify(client, null, 2)}

MEETING CONTEXT:
Type: ${meetingType}
Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}

TASK:
Prepare a full meeting brief.

REQUIRED JSON OUTPUT STRUCTURE:
{
  "meetingDetails": { "date": "string", "location": "string", "type": "string" },
  "summary": "2 sentences on personality, context, and key themes",
  "financialSnapshot": { "netWorth": "string", "income": "string", "assets": "string", "liabilities": "string", "riskProfile": "string" },
  "goals": [{ "text": "goal description", "why": "strategic reason" }],
  "criticalItems": [{ "text": "item", "urgency": "Critical/High/Medium", "deadline": "date/timing", "reason": "impact" }],
  "opportunities": [{ "heading": "short title", "text": "details" }],
  "risks": [{ "heading": "short title", "text": "details" }],
  "talkingPoints": [{ "topic": "string", "script": "suggested phrasing" }],
  "emailTemplate": "Draft a professional follow-up email summarizing the meeting and actions."
}
`;

        let content = await callGroqChat({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            maxTokens: 4000
        });

        try {
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                content = content.substring(jsonStart, jsonEnd + 1);
            }
            return JSON.parse(content);
        } catch {
            throw new Error('Failed to parse AI response as JSON');
        }
    };

    const buildOfflineBrief = (client, sections = []) => {
        if (!client) return null;

        const sectionMap = sections.reduce((acc, item) => {
            acc[item.section_type] = item.data;
            return acc;
        }, {});

        const financial = sectionMap.financial_summary || {};
        const goals = sectionMap.goals || [];
        const risks = sectionMap.risks || [];
        const opportunities = sectionMap.opportunities || [];

        return {
            meetingDetails: { date: client.next_review_date || 'Upcoming', location: 'Office', type: meetingType },
            summary: sectionMap.personal_details?.text || `${client.client_name} client profile loaded from database.`,
            financialSnapshot: {
                netWorth: client.net_worth ? `£${Number(client.net_worth).toLocaleString()}` : 'N/A',
                income: client.combined_income ? `£${Number(client.combined_income).toLocaleString()}` : 'N/A',
                assets: financial.text || 'N/A',
                liabilities: 'N/A',
                riskProfile: 'N/A'
            },
            goals: goals.map((g) => ({ text: g, why: 'Client goal' })),
            criticalItems: risks.slice(0, 3).map((r) => ({ text: r, urgency: 'High', deadline: 'Review', reason: 'Risk noted' })),
            opportunities: opportunities.map((o) => ({ heading: 'Opportunity', text: o })),
            risks: risks.map((r) => ({ heading: 'Risk', text: r })),
            talkingPoints: [
                { topic: 'Opening', script: 'Let’s review your latest updates and priorities.' },
                { topic: 'Priorities', script: 'We can focus on urgent items and agreed next steps.' }
            ],
            emailTemplate: 'Thank you for the meeting. I will follow up with the action points discussed.'
        };
    };

    const handleGenerate = async () => {
        if (!selectedClientId || !selectedClient) return;

        setIsGenerating(true);
        setGeneratedBrief(null);
        setError(null);

        let sections = [];
        try {
            sections = await fetchClientData(selectedClientId);
            setClientSections(sections);
        } catch (err) {
            console.warn('Failed to fetch client data', err.message);
        }

        try {
            const brief = await generateBriefWithAI(selectedClient);
            setGeneratedBrief(brief);
        } catch (err) {
            setError(`AI Error: ${err.message}. Switching to Offline Mode.`);
            const offlineBrief = buildOfflineBrief(selectedClient, sections);
            if (offlineBrief) {
                setGeneratedBrief(offlineBrief);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleChatSend = async (seedPrompt) => {
        const prompt = (seedPrompt || chatInput).trim();
        if (!prompt || !selectedClient || isChatLoading) return;

        const userMessage = { role: 'user', content: prompt };
        const conversation = [...chatMessages, userMessage];

        setChatMessages(conversation);
        if (!seedPrompt) setChatInput('');
        setIsChatLoading(true);
        setChatError(null);

        const parsedDocSnippet = latestParsedDoc?.parsed_data
            ? JSON.stringify(latestParsedDoc.parsed_data).slice(0, 4000)
            : 'None';

        const systemPrompt = `
You are Jarvis Finance Copilot for advisor meeting prep.
Be finance-first and client-specific.
Give practical suggestions with reasons and expected impact.
Keep the answer concise and structured for advisor use.
`;

        const userPrompt = `
CLIENT PROFILE:
${JSON.stringify(selectedClient, null, 2)}

MEETING TYPE:
${meetingType}

GENERATED BRIEF:
${generatedBrief ? JSON.stringify(generatedBrief, null, 2) : 'Not generated yet'}

CLIENT SECTIONS:
${JSON.stringify(clientSections, null, 2)}

PARSED DOCUMENT SNIPPET:
${parsedDocSnippet}

QUESTION:
${prompt}
`;

        try {
            const reply = await callGroqChat({
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...conversation.slice(-8),
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.2,
                maxTokens: 1200
            });

            setChatMessages((prev) => [
                ...prev,
                { role: 'assistant', content: reply || 'I could not generate a useful response. Please try again.' }
            ]);
        } catch (err) {
            setChatError(err.message || 'Failed to get response from Jarvis chat.');
            setChatMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'I hit an error while processing that. Please try again.' }
            ]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const briefGoals = generatedBrief?.goals || [];
    const briefCritical = generatedBrief?.criticalItems || [];
    const briefOpportunities = generatedBrief?.opportunities || [];
    const briefRisks = generatedBrief?.risks || [];
    const briefTalkingPoints = generatedBrief?.talkingPoints || [];

    return (
        <div className={`${generatedBrief ? 'h-[calc(100vh-3.5rem)]' : 'h-[calc(100vh-3.5rem)]'} animate-fade-in relative flex flex-col`}>
            <div className="glass-panel p-4 lg:p-5 rounded-[32px] border-2 border-slate-700/70 h-full flex flex-col gap-4">
                <section className={`relative rounded-[24px] border-2 border-slate-700/80 bg-slate-900/45 overflow-hidden transition-all duration-300 ${generatedBrief ? 'p-3' : 'p-4 lg:p-5'}`}>
                    <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 0% 0%, #2563eb 0%, transparent 45%)' }}></div>

                    {/* Collapsed Header (when brief is generated) */}
                    {generatedBrief && (
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-600/90">
                                    <BrainCircuit className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">{selectedClient?.client_name} - {meetingType}</h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setGeneratedBrief(null)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/80 hover:bg-blue-500 text-white transition-colors"
                                >
                                    Change Client
                                </button>
                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-2 border border-blue-400/30"
                                    style={{
                                        color: '#ffffff',
                                        backgroundImage: 'linear-gradient(90deg, #1d4ed8 0%, #0f766e 100%)'
                                    }}
                                >
                                    <Zap className={`w-3 h-3 ${isGenerating ? 'animate-pulse' : ''}`} />
                                    {isGenerating ? 'Regenerating...' : 'Regenerate'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Expanded Header (when no brief yet) */}
                    {!generatedBrief && (
                        <div className="relative z-10 flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-blue-600/90">
                                        <BrainCircuit className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white flex items-center">
                                            Meeting Prep Workspace
                                            <SectionInfo text="Use this workspace to produce a structured prep pack before a meeting, including goals, risks, actions, and talking points." />
                                        </h2>
                                    </div>
                                </div>

                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                                <div className="lg:col-span-5">
                                    <label className="text-[11px] uppercase tracking-wider text-slate-400 mb-1 block">Client</label>
                                    <select
                                        value={selectedClientId}
                                        onChange={(e) => setSelectedClientId(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 focus:border-blue-500 outline-none"
                                    >
                                        <option value="">Select Client</option>
                                        {clients.map((client) => (
                                            <option key={client.client_id || client.id || client.client_name} value={client.client_id}>
                                                {client.client_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="lg:col-span-4">
                                    <label className="text-[11px] uppercase tracking-wider text-slate-400 mb-1 block">Meeting Type</label>
                                    <select
                                        value={meetingType}
                                        onChange={(e) => setMeetingType(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-100 focus:border-emerald-500 outline-none"
                                    >
                                        {MEETING_TYPES.map((type) => (
                                            <option key={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="lg:col-span-3">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!selectedClientId || isGenerating}
                                        className="w-full px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-blue-400/30 shadow-lg"
                                        style={{
                                            color: '#ffffff',
                                            backgroundImage: 'linear-gradient(90deg, #1d4ed8 0%, #0f766e 100%)'
                                        }}
                                    >
                                        <Zap className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                                        {isGenerating ? 'Generating...' : 'Generate Brief'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <CalendarDays className="w-4 h-4 text-blue-300" />
                                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                        </div>
                    )}
                </section>

                {apiSettingsOpen && (
                    <div className="absolute top-20 right-4 z-50 w-80 glass-panel p-4 shadow-2xl border border-blue-500/30">
                        <h4 className="text-sm font-bold text-white mb-2 flex items-center">
                            AI Configuration
                            <SectionInfo text="Optional browser-session API key override for Groq requests. If empty, the server-side key path is used." />
                        </h4>
                        <p className="text-xs text-slate-400 mb-3">Optional: provide a Groq API key for this browser session (otherwise the server key is used).</p>
                        <input
                            type="password"
                            value={groqApiKey}
                            onChange={(e) => setGroqApiKey(e.target.value)}
                            placeholder="gsk_..."
                            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white mb-3 focus:border-blue-500 outline-none"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setApiSettingsOpen(false)} className="text-xs px-3 py-2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                            <button onClick={handleSaveKey} className="text-xs px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white">Save Key</button>
                        </div>
                    </div>
                )}

                <section className="flex flex-col md:flex-row gap-5 flex-1 min-h-0">
                    <main className="flex-1 rounded-[24px] border-2 border-slate-700/80 bg-slate-900/40 p-7 overflow-y-auto custom-scrollbar space-y-5">
                        {error && (
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-300 shrink-0" />
                                <p className="text-sm text-red-100">{error}</p>
                            </div>
                        )}

                        {isGenerating && (
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map((n) => (
                                    <div key={`sk-${n}`} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 animate-pulse">
                                        <div className="h-3 bg-slate-800 rounded w-1/3 mb-3"></div>
                                        <div className="h-2 bg-slate-800 rounded w-full mb-2"></div>
                                        <div className="h-2 bg-slate-800 rounded w-5/6"></div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!generatedBrief && !isGenerating && (
                            <div className="h-full min-h-[500px] flex items-center justify-center text-center">
                                <div>
                                    <h3 className="text-3xl text-slate-400 font-semibold">client brief</h3>
                                    <p className="text-sm text-slate-500 mt-2">Generate a brief to load this panel.</p>
                                </div>
                            </div>
                        )}

                        {generatedBrief && !isGenerating && (
                            <>
                                <section className="rounded-xl border border-slate-700 bg-slate-900/55 p-7 border-l-4 border-l-blue-500">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{selectedClient?.client_name} Brief</h3>
                                            <p className="mt-1 text-sm text-slate-400 flex items-center gap-2">
                                                <Clock className="w-4 h-4" />
                                                {generatedBrief.meetingDetails?.date || 'Upcoming'} • {generatedBrief.meetingDetails?.type || meetingType}
                                            </p>
                                        </div>
                                        <span className="text-xs px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 text-emerald-200">
                                            Advisor Ready
                                        </span>
                                    </div>
                                    <p className="mt-4 text-sm text-slate-200 leading-7">{generatedBrief.summary}</p>
                                </section>

                                <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="rounded-xl border border-slate-700 bg-slate-900/55 p-6">
                                        <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-blue-300" /> Financial Snapshot
                                            <SectionInfo text="High-level financial baseline for opening the discussion and validating current position." />
                                        </h4>
                                        <ul className="space-y-2 text-sm">
                                            <li className="flex justify-between"><span className="text-slate-500">Net Worth</span><span className="text-white font-mono">{generatedBrief.financialSnapshot?.netWorth}</span></li>
                                            <li className="flex justify-between"><span className="text-slate-500">Income</span><span className="text-white font-mono">{generatedBrief.financialSnapshot?.income}</span></li>
                                            <li className="flex justify-between"><span className="text-slate-500">Risk Profile</span><span className="text-white">{generatedBrief.financialSnapshot?.riskProfile}</span></li>
                                            <li className="pt-2 border-t border-slate-800 text-xs text-slate-400">Assets: <span className="text-slate-300">{generatedBrief.financialSnapshot?.assets}</span></li>
                                        </ul>
                                    </div>

                                    <div className="rounded-xl border border-slate-700 bg-slate-900/55 p-6">
                                        <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-2">
                                            <Target className="w-4 h-4 text-emerald-300" /> Strategic Goals
                                            <SectionInfo text="Client objectives plus rationale, so meeting decisions stay aligned to long-term priorities." />
                                        </h4>
                                        <div className="space-y-3">
                                            {briefGoals.length ? briefGoals.map((goal, idx) => (
                                                <div key={`goal-${idx}-${goal.text}`} className="border-l-2 border-emerald-500/40 pl-3">
                                                    <p className="text-sm text-emerald-100 font-medium">{goal.text}</p>
                                                    <p className="text-xs text-emerald-300/70 mt-1">{goal.why}</p>
                                                </div>
                                            )) : <p className="text-xs text-slate-500">No goals extracted.</p>}
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-xl border border-slate-700 bg-slate-900/55 p-6">
                                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-2">
                                        <ShieldAlert className="w-4 h-4 text-amber-300" /> Priority Actions
                                        <SectionInfo text="Urgent or high-impact actions with timing and reasons to drive immediate follow-through." />
                                    </h4>
                                    <div className="space-y-2">
                                        {briefCritical.length ? briefCritical.map((item, idx) => {
                                            const urgency = item.urgency || 'Medium';
                                            return (
                                                <div key={`critical-${idx}-${item.text}`} className={`rounded-lg border p-4 ${PRIORITY_STYLES[urgency] || PRIORITY_STYLES.Medium}`}>
                                                    <div className="flex items-center justify-between gap-3">
                                                        <p className="text-sm font-semibold">{item.text}</p>
                                                        <span className="text-[10px] uppercase font-semibold">{urgency}</span>
                                                    </div>
                                                    <p className="text-xs mt-2 opacity-90">Deadline: {item.deadline || 'TBD'} • {item.reason || 'No reason provided'}</p>
                                                </div>
                                            );
                                        }) : <p className="text-xs text-slate-500">No critical actions identified.</p>}
                                    </div>
                                </section>

                                <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-6">
                                        <h4 className="text-xs uppercase tracking-wider font-bold text-blue-200 mb-3 flex items-center gap-2">
                                            <Lightbulb className="w-4 h-4" /> Opportunities
                                            <SectionInfo text="Potential improvements such as tax, allocation, or planning upgrades that can add value." />
                                        </h4>
                                        <div className="space-y-2">
                                            {briefOpportunities.length ? briefOpportunities.map((opp, idx) => (
                                                <div key={`opp-${idx}-${opp.heading}`} className="rounded-md p-3 bg-blue-500/10 border border-blue-500/20">
                                                    <p className="text-xs uppercase font-semibold text-blue-200">{opp.heading}</p>
                                                    <p className="text-sm text-slate-200 mt-1 leading-6">{opp.text}</p>
                                                </div>
                                            )) : <p className="text-xs text-slate-500">No opportunities identified.</p>}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
                                        <h4 className="text-xs uppercase tracking-wider font-bold text-red-200 mb-3 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> Risks
                                            <SectionInfo text="Key downside exposures and vulnerabilities that should be addressed in the meeting." />
                                        </h4>
                                        <div className="space-y-2">
                                            {briefRisks.length ? briefRisks.map((risk, idx) => (
                                                <div key={`risk-${idx}-${risk.heading}`} className="rounded-md p-3 bg-red-500/10 border border-red-500/20">
                                                    <p className="text-xs uppercase font-semibold text-red-200">{risk.heading}</p>
                                                    <p className="text-sm text-slate-200 mt-1 leading-6">{risk.text}</p>
                                                </div>
                                            )) : <p className="text-xs text-slate-500">No risks identified.</p>}
                                        </div>
                                    </div>
                                </section>

                                <section className="rounded-xl border border-slate-700 bg-slate-900/55 p-6">
                                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-purple-300" /> Talking Points
                                        <SectionInfo text="Suggested advisor phrasing and conversation prompts to structure a confident meeting flow." />
                                    </h4>
                                    <div className="space-y-3">
                                        {briefTalkingPoints.length ? briefTalkingPoints.map((point, idx) => (
                                            <div key={`talk-${idx}-${point.topic}`} className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                                                <p className="text-sm text-white font-semibold">{idx + 1}. {point.topic}</p>
                                                <p className="text-sm text-slate-300 mt-2 leading-6">"{point.script}"</p>
                                                <Mic className="w-3 h-3 text-slate-500 mt-2" />
                                            </div>
                                        )) : <p className="text-xs text-slate-500">No talking points available.</p>}
                                    </div>
                                </section>

                                <section className="rounded-xl border border-slate-700 bg-slate-900/55 p-6">
                                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-3 flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-emerald-300" /> Draft Follow-up Email
                                        <SectionInfo text="Post-meeting summary template to confirm decisions, owners, and next steps with the client." />
                                    </h4>
                                    <div className="bg-slate-950 rounded-lg border border-slate-800 p-4 text-sm text-slate-300 whitespace-pre-wrap leading-7">
                                        {generatedBrief.emailTemplate}
                                    </div>
                                    <div className="mt-4 flex gap-2 justify-end">
                                        <button className="px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2">
                                            <FileText className="w-3 h-3" /> Copy Email
                                        </button>
                                        <button className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2">
                                            <Mail className="w-3 h-3" /> Send Draft
                                        </button>
                                    </div>
                                </section>
                            </>
                        )}
                    </main>

                    <aside className="w-full md:w-[35%] min-h-0 rounded-[24px] border-2 border-slate-700/80 bg-slate-900/40 p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-emerald-300" />
                                <h4 className="text-sm font-bold text-slate-100">Finance Chatbot</h4>
                                <SectionInfo text="Context-aware copilot for client-specific finance questions during prep. Uses selected client + generated brief context." />
                            </div>
                            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">Client Context On</span>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                            {QUICK_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => handleChatSend(prompt)}
                                    disabled={!selectedClient || isChatLoading}
                                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 disabled:opacity-40"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-3">
                            {!selectedClient && (
                                <div className="text-xs text-slate-400 p-3 rounded-lg border border-slate-800 bg-slate-900/70">
                                    Select a client to use the chatbot.
                                </div>
                            )}

                            {chatMessages.map((msg, idx) => (
                                <div key={`msg-${idx}-${msg.role}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[92%] rounded-2xl px-4 py-3 border ${msg.role === 'user'
                                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-100 rounded-br-md'
                                        : 'bg-slate-900/80 border-slate-700 text-slate-100 rounded-bl-md'
                                        }`}>
                                        <p className="text-[11px] uppercase tracking-wider mb-1 opacity-70">{msg.role === 'user' ? 'You' : 'Jarvis'}</p>
                                        <p className="text-sm leading-6 whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))}

                            {isChatLoading && (
                                <div className="flex justify-start">
                                    <div className="max-w-[92%] rounded-2xl rounded-bl-md px-4 py-3 border bg-slate-900/80 border-slate-700 text-slate-300 animate-pulse">
                                        <p className="text-[11px] uppercase tracking-wider mb-1 opacity-70">Jarvis</p>
                                        <p className="text-sm">Thinking through finance recommendations...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {chatError && <p className="text-xs text-red-300 mt-2">{chatError}</p>}

                        <div className="mt-3 flex gap-2">
                            <input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleChatSend();
                                    }
                                }}
                                disabled={!selectedClient || isChatLoading}
                                placeholder={selectedClient ? 'Ask about this client\'s finances...' : 'Select a client first'}
                                className="flex-1 px-3 py-3 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:border-emerald-500 outline-none"
                            />
                            <button
                                onClick={() => handleChatSend()}
                                disabled={!selectedClient || !chatInput.trim() || isChatLoading}
                                className="px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <SendHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    </aside>
                </section>
            </div>
        </div>
    );
};

export default MeetingPrep;
