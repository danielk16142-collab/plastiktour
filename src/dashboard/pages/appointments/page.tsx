import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getAppointments,
  upsertAppointment,
  cancelAppointment,
  getWaitlist,
  addToWaitlist,
  getMatchingWaitlistPatients,
} from '../../../backend/crm.web';
import { scheduleReminders, notifyWaitlistPatient } from '../../../backend/whatsapp.web';
import type { Appointment, WaitlistEntry, Language, ProcedureType } from '../../../types';

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#3b82f6',
  confirmed: '#10b981',
  cancelled: '#ef4444',
  no_show: '#f97316',
  completed: '#6b7280',
};

export default function AppointmentsPage() {
  const { t } = useTranslation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'appointments' | 'waitlist'>('appointments');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [appts, wl] = await Promise.all([
      getAppointments(selectedDate),
      getWaitlist(),
    ]);
    setAppointments(appts);
    setWaitlist(wl);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleCancel = async (appt: Appointment) => {
    if (!confirm('¿Cancelar esta cita?')) return;
    await cancelAppointment(appt.id);

    const matching = await getMatchingWaitlistPatients(appt.procedure ?? '', appt.date);
    if (matching.length > 0) {
      const first = matching[0];
      if (confirm(`¿Notificar a ${first.patientName} de la lista de espera?`)) {
        await notifyWaitlistPatient(first, appt.date);
        alert(`✅ ${first.patientName} fue notificado/a por WhatsApp`);
      }
    }

    void fetchData();
  };

  const handleConfirm = async (appt: Appointment) => {
    await upsertAppointment({ ...appt, status: 'confirmed' });
    void fetchData();
  };

  const handleScheduleReminders = async (appt: Appointment) => {
    const phone = prompt('Teléfono del paciente (con código de país):');
    if (!phone) return;
    await scheduleReminders(appt, phone, appt.patientName, 'es' as Language);
    alert('✅ Recordatorios de WhatsApp programados (24h y 2h antes)');
  };

  const handleAddDemoAppointment = async () => {
    const appt: Appointment = {
      id: `appt_${Date.now()}`,
      patientId: `patient_demo`,
      patientName: 'Ana Martínez',
      date: selectedDate,
      time: '10:00',
      duration: 60,
      type: 'consultation',
      status: 'scheduled',
      procedure: 'rhinoplasty',
    };
    await upsertAppointment(appt);
    void fetchData();
  };

  const handleAddToWaitlist = async () => {
    const entry: WaitlistEntry = {
      id: `wl_${Date.now()}`,
      patientId: `patient_${Date.now()}`,
      patientName: 'Carlos Pérez',
      phone: '+52 55 9876 5432',
      preferredLanguage: 'es' as Language,
      procedure: 'liposuction' as ProcedureType,
      flexibleDates: true,
      addedAt: new Date().toISOString(),
      notified: false,
    };
    await addToWaitlist(entry);
    void fetchData();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>{t('appointments.title')}</h1>
        <div style={styles.actions}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={styles.dateInput}
          />
          <button onClick={() => void handleAddDemoAppointment()} style={styles.primaryBtn}>
            + Demo Cita
          </button>
        </div>
      </div>

      <div style={styles.viewToggle}>
        <button
          onClick={() => setView('appointments')}
          style={{ ...styles.toggleBtn, ...(view === 'appointments' ? styles.toggleActive : {}) }}
        >
          📅 Citas ({appointments.length})
        </button>
        <button
          onClick={() => setView('waitlist')}
          style={{ ...styles.toggleBtn, ...(view === 'waitlist' ? styles.toggleActive : {}) }}
        >
          ⏳ {t('appointments.waitlist.title')} ({waitlist.length})
        </button>
      </div>

      {loading ? (
        <p style={styles.info}>{t('common.loading')}</p>
      ) : view === 'appointments' ? (
        <div style={styles.list}>
          {appointments.length === 0 ? (
            <p style={styles.info}>No hay citas para esta fecha.</p>
          ) : (
            appointments.map((appt) => (
              <div key={appt.id} style={styles.apptCard}>
                <div style={styles.timeCol}>
                  <strong style={styles.time}>{appt.time}</strong>
                  <span style={styles.duration}>{appt.duration} min</span>
                </div>

                <div style={styles.apptInfo}>
                  <strong style={styles.patientName}>{appt.patientName}</strong>
                  <span style={styles.apptMeta}>
                    {t(`appointments.type.${appt.type}`)}
                    {appt.procedure && ` — ${t(`patients.procedures.${appt.procedure}`)}`}
                  </span>
                  {appt.notes && <span style={styles.notes}>{appt.notes}</span>}
                </div>

                <div style={styles.apptRight}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background: STATUS_COLORS[appt.status] + '20',
                      color: STATUS_COLORS[appt.status],
                    }}
                  >
                    {t(`appointments.status.${appt.status}`)}
                  </span>

                  {appt.status === 'scheduled' && (
                    <div style={styles.apptActions}>
                      <button
                        onClick={() => void handleConfirm(appt)}
                        style={styles.actionBtn}
                      >
                        ✓ Confirmar
                      </button>
                      <button
                        onClick={() => void handleScheduleReminders(appt)}
                        style={{ ...styles.actionBtn, background: '#dcfce7', color: '#166534' }}
                      >
                        💬 Recordatorios
                      </button>
                      <button
                        onClick={() => void handleCancel(appt)}
                        style={{ ...styles.actionBtn, background: '#fee2e2', color: '#991b1b' }}
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          <div style={styles.waitlistHeader}>
            <p style={styles.waitlistDesc}>
              Los pacientes en la lista de espera serán notificados automáticamente cuando se
              libere un espacio compatible.
            </p>
            <button onClick={() => void handleAddToWaitlist()} style={styles.primaryBtn}>
              + Demo Espera
            </button>
          </div>
          {waitlist.length === 0 ? (
            <p style={styles.info}>{t('common.noData')}</p>
          ) : (
            <div style={styles.list}>
              {waitlist.map((entry) => (
                <div key={entry.id} style={styles.waitlistCard}>
                  <div style={styles.apptInfo}>
                    <strong>{entry.patientName}</strong>
                    <span style={styles.apptMeta}>
                      {t(`patients.procedures.${entry.procedure}`)} ·{' '}
                      {entry.phone} · {entry.preferredLanguage.toUpperCase()}
                    </span>
                    <span style={styles.apptMeta}>
                      En espera desde: {new Date(entry.addedAt).toLocaleDateString('es-MX')} ·{' '}
                      {entry.flexibleDates ? '📅 Fechas flexibles' : '📅 Fecha fija'}
                    </span>
                  </div>
                  {entry.notified && (
                    <span style={{ ...styles.statusBadge, background: '#dcfce7', color: '#166534' }}>
                      ✓ Notificado
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '32px', fontFamily: "'Inter', sans-serif", maxWidth: '1000px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  actions: { display: 'flex', gap: '12px', alignItems: 'center' },
  dateInput: { padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' },
  primaryBtn: { padding: '10px 20px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' },
  viewToggle: { display: 'flex', gap: '8px', marginBottom: '20px' },
  toggleBtn: { padding: '10px 20px', border: '1.5px solid #e5e7eb', borderRadius: '10px', background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500 },
  toggleActive: { background: '#667eea', color: '#fff', borderColor: '#667eea' },
  info: { textAlign: 'center', color: '#9ca3af', padding: '40px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  apptCard: { background: '#fff', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', gap: '16px', alignItems: 'flex-start' },
  timeCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '56px' },
  time: { fontSize: '18px', color: '#1a1a2e' },
  duration: { fontSize: '11px', color: '#9ca3af' },
  apptInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
  patientName: { fontSize: '16px', color: '#1a1a2e' },
  apptMeta: { fontSize: '13px', color: '#6b7280' },
  notes: { fontSize: '12px', color: '#9ca3af' },
  apptRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' },
  statusBadge: { padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 },
  apptActions: { display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' },
  actionBtn: { padding: '6px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px', background: '#f9fafb', color: '#374151', cursor: 'pointer', fontSize: '12px', fontWeight: 500 },
  waitlistHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  waitlistDesc: { fontSize: '14px', color: '#6b7280', maxWidth: '500px', margin: 0 },
  waitlistCard: { background: '#fff', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
};
