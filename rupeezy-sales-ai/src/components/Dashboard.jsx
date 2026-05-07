import { useState } from 'react';
import LeadCard from './LeadCard';

export default function Dashboard({ leads, onDeleteLead }) {
    const [selectedLead, setSelectedLead] = useState(null);
    const [showHandoffModal, setShowHandoffModal] = useState(false);

    const totalContacted = leads.length;
    const totalQualified = leads.filter(lead => lead.status === 'Hot' || lead.status === 'Warm').length;
    const totalHot = leads.filter(lead => lead.status === 'Hot').length;

   
    const formatDuration = (seconds) => {
        if (!seconds && seconds !== 0) return '—';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (m === 0) return `${s}s`;
        return `${m}m ${s}s`;
    };

    
    const handleHandoff = () => {
        setShowHandoffModal(true);
    };

    
    const handleWhatsApp = () => {
        const message = encodeURIComponent(
            `Hi! Thanks for your interest in the Rupeezy Authorized Partner program. 🚀\n\n` +
            `Here's what you get:\n` +
            `✅ Zero joining fee\n` +
            `✅ 100% brokerage share\n` +
            `✅ Daily payouts via RISE Portal\n\n` +
            `Sign up here: https://rupeezy.in/partner-signup\n\n` +
            `Reply if you have any questions!`
        );
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    
    const handleLogNurture = () => {
        alert(`${selectedLead.name} has been logged for nurture campaign.\n\n(In production, this would add the lead to an automated email/WhatsApp drip sequence.)`);
    };

    const handleDeleteClick = () => {
        if (window.confirm(`Delete ${selectedLead.name} from the CRM?`)) {
            onDeleteLead(selectedLead.id);
            setSelectedLead(null);
        }
    };

   
    const renderActionButton = () => {
        if (!selectedLead) return null;

        switch (selectedLead.status) {
            case 'Hot':
                return (
                    <button
                        onClick={handleHandoff}
                        className="flex-1 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold rounded-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">transfer_within_a_station</span>
                        Transfer to RM
                    </button>
                );
            case 'Warm':
                return (
                    <button
                        onClick={handleWhatsApp}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#0f172a] font-bold rounded-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                        Send WhatsApp Link
                    </button>
                );
            case 'Cold':
            default:
                return (
                    <button
                        onClick={handleLogNurture}
                        className="flex-1 py-2.5 bg-[#37333e] hover:bg-[#4a4455] text-[#ccc3d8] border border-[#4a4455] font-bold rounded-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">schedule_send</span>
                        Log for Nurture
                    </button>
                );
        }
    };

    return (
        <main className="max-w-[1440px] mx-auto p-5 md:p-8 w-full h-full flex flex-col gap-6 overflow-hidden">

            <section className="bg-[#221e28] rounded-lg border border-[#4a4455] p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden shrink-0">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#7c3aed] rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>

                <div className="flex-1 text-center md:text-left z-10">
                    <h2 className="text-3xl font-semibold text-[#e8dfee] mb-1">Pipeline Overview</h2>
                    <p className="text-sm text-[#ccc3d8]">Real-time status of your active leads</p>
                </div>

                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto z-10">
                    <div className="flex-1 md:flex-none flex flex-col items-center p-2 md:px-6 bg-[#37333e] rounded-md border border-[#4a4455]">
                        <span className="text-[12px] font-bold tracking-widest text-[#ccc3d8] mb-1">CONTACTED</span>
                        <span className="text-2xl font-semibold text-[#e8dfee]">{totalContacted}</span>
                    </div>
                    <span className="material-symbols-outlined text-[#958da1]">chevron_right</span>

                    <div className="flex-1 md:flex-none flex flex-col items-center p-2 md:px-6 bg-[#37333e] rounded-md border border-[#4a4455]">
                        <span className="text-[12px] font-bold tracking-widest text-[#ccc3d8] mb-1">QUALIFIED</span>
                        <span className="text-2xl font-semibold text-[#e8dfee]">{totalQualified}</span>
                    </div>
                    <span className="material-symbols-outlined text-[#958da1]">chevron_right</span>

                    <div className="flex-1 md:flex-none flex flex-col items-center p-2 md:px-6 bg-[#37333e] rounded-md border border-[#d2bbff]/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[#7c3aed]/10"></div>
                        <span className="text-[12px] font-bold tracking-widest text-[#d2bbff] mb-1 relative z-10">HOT</span>
                        <span className="text-2xl font-semibold text-[#d2bbff] relative z-10">{totalHot}</span>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-hidden">

                <div className="lg:col-span-5 flex flex-col h-full min-h-0">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                        <h3 className="text-2xl font-semibold text-[#e8dfee]">Priority Leads</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4a4455 transparent' }}>
                        {leads.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
                                <span className="material-symbols-outlined text-[48px] mb-3 text-[#958da1]">person_search</span>
                                <p className="text-[#ccc3d8] text-sm">No leads yet. Start a call to generate your first lead.</p>
                            </div>
                        )}
                        {leads.map(lead => (
                            <div
                                key={lead.id}
                                onClick={() => setSelectedLead(lead)}
                                className={`cursor-pointer transition-all duration-200 hover:-translate-y-1 rounded-xl ${selectedLead?.id === lead.id ? 'ring-2 ring-[#7c3aed] shadow-[0_0_15px_rgba(124,58,237,0.3)]' : ''}`}
                            >
                                <LeadCard lead={lead} />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hidden lg:block lg:col-span-7 h-full min-h-0">
                    {selectedLead ? (
                        <div className="bg-[#221e28] rounded-lg border border-[#4a4455] h-full flex flex-col p-6 overflow-hidden relative">

                            {/* Header */}
                            <div className="flex justify-between items-start border-b border-[#3c3742] pb-4 mb-4 shrink-0">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">{selectedLead.name}</h2>
                                    <div className="flex items-center gap-3 text-sm text-[#958da1]">
                                        <span>{selectedLead.role}</span>
                                        {selectedLead.duration !== undefined && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">timer</span>
                                                    {formatDuration(selectedLead.duration)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="bg-[#37333e] px-4 py-1.5 rounded-full text-sm font-bold border border-[#4a4455]">
                                        Score: {selectedLead.score}
                                    </span>
                                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider ${
                                        selectedLead.status === 'Hot' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                        selectedLead.status === 'Warm' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    }`}>
                                        {selectedLead.status}
                                    </span>
                                </div>
                            </div>

                            {/* Scrollable content */}
                            <div className="flex-1 overflow-y-auto pr-4 space-y-6 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4a4455 transparent' }}>

                                {/* AI Analysis + Action */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-[#1a1721] p-4 rounded-xl border border-[#3c3742]">
                                        <h4 className="text-[11px] font-bold text-[#958da1] uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">psychology</span>
                                            AI Analysis
                                        </h4>
                                        <p className="text-sm text-[#e8dfee] leading-relaxed">{selectedLead.reason}</p>
                                    </div>

                                    <div className="bg-[#1a1721] p-5 rounded-xl border border-[#3c3742] flex flex-col justify-between">
                                        <div>
                                            <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">bolt</span>
                                                Suggested Action
                                            </h4>
                                            <p className="text-sm text-[#e8dfee] leading-relaxed mb-4">{selectedLead.nextAction}</p>
                                        </div>

                                        <div className="flex gap-3">
                                            {renderActionButton()}
                                            <button
                                                onClick={handleDeleteClick}
                                                className="px-4 py-2.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500 hover:text-white text-red-400 font-bold rounded-lg transition-all transform active:scale-95 flex items-center justify-center"
                                                title="Delete Lead"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Key Objections Raised */}
                                {selectedLead.keyObjections && selectedLead.keyObjections.length > 0 && (
                                    <div className="bg-[#1a1721] p-4 rounded-xl border border-amber-500/20">
                                        <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">warning</span>
                                            Objections Raised
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedLead.keyObjections.map((objection, idx) => (
                                                <span key={idx} className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[13px] px-3 py-1.5 rounded-lg">
                                                    {objection}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Full Transcript */}
                                <div>
                                    <h4 className="text-[11px] font-bold text-[#958da1] uppercase tracking-widest mb-3 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">forum</span>
                                        Full Call Transcript
                                    </h4>
                                    <div className="bg-[#15121b] border border-[#3c3742] rounded-xl p-4 space-y-4">
                                        {selectedLead.transcript && selectedLead.transcript.map((msg, idx) => {
                                            const isAI = msg.role === 'ai' || msg.role === 'Rep';
                                            const displayName = isAI ? 'Rupeezy AI' : 'Caller';
                                            return (
                                                <div key={idx} className={`flex flex-col w-4/5 ${isAI ? 'items-start self-start' : 'items-end self-end ml-auto'}`}>
                                                    <span className="text-[10px] text-[#958da1] mb-1 px-1">{displayName}</span>
                                                    <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-md ${
                                                        isAI
                                                        ? 'bg-[#37333e] text-[#e8dfee] rounded-tl-none'
                                                        : 'bg-[#7c3aed] text-white rounded-tr-none'
                                                    }`}>
                                                        {msg.text}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#221e28] rounded-lg border border-[#4a4455] h-full flex flex-col items-center justify-center p-12 text-center relative overflow-hidden">
                            <span className="material-symbols-outlined text-[64px] text-[#3c3742] mb-4">analytics</span>
                            <h3 className="text-2xl font-semibold text-[#e8dfee] mb-2">Select a lead to view full analytics</h3>
                            <p className="text-base text-[#ccc3d8] max-w-md">Detailed transcripts, AI reasoning, and suggested next steps will appear here.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ── RM Handoff Modal ── */}
            {showHandoffModal && selectedLead && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowHandoffModal(false)}>
                    <div className="bg-[#1a1721] border border-[#4a4455] rounded-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="bg-red-500/10 border-b border-red-500/20 p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-red-400">transfer_within_a_station</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">RM Handoff — Hot Lead</h3>
                                        <p className="text-sm text-red-300">Ready for human Relationship Manager</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowHandoffModal(false)} className="text-[#958da1] hover:text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body — What the RM sees */}
                        <div className="p-6 space-y-5">

                            {/* Lead Summary */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xl font-bold text-white">{selectedLead.name}</h4>
                                    <p className="text-sm text-[#958da1]">{selectedLead.role} • {selectedLead.callTime ? new Date(selectedLead.callTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Just now'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-sm font-bold">🔥 HOT</span>
                                    <span className="bg-[#37333e] px-3 py-1 rounded-full text-sm font-bold border border-[#4a4455] text-[#e8dfee]">Score: {selectedLead.score}</span>
                                </div>
                            </div>

                            {/* Duration */}
                            {selectedLead.duration !== undefined && (
                                <div className="flex items-center gap-2 text-sm text-[#ccc3d8]">
                                    <span className="material-symbols-outlined text-[16px]">timer</span>
                                    Call Duration: {formatDuration(selectedLead.duration)}
                                </div>
                            )}

                            {/* AI Summary for RM */}
                            <div className="bg-[#221e28] p-4 rounded-xl border border-[#3c3742]">
                                <h5 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-2">📋 Call Summary (for RM)</h5>
                                <p className="text-sm text-[#e8dfee] leading-relaxed">{selectedLead.reason}</p>
                            </div>

                            {/* Objections */}
                            {selectedLead.keyObjections && selectedLead.keyObjections.length > 0 && (
                                <div className="bg-[#221e28] p-4 rounded-xl border border-amber-500/20">
                                    <h5 className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-2">⚠️ Objections Raised & Addressed</h5>
                                    <ul className="space-y-1">
                                        {selectedLead.keyObjections.map((obj, i) => (
                                            <li key={i} className="text-sm text-amber-200 flex items-start gap-2">
                                                <span className="text-amber-500 mt-0.5">•</span>
                                                {obj}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Suggested Next Step */}
                            <div className="bg-[#7c3aed]/10 p-4 rounded-xl border border-[#d2bbff]/20">
                                <h5 className="text-[11px] font-bold text-[#d2bbff] uppercase tracking-widest mb-2">🎯 Recommended Next Step</h5>
                                <p className="text-sm text-[#e8dfee]">{selectedLead.nextAction}</p>
                            </div>

                            {/* Transcript Preview */}
                            <div>
                                <h5 className="text-[11px] font-bold text-[#958da1] uppercase tracking-widest mb-2">💬 Key Conversation Moments</h5>
                                <div className="bg-[#15121b] border border-[#3c3742] rounded-xl p-3 max-h-40 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4a4455 transparent' }}>
                                    {selectedLead.transcript && selectedLead.transcript.map((msg, idx) => {
                                        const isAI = msg.role === 'ai' || msg.role === 'Rep';
                                        return (
                                            <p key={idx} className="text-[13px] leading-relaxed">
                                                <span className={`font-semibold ${isAI ? 'text-[#d2bbff]' : 'text-emerald-400'}`}>
                                                    {isAI ? 'AI' : 'Lead'}:
                                                </span>{' '}
                                                <span className="text-[#ccc3d8]">{msg.text}</span>
                                            </p>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* RM Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowHandoffModal(false);
                                        alert('Lead has been assigned to RM queue.\n\n(In production: RM receives push notification + full context in their CRM dashboard.)');
                                    }}
                                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-[#0f172a] font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                    Assign to RM
                                </button>
                                <button
                                    onClick={() => {
                                        const message = encodeURIComponent(
                                            `Hi! Following up on our conversation about the Rupeezy Partner Program.\n\n` +
                                            `Quick recap:\n✅ Zero joining fee\n✅ 100% brokerage share\n✅ Daily payouts\n\n` +
                                            `Ready to get started? Sign up here: https://rupeezy.in/partner-signup`
                                        );
                                        window.open(`https://wa.me/?text=${message}`, '_blank');
                                    }}
                                    className="py-3 px-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">chat</span>
                                    WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}