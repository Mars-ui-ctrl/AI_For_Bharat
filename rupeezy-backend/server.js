import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const HINDI_MARKERS = [
    'kya', 'hai', 'hain', 'mein', 'main', 'mujhe', 'aap', 'aapka', 'aapki',
    'yeh', 'woh', 'kaise', 'kahan', 'kyun', 'kab', 'kaun', 'kitna', 'kitne',
    'nahi', 'nahin', 'haan', 'ji', 'accha', 'theek', 'bahut', 'bohot',
    'karo', 'karna', 'karenge', 'karega', 'karein', 'bolo', 'batao', 'bataiye',
    'paise', 'paisa', 'rupaye', 'lakh', 'crore', 'chahiye', 'chahte',
    'samajh', 'samjho', 'suniye', 'suno', 'dekho', 'dekhiye',
    'broker', 'brokerage', 'dost', 'bhai', 'sir', 'madam',
    'abhi', 'toh', 'phir', 'lekin', 'aur', 'ya', 'par', 'se', 'ke', 'ka', 'ki',
    'ho', 'tha', 'thi', 'the', 'hoga', 'hogi', 'raha', 'rahi', 'rahe',
    'mera', 'meri', 'tera', 'teri', 'tumhara', 'hamara', 'unka', 'uski',
    'kuch', 'sab', 'bahut', 'zyada', 'kam', 'thoda', 'bilkul',
    'zaroor', 'zaroorat', 'madad', 'kaam', 'paisa',
];

function detectLanguage(text) {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    const hindiCount = words.filter(w => HINDI_MARKERS.includes(w)).length;
    const ratio = hindiCount / Math.max(words.length, 1);

    if (ratio > 0.15 || hindiCount >= 3) return 'hi';
    return 'en';
}

const VOICES = {
    'en': 'en-IN-NeerjaNeural',
    'hi': 'hi-IN-SwaraNeural',
};

const systemPrompt = `
You are the "Rupeezy AI Sales Agent," an advanced, highly professional, and persuasive B2B sales assistant.
Your goal is to pitch the Rupeezy Authorized Partner (AP) program, handle objections naturally, qualify the lead, and gather context for a human Relationship Manager.
CORE DIRECTIVES
1.	Be Conversational: Speak naturally, confidently, and concisely. Keep responses under 3 sentences.
2.	The Pitch: Key benefits are zero joining fee, 100% brokerage share, and daily payouts via the RISE Portal.
3.	Multilingual Agility: Detect the user's language. If they speak Hindi or Hinglish, respond in HINGLISH ONLY using the English alphabet (e.g., "Main aapki madad kar sakta hoon"). NEVER use the Devanagari script (Hindi alphabet).
4.	Context Awareness: Always consider previous conversation history. Do not repeat the same pitch.
5.  SPEECH OPTIMIZATION: Your reply will be read aloud by a TTS engine. Write in a way that sounds natural when spoken. Avoid bullet points, special characters, URLs, or formatting. Use short, punchy sentences.
CONVERSATION CONTROL
You must internally track and follow these stages:
•	opening
•	pitching
•	qualifying
•	closing
Progress naturally and do not skip stages.
OBJECTION HANDLING
•	If user says they already use another broker:
Acknowledge positively and compare benefits. Example: "That's great — you already understand the business. But are you getting 100% brokerage share and daily payouts? Most brokers cap you at 60–70% and pay monthly. Rupeezy gives you everything you earn, every single day."
•	If user says they don't trust online platforms:
Reassure calmly with reliability and credibility. Mention Rupeezy is a SEBI-registered broker with a fully digital onboarding process. Do not be aggressive.
•	If user says they don't have enough contacts or clients:
Encourage them. Example: "You don't need hundreds of clients to start. Even 5–10 active traders can generate significant income with 100% brokerage share. And Rupeezy provides marketing support and training to help you grow your network."
•	If user asks about client support — who handles issues:
Reassure them that Rupeezy handles all client support, KYC, compliance, and platform issues. The partner focuses only on bringing clients. Example: "You focus on relationships — Rupeezy handles everything else: support tickets, KYC, compliance, tech issues. Your clients get direct support from our team."
•	If user says "I'll think about it" or "call me later":
Respect their time but create urgency. Example: "Of course, take your time. Just so you know — the zero joining fee offer is available now, and partners who sign up this week get priority onboarding. Can I send you a WhatsApp link so you have all the details handy?"
SCORING LOGIC
Determine a precise score_change based on intent:
•	Strong interest: +20
•	Moderate interest: +10
•	Neutral: 0
•	Mild hesitation: -5
•	Strong rejection: -30
INTENT CLASSIFICATION
Classify the user's intent as one of:
•	interested
•	hesitant
•	neutral
•	not_interested
NEXT ACTION
Decide the next best action:
•	ask_question
•	pitch_benefit
•	handle_objection
•	close_conversation
STRICT OUTPUT FORMAT
You are a machine communicating with a backend server.
You MUST ONLY output raw JSON. No preamble, no markdown, no explanation, no "Here is the JSON" text.
Start your output with { and end with }.
If the format is broken, the system will crash.
Example of a valid response:
{"reply": "That sounds great! Tell me more about your trading volume.", "score_change": 10, "reason": "User showed moderate interest", "intent": "interested", "next_action": "ask_question", "lang": "en"}

`;

async function callGeminiWithRetry(model, contents, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent({ contents });
            return result;
        } catch (err) {
            const isRetryable = err.status === 503 || err.status === 429;
            if (isRetryable && attempt < maxRetries) {
                const delay = attempt * 2000;
                console.log(`[Gemini] Retry ${attempt}/${maxRetries} after ${delay}ms (status: ${err.status})`);
                await new Promise(r => setTimeout(r, delay));
            } else {
                throw err;
            }
        }
    }
}

