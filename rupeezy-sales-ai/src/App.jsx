import { useState, useEffect } from 'react';
import VoiceInterface from './components/VoiceInterface';
import Dashboard from './components/Dashboard';

const STORAGE_KEY = 'rupeezy_leads';

function loadLeads() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

export default function App() {
    const [activeTab, setActiveTab] = useState('live');
    const [leads, setLeads] = useState(loadLeads);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    }, [leads]);

    const handleCallEnd = (newLead) => {
        setLeads(prevLeads => [newLead, ...prevLeads]);
        setActiveTab('dashboard');
    };

    const handleDeleteLead = (leadId) => {
        setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
    };

    return (
        <div className="bg-[#15121b] text-[#e8dfee] h-screen overflow-hidden flex flex-col font-sans">
            <nav className="flex justify-between items-center px-8 h-16 w-full sticky top-0 z-50 bg-[#0B0F19] border-b border-slate-800">
                <div className="flex items-center gap-12">
                    <span className="text-xl font-bold tracking-tight text-slate-50">Rupeezy AI</span>
                    <div className="hidden md:flex gap-6 items-end h-full">
                        <button
                            onClick={() => setActiveTab('live')}
                            className={`text-sm font-medium pb-4 mt-4 transition-colors duration-200 ${activeTab === 'live' ? 'text-violet-500 border-b-2 border-violet-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
                        >
                            Live Call
                        </button>
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`text-sm font-medium pb-4 mt-4 transition-colors duration-200 ${activeTab === 'dashboard' ? 'text-violet-500 border-b-2 border-violet-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
                        >
                            Dashboard
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 hidden sm:inline">Creator</span>
                    <div className="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-sm font-bold ml-2">R</div>
                </div>
            </nav>

            <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'live' ? (
                    <VoiceInterface onCallEnd={handleCallEnd} leadHistory={leads} />
                ) : (
                    <Dashboard leads={leads} onDeleteLead={handleDeleteLead} />
                )}
            </div>
        </div>
    );
}