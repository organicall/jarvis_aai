import React, { useState } from 'react';
import { clients } from '../data/clients';
import { Search, Filter, MoreHorizontal, User, Phone, Mail, MapPin } from 'lucide-react';

const ClientList = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header & Controls */}
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
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 gap-4">
                {filteredClients.map((client) => (
                    <div key={client.id} className="glass-card flex items-center gap-6 group hover:bg-slate-800/40 transition-all cursor-pointer">
                        {/* Avatar / Initials */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600 group-hover:border-blue-500/50 transition-colors">
                            <span className="font-bold text-slate-300 group-hover:text-blue-400">
                                {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <div className="md:col-span-1">
                                <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{client.name}</h3>
                                <p className="text-xs text-slate-500">{client.id} • {client.status}</p>
                            </div>

                            <div className="hidden md:block">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Next Review</p>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                    <div className={`w-2 h-2 rounded-full ${new Date(client.nextReview) < new Date('2026-04-01') ? 'bg-orange-500' : 'bg-emerald-500'}`}></div>
                                    {client.nextReview}
                                </div>
                            </div>

                            <div className="hidden md:block">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Net Worth</p>
                                <p className="text-sm font-mono text-slate-300">£{(client.financials.netWorth / 1000).toLocaleString()}k</p>
                            </div>

                            <div className="md:col-span-1 flex justify-end">
                                {client.risks.some(r => r.type === 'critical') && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-full mr-4">
                                        Critical Action
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientList;
