import { useState } from 'react';

export default function LeadCard({ lead }) {
    const [isExpanded, setIsExpanded] = useState(false);

    
    const getStatusStyles = (status) => {
        switch (status) {
            case 'Hot':
                return { bg: 'bg-[#93000a]/20', border: 'border-[#93000a]/30', dot: 'bg-[#ffb4ab]', text: 'text-[#ffb4ab]' };
            case 'Warm':
                return { bg: 'bg-[#a15100]/20', border: 'border-[#a15100]/30', dot: 'bg-[#ffb784]', text: 'text-[#ffb784]' };
            case 'Cold':
            default:
                return { bg: 'bg-[#37333e]', border: 'border-[#4a4455]', dot: 'bg-[#958da1]', text: 'text-[#ccc3d8]' };
        }
    };

    const statusStyle = getStatusStyles(lead.status);

    return (
        <div
            className={`bg-[#221e28] rounded-lg border overflow-hidden transition-all duration-300 relative ${isExpanded ? 'border-[#d2bbff] shadow-[0_0_15px_rgba(124,58,237,0.15)]' : 'border-[#4a4455] hover:bg-[#37333e] cursor-pointer group'}`}
            onClick={() => !isExpanded && setIsExpanded(true)}
        >
            {/* Header (Always Visible) */}
            <div className={`p-4 flex justify-between items-center ${isExpanded ? 'border-b border-[#4a4455] bg-[#37333e]/50 items-start' : ''}`}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#3c3742] flex items-center justify-center text-[#e8dfee] text-lg border border-[#4a4455]">
                        {lead.initials}
                    </div>
                    <div>
                        <h4 className={`text-base font-semibold transition-colors ${isExpanded ? 'text-[#e8dfee]' : 'text-[#e8dfee] group-hover:text-[#d2bbff]'}`}>
                            {lead.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            {!isExpanded && (
                                <div className={`px-2 py-0.5 rounded-full ${statusStyle.bg} border ${statusStyle.border} flex items-center gap-1`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${statusStyle.text}`}>{lead.status}</span>
                                </div>
                            )}
                            <span className="text-sm text-[#ccc3d8]">{lead.role}</span>
                            {lead.duration !== undefined && (
                                <span className="text-sm text-[#958da1] flex items-center gap-1">
                                    <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>timer</span>
                                    {lead.duration < 60 ? `${lead.duration}s` : `${Math.floor(lead.duration / 60)}m ${lead.duration % 60}s`}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {isExpanded && (
                        <div className={`px-3 py-1 rounded-full ${statusStyle.bg} border ${statusStyle.border} flex items-center gap-1 mb-2`}>
                            <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`}></span>
                            <span className={`text-xs font-bold uppercase tracking-widest ${statusStyle.text}`}>{lead.status}</span>
                        </div>
                    )}
                    <div className="text-right">
                        <span className={`text-2xl md:text-3xl font-semibold block leading-none ${isExpanded ? 'text-[#d2bbff]' : 'text-[#e8dfee] opacity-60'}`}>{lead.score}</span>
                        <span className="text-[12px] font-bold uppercase tracking-widest text-[#ccc3d8]">SCORE</span>
                    </div>
                </div>
            </div>

            {/* Expanded Details Section */}
            {isExpanded && (
                <div className="p-4 space-y-4 bg-[#221e28]">

                    {/* Score Reason */}
                    <div className="bg-[#37333e] rounded-md p-3 border border-[#4a4455]/50">
                        <h5 className="text-[12px] font-bold uppercase tracking-widest text-[#ccc3d8] mb-1 flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>lightbulb</span>
                            Score Reason
                        </h5>
                        <p className="text-sm text-[#e8dfee]">{lead.reason}</p>
                    </div>

                    {/* Transcript Snippet */}
                    <div>
                        <h5 className="text-[12px] font-bold uppercase tracking-widest text-[#ccc3d8] mb-1 flex items-center gap-1">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>record_voice_over</span>
                            Conversation Snippet
                        </h5>
                        <div className="space-y-2 text-sm pl-4 border-l-2 border-[#4a4455] mt-2">
                            {lead.transcript.slice(-4).map((msg, index) => {
                                const isAI = msg.role === 'ai' || msg.role === 'Rep';
                                const displayName = isAI ? 'AI' : 'Caller';
                                return (
                                    <p key={index}>
                                        <span className={isAI ? 'text-[#d2bbff] font-medium' : 'text-[#ccc3d8]'}>{displayName}: </span>
                                        <span className={isAI ? 'text-[#e8dfee]' : 'text-[#ccc3d8]'}>"{msg.text}"</span>
                                    </p>
                                );
                            })}
                        </div>
                    </div>

                    {/* Next Action */}
                    <div className="bg-[#7c3aed]/10 border border-[#d2bbff]/20 rounded-md p-3 flex items-start gap-4">
                        <span className="material-symbols-outlined text-[#d2bbff] mt-1">event_available</span>
                        <div className="flex-1">
                            <h5 className="text-[12px] font-bold uppercase tracking-widest text-[#d2bbff] mb-1">Next Action Suggested</h5>
                            <p className="text-sm text-[#e8dfee] mb-4">{lead.nextAction}</p>
                            <div className="flex gap-2">
                                <button className="bg-[#d2bbff] text-[#3f008e] px-4 py-2 rounded-md text-sm font-medium hover:bg-[#eaddff] transition-colors active:scale-95">Take Action</button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                                    className="border border-[#4a4455] text-[#e8dfee] px-4 py-2 rounded-md text-sm hover:bg-[#37333e] transition-colors active:scale-95"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}