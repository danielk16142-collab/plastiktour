import type {
  Appointment,
  Lead,
  Patient,
  PatientStatus,
  PostOpCheckIn,
  WaitlistEntry,
} from '../types';

// In production these would use Wix Data Collections or an external DB.
// This module defines the interface and mock data for development.

const patientsStore = new Map<string, Patient>();
const appointmentsStore = new Map<string, Appointment>();
const waitlistStore = new Map<string, WaitlistEntry>();
const postOpStore = new Map<string, PostOpCheckIn>();
const leadsStore = new Map<string, Lead>();

// --- Patients ---

export async function getPatients(query?: {
  status?: PatientStatus;
  search?: string;
}): Promise<Patient[]> {
  let patients = Array.from(patientsStore.values());

  if (query?.status) {
    patients = patients.filter((p) => p.status === query.status);
  }

  if (query?.search) {
    const q = query.search.toLowerCase();
    patients = patients.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }

  return patients.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getPatient(id: string): Promise<Patient | null> {
  return patientsStore.get(id) ?? null;
}

export async function upsertPatient(data: Omit<Patient, 'createdAt' | 'updatedAt'>): Promise<Patient> {
  const now = new Date().toISOString();
  const existing = patientsStore.get(data.id);

  const patient: Patient = {
    ...data,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  patientsStore.set(patient.id, patient);
  return patient;
}

export async function deletePatient(id: string): Promise<void> {
  patientsStore.delete(id);
}

// --- Appointments ---

export async function getAppointments(date?: string): Promise<Appointment[]> {
  let appts = Array.from(appointmentsStore.values());
  if (date) {
    appts = appts.filter((a) => a.date === date);
  }
  return appts.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export async function upsertAppointment(data: Appointment): Promise<Appointment> {
  appointmentsStore.set(data.id, data);
  return data;
}

export async function cancelAppointment(id: string): Promise<void> {
  const appt = appointmentsStore.get(id);
  if (appt) {
    appointmentsStore.set(id, { ...appt, status: 'cancelled' });
  }
}

// --- Waitlist ---

export async function getWaitlist(): Promise<WaitlistEntry[]> {
  return Array.from(waitlistStore.values()).sort((a, b) =>
    a.addedAt.localeCompare(b.addedAt)
  );
}

export async function addToWaitlist(entry: WaitlistEntry): Promise<WaitlistEntry> {
  waitlistStore.set(entry.id, entry);
  return entry;
}

export async function removeFromWaitlist(id: string): Promise<void> {
  waitlistStore.delete(id);
}

export async function getMatchingWaitlistPatients(
  procedure: string,
  date: string
): Promise<WaitlistEntry[]> {
  return Array.from(waitlistStore.values()).filter(
    (e) => e.procedure === procedure && !e.notified && (e.flexibleDates || e.addedAt <= date)
  );
}

// --- Post-Op Follow-ups ---

export async function getPostOpCheckIns(filters?: {
  flaggedOnly?: boolean;
  pending?: boolean;
}): Promise<PostOpCheckIn[]> {
  let checkIns = Array.from(postOpStore.values());

  if (filters?.flaggedOnly) {
    checkIns = checkIns.filter((c) => c.flaggedForReview);
  }

  if (filters?.pending) {
    checkIns = checkIns.filter((c) => !c.completedAt);
  }

  return checkIns.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export async function upsertPostOpCheckIn(checkIn: PostOpCheckIn): Promise<PostOpCheckIn> {
  postOpStore.set(checkIn.id, checkIn);
  return checkIn;
}

export async function schedulePostOpCheckIns(
  patientId: string,
  patientName: string,
  surgeryDate: string
): Promise<PostOpCheckIn[]> {
  const days: PostOpCheckIn['checkInDay'][] = [1, 7, 30, 90];
  const base = new Date(surgeryDate);

  const checkIns = days.map((day) => {
    const scheduled = new Date(base);
    scheduled.setDate(scheduled.getDate() + day);

    const checkIn: PostOpCheckIn = {
      id: `postop_${patientId}_day${day}`,
      patientId,
      patientName,
      surgeryDate,
      checkInDay: day,
      scheduledAt: scheduled.toISOString(),
      flaggedForReview: false,
    };

    postOpStore.set(checkIn.id, checkIn);
    return checkIn;
  });

  return checkIns;
}

// --- Leads ---

export async function getLeads(): Promise<Lead[]> {
  return Array.from(leadsStore.values()).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export async function upsertLead(lead: Lead): Promise<Lead> {
  leadsStore.set(lead.id, lead);
  return lead;
}

export async function convertLeadToPatient(leadId: string): Promise<Patient | null> {
  const lead = leadsStore.get(leadId);
  if (!lead) return null;

  const [firstName = '', ...rest] = (lead.name ?? '').split(' ');
  const lastName = rest.join(' ');

  const patient = await upsertPatient({
    id: `patient_${Date.now()}`,
    firstName,
    lastName,
    email: lead.email,
    phone: lead.phone,
    preferredLanguage: lead.preferredLanguage,
    status: 'consultation_scheduled',
    procedure: lead.interestedProcedure,
    bddRiskFlag: false,
  });

  leadsStore.set(leadId, { ...lead, convertedToPatient: true });
  return patient;
}

// --- Dashboard Stats ---

export async function getDashboardStats(): Promise<{
  todayAppointments: number;
  pendingFollowups: number;
  activeLeads: number;
  cancelledThisMonth: number;
  waitlistCount: number;
  revenueAtRisk: number;
}> {
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.slice(0, 7);

  const todayAppointments = Array.from(appointmentsStore.values()).filter(
    (a) => a.date === today && a.status !== 'cancelled'
  ).length;

  const pendingFollowups = Array.from(postOpStore.values()).filter(
    (c) => !c.completedAt && new Date(c.scheduledAt) <= new Date()
  ).length;

  const activeLeads = Array.from(leadsStore.values()).filter(
    (l) => !l.convertedToPatient
  ).length;

  const cancelledThisMonth = Array.from(appointmentsStore.values()).filter(
    (a) => a.status === 'cancelled' && a.date.startsWith(thisMonth)
  ).length;

  const waitlistCount = waitlistStore.size;

  // $1,000/hour surgery average * 4-hour surgery = $4,000 per cancellation
  const revenueAtRisk = cancelledThisMonth * 4000;

  return {
    todayAppointments,
    pendingFollowups,
    activeLeads,
    cancelledThisMonth,
    waitlistCount,
    revenueAtRisk,
  };
}
