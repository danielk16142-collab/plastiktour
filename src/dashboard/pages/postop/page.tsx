import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPostOpCheckIns, upsertPostOpCheckIn } from '../../../backend/crm.web';
import { sendPostOpCheckIn, sendUrgentAlert } from '../../../backend/whatsapp.web';
import { generatePostOpMessage } from '../../../backend/claude.web';
import type { PostOpCheckIn, Language } from '../../../types';

const URGENCY_COLORS = {
  normal: { bg: '#dcfce7', text: '#166534', label: 'Normal' },
  monitor: { bg: '#fef3c7', text: '#92400e', label: 'Monitorear' },
  urgent: { bg: '#fee2e2', text: '#991b1b', label: 'URGENTE' },
};

const DAY_LABELS: Record<number, string> = {
  1: 'Día 1',
  7: 'Semana 1',
  30: 'Mes 1',
  90: '3 Meses',
};

export default function PostOpPage() {
  const { t } = useTranslation();
  const [checkIns, setCheckIns] = useState<PostOpCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'flagged'>('all');
  const [selected, setSelected] = useState<PostOpCheckIn | null>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchCheckIns = useCallback(async () => {
    setLoading(true);
    const data = await getPostOpCheckIns({
      flaggedOnly: filter === 'flagged',
      pending: filter === 'pending',
    });
    setCheckIns(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    void fetchCheckIns();
  }, [fetchCheckIns]);

  const handleGenerateResponse = async (checkIn: PostOpCheckIn) => {
    setSelected(checkIn);
    setAiLoading(true);
    setAiResponse('');

    const lang: Language = 'es';
    const result = await generatePostOpMessage(checkIn, lang);
    setAiResponse(result.message);

    if (result.urgencyLevel !== 'normal') {
      await upsertPostOpCheckIn({ ...checkIn, flaggedForReview: true });
      void fetchCheckIns();
    }

    setAiLoading(false);
  };

  const handleSendWhatsApp = async (checkIn: PostOpCheckIn) => {
    const phone = prompt('Teléfono del paciente (con código de país):');
    if (!phone) return;

    await sendPostOpCheckIn(checkIn, phone, 'es', 'Dr. García');
    alert('✅ Mensaje de seguimiento enviado por WhatsApp');
  };

  const handleFlagUrgent = async (checkIn: PostOpCheckIn) => {
    const phone = prompt('Teléfono de emergencia del paciente:');
    if (!phone) return;

    await sendUrgentAlert(phone, checkIn.patientName, '+52 55 0000 0000', 'es');
    await upsertPostOpCheckIn({ ...checkIn, flaggedForReview: true });
    void fetchCheckIns();
    alert('🚨 Alerta de urgencia enviada');
  };

  const handleComplete = async (checkIn: PostOpCheckIn) => {
    await upsertPostOpCheckIn({
      ...checkIn,
      completedAt: new Date().toISOString(),
      response: aiResponse || undefined,
    });
    setSelected(null);
    setAiResponse('');
    void fetchCheckIns();
  };

  const pendingCount = checkIns.filter((c) => !c.completedAt).length;
  const flaggedCount = checkIns.filter((c) => c.flaggedForReview).length;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t('postop.title')}</h1>
          <div style={styles.badges}>
            <span style={{ ...styles.badge, background: '#fef3c7', color: '#92400e' }}>
              ⏳ {pendingCount} pendientes
            </span>
            {flaggedCount > 0 && (
              <span style={{ ...styles.badge, background: '#fee2e2', color: '#991b1b' }}>
                🚨 {flaggedCount} urgentes
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={styles.filterBar}>
        {(['all', 'pending', 'flagged'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{ ...styles.filterBtn, ...(filter === f ? styles.filterBtnActive : {}) }}
          >
            {f === 'all' ? t('common.all') : f === 'pending' ? 'Pendientes' : '🚨 Urgentes'}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={styles.info}>{t('common.loading')}</p>
      ) : checkIns.length === 0 ? (
        <p style={styles.info}>{t('common.noData')}</p>
      ) : (
        <div style={styles.list}>
          {checkIns.map((c) => (
            <div
              key={c.id}
              style={{
                ...styles.card,
                ...(c.flaggedForReview ? styles.cardFlagged : {}),
                ...(!!c.completedAt ? styles.cardDone : {}),
              }}
            >
              <div style={styles.cardHeader}>
                <div>
                  <strong style={styles.patientName}>{c.patientName}</strong>
                  <span style={styles.dayTag}>{DAY_LABELS[c.checkInDay]}</span>
                  {c.flaggedForReview && (
                    <span style={{ ...styles.urgencyTag, ...URGENCY_COLORS.urgent }}>
                      🚨 URGENTE
                    </span>
                  )}
                  {c.completedAt && (
                    <span style={{ ...styles.urgencyTag, background: '#dcfce7', color: '#166534' }}>
                      ✓ Completado
                    </span>
                  )}
                </div>
                <span style={styles.date}>
                  {new Date(c.scheduledAt).toLocaleDateString('es-MX')}
                </span>
              </div>

              {(c.symptoms || c.painLevel !== undefined) && (
                <div style={styles.symptoms}>
                  {c.symptoms && <span>🩺 {c.symptoms}</span>}
                  {c.painLevel !== undefined && (
                    <span style={{ color: c.painLevel >= 7 ? '#ef4444' : c.painLevel >= 4 ? '#f59e0b' : '#10b981' }}>
                      💊 Dolor: {c.painLevel}/10
                    </span>
                  )}
                </div>
              )}

              {!c.completedAt && (
                <div style={styles.cardActions}>
                  <button
                    onClick={() => void handleGenerateResponse(c)}
                    style={styles.actionBtn}
                  >
                    🤖 Generar Respuesta IA
                  </button>
                  <button
                    onClick={() => void handleSendWhatsApp(c)}
                    style={{ ...styles.actionBtn, background: '#25d366', color: '#fff' }}
                  >
                    💬 Enviar WhatsApp
                  </button>
                  {!c.flaggedForReview && (
                    <button
                      onClick={() => void handleFlagUrgent(c)}
                      style={{ ...styles.actionBtn, background: '#fee2e2', color: '#991b1b' }}
                    >
                      🚨 Urgente
                    </button>
                  )}
                  {selected?.id === c.id && aiResponse && (
                    <button
                      onClick={() => void handleComplete(c)}
                      style={{ ...styles.actionBtn, background: '#10b981', color: '#fff' }}
                    >
                      ✓ Marcar Completo
                    </button>
                  )}
                </div>
              )}

              {selected?.id === c.id && (
                <div style={styles.aiBox}>
                  {aiLoading ? (
                    <p style={{ color: '#6b7280' }}>🤖 Generando respuesta...</p>
                  ) : (
                    <>
                      <p style={styles.aiLabel}>Respuesta sugerida por IA:</p>
                      <p style={styles.aiText}>{aiResponse}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '32px', fontFamily: "'Inter', sans-serif", maxWidth: '1000px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' },
  badges: { display: 'flex', gap: '8px' },
  badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 },
  filterBar: { display: 'flex', gap: '8px', marginBottom: '24px' },
  filterBtn: { padding: '8px 18px', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 500, fontSize: '13px' },
  filterBtnActive: { background: '#667eea', color: '#fff', borderColor: '#667eea' },
  info: { textAlign: 'center', color: '#9ca3af', padding: '40px' },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: '4px solid #e5e7eb' },
  cardFlagged: { borderLeft: '4px solid #ef4444', background: '#fff5f5' },
  cardDone: { opacity: 0.6 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  patientName: { fontSize: '16px', color: '#1a1a2e', marginRight: '8px' },
  dayTag: { background: '#ede9fe', color: '#5b21b6', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, marginRight: '6px' },
  urgencyTag: { padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 },
  date: { fontSize: '12px', color: '#9ca3af' },
  symptoms: { display: 'flex', gap: '16px', fontSize: '13px', color: '#4b5563', marginBottom: '12px' },
  cardActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  actionBtn: { padding: '7px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#374151', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
  aiBox: { marginTop: '12px', padding: '12px 16px', background: '#f0f4ff', borderRadius: '8px', borderLeft: '3px solid #667eea' },
  aiLabel: { fontSize: '12px', fontWeight: 600, color: '#667eea', marginBottom: '6px' },
  aiText: { fontSize: '14px', color: '#374151', margin: 0, lineHeight: '1.6' },
};
