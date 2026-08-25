import { GoogleGenAI } from '@google/genai';
import { NoticeItem, FacultyMember, StudentRecord, UploadAsset } from '@/types';

const getApiKey = (): string => {
  return (
    ((import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    localStorage.getItem('sit_gemini_api_key') ||
    ''
  ).trim();
};

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const aiService = {
  /**
   * Advanced multi-turn conversation & context-aware SIT AI assistant.
   */
  async askDepartmentAssistant(
    userQuery: string,
    history: ChatMessage[],
    mode: 'general' | 'academic' | 'faculty' | 'notices',
    contextData: {
      notices: NoticeItem[];
      faculty: FacultyMember[];
      students: StudentRecord[];
      documents: UploadAsset[];
    }
  ): Promise<string> {
    const apiKey = getApiKey();

    const modeFocus = {
      general: 'Focus on providing clean, concise, helpful guidance about the Sharad Institute of Technology (SITCOE) Portal and Trust institutions.',
      academic: 'Focus on curriculum, course credits, examination schemes, GPA calculations, and study materials.',
      faculty: 'Focus on faculty designations, current campus location (ON CAMPUS, IN LAB, IN MEETING), research, and office hours.',
      notices: 'Focus on filtering circulars, urgent notices, submission deadlines, and academic targets.'
    }[mode];

    const systemPrompt = `You are SIT AI, the intelligent, helpful official AI Assistant for Sharad Institute of Technology (SITCOE) and Trust Institutions.
${modeFocus}

LIVE INSTITUTIONAL DATA:
- Institution: Sharad Institute of Technology (SITCOE) & Trust Units
- Administration: Central Administration & Portal Controllers
- Active Faculty Roster (${contextData.faculty.length}): ${contextData.faculty.map(f => `${f.name} [${f.status}] - Spec: ${f.specialization}, Office: ${f.officeHours || '9 AM - 5 PM'}`).join('; ')}
- Published Circulars (${contextData.notices.length}): ${contextData.notices.map(n => `[${n.priority}] "${n.title}" (Date: ${n.publishedAt})`).join('; ')}
- Available Study Documents (${contextData.documents.length}): ${contextData.documents.map(d => `${d.title} [${d.category}]`).join('; ')}

RESPONSE STYLE RULES:
1. Be ultra-concise, elegant, and minimal. Introduce yourself as SIT AI when relevant.
2. Use clean markdown formatting (bold highlights, bullet lists).
3. If giving faculty status, explicitly state if they are ON CAMPUS, IN LAB, IN MEETING, or OFF CAMPUS.
4. If asked about circulars or notices, highlight deadlines clearly.`;

    if (apiKey) {
      try {
        const contents = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
          { role: 'user', parts: [{ text: userQuery }] }
        ];

        // Try gemini-1.5-flash first
        let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents })
        });

        // Fallback to gemini-2.0-flash if 1.5 endpoint fails
        if (!res.ok) {
          res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
          });
        }

        const data = await res.json();

        if (data.error) {
          return `⚠️ **SIT AI (Gemini Error)**: ${data.error.message || 'API Key Error'}\n\n*Please verify your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and click the ⚙️ Settings icon in the chat header to update it.*`;
        }

        const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (textResult) {
          return textResult;
        }
      } catch (err: any) {
        console.warn('SIT AI Gemini API connection failed:', err);
        return `⚠️ **SIT AI Connection Error**: Unable to reach Google Gemini API (${err.message || 'Network error'}).\n\nFallback local response:\n\n` + this.fallbackLocalKnowledgeEngine(userQuery, mode, contextData);
      }
    }

    return this.fallbackLocalKnowledgeEngine(userQuery, mode, contextData);
  },

  fallbackLocalKnowledgeEngine(
    query: string,
    mode: string,
    context: { notices: NoticeItem[]; faculty: FacultyMember[]; documents: UploadAsset[] }
  ): string {
    const q = query.toLowerCase();

    if (mode === 'faculty' || q.includes('faculty') || q.includes('professor') || q.includes('status')) {
      const facList = context.faculty.length > 0 
        ? context.faculty.map(f => `• **${f.name}**: ${f.status} (${f.specialization})`).join('\n')
        : '• **Dr. A. S. Poornima**: ON CAMPUS\n• **Prof. Veena K**: IN LAB\n• **Dr. R. Kumar**: IN MEETING';
      return `### 👨‍🏫 Faculty Status Directory\n\n${facList}\n\n*Note: Faculty status updates automatically upon campus check-in.*`;
    }

    if (mode === 'notices' || q.includes('notice') || q.includes('circular') || q.includes('urgent') || q.includes('exam')) {
      const urgent = context.notices.filter(n => n.priority === 'URGENT');
      const recentList = context.notices.slice(0, 3).map(n => `• **[${n.priority}] ${n.title}** (${n.publishedAt})`).join('\n');
      return `### 📢 Department Circulars\n\n**Total Notices**: ${context.notices.length}\n${urgent.length > 0 ? `🚨 **Urgent Notice**: ${urgent[0].title}\n\n` : ''}${recentList || '• No urgent notices currently pending.'}`;
    }

    if (mode === 'academic' || q.includes('syllabus') || q.includes('credit') || q.includes('gpa') || q.includes('course')) {
      return `### 🎓 Academic & Curriculum Guide\n\n• **Department**: Computer Science & Engineering (B.Tech)\n• **Syllabus & Notes**: Access all semester PDFs under **Documents Library**.\n• **CGPA Grading**: Based on SIT autonomous 10-point credit scale.\n• **Minimum Attendance**: 85% mandatory for examination eligibility.`;
    }

    if (q.includes('admin') || q.includes('controller') || q.includes('hod')) {
      return `### 👑 Administration\n\n• **Central Administration**: Sharad Institute of Technology (SITCOE)\n• **Portal Access**: Role-based access for Admin, Faculty, Students, and Parents.`;
    }

    return `### 🤖 SIT Institutional AI Assistant\n\nHow can I help you today? Select a mode above or ask about:\n• **Notices & Circulars**\n• **Faculty presence status**\n• **Syllabus & Study documents**\n• **Placement & Academic Programs**`;
  }
};
