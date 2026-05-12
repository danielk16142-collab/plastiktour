import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createTranslationSession,
  translateSpeech,
  type TranslatedMessage,
  type TranslationSession,
} from '../../../backend/translator.web';
import type { Language } from '../../../types';

const LANG_FLAGS: Record<Language, string> = { es: '🇲🇽', en: '🇺🇸', fr: '🇫🇷' };
const LANG_NAMES: Record<Language, string> = { es: 'Español', en: 'English', fr: 'Français' };

export default function TranslatorPage() {
  const { t } = useTranslation();
  const [session, setSession] = useState<TranslationSession | null>(null);
  const [doctorLang, setDoctorLang] = useState<Language>('es');
  const [patientLang, setPatientLang] = useState<Language>('en');
  const [doctorInput, setDoctorInput] = useState('');
  const [patientInput, setPatientInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  const startSession = async () => {
    const s = await createTranslationSession(doctorLang, patientLang);
    setSession(s);
  };

  const sendTranslation = async (speaker: 'doctor' | 'patient') => {
    if (!session) return;

    const text = speaker === 'doctor' ? doctorInput : patientInput;
    if (!text.trim()) return;

    setLoading(true);

    if (speaker === 'doctor') setDoctorInput('');
    else setPatientInput('');

    const msg = await translateSpeech(session.sessionId, text.trim(), speaker);

    setSession((prev) =>
      prev
        ? { ...prev, messages: [...prev.messages, msg] }
        : prev
    );

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, speaker: 'doctor' | 'patient') => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendTranslation(speaker);
    }
  };

  if (!session) {
    return (
      <div style={styles.setupPage}>
        <div style={styles.setupCard}>
          <h1 style={styles.title}>{t('translator.title')}</h1>
          <p style={styles.subtitle}>
            Configura los idiomas del doctor y del paciente para iniciar la sesión de traducción
            en tiempo real.
          </p>

          <div style={styles.langSetup}>
            <div style={styles.langSetupCol}>
              <label style={styles.setupLabel}>👨‍⚕️ Doctor / Cirujano</label>
              <select
                value={doctorLang}
                onChange={(e) => setDoctorLang(e.target.value as Language)}
                style={styles.langSelect}
              >
                {(['es', 'en', 'fr'] as Language[]).map((l) => (
                  <option key={l} value={l}>
                    {LANG_FLAGS[l]} {LANG_NAMES[l]}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.arrowSep}>⇄</div>

            <div style={styles.langSetupCol}>
              <label style={styles.setupLabel}>🧑 Paciente</label>
              <select
                value={patientLang}
                onChange={(e) => setPatientLang(e.target.value as Language)}
                style={styles.langSelect}
              >
                {(['es', 'en', 'fr'] as Language[]).map((l) => (
                  <option key={l} value={l}>
                    {LANG_FLAGS[l]} {LANG_NAMES[l]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={() => void startSession()} style={styles.startBtn}>
            🌐 Iniciar Sesión de Traducción
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>{t('translator.title')}</h1>
        <div style={styles.sessionInfo}>
          <span>{LANG_FLAGS[session.doctorLanguage]} {LANG_NAMES[session.doctorLanguage]}</span>
          <span style={styles.arrow}>⇄</span>
          <span>{LANG_FLAGS[session.patientLanguage]} {LANG_NAMES[session.patientLanguage]}</span>
        </div>
        <button onClick={() => setSession(null)} style={styles.endBtn}>
          Terminar Sesión
        </button>
      </div>

      <div style={styles.chatArea}>
        {session.messages.length === 0 && (
          <p style={styles.emptyChat}>
            La sesión está activa. Empieza escribiendo abajo para traducir en tiempo real.
          </p>
        )}

        {session.messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            doctorLang={session.doctorLanguage}
            patientLang={session.patientLanguage}
          />
        ))}

        {loading && (
          <div style={styles.translatingBadge}>
            🌐 {t('translator.translating')}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div style={styles.inputPanel}>
        <div style={styles.inputCol}>
          <div style={styles.inputLabel}>
            👨‍⚕️ {LANG_FLAGS[session.doctorLanguage]} {LANG_NAMES[session.doctorLanguage]}
          </div>
          <div style={styles.inputRow}>
            <textarea
              value={doctorInput}
              onChange={(e) => setDoctorInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'doctor')}
              placeholder={`Habla en ${LANG_NAMES[session.doctorLanguage]}...`}
              rows={2}
              style={styles.textarea}
            />
            <button
              onClick={() => void sendTranslation('doctor')}
              disabled={!doctorInput.trim() || loading}
              style={{ ...styles.sendBtn, background: '#667eea' }}
            >
              ➤
            </button>
          </div>
        </div>

        <div style={styles.inputDivider}>|</div>

        <div style={styles.inputCol}>
          <div style={styles.inputLabel}>
            🧑 {LANG_FLAGS[session.patientLanguage]} {LANG_NAMES[session.patientLanguage]}
          </div>
          <div style={styles.inputRow}>
            <textarea
              value={patientInput}
              onChange={(e) => setPatientInput(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, 'patient')}
              placeholder={`Speak in ${LANG_NAMES[session.patientLanguage]}...`}
              rows={2}
              style={styles.textarea}
            />
            <button
              onClick={() => void sendTranslation('patient')}
              disabled={!patientInput.trim() || loading}
              style={{ ...styles.sendBtn, background: '#10b981' }}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  doctorLang,
  patientLang,
}: {
  msg: TranslatedMessage;
  doctorLang: Language;
  patientLang: Language;
}) {
  const isDoctor = msg.speaker === 'doctor';
  const srcLang = isDoctor ? doctorLang : patientLang;
  const tgtLang = isDoctor ? patientLang : doctorLang;

  return (
    <div style={{ ...styles.msgBlock, alignItems: isDoctor ? 'flex-start' : 'flex-end' }}>
      <div style={styles.msgMeta}>
        {isDoctor ? '👨‍⚕️' : '🧑'}{' '}
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
          {LANG_FLAGS[srcLang]}
        </span>
      </div>
      <div style={{ ...styles.msgBubble, background: isDoctor ? '#ede9fe' : '#dcfce7' }}>
        <p style={styles.msgOriginal}>{msg.original}</p>
        {msg.original !== msg.translated && (
          <p style={styles.msgTranslated}>
            {LANG_FLAGS[tgtLang]} {msg.translated}
          </p>
        )}
      </div>
      <div style={styles.msgTime}>
        {new Date(msg.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  setupPage: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '24px', fontFamily: "'Inter', sans-serif" },
  setupCard: { background: '#fff', borderRadius: '20px', padding: '48px', maxWidth: '520px', width: '100%', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', textAlign: 'center' },
  title: { fontSize: '24px', fontWeight: 800, color: '#1a1a2e', marginBottom: '12px' },
  subtitle: { fontSize: '14px', color: '#6b7280', marginBottom: '32px' },
  langSetup: { display: 'flex', alignItems: 'center', gap: '16px', justifyContent: 'center', marginBottom: '32px' },
  langSetupCol: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  setupLabel: { fontSize: '13px', fontWeight: 600, color: '#374151' },
  langSelect: { padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', outline: 'none' },
  arrowSep: { fontSize: '24px', color: '#9ca3af', flexShrink: 0, marginTop: '20px' },
  startBtn: { padding: '14px 32px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' },
  page: { display: 'flex', flexDirection: 'column', height: '100vh', padding: '24px', fontFamily: "'Inter', sans-serif", maxWidth: '1000px', margin: '0 auto', boxSizing: 'border-box' },
  header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' },
  sessionInfo: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f3f4f6', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 500 },
  arrow: { color: '#9ca3af' },
  endBtn: { marginLeft: 'auto', padding: '8px 16px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 },
  chatArea: { flex: 1, overflowY: 'auto', background: '#f9fafb', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  emptyChat: { textAlign: 'center', color: '#9ca3af', margin: 'auto', fontSize: '14px' },
  translatingBadge: { alignSelf: 'center', background: '#ede9fe', color: '#5b21b6', padding: '6px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 },
  msgBlock: { display: 'flex', flexDirection: 'column', maxWidth: '70%' },
  msgMeta: { fontSize: '13px', marginBottom: '4px' },
  msgBubble: { padding: '12px 16px', borderRadius: '12px' },
  msgOriginal: { margin: '0 0 4px', fontSize: '14px', color: '#1f2937' },
  msgTranslated: { margin: 0, fontSize: '13px', color: '#6b7280', fontStyle: 'italic', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '6px' },
  msgTime: { fontSize: '11px', color: '#9ca3af', marginTop: '4px' },
  inputPanel: { display: 'flex', gap: '16px', background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  inputCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  inputLabel: { fontSize: '13px', fontWeight: 600, color: '#374151' },
  inputRow: { display: 'flex', gap: '8px' },
  textarea: { flex: 1, border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '10px 12px', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit' },
  sendBtn: { width: '44px', height: '44px', border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  inputDivider: { color: '#e5e7eb', fontSize: '24px', alignSelf: 'center' },
};
