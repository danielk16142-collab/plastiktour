import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getPatients, upsertPatient, deletePatient } from '../../../backend/crm.web';
import type { Patient, PatientStatus, ProcedureType, Language } from '../../../types';

const STATUS_COLORS: Record<PatientStatus, string> = {
  lead: '#8b5cf6',
  consultation_scheduled: '#3b82f6',
  consultation_done: '#06b6d4',
  preop: '#f59e0b',
  surgery_scheduled: '#f97316',
  postop: '#10b981',
  follow_up_complete: '#6b7280',
};

const EMPTY_PATIENT: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'> = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  preferredLanguage: 'es',
  status: 'lead',
  bddRiskFlag: false,
};

export default function PatientsPage() {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<PatientStatus | 'all'>('all');
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState(EMPTY_PATIENT);
  const [showModal, setShowModal] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    const data = await getPatients({
      search: search || undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
    });
    setPatients(data);
    setLoading(false);
  }, [search, filterStatus]);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_PATIENT);
    setShowModal(true);
  };

  const openEdit = (p: Patient) => {
    setEditing(p);
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = p;
    setForm(rest);
    setShowModal(true);
  };

  const handleSave = async () => {
    const id = editing?.id ?? `patient_${Date.now()}`;
    await upsertPatient({ id, ...form });
    setShowModal(false);
    void fetchPatients();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.confirm') + '?')) return;
    await deletePatient(id);
    void fetchPatients();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>{t('patients.title')}</h1>
        <button onClick={openCreate} style={styles.primaryBtn}>
          + {t('patients.addPatient')}
        </button>
      </div>

      <div style={styles.filters}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('patients.searchPlaceholder')}
          style={styles.searchInput}
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as PatientStatus | 'all')}
          style={styles.select}
        >
          <option value="all">{t('common.all')}</option>
          {Object.keys(STATUS_COLORS).map((s) => (
            <option key={s} value={s}>
              {t(`patients.status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={styles.loading}>{t('common.loading')}</p>
      ) : patients.length === 0 ? (
        <p style={styles.empty}>{t('common.noData')}</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Nombre', 'Email', 'Teléfono', 'Idioma', 'Procedimiento', 'Estado', 'BDD', ''].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>{p.firstName} {p.lastName}</strong>
                  </td>
                  <td style={styles.td}>{p.email}</td>
                  <td style={styles.td}>{p.phone}</td>
                  <td style={styles.td}>{p.preferredLanguage.toUpperCase()}</td>
                  <td style={styles.td}>
                    {p.procedure ? t(`patients.procedures.${p.procedure}`) : '—'}
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      background: STATUS_COLORS[p.status] + '20',
                      color: STATUS_COLORS[p.status],
                    }}>
                      {t(`patients.status.${p.status}`)}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {p.bddRiskFlag && <span style={styles.bddBadge}>⚠️ BDD</span>}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button onClick={() => openEdit(p)} style={styles.iconBtn}>✏️</button>
                      <button onClick={() => void handleDelete(p.id)} style={styles.iconBtn}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>
              {editing ? t('common.edit') : t('patients.addPatient')}
            </h2>
            <div style={styles.modalForm}>
              {(
                [
                  ['firstName', t('patients.fields.firstName')],
                  ['lastName', t('patients.fields.lastName')],
                  ['email', t('patients.fields.email')],
                  ['phone', t('patients.fields.phone')],
                ] as [keyof typeof form, string][]
              ).map(([field, label]) => (
                <div key={field} style={styles.formField}>
                  <label style={styles.formLabel}>{label}</label>
                  <input
                    value={form[field] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    style={styles.formInput}
                  />
                </div>
              ))}

              <div style={styles.formField}>
                <label style={styles.formLabel}>{t('patients.fields.preferredLanguage')}</label>
                <select
                  value={form.preferredLanguage}
                  onChange={(e) => setForm((f) => ({ ...f, preferredLanguage: e.target.value as Language }))}
                  style={styles.formInput}
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>{t('patients.fields.procedure')}</label>
                <select
                  value={form.procedure ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, procedure: e.target.value as ProcedureType || undefined }))}
                  style={styles.formInput}
                >
                  <option value="">—</option>
                  {(['rhinoplasty','breast_augmentation','liposuction','facelift','blepharoplasty','abdominoplasty','brow_lift','other'] as ProcedureType[]).map((p) => (
                    <option key={p} value={p}>{t(`patients.procedures.${p}`)}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>{t('patients.fields.bddRisk')}</label>
                <input
                  type="checkbox"
                  checked={form.bddRiskFlag}
                  onChange={(e) => setForm((f) => ({ ...f, bddRiskFlag: e.target.checked }))}
                />
              </div>

              <div style={styles.formField}>
                <label style={styles.formLabel}>{t('patients.fields.notes')}</label>
                <textarea
                  value={form.surgeonNotes ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, surgeonNotes: e.target.value }))}
                  rows={3}
                  style={{ ...styles.formInput, resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={styles.modalActions}>
              <button onClick={() => setShowModal(false)} style={styles.cancelBtn}>
                {t('common.cancel')}
              </button>
              <button onClick={() => void handleSave()} style={styles.primaryBtn}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '32px', fontFamily: "'Inter', sans-serif", maxWidth: '1400px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  primaryBtn: { padding: '10px 20px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' },
  filters: { display: 'flex', gap: '12px', marginBottom: '20px' },
  searchInput: { flex: 1, padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  select: { padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  loading: { textAlign: 'center', color: '#6b7280', padding: '40px' },
  empty: { textAlign: 'center', color: '#9ca3af', padding: '40px' },
  tableWrapper: { overflowX: 'auto', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px 16px', background: '#f9fafb', fontSize: '12px', fontWeight: 600, color: '#6b7280', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#374151' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 },
  bddBadge: { background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 },
  actions: { display: 'flex', gap: '4px' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  modal: { background: '#fff', borderRadius: '16px', padding: '32px', width: '540px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' },
  modalTitle: { fontSize: '20px', fontWeight: 700, color: '#1a1a2e', marginBottom: '24px' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formField: { display: 'flex', flexDirection: 'column', gap: '6px' },
  formLabel: { fontSize: '13px', fontWeight: 500, color: '#374151' },
  formInput: { padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', width: '100%' },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' },
  cancelBtn: { padding: '10px 20px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontWeight: 500, cursor: 'pointer' },
};
