import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const GREETING = "Hello! I'm Rupeezy AI. How can I help you today?";

export default function VoiceInterface({ onCallEnd, leadHistory }) {
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    const [totalScore, setTotalScore] = useState(50);
    const [messages, setMessages] = useState([]);
    const [callDuration, setCallDuration] = useState(0);

    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const chatContainerRef = useRef(null);
    const currentAudioUrlRef = useRef(null);
    const messagesRef = useRef(messages);
    const isCallActiveRef = useRef(false);
    const totalScoreRef = useRef(50);
    const callStartTimeRef = useRef(null);
    const durationIntervalRef = useRef(null);

    useEffect(() => { messagesRef.current = messages; }, [messages]);
    useEffect(() => { totalScoreRef.current = totalScore; }, [totalScore]);

    const cleanupAudioUrl = useCallback(() => {
        if (currentAudioUrlRef.current) {
            URL.revokeObjectURL(currentAudioUrlRef.current);
            currentAudioUrlRef.current = null;
        }
    }, []);

    function startListening() {
        if (!recognitionRef.current || !isCallActiveRef.current) return;
        try {
            recognitionRef.current.start();
            setIsRecording(true);
        } catch (e) {
            console.warn('[STT] Could not start:', e.message);
        }
    }

    async function speakAndLoop(text, lang = 'en') {
        try {
            if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
            cleanupAudioUrl();
            setIsSpeaking(true);

            const response = await fetch(`${API_BASE}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, lang })
            });

            if (!response.ok) throw new Error('TTS failed');

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            currentAudioUrlRef.current = audioUrl;

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                setIsSpeaking(false);
                cleanupAudioUrl();
                if (isCallActiveRef.current) setTimeout(() => startListening(), 500);
            };
            audio.onerror = () => {
                setIsSpeaking(false);
                cleanupAudioUrl();
                if (isCallActiveRef.current) setTimeout(() => startListening(), 500);
            };

            await audio.play();
        } catch (error) {
            setIsSpeaking(false);
            if (isCallActiveRef.current) setTimeout(() => startListening(), 500);
        }
    }

    async function handleAIResponse(userText) {
        if (!isCallActiveRef.current) return;
        setIsThinking(true);
        try {
            let contextNote = '';
            if (leadHistory && leadHistory.length > 0) {
                const recentLeads = leadHistory.slice(0, 3);
                const summaries = recentLeads.map(l =>
                    `[Previous call: ${l.name} — Status: ${l.status}, Score: ${l.score}. Summary: ${l.reason}]`
                ).join('\n');
                contextNote = `\n\nCONTEXT FROM PRIOR CALLS (use this to personalize):\n${summaries}\n`;
            }

            const historyWithContext = [...messagesRef.current];
            if (contextNote && historyWithContext.length <= 2) {
                historyWithContext.unshift({ role: 'user', text: contextNote });
                historyWithContext.unshift({ role: 'ai', text: 'Understood. I will use this context to personalize the conversation.' });
            }

            const response = await fetch(`${API_BASE}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userMessage: userText, history: historyWithContext })
            });

            if (!response.ok) throw new Error('Chat API failed');
            const data = await response.json();

            if (data.reply) {
                setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
                setTotalScore(prev => Math.min(100, Math.max(0, prev + (data.score_change || 0))));
                setIsThinking(false);
                await speakAndLoop(data.reply, data.lang || 'en');
            } else {
                setIsThinking(false);
                if (isCallActiveRef.current) setTimeout(() => startListening(), 500);
            }
        } catch (error) {
            setIsThinking(false);
            setMessages(prev => [...prev, { role: 'ai', text: "Connection issue. Let me try again..." }]);
            if (isCallActiveRef.current) setTimeout(() => startListening(), 1000);
        }
    }

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-IN';
            recognition.maxAlternatives = 1;

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setMessages(prev => [...prev, { role: 'user', text: transcript }]);
                setIsRecording(false);
                handleAIResponse(transcript);
            };

            recognition.onerror = (event) => {
                setIsRecording(false);
                if (isCallActiveRef.current && event.error === 'no-speech') {
                    setTimeout(() => startListening(), 300);
                }
            };

            recognition.onend = () => setIsRecording(false);
            recognitionRef.current = recognition;
        }

        return () => {
            cleanupAudioUrl();
            if (audioRef.current) audioRef.current.pause();
            if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        };
    }, []);

    const startCall = async () => {
        if (!recognitionRef.current) return alert("Please use Chrome for voice features!");
        isCallActiveRef.current = true;
        setIsCallActive(true);
        setMessages([{ role: 'ai', text: GREETING }]);
        setTotalScore(50);
        setCallDuration(0);

        callStartTimeRef.current = Date.now();
        durationIntervalRef.current = setInterval(() => {
            setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        }, 1000);

        await speakAndLoop(GREETING, 'en');
    };

    const endCall = async () => {
        isCallActiveRef.current = false;
        setIsCallActive(false);
        setIsRecording(false);
        setIsSpeaking(false);

        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
        }
        const finalDuration = callStartTimeRef.current
            ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
            : 0;

        try { recognitionRef.current?.stop(); } catch (_) {}
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }

        const currentMessages = messagesRef.current;

        if (currentMessages.length <= 1) {
            setIsThinking(false);
            setMessages([]);
            setCallDuration(0);
            return;
        }

        setIsThinking(true);

        const score = totalScoreRef.current;
        let finalStatus = 'Cold';
        if (score >= 70) finalStatus = 'Hot';
        else if (score >= 40) finalStatus = 'Warm';

        let summaryData = {};
        try {
            const response = await fetch(`${API_BASE}/api/summarize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: currentMessages })
            });
            if (response.ok) summaryData = await response.json();
        } catch (error) {
            console.error("Summary failed:", error);
        }

        const newLead = {
            id: Date.now(),
            name: "Lead @ " + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
            role: "Inbound Lead",
            initials: "IL",
            score: score,
            status: finalStatus,
            reason: summaryData.summary || "Call ended before analysis could complete.",
            transcript: currentMessages,
            nextAction: summaryData.suggested_action || "Review transcript to determine next steps.",
            keyObjections: summaryData.key_objections || [],
            duration: finalDuration,
            callTime: new Date().toISOString(),
        };

        if (onCallEnd) onCallEnd(newLead);
        setMessages([]);
        setTotalScore(50);
        setCallDuration(0);
        setIsThinking(false);
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const getStatusInfo = () => {
        if (isThinking) return { icon: 'psychology', text: 'Analyzing Lead...', color: 'text-amber-400 border-amber-500/50' };
        if (isSpeaking) return { icon: 'record_voice_over', text: 'AI Speaking...', color: 'text-emerald-400 border-emerald-500/50' };
        if (isRecording) return { icon: 'graphic_eq', text: 'Listening...', color: 'text-[#d2bbff] border-[#7c3aed]' };
        if (isCallActive) return { icon: 'call', text: 'Call Active', color: 'text-emerald-400 border-emerald-500/50' };
        return { icon: 'mic_off', text: 'Ready', color: 'text-[#ccc3d8]' };
    };

    const status = getStatusInfo();

    return (
        <main className="flex-1 flex flex-col items-center p-6 w-full max-w-4xl mx-auto h-[calc(100vh-64px)] overflow-hidden">

            <div className="mb-6 flex items-center gap-3 shrink-0">
                <div className={`flex items-center gap-2 bg-[#2c2833] border border-[#4a4455] rounded-full px-6 py-2 text-[12px] font-bold uppercase tracking-widest ${status.color}`}>
                    <span className="material-symbols-outlined text-[18px]">{status.icon}</span>
                    {status.text}
                </div>
                {isCallActive && (
                    <div className="flex items-center gap-2 bg-[#2c2833] border border-[#4a4455] rounded-full px-4 py-2 text-[12px] font-bold tracking-widest text-[#ccc3d8]">
                        <span className="material-symbols-outlined text-[16px] text-red-400">timer</span>
                        <span className="tabular-nums">{formatDuration(callDuration)}</span>
                    </div>
                )}
            </div>

            <div className="relative w-48 h-48 flex items-center justify-center my-8 shrink-0">
                {(isRecording || isSpeaking) && (
                    <div className={`absolute inset-0 rounded-full blur-3xl opacity-25 animate-pulse ${isSpeaking ? 'bg-emerald-500' : 'bg-[#7c3aed]'}`}></div>
                )}
                <div
                    className={`relative z-10 w-32 h-32 bg-[#37333e] border-2 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                        isThinking ? 'border-amber-500/50 opacity-50' :
                        isSpeaking ? 'border-emerald-500 text-emerald-400' :
                        isRecording ? 'border-[#7c3aed] text-[#d2bbff] animate-pulse' :
                        isCallActive ? 'border-emerald-500/50 text-emerald-400' :
                        'border-[#958da1] text-[#d2bbff]'
                    }`}
                >
                    <span className="material-symbols-outlined text-[56px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isThinking ? 'psychology' : isSpeaking ? 'graphic_eq' : isRecording ? 'mic' : isCallActive ? 'call' : 'mic_off'}
                    </span>
                </div>
            </div>

            <div ref={chatContainerRef} className="w-full max-w-2xl flex-1 overflow-y-auto flex flex-col gap-5 pr-2 mb-8" style={{ scrollbarWidth: 'none' }}>
                {messages.length === 0 && !isCallActive && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                        <span className="material-symbols-outlined text-[48px] mb-3 text-[#958da1]">call</span>
                        <p className="text-[#ccc3d8] text-sm">Click <strong>Start Call</strong> to begin a conversation</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 w-[90%] animate-slideUp ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                        <div className={`w-10 h-10 rounded-full border border-[#4a4455] flex items-center justify-center shrink-0 overflow-hidden ${msg.role === 'ai' ? 'bg-[#37333e]' : 'bg-[#7c3aed]'}`}>
                             <img alt={msg.role} className="w-full h-full object-cover" src={msg.role === 'ai' ? "https:
                        </div>
                        <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-lg ${msg.role === 'user' ? 'bg-[#7c3aed] text-white rounded-tr-none' : 'bg-[#221e28] text-[#e8dfee] border border-[#3c3742] rounded-tl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            <div className="w-full max-w-md mx-auto pt-6 flex gap-4 shrink-0 border-t border-white/5">
                {!isCallActive ? (
                    <button
                        onClick={startCall}
                        className="flex-1 py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-[13px] transition-all flex items-center justify-center gap-2 shadow-lg bg-[#d2bbff] text-[#3f008e] hover:bg-white"
                    >
                        <span className="material-symbols-outlined">keyboard_voice</span>
                        Start Call
                    </button>
                ) : (
                    <button
                        onClick={endCall}
                        className="flex-1 py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-[13px] transition-all flex items-center justify-center gap-2 shadow-lg bg-red-600 text-white hover:bg-red-500"
                    >
                        <span className="material-symbols-outlined">call_end</span>
                        End Call
                    </button>
                )}
            </div>
        </main>
    );
}