import type { Appointment, Language, PostOpCheckIn, WaitlistEntry } from '../types';

const WA_API_URL = 'https://graph.facebook.com/v20.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN ?? '';

type TemplateParam = { type: 'text'; text: string };

async function sendWhatsAppMessage(
  to: string,
  templateName: string,
  language: Language,
  components: { type: string; parameters: TemplateParam[] }[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const langCode: Record<Language, string> = {
    es: 'es_MX',
    en: 'en_US',
    fr: 'fr',
  };

  const payload = {
    messaging_product: 'whatsapp',
    to: to.replace(/\D/g, ''),
    type: 'template',
    template: {
      name: templateName,
      language: { code: langCode[language] },
      components,
    },
  };

  const res = await fetch(`${WA_API_URL}/${PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: err };
  }

  const data = (await res.json()) as { messages?: { id: string }[] };
  return { success: true, messageId: data.messages?.[0]?.id };
}

export async function sendAppointmentReminder(
  appointment: Appointment,
  phone: string,
  patientName: string,
  language: Language,
  hoursAhead: 24 | 2
): Promise<{ success: boolean; error?: string }> {
  const templateName =
    hoursAhead === 24 ? 'appointment_reminder_24h' : 'appointment_reminder_2h';

  const params: TemplateParam[] = [
    { type: 'text', text: patientName },
    { type: 'text', text: appointment.date },
    { type: 'text', text: appointment.time },
  ];

  if (hoursAhead === 24) {
    params.splice(1, 0, { type: 'text', text: appointment.type });
  }

  return sendWhatsAppMessage(phone, templateName, language, [
    { type: 'body', parameters: params },
  ]);
}

export async function sendCancellationRecoveryMessage(
  phone: string,
  patientName: string,
  language: Language
): Promise<{ success: boolean; error?: string }> {
  return sendWhatsAppMessage(phone, 'cancellation_recovery', language, [
    { type: 'body', parameters: [{ type: 'text', text: patientName }] },
  ]);
}

export async function notifyWaitlistPatient(
  entry: WaitlistEntry,
  availableDate: string
): Promise<{ success: boolean; error?: string }> {
  const procedureLabels: Record<string, string> = {
    rhinoplasty: 'Rhinoplasty / Rinoplastia',
    breast_augmentation: 'Breast Augmentation / Aumento de Busto',
    liposuction: 'Liposuction / Liposucción',
    facelift: 'Facelift / Lifting Facial',
    blepharoplasty: 'Blepharoplasty / Blefaroplastia',
    abdominoplasty: 'Abdominoplasty / Abdominoplastia',
    brow_lift: 'Brow Lift / Lifting de Cejas',
    other: 'Procedure / Procedimiento',
  };

  return sendWhatsAppMessage(entry.phone, 'waitlist_slot_available', entry.preferredLanguage, [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: entry.patientName },
        { type: 'text', text: procedureLabels[entry.procedure] ?? entry.procedure },
        { type: 'text', text: availableDate },
      ],
    },
  ]);
}

export async function sendPostOpCheckIn(
  checkIn: PostOpCheckIn,
  phone: string,
  language: Language,
  doctorName: string
): Promise<{ success: boolean; error?: string }> {
  const templateByDay: Record<number, string> = {
    1: 'postop_checkin_day1',
    7: 'postop_checkin_week1',
    30: 'postop_checkin_month1',
    90: 'postop_checkin_month3',
  };

  const template = templateByDay[checkIn.checkInDay] ?? 'postop_checkin_day1';

  const params: TemplateParam[] =
    checkIn.checkInDay === 1
      ? [
          { type: 'text', text: checkIn.patientName },
          { type: 'text', text: doctorName },
        ]
      : [{ type: 'text', text: checkIn.patientName }];

  return sendWhatsAppMessage(phone, template, language, [
    { type: 'body', parameters: params },
  ]);
}

export async function sendUrgentAlert(
  phone: string,
  patientName: string,
  emergencyPhone: string,
  language: Language
): Promise<{ success: boolean; error?: string }> {
  return sendWhatsAppMessage(phone, 'urgent_care_alert', language, [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: patientName },
        { type: 'text', text: emergencyPhone },
      ],
    },
  ]);
}

export async function scheduleReminders(
  appointment: Appointment,
  phone: string,
  patientName: string,
  language: Language
): Promise<void> {
  const surgeryDate = new Date(`${appointment.date}T${appointment.time}`);
  const now = new Date();

  const ms24h = surgeryDate.getTime() - 24 * 60 * 60 * 1000 - now.getTime();
  const ms2h = surgeryDate.getTime() - 2 * 60 * 60 * 1000 - now.getTime();

  if (ms24h > 0) {
    setTimeout(
      () => sendAppointmentReminder(appointment, phone, patientName, language, 24),
      ms24h
    );
  }

  if (ms2h > 0) {
    setTimeout(
      () => sendAppointmentReminder(appointment, phone, patientName, language, 2),
      ms2h
    );
  }
}
