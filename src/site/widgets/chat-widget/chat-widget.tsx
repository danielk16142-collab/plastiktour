import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../../i18n';
import type { ChatMessage, Language } from '../../../types';

interface ChatWidgetProps {
  clinicName?: string;
  defaultLanguage?: Language;
  accentColor?: string;
}

export default function ChatWidget({
  clinicName = 'PlastiKTour',
  defaultLanguage = 'es',
  accentColor = '#667eea',
}: ChatWidgetProps) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [bddWarning, setBddWarning] = useState(false);
  const [sessionId] = useState(() => `chat_${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language, i18n]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: ChatMessage = {
        role: 'assistant',
        content: t('chatbot.greeting', { clinicName }),
        timestamp: new Date().toISOString(),
        language,
      };
      setMessages([greeting]);
    }
  }, [isOpen, clinicName, language, t, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
      language,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          messages: [...messages, userMsg],
          language,
          clinicName,
        }),
      });

      const data = (await res.json()) as {
        reply: string;
        bddFlagged: boolean;
      };

      if (data.bddFlagged) setBddWarning(true);

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        language,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '...',
          timestamp: new Date().toISOString(),
          language,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <div style={styles.root}>
      {isOpen && (
        <div style={styles.window}>
          <div style={{ ...styles.header, background: accentColor }}>
            <div style={styles.headerInfo}>
              <div style={styles.avatar}>💎</div>
              <div>
                <div style={styles.headerName}>{clinicName}</div>
                <div style={styles.headerStatus}>● Online</div>
              </div>
            </div>
            <div style={styles.headerActions}>
              <div style={styles.langSwitcher}>
                {(['es', 'en', 'fr'] as Language[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => changeLanguage(l)}
                    style={{
                      ...styles.langBtn,
                      ...(language === l ? styles.langBtnActive : {}),
                    }}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
              <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>
          </div>

          {bddWarning && (
            <div style={styles.bddBanner}>
              ⚠️ Nuestro equipo revisará esta consulta antes de agendar. Tu bienestar es nuestra
              prioridad.
            </div>
          )}

          <div style={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.msgWrapper,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                {msg.role === 'assistant' && <div style={styles.botAvatar}>💎</div>}
                <div
                  style={{
                    ...styles.bubble,
                    ...(msg.role === 'user'
                      ? { ...styles.userBubble, background: accentColor }
                      : styles.botBubble),
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ ...styles.msgWrapper, justifyContent: 'flex-start' }}>
                <div style={styles.botAvatar}>💎</div>
                <div style={{ ...styles.bubble, ...styles.botBubble, ...styles.typingBubble }}>
                  <span style={styles.dot} />
                  <span style={{ ...styles.dot, animationDelay: '0.2s' }} />
                  <span style={{ ...styles.dot, animationDelay: '0.4s' }} />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div style={styles.inputArea}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chatbot.placeholder')}
              rows={1}
              style={styles.textarea}
            />
            <button
              onClick={() => void sendMessage()}
              disabled={!input.trim() || isTyping}
              style={{
                ...styles.sendBtn,
                background: accentColor,
                opacity: !input.trim() || isTyping ? 0.5 : 1,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((o) => !o)}
        style={{ ...styles.fab, background: accentColor }}
        aria-label="Open chat"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      <style>{dotAnimation}</style>
    </div>
  );
}

const dotAnimation = `
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}`;

const styles: Record<string, React.CSSProperties> = {
  root: { position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, fontFamily: "'Inter', sans-serif" },
  fab: {
    width: '60px', height: '60px', borderRadius: '50%', border: 'none',
    color: '#fff', fontSize: '24px', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s',
  },
  window: {
    position: 'absolute', bottom: '76px', right: 0,
    width: '360px', height: '520px',
    background: '#fff', borderRadius: '16px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  header: { padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '38px', height: '38px', background: 'rgba(255,255,255,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' },
  headerName: { color: '#fff', fontWeight: 700, fontSize: '14px' },
  headerStatus: { color: 'rgba(255,255,255,0.8)', fontSize: '11px' },
  headerActions: { display: 'flex', alignItems: 'center', gap: '8px' },
  langSwitcher: { display: 'flex', gap: '4px' },
  langBtn: { padding: '2px 6px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' },
  langBtnActive: { background: 'rgba(255,255,255,0.5)', fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' },
  bddBanner: { background: '#fff3cd', color: '#856404', padding: '8px 14px', fontSize: '12px', borderBottom: '1px solid #ffc107' },
  messages: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  msgWrapper: { display: 'flex', alignItems: 'flex-end', gap: '8px' },
  botAvatar: { width: '28px', height: '28px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 },
  bubble: { maxWidth: '240px', padding: '10px 14px', borderRadius: '16px', fontSize: '13px', lineHeight: '1.5', wordBreak: 'break-word' },
  botBubble: { background: '#f3f4f6', color: '#1f2937', borderBottomLeftRadius: '4px' },
  userBubble: { color: '#fff', borderBottomRightRadius: '4px' },
  typingBubble: { display: 'flex', gap: '4px', alignItems: 'center', padding: '12px 16px' },
  dot: { width: '8px', height: '8px', background: '#9ca3af', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out' },
  inputArea: { padding: '12px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '8px', alignItems: 'flex-end' },
  textarea: { flex: 1, border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', resize: 'none', outline: 'none', fontFamily: 'inherit', maxHeight: '80px', overflowY: 'auto' },
  sendBtn: { width: '40px', height: '40px', borderRadius: '10px', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
};
