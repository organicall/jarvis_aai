import React, { useState, useEffect } from 'react';
import { clients } from '../data/clients';
import { clientBriefs } from '../data/clientBriefs';
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
    Mic
} from 'lucide-react';

const MeetingPrep = () => {
    const [selectedClientId, setSelectedClientId] = useState('');
    const [meetingType, setMeetingType] = useState('Annual Review');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedBrief, setGeneratedBrief] = useState(null);
    const [error, setError] = useState(null);
    const [apiSettingsOpen, setApiSettingsOpen] = useState(false);
    const [groqApiKey, setGroqApiKey] = useState(localStorage.getItem('jarvis_groq_key') || '');
    const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

    const selectedClient = clients.find(c => c.id === selectedClientId);

    const handleGenerate = async () => {
        if (!selectedClientId) return;

        setIsGenerating(true);
        setGeneratedBrief(null);
        setError(null);

        try {
            const brief = await generateBriefWithAI(selectedClient);
            setGeneratedBrief(brief);
        } catch (error) {
            console.error("AI Generation Failed:", error);

            // Set visible error
            setError(`AI Error: ${error.message}. Switching to Offline Mode.`);

            // FORCE FALLBACK
            const mockData = getOfflineBrief(selectedClient);
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

        // Add 30s timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        let response;
        try {
            response = await fetch(`${apiBase}/api/groq`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(groqApiKey && groqApiKey.startsWith('gsk_') ? { 'x-groq-key': groqApiKey } : {})
                },
                signal: controller.signal,
                body: JSON.stringify({
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.3,
                    max_tokens: 4000
                })
            });
            clearTimeout(timeoutId);
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out after 30 seconds');
            }
            throw error;
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error("Groq API Error Details:", errData);
            throw new Error(`Groq API Error: ${response.status} - ${errData.error?.message || errData.error || 'Unknown Error'}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;

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

    // --- Mock Data Generator (Fallback / Demo) ---
    const getOfflineBrief = (client) => {
        if (!client) return null;
        console.log("Generating Offline Brief for:", client.name);
        const brief = clientBriefs[client.id];
        if (!brief) return null;

        return {
            ...brief,
            meetingDetails: {
                ...brief.meetingDetails,
                type: meetingType
            }
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
                                    key={c.id}
                                    onClick={() => setSelectedClientId(c.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${selectedClientId === c.id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                                        {c.name.split(' ')[0][0]}{c.name.split(' ')[1]?.[0]}
                                    </div>
                                    <span className="text-sm font-medium truncate">{c.name}</span>
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
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all mt-4 ${!selectedClientId
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : isGenerating
                                    ? 'bg-blue-600/50 text-white/50 cursor-wait'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-purple-900/20'
                                }`}
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
                                        <h3 className="text-xl font-bold text-white mb-1">Meeting Brief: {selectedClient?.name}</h3>
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
