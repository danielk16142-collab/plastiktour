import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../i18n';
import { getDashboardStats } from '../../backend/crm.web';

interface Stats {
  todayAppointments: number;
  pendingFollowups: number;
  activeLeads: number;
  cancelledThisMonth: number;
  waitlistCount: number;
  revenueAtRisk: number;
}

const STAT_CARDS = [
  { key: 'todayAppointments', label: 'dashboard.todayAppointments', icon: '📅', color: '#667eea' },
  { key: 'pendingFollowups', label: 'dashboard.pendingFollowups', icon: '🔔', color: '#f59e0b', alert: true },
  { key: 'activeLeads', label: 'dashboard.activeLeads', icon: '🎯', color: '#10b981' },
  { key: 'cancelledThisMonth', label: 'dashboard.cancelledThisMonth', icon: '❌', color: '#ef4444' },
  { key: 'waitlistCount', label: 'dashboard.waitlistCount', icon: '⏳', color: '#8b5cf6' },
  { key: 'revenueAtRisk', label: 'dashboard.revenueAtRisk', icon: '💸', color: '#f97316', isCurrency: true },
] as const;

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'es' | 'en' | 'fr'>('es');

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const switchLang = (l: 'es' | 'en' | 'fr') => {
    setLang(l);
    void i18n.changeLanguage(l);
  };

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.title}>{t('app.name')}</h1>
          <p style={styles.subtitle}>{t('dashboard.welcome')} 👋</p>
        </div>
        <div style={styles.langBar}>
          {(['es', 'en', 'fr'] as const).map((l) => (
            <button
              key={l}
              onClick={() => switchLang(l)}
              style={{ ...styles.langBtn, ...(lang === l ? styles.langBtnActive : {}) }}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.statsGrid}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ ...styles.statCard, ...styles.skeleton }} />
            ))
          : STAT_CARDS.map(({ key, label, icon, color, isCurrency }) => {
              const value = stats?.[key as keyof Stats] ?? 0;
              return (
                <div key={key} style={{ ...styles.statCard, borderTop: `4px solid ${color}` }}>
                  <div style={styles.statIcon}>{icon}</div>
                  <div style={styles.statValue}>
                    {isCurrency ? `$${value.toLocaleString()}` : value}
                  </div>
                  <div style={styles.statLabel}>{t(label)}</div>
                </div>
              );
            })}
      </div>

      <div style={styles.quickNav}>
        <h2 style={styles.sectionTitle}>Acciones Rápidas</h2>
        <div style={styles.navGrid}>
          {[
            { icon: '👥', label: t('nav.patients'), href: '/patients' },
            { icon: '📅', label: t('nav.appointments'), href: '/appointments' },
            { icon: '🎯', label: t('nav.leads'), href: '/leads' },
            { icon: '🏥', label: t('nav.postop'), href: '/postop' },
            { icon: '⏳', label: t('nav.waitlist'), href: '/waitlist' },
            { icon: '🌐', label: t('translator.title'), href: '/translator' },
          ].map(({ icon, label, href }) => (
            <a key={href} href={href} style={styles.navCard}>
              <span style={styles.navIcon}>{icon}</span>
              <span style={styles.navLabel}>{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '32px', fontFamily: "'Inter', 'Segoe UI', sans-serif", maxWidth: '1200px', margin: '0 auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
  title: { fontSize: '28px', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  subtitle: { fontSize: '15px', color: '#6b7280', marginTop: '4px' },
  langBar: { display: 'flex', gap: '8px' },
  langBtn: { padding: '6px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: '#fff', color: '#374151', cursor: 'pointer', fontWeight: 500, fontSize: '13px' },
  langBtnActive: { background: '#667eea', color: '#fff', borderColor: '#667eea' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '40px' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' },
  skeleton: { background: '#f3f4f6', animation: 'pulse 1.5s infinite', minHeight: '100px' },
  statIcon: { fontSize: '24px' },
  statValue: { fontSize: '28px', fontWeight: 800, color: '#1a1a2e' },
  statLabel: { fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' },
  sectionTitle: { fontSize: '18px', fontWeight: 700, color: '#374151', marginBottom: '16px' },
  quickNav: {},
  navGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' },
  navCard: { background: '#fff', borderRadius: '12px', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textDecoration: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' },
  navIcon: { fontSize: '28px' },
  navLabel: { fontSize: '13px', fontWeight: 500, color: '#374151', textAlign: 'center' },
};
