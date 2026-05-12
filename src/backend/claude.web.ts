import Anthropic from '@anthropic-ai/sdk';
import type { ChatMessage, Language, Lead, PostOpCheckIn } from '../types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT_BY_LANG: Record<Language, string> = {
  es: `Eres el asistente virtual de una clínica de cirugía plástica. Tu rol es:
1. Dar información clara y empática sobre procedimientos estéticos
2. Detectar señales de Trastorno Dismórfico Corporal (TDC/BDD) como expectativas irreales, obsesión con defectos menores, historial de múltiples cirugías insatisfactorias
3. Calificar prospectos: recopilar nombre, procedimiento de interés y datos de contacto
4. Agendar consultas
5. Mantener confidencialidad y profesionalismo

Responde siempre en español a menos que el usuario cambie de idioma.
Si detectas señales de BDD, responde con empatía y sugiere una evaluación psicológica antes de la cirugía.
Sé cálido, profesional y conciso. Máximo 3 oraciones por respuesta.`,

  en: `You are the virtual assistant of a plastic surgery clinic. Your role is to:
1. Provide clear and empathetic information about aesthetic procedures
2. Detect Body Dysmorphic Disorder (BDD) signals: unrealistic expectations, obsession with minor flaws, history of multiple unsatisfactory surgeries
3. Qualify leads: collect name, procedure of interest and contact details
4. Schedule consultations
5. Maintain confidentiality and professionalism

Always respond in English unless the user switches languages.
If you detect BDD signals, respond with empathy and suggest a psychological evaluation before surgery.
Be warm, professional and concise. Maximum 3 sentences per response.`,

  fr: `Vous êtes l'assistant virtuel d'une clinique de chirurgie plastique. Votre rôle est de:
1. Fournir des informations claires et empathiques sur les procédures esthétiques
2. Détecter les signaux de Trouble Dysmorphique Corporel (TDC/BDD): attentes irréalistes, obsession pour des défauts mineurs, historique de chirurgies multiples insatisfaisantes
3. Qualifier les prospects: recueillir nom, procédure d'intérêt et coordonnées
4. Planifier des consultations
5. Maintenir la confidentialité et le professionnalisme

Répondez toujours en français sauf si l'utilisateur change de langue.
Si vous détectez des signaux de TDC, répondez avec empathie et suggérez une évaluation psychologique avant la chirurgie.
Soyez chaleureux, professionnel et concis. Maximum 3 phrases par réponse.`,
};

export async function chatWithPatient(
  messages: ChatMessage[],
  language: Language = 'es',
  clinicName: string = 'PlastiKTour'
): Promise<{ reply: string; bddFlagged: boolean; leadData: Partial<Lead> | null }> {
  const systemPrompt = `${SYSTEM_PROMPT_BY_LANG[language]}\n\nClínica/Clinic: ${clinicName}`;

  const anthropicMessages = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  const reply = response.content[0].type === 'text' ? response.content[0].text : '';

  const bddKeywords = [
    'todo el mundo',
    'everyone notices',
    'tout le monde',
    'tercera cirugia',
    'third surgery',
    'troisième chirurgie',
    'me odio',
    'i hate myself',
    'je me déteste',
    'defecto',
    'ugly',
    'laid',
    'horrible',
    'imperfecto',
  ];
  const lastUserMsg = messages.filter((m) => m.role === 'user').slice(-1)[0]?.content ?? '';
  const bddFlagged = bddKeywords.some((kw) =>
    lastUserMsg.toLowerCase().includes(kw.toLowerCase())
  );

  return { reply, bddFlagged, leadData: null };
}

export async function qualifyLead(lead: Partial<Lead>): Promise<{
  score: number;
  notes: string;
  recommended_next_step: string;
}> {
  const prompt = `Califica este prospecto para una clínica de cirugía plástica y devuelve un JSON con score (0-100), notes y recommended_next_step.

Datos del prospecto:
- Nombre: ${lead.name ?? 'Desconocido'}
- Procedimiento: ${lead.interestedProcedure ?? 'No especificado'}
- Fuente: ${lead.source ?? 'desconocida'}
- Notas de calificación: ${lead.qualificationNotes ?? 'ninguna'}

Criterios de puntuación:
- Tiene procedimiento específico en mente (+20)
- Proporcionó datos de contacto completos (+20)
- Vino por referido (+15)
- Tiene fecha tentativa (+15)
- Sin señales de BDD (+15)
- Responde rápido a mensajes (+15)

Responde SOLO con JSON válido, sin markdown.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

  try {
    return JSON.parse(text);
  } catch {
    return {
      score: 50,
      notes: 'Error en calificación automática',
      recommended_next_step: 'Revisión manual requerida',
    };
  }
}

export async function generatePostOpMessage(
  checkIn: PostOpCheckIn,
  language: Language = 'es'
): Promise<{ message: string; urgencyLevel: 'normal' | 'monitor' | 'urgent' }> {
  const langLabel = { es: 'Spanish', en: 'English', fr: 'French' }[language];

  const prompt = `You are a plastic surgery post-op care assistant. Analyze this patient check-in and:
1. Write a warm, professional follow-up message in ${langLabel}
2. Determine urgency: "normal", "monitor" or "urgent"

Patient: ${checkIn.patientName}
Day since surgery: ${checkIn.checkInDay}
Symptoms: ${checkIn.symptoms ?? 'none reported'}
Pain level (0-10): ${checkIn.painLevel ?? 'not reported'}

Urgency criteria:
- "urgent": fever, severe pain (8+), excessive discharge, signs of infection
- "monitor": moderate pain (5-7), unusual swelling, patient seems anxious
- "normal": mild symptoms consistent with normal recovery

Respond ONLY with valid JSON: {"message": "...", "urgencyLevel": "normal|monitor|urgent"}
No markdown, no explanation.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: 'Thank you for your update. We will review your information shortly.',
      urgencyLevel: 'normal',
    };
  }
}

export async function translateText(
  text: string,
  targetLanguage: Language
): Promise<string> {
  const langNames = { es: 'Spanish', en: 'English', fr: 'French' };

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Translate the following medical/clinical text to ${langNames[targetLanguage]}.
Return ONLY the translation, no explanations or quotes:

${text}`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text.trim() : text;
}