function parseGeminiResponse(rawText, fallbackLang = 'en') {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.reply && !parsed.reply.toLowerCase().includes('json')) {
                return parsed;
            }
            if (parsed.reply && parsed.reply.toLowerCase().includes('json')) {
                parsed.reply = "That's interesting! Could you tell me more about what you're looking for?";
            }
            return parsed;
        } catch (_) {  }
    }

    console.warn('[Gemini] Non-JSON response, using fallback:', rawText.substring(0, 100));
    return {
        reply: "I appreciate your interest! Could you tell me a bit more so I can assist you better?",
        score_change: 0,
        reason: "AI returned non-structured response",
        intent: "neutral",
        next_action: "ask_question",
        lang: fallbackLang
    };
}

app.post("/api/chat", async (req, res) => {
    try {
        const { userMessage, history } = req.body;

        if (!userMessage || !Array.isArray(history)) {
            return res.status(400).json({ error: "Missing userMessage or history array" });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
            systemInstruction: systemPrompt,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
                responseMimeType: "application/json",
            }
        });

        const formattedHistory = history
            .filter(msg => msg.text)
            .map(msg => ({
                role: msg.role === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));

        formattedHistory.push({ role: 'user', parts: [{ text: userMessage }] });

        const result = await callGeminiWithRetry(model, formattedHistory);
        const rawText = result.response.text();
        const parsedData = parseGeminiResponse(rawText);

        if (!parsedData.lang) {
            parsedData.lang = detectLanguage(parsedData.reply || '');
        }

        res.json(parsedData);
    } catch (error) {
        console.error("Gemini Error:", error.message || error);
        res.status(500).json({ error: "Failed to get AI response" });
    }
});

app.post("/api/tts", async (req, res) => {
    try {
        const { text, lang = 'en' } = req.body;

        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: "No text provided" });
        }

        let cleanText = text
            .replace(/[*_#`~]/g, '')
            .replace(/\[.*?\]\(.*?\)/g, '')
            .replace(/[.,!?;:]{2,}/g, '.')
            .replace(/\s+/g, ' ')
            .trim();

        if (cleanText.length === 0) {
            return res.status(400).json({ error: "Text is empty after cleaning" });
        }

        const voiceName = VOICES[lang] || VOICES['en'];
        console.log(`[TTS] Voice: ${voiceName} | Lang: ${lang} | Text: "${cleanText.substring(0, 60)}..."`);

        const tts = new MsEdgeTTS();
        await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

        const { audioStream } = tts.toStream(cleanText);

        const chunks = [];

        audioStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        audioStream.on('close', () => {
            const audioBuffer = Buffer.concat(chunks);
            console.log(`[TTS] Done: ${audioBuffer.length} bytes`);
            res.set({
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.length,
                'Cache-Control': 'no-cache',
            });
            res.send(audioBuffer);
        });

        audioStream.on('error', (err) => {
            console.error('[TTS] Stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: "TTS streaming failed" });
            }
        });

    } catch (error) {
        console.error("[TTS] Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "TTS generation failed" });
        }
    }
});


const summaryPrompt = `
You are an expert B2B Sales Manager analyzing a conversation between an AI Sales Agent and a potential partner lead for the Rupeezy program.

Your goal is to generate a high-quality Human Handoff Report that helps a Relationship Manager (RM) close the lead efficiently.

ANALYSIS GUIDELINES:
- Identify the lead's true intent (interest level, hesitation, or rejection)
- Extract key objections or concerns raised by the lead
- Consider engagement level (questions asked, responsiveness, willingness)
- Detect buying signals (curiosity about earnings, onboarding, process)
- Be concise but insightful

STRICT OUTPUT FORMAT:
You MUST return ONLY valid JSON in this exact structure:
{
  "summary": "A sharp 1-2 sentence summary capturing intent and readiness",
  "key_objections": ["Clear objection 1", "Clear objection 2"],
  "suggested_action": "A specific, actionable next step for the RM (call now, send WhatsApp link, follow up later, etc.)"
}
`;

app.post("/api/summarize", async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!Array.isArray(transcript) || transcript.length === 0) {
            return res.status(400).json({ error: "Missing or empty transcript array" });
        }
        
        const conversationText = transcript.map(msg => `${msg.role.toUpperCase()}: ${msg.text}`).join("\n");

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
            systemInstruction: summaryPrompt,
            generationConfig: { temperature: 0.3, responseMimeType: "application/json" }
        });

        const contents = [{ role: "user", parts: [{ text: `Analyze this call:\n\n${conversationText}` }] }];
        const result = await callGeminiWithRetry(model, contents);
        const rawText = result.response.text();

        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        let parsed;
        try {
            parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
        } catch (_) {
            parsed = {
                summary: rawText.replace(/[*#`_]/g, '').trim().substring(0, 200),
                key_objections: [],
                suggested_action: "Review transcript manually."
            };
        }

        res.json(parsed);
    } catch (error) {
        console.error("Summary Error:", error);
        res.status(500).json({ error: "Failed to generate summary" });
    }
});


app.get("/api/health", (req, res) => {
    res.json({ status: "ok", voices: VOICES });
});

app.listen(PORT, () => {
    console.log(`🚀 Rupeezy Backend running on port ${PORT}`);
    console.log(`🎙️  TTS Voices: EN → ${VOICES.en} | HI → ${VOICES.hi}`);
});
