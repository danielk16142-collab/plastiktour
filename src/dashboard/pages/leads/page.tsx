import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLeads, upsertLead, convertLeadToPatient } from '../../../backend/crm.web';
import { qualifyLead } from '../../../backend/claude.web';
import type { Lead, Language, ProcedureType } from '../../../types';

const SCORE_COLOR = (score: number) =>
  score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

export default function LeadsPage() {
  const { t } = useTranslation();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [qualifying, setQualifying] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const data = await getLeads();
    setLeads(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  const handleQualify = async (lead: Lead) => {
    setQualifying(lead.id);
    const result = await qualifyLead(lead);
    await upsertLead({
      ...lead,
      qualificationScore: result.score,
      qualificationNotes: result.notes,
    });
    void fetchLeads();
    setQualifying(null);
  };

  const handleConvert = async (leadId: string) => {
    if (!confirm('¿Convertir este prospecto en paciente?')) return;
    const patient = await convertLeadToPatient(leadId);
    if (patient) {
      alert(`✅ Paciente creado: ${patient.firstName} ${patient.lastName}`);
      void fetchLeads();
    }
  };

  const handleAddDemo = async () => {
    const demo: Lead = {
      id: `lead_${Date.now()}`,
      name: 'María González',
      email: 'maria@ejemplo.com',
      phone: '+52 55 1234 5678',
      preferredLanguage: 'es' as Language,
      interestedProcedure: 'rhinoplasty' as ProcedureType,
      source: 'chatbot',
      qualificationScore: 0,
      qualificationNotes: '',
      convertedToPatient: false,
      createdAt: new Date().toISOString(),
    };
    await upsertLead(demo);
    void fetchLeads();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>{t('leads.title')}</h1>
        <button onClick={() => void handleAddDemo()} style={styles.primaryBtn}>
          + Demo Lead
        </button>
      </div>

      {loading ? (
        <p style={styles.info}>{t('common.loading')}</p>
      ) : leads.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🎯</div>
          <p style={styles.emptyText}>No hay prospectos aún.</p>
          <p style={styles.emptySubtext}>
            Los prospectos aparecerán aquí cuando un paciente use el chatbot o formulario de
            contacto.
          </p>
        </div>
      ) : (
        <div style={styles.leadsList}>
          {leads.map((lead) => (
            <div
              key={lead.id}
              style={{
                ...styles.leadCard,
                ...(lead.convertedToPatient ? styles.convertedCard : {}),
              }}
            >
              <div style={styles.leadHeader}>
                <div>
                  <strong style={styles.leadName}>{lead.name}</strong>
                  {lead.convertedToPatient && (
                    <span style={styles.convertedBadge}>✓ Convertido</span>
                  )}
                </div>
                <div
                  style={{
                    ...styles.scoreCircle,
                    background: SCORE_COLOR(lead.qualificationScore),
                  }}
                >
                  {lead.qualificationScore}
                </div>
              </div>

              <div style={styles.leadDetails}>
                <span>📧 {lead.email}</span>
                <span>📱 {lead.phone}</span>
                <span>🌐 {lead.preferredLanguage.toUpperCase()}</span>
                {lead.interestedProcedure && (
                  <span>💉 {t(`patients.procedures.${lead.interestedProcedure}`)}</span>
                )}
                <span style={styles.sourceBadge}>
                  {lead.source === 'chatbot' && '🤖 '}
                  {lead.source === 'whatsapp' && '💬 '}
                  {lead.source === 'form' && '📋 '}
                  {lead.source === 'referral' && '👥 '}
                  {t(`leads.source.${lead.source}`)}
                </span>
              </div>

              {lead.qualificationNotes && (
                <p style={styles.notes}>💡 {lead.qualificationNotes}</p>
              )}

              {!lead.convertedToPatient && (
                <div style={styles.leadActions}>
                  <button
                    onClick={() => void handleQualify(lead)}
                    disabled={qualifying === lead.id}
                    style={styles.qualifyBtn}
                  >
                    {qualifying === lead.id ? '⏳ Calificando...' : `🤖 ${t('leads.qualify')}`}
                  </button>
                  {lead.qualificationScore >= 50 && (
                    <button
                      onClick={() => void handleConvert(lead.id)}
                      style={styles.convertBtn}
                    >
                      👤 {t('leads.convertToPatient')}
                    </button>
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
  page: { padding: '32px', fontFamily: "'Inter', sans-serif", maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  primaryBtn: { padding: '10px 20px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' },
  info: { textAlign: 'center', color: '#9ca3af', padding: '40px' },
  emptyState: { textAlign: 'center', padding: '60px 24px' },
  emptyIcon: { fontSize: '48px', marginBottom: '16px' },
  emptyText: { fontSize: '18px', fontWeight: 600, color: '#374151' },
  emptySubtext: { fontSize: '14px', color: '#9ca3af', maxWidth: '400px', margin: '8px auto 0' },
  leadsList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  leadCard: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: '4px solid #667eea' },
  convertedCard: { opacity: 0.7, borderLeft: '4px solid #10b981' },
  leadHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  leadName: { fontSize: '17px', color: '#1a1a2e', marginRight: '8px' },
  convertedBadge: { background: '#dcfce7', color: '#166534', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 },
  scoreCircle: { width: '44px', height: '44px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '15px', flexShrink: 0 },
  leadDetails: { display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: '#4b5563', marginBottom: '8px' },
  sourceBadge: { background: '#f3f4f6', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' },
  notes: { fontSize: '13px', color: '#6b7280', background: '#f9fafb', padding: '8px 12px', borderRadius: '8px', margin: '8px 0' },
  leadActions: { display: 'flex', gap: '8px', marginTop: '12px' },
  qualifyBtn: { padding: '8px 16px', background: '#ede9fe', color: '#5b21b6', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' },
  convertBtn: { padding: '8px 16px', background: '#dcfce7', color: '#166534', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' },
};
