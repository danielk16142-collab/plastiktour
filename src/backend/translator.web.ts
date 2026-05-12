import { translateText } from './claude.web';
import type { Language } from '../types';

export interface TranslationSession {
  sessionId: string;
  doctorLanguage: Language;
  patientLanguage: Language;
  messages: TranslatedMessage[];
}

export interface TranslatedMessage {
  id: string;
  original: string;
  translated: string;
  speaker: 'doctor' | 'patient';
  timestamp: string;
}

const sessions = new Map<string, TranslationSession>();

export async function createTranslationSession(
  doctorLanguage: Language,
  patientLanguage: Language
): Promise<TranslationSession> {
  const session: TranslationSession = {
    sessionId: `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    doctorLanguage,
    patientLanguage,
    messages: [],
  };
  sessions.set(session.sessionId, session);
  return session;
}

export async function translateSpeech(
  sessionId: string,
  text: string,
  speaker: 'doctor' | 'patient'
): Promise<TranslatedMessage> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  const sourceLang = speaker === 'doctor' ? session.doctorLanguage : session.patientLanguage;
  const targetLang = speaker === 'doctor' ? session.patientLanguage : session.doctorLanguage;

  const translated =
    sourceLang === targetLang ? text : await translateText(text, targetLang);

  const message: TranslatedMessage = {
    id: `msg_${Date.now()}`,
    original: text,
    translated,
    speaker,
    timestamp: new Date().toISOString(),
  };

  session.messages.push(message);
  return message;
}

export function getSession(sessionId: string): TranslationSession | null {
  return sessions.get(sessionId) ?? null;
}

export function endSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export async function translateBulk(
  texts: string[],
  targetLanguage: Language
): Promise<string[]> {
  return Promise.all(texts.map((t) => translateText(t, targetLanguage)));
}
