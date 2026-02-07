import React, { useState, useEffect } from 'react';
import { fetchClients, fetchClientData, fetchLatestParsedDoc } from '../lib/db';
import {
    Users,
    Target,
    AlertTriangle,
    Lightbulb,
    TrendingUp,
    MessageSquare,
    CheckSquare,
    FileText,
    Mail,
    Clock,
    Zap,
    Settings,
    BrainCircuit,
    Mic,
    SendHorizontal
} from 'lucide-react';

const MeetingPrep = ({ initialClientId }) => {
    const [selectedClientId, setSelectedClientId] = useState(initialClientId || '');

    useEffect(() => {
        if (initialClientId) setSelectedClientId(initialClientId);
    }, [initialClientId]);
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

    const selectedClient = clients.find(c => c.client_id === selectedClientId);

    useEffect(() => {
        let ignore = false;

        const loadClientContext = async () => {
            if (!selectedClientId) {
                setClientSections([]);
                setLatestParsedDoc(null);
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
                console.warn('Failed to load client context', err.message);
                if (!ignore) {
                    setClientSections([]);
                    setLatestParsedDoc(null);
                }
            }
        };

        loadClientContext();
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
                content: `I am ready to help with ${selectedClient.client_name}. Ask me anything about their financial plan, risks, opportunities, or meeting strategy.`
            }
        ]);
        setChatError(null);
        setChatInput('');
    }, [selectedClientId, selectedClient]);

    const handleGenerate = async () => {
        if (!selectedClientId) return;

        setIsGenerating(true);
        setGeneratedBrief(null);
        setError(null);

        let fallbackSections = [];
        try {
            if (selectedClientId) {
                fallbackSections = await fetchClientData(selectedClientId);
                setClientSections(fallbackSections);
            }
        } catch (err) {
            console.warn('Failed to fetch client data', err.message);
        }

        try {
            const brief = await generateBriefWithAI(selectedClient);
            setGeneratedBrief(brief);
        } catch (error) {
            console.error("AI Generation Failed:", error);

            // Set visible error
            setError(`AI Error: ${error.message}. Switching to Offline Mode.`);

            // FORCE FALLBACK
            const mockData = buildOfflineBrief(selectedClient, fallbackSections);
            console.log("Fallback Data Generated:", mockData);

            if (mockData) {
                setGeneratedBrief(mockData);
            } else {
                setError("Optimization Failed: No offline data available for this client.");
            }
        } finally {
            setIsGenerating(false);
        }
    };

    // Auto-scroll to brief when generated
    useEffect(() => {
        if (generatedBrief) {
            const element = document.getElementById('brief-container');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [generatedBrief]);

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
                        model: "llama-3.3-70b-versatile",
                        temperature,
                        max_tokens: maxTokens
                    })
                });

                if (response) break;
            } catch (error) {
                lastNetworkError = error;
                if (error.name === 'AbortError') {
                    clearTimeout(timeoutId);
                    throw new Error('Request timed out after 30 seconds');
                }
            }
        }
        clearTimeout(timeoutId);

        if (!response) {
            if (lastNetworkError?.message?.includes('Failed to fetch')) {
                throw new Error('AI proxy is unreachable. Start the backend proxy (`npm run server`) or run both services with `npm run dev:all`.');
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

    // --- Real AI Generator (Groq) ---
    const generateBriefWithAI = async (client) => {
        console.log("Using API Base:", apiBase);

        // JARVIS WORKFLOW System Prompt
        const systemPrompt = `
        You are Jarvis, an elite AI assistant for UK financial advisors.
        Role: Proactive, strategic, and data-driven advisor assistant.
        capabilities: 1. Investment analysis 2. Meeting prep 3. Compliance.
        
        You must output your response in strictly VALID JSON format matching the schema requested by the user. 
        Do not include markdown formatting (like \`\`\`json) or any conversational text outside the JSON object.
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
            "financialSnapshot": { 
                "netWorth": "string", 
                "income": "string", 
                "assets": "string", 
                "liabilities": "string", 
                "riskProfile": "string" 
            },
            "goals": [{ "text": "goal description", "why": "strategic reason" }],
            "criticalItems": [{ "text": "item", "urgency": "Critical/High/Medium", "deadline": "date/timing", "reason": "impact" }],
            "opportunities": [{ "heading": "short title", "text": "details (e.g. tax saving)" }],
            "risks": [{ "heading": "short title", "text": "details (e.g. protection gap)" }],
            "talkingPoints": [{ "topic": "string", "script": "suggested phrasing" }],
            "emailTemplate": "Draft a professional follow-up email summarizing the meeting and actions."
        }
        `;

        console.log("Attempting Groq API Call via Proxy...");
        let content = await callGroqChat({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.3,
            maxTokens: 4000
        });

        // Clean potential markdown code blocks
        try {
            const jsonStart = content.indexOf('{');
            const jsonEnd = content.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                content = content.substring(jsonStart, jsonEnd + 1);
            }
            return JSON.parse(content);
        } catch (e) {
            console.error("JSON Parsing Error on content:", content);
            throw new Error("Failed to parse AI response as JSON");
        }
    };

    const handleChatSend = async () => {
        const prompt = chatInput.trim();
        if (!prompt || !selectedClient || isChatLoading) return;

        const userMessage = { role: 'user', content: prompt };
        const nextMessages = [...chatMessages, userMessage];
        setChatMessages(nextMessages);
        setChatInput('');
        setChatError(null);
        setIsChatLoading(true);

        const recentConversation = nextMessages.slice(-8).map((msg) => ({
            role: msg.role,
            content: msg.content
        }));
        const parsedDocSnippet = latestParsedDoc?.parsed_data
            ? JSON.stringify(latestParsedDoc.parsed_data).slice(0, 4000)
            : 'None';

        const systemPrompt = `
        You are Jarvis Finance Copilot for advisor meeting prep.
        Priorities:
        1. Use only provided client context. If missing data, state what is missing.
        2. Be finance-first: tax efficiency, cashflow, risk, protection, goals, diversification, retirement readiness.
        3. Give practical suggestions with reasons and expected impact.
        4. Keep answers concise and advisor-ready.
        5. End with 2-4 concrete next-step bullets when relevant.
        `;

        const userPrompt = `
        CLIENT PROFILE:
        ${JSON.stringify(selectedClient, null, 2)}

        MEETING TYPE:
        ${meetingType}

        GENERATED BRIEF (if available):
        ${generatedBrief ? JSON.stringify(generatedBrief, null, 2) : 'Not generated yet'}

        CLIENT SECTIONS:
        ${JSON.stringify(clientSections, null, 2)}

        LATEST PARSED DOCUMENT SNIPPET:
        ${parsedDocSnippet}

        USER QUESTION:
        ${prompt}
        `;

        try {
            const assistantReply = await callGroqChat({
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...recentConversation,
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.2,
                maxTokens: 1200
            });

            setChatMessages((prev) => [
                ...prev,
                { role: 'assistant', content: assistantReply || 'I could not generate a useful response. Please try rephrasing your question.' }
            ]);
        } catch (err) {
            console.error('Chat request failed', err);
            setChatError(err.message || 'Failed to get response from Jarvis chat.');
            setChatMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'I hit an error while processing that. Please try again.' }
            ]);
        } finally {
            setIsChatLoading(false);
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

    return (
        <div className="space-y-6 h-full flex flex-col animate-fade-in relative">

            {/* Header / Toolbar */}
            <div className="flex justify-between items-center glass-panel p-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <BrainCircuit className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Meeting Preparation & Intelligence</h2>
                        <p className="text-xs text-slate-400">Powered by Jarvis AI (Groq)</p>
                    </div>
                </div>

                <button
                    onClick={() => setApiSettingsOpen(!apiSettingsOpen)}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                    title="AI Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            {/* API Key Modal (Simulated) */}
            {apiSettingsOpen && (
                <div className="absolute top-20 right-4 z-50 w-80 glass-panel p-4 shadow-2xl border border-blue-500/30">
                    <h4 className="text-sm font-bold text-white mb-2">AI Configuration</h4>
                    <p className="text-xs text-slate-400 mb-3">Optional: provide a Groq API key for this browser session (otherwise the server key is used).</p>
                    <input
                        type="password"
                        value={groqApiKey}
                        onChange={(e) => setGroqApiKey(e.target.value)}
                        placeholder="gsk_..."
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-white mb-3 focus:border-blue-500 outline-none"
                    />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setApiSettingsOpen(false)} className="text-xs text-slate-400 hover:text-white px-3 py-1">Cancel</button>
                        <button onClick={handleSaveKey} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded">Save Key</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">

                {/* Left Sidebar: Controls */}
                <div className="lg:col-span-3 lg:col-span-4 flex flex-col gap-4">
                    {/* Client Selection */}
                    <div className="glass-panel p-6 space-y-4">
                        <label className="block text-sm font-medium text-slate-300">Select Client</label>
                        <div className="space-y-2">
                            {clients.map(c => (
                                <button
                                    key={c.client_id || c.id || c.client_name}
                                    onClick={() => setSelectedClientId(c.client_id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${selectedClientId === c.client_id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                                        {c.client_name.split(' ')[0][0]}{c.client_name.split(' ')[1]?.[0]}
                                    </div>
                                    <span className="text-sm font-medium truncate">{c.client_name}</span>
                                </button>
                            ))}
                        </div>

                        <label className="block text-sm font-medium text-slate-300 mt-4">Meeting Type</label>
                        <select
                            value={meetingType}
                            onChange={(e) => setMeetingType(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:border-blue-500 outline-none"
                        >
                            <option>Annual Review</option>
                            <option>Initial Onboarding</option>
                            <option>Ad-hoc / Urgent</option>
                            <option>Pre-Retirement Planning</option>
                        </select>

                        <button
                            onClick={handleGenerate}
                            disabled={!selectedClientId || isGenerating}
                            className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4 text-white shadow-lg"
                            style={{
                                backgroundImage: !selectedClientId
                                    ? 'none'
                                    : 'linear-gradient(to right, #2563eb, #9333ea)',
                                backgroundColor: !selectedClientId ? '#1e293b' : 'transparent',
                                cursor: !selectedClientId ? 'not-allowed' : isGenerating ? 'wait' : 'pointer',
                                opacity: !selectedClientId ? 0.5 : isGenerating ? 0.7 : 1
                            }}
                        >
                            {isGenerating ? (
                                <>
                                    <Zap className="w-5 h-5 animate-pulse" />
                                    Analyzing with Jarvis...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-5 h-5" />
                                    Generate Brief
                                </>
                            )}
                        </button>
                    </div>

                    {/* Tip Box */}
                    <div className="glass-panel p-4 bg-blue-500/5 border-blue-500/20">
                        <div className="flex gap-3">
                            <Lightbulb className="w-5 h-5 text-blue-400 shrink-0" />
                            <div>
                                <p className="text-xs text-blue-200 font-medium mb-1">Pro Tip</p>
                                <p className="text-[10px] text-blue-300/80 leading-relaxed">
                                    Jarvis analyzes recent transactions, emails, and market changes to proactively suggest discussion points.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Finance Chatbot */}
                    <div className="glass-panel p-4 flex flex-col min-h-[360px] max-h-[460px]">
                        <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-sm font-bold text-slate-200">Client Chat (Finance Copilot)</h4>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                            {!selectedClient && (
                                <div className="text-xs text-slate-500 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                                    Select a client to start chatting.
                                </div>
                            )}

                            {selectedClient && chatMessages.map((msg, idx) => (
                                <div
                                    key={`${msg.role}-${idx}`}
                                    className={`rounded-lg px-3 py-2 text-xs leading-relaxed border ${msg.role === 'user'
                                        ? 'bg-blue-600/15 border-blue-500/30 text-blue-100 ml-8'
                                        : 'bg-slate-900/70 border-slate-800 text-slate-200 mr-3'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            ))}

                            {isChatLoading && (
                                <div className="rounded-lg px-3 py-2 text-xs border bg-slate-900/70 border-slate-800 text-slate-400 mr-3 animate-pulse">
                                    Jarvis is thinking...
                                </div>
                            )}
                        </div>

                        {chatError && (
                            <p className="text-[11px] text-red-300 mt-2">{chatError}</p>
                        )}

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
                                placeholder={selectedClient ? 'Ask about risks, investments, tax moves...' : 'Select a client first'}
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 outline-none disabled:opacity-50"
                            />
                            <button
                                onClick={handleChatSend}
                                disabled={!selectedClient || !chatInput.trim() || isChatLoading}
                                className="px-3 py-2 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <SendHorizontal className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Content: Brief Display */}
                <div className="lg:col-span-9 lg:col-span-8 overflow-y-auto custom-scrollbar">

                    {error && (
                        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-fade-in">
                            <AlertTriangle className="text-red-400 w-5 h-5 shrink-0" />
                            <p className="text-sm text-red-200">{error}</p>
                        </div>
                    )}

                    {!generatedBrief && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                            <BrainCircuit className="w-16 h-16 opacity-20" />
                            <p className="text-sm">Select a client and click "Generate Brief" to start.</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center space-y-6">
                            <div className="relative w-24 h-24">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                                <BrainCircuit className="absolute inset-0 m-auto text-blue-500 w-8 h-8 animate-pulse" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-medium text-white">Analyzing Client Profile...</h3>
                                <p className="text-sm text-slate-400">Checking for identifying protection gaps, excessive cash, and recent life events.</p>
                            </div>
                        </div>
                    )}

                    {generatedBrief && !isGenerating && (
                        <div id="brief-container" className="space-y-6 animate-fade-in-up pb-10">

                            {/* Brief Header */}
                            <div className="glass-panel p-6 border-l-4 border-l-blue-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">Meeting Brief: {selectedClient?.client_name}</h3>
                                        <p className="text-sm text-slate-400 flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            {generatedBrief.meetingDetails.date} • {generatedBrief.meetingDetails.type}
                                        </p>
                                    </div>
                                    <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20 font-mono">
                                        AI Confidence: 98%
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-700/50">
                                    <p className="text-sm text-slate-300 leading-relaxed italic">
                                        "{generatedBrief.summary}"
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Financial Snapshot */}
                                <div className="glass-panel p-4">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> Financial Snapshot
                                    </h4>
                                    <ul className="space-y-2 text-sm">
                                        <li className="flex justify-between"><span className="text-slate-500">Net Worth</span> <span className="text-white font-mono">{generatedBrief.financialSnapshot.netWorth}</span></li>
                                        <li className="flex justify-between"><span className="text-slate-500">Income</span> <span className="text-white font-mono">{generatedBrief.financialSnapshot.income}</span></li>
                                        <li className="flex justify-between"><span className="text-slate-500">Risk Profile</span> <span className="text-white">{generatedBrief.financialSnapshot.riskProfile}</span></li>
                                        <li className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400">
                                            <span className="block mb-1">Key Assets:</span>
                                            <span className="text-slate-300">{generatedBrief.financialSnapshot.assets}</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Goals */}
                                <div className="glass-panel p-4">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Target className="w-4 h-4" /> Strategic Goals
                                    </h4>
                                    <div className="space-y-3">
                                        {generatedBrief.goals.map((goal, idx) => (
                                            <div key={idx} className="relative pl-3 border-l-2 border-emerald-500/30">
                                                <p className="text-sm font-medium text-emerald-100">{goal.text}</p>
                                                <p className="text-[10px] text-emerald-400/60 mt-0.5">{goal.why}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Critical & Risks Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="glass-panel p-5 bg-red-500/5 border-red-500/20">
                                    <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Critical Actions
                                    </h4>
                                    <div className="space-y-3">
                                        {generatedBrief.criticalItems.map((item, idx) => (
                                            <div key={idx} className="flex gap-3 items-start bg-red-500/10 p-3 rounded-lg border border-red-500/10">
                                                <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                                                <div>
                                                    <p className="text-sm font-bold text-red-100">{item.text}</p>
                                                    <div className="flex gap-2 mt-1">
                                                        <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded uppercase">{item.deadline}</span>
                                                        <span className="text-[10px] text-red-400/70">{item.reason}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="glass-panel p-5 bg-blue-500/5 border-blue-500/20">
                                    <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Lightbulb className="w-4 h-4" /> Opportunities
                                    </h4>
                                    <div className="space-y-3">
                                        {generatedBrief.opportunities.map((opp, idx) => (
                                            <div key={idx} className="flex gap-3 items-start p-2 hover:bg-white/5 rounded-lg transition-colors">
                                                <div className="p-1.5 bg-blue-500/20 rounded-md text-blue-400">
                                                    <Zap className="w-3 h-3" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-blue-300 uppercase">{opp.heading}</p>
                                                    <p className="text-sm text-slate-200">{opp.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Talking Points & Scripts */}
                            <div className="glass-panel p-6">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> AI Talking Points
                                </h4>
                                <div className="space-y-6">
                                    {generatedBrief.talkingPoints.map((point, idx) => (
                                        <div key={idx} className="group">
                                            <h5 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">{idx + 1}</span>
                                                {point.topic}
                                            </h5>
                                            <div className="ml-8 p-4 bg-slate-800/50 rounded-xl rounded-tl-none border border-slate-700/50 relative">
                                                <Mic className="absolute right-3 top-3 w-4 h-4 text-slate-600" />
                                                <p className="text-sm text-slate-300 leading-relaxed font-medium">"{point.script}"</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Follow Up Email */}
                            <div className="glass-panel p-6 border border-slate-700/50">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> Draft Follow-Up Email
                                </h4>
                                <div className="bg-slate-950 p-6 rounded-xl font-mono text-xs text-slate-400 leading-relaxed border border-slate-800 whitespace-pre-wrap">
                                    {generatedBrief.emailTemplate}
                                </div>
                                <div className="mt-4 flex gap-3 justify-end">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors">
                                        <FileText className="w-3 h-3" /> Copy Text
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors">
                                        <Mail className="w-3 h-3" /> Send Drafting
                                    </button>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MeetingPrep;
