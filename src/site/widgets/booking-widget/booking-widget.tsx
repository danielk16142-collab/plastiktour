import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../../../i18n';
import type { Language, ProcedureType } from '../../../types';

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  procedure: ProcedureType | '';
  preferredDate: string;
  message: string;
  language: Language;
}

const INITIAL_FORM: BookingFormData = {
  name: '',
  email: '',
  phone: '',
  procedure: '',
  preferredDate: '',
  message: '',
  language: 'es',
};

export default function BookingWidget() {
  const { t, i18n } = useTranslation();
  const [form, setForm] = useState<BookingFormData>(INITIAL_FORM);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'language') {
      i18n.changeLanguage(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Submission failed');

      setStatus('success');
      setForm(INITIAL_FORM);
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successIcon}>✓</div>
        <p style={styles.successText}>{t('booking.form.success')}</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{t('booking.title')}</h2>
        <p style={styles.subtitle}>{t('booking.subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.row}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>{t('booking.form.name')}</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder={t('booking.form.name')}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>{t('translator.selectLanguage')}</label>
            <select name="language" value={form.language} onChange={handleChange} style={styles.input}>
              <option value="es">{t('translator.languages.es')}</option>
              <option value="en">{t('translator.languages.en')}</option>
              <option value="fr">{t('translator.languages.fr')}</option>
            </select>
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>{t('booking.form.email')}</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>{t('booking.form.phone')}</label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              required
              style={styles.input}
              placeholder="+1 555 000 0000"
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>{t('booking.form.procedure')}</label>
            <select name="procedure" value={form.procedure} onChange={handleChange} style={styles.input}>
              <option value="">— {t('common.select', 'Select')} —</option>
              <option value="rhinoplasty">{t('patients.procedures.rhinoplasty')}</option>
              <option value="breast_augmentation">{t('patients.procedures.breast_augmentation')}</option>
              <option value="liposuction">{t('patients.procedures.liposuction')}</option>
              <option value="facelift">{t('patients.procedures.facelift')}</option>
              <option value="blepharoplasty">{t('patients.procedures.blepharoplasty')}</option>
              <option value="abdominoplasty">{t('patients.procedures.abdominoplasty')}</option>
              <option value="brow_lift">{t('patients.procedures.brow_lift')}</option>
              <option value="other">{t('patients.procedures.other')}</option>
            </select>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>{t('booking.form.preferredDate')}</label>
            <input
              name="preferredDate"
              type="date"
              value={form.preferredDate}
              onChange={handleChange}
              style={styles.input}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div style={styles.fieldGroupFull}>
          <label style={styles.label}>{t('booking.form.message')}</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={3}
            style={{ ...styles.input, resize: 'vertical' }}
            placeholder={t('booking.form.message')}
          />
        </div>

        {status === 'error' && (
          <p style={styles.errorText}>{t('booking.form.error')}</p>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          style={status === 'submitting' ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
        >
          {status === 'submitting' ? t('booking.form.submitting') : t('booking.form.submit')}
        </button>

        <p style={styles.privacy}>🔒 {t('booking.privacy')}</p>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    maxWidth: '640px',
    margin: '0 auto',
    padding: '32px 24px',
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: { marginBottom: '28px', textAlign: 'center' },
  title: { fontSize: '24px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' },
  subtitle: { fontSize: '14px', color: '#6b7280', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  row: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  fieldGroup: { flex: '1', minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldGroupFull: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: 500, color: '#374151' },
  input: {
    padding: '10px 14px',
    border: '1.5px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1f2937',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: '#fafafa',
    width: '100%',
    boxSizing: 'border-box',
  },
  button: {
    marginTop: '8px',
    padding: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  buttonDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  privacy: { textAlign: 'center', fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' },
  errorText: { color: '#ef4444', fontSize: '13px', textAlign: 'center' },
  successContainer: {
    textAlign: 'center',
    padding: '48px 24px',
    fontFamily: "'Inter', sans-serif",
  },
  successIcon: {
    width: '64px',
    height: '64px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    color: '#fff',
    margin: '0 auto 16px',
  },
  successText: { fontSize: '16px', color: '#374151', fontWeight: 500 },
};
