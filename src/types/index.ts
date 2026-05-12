export type Language = 'en' | 'es' | 'fr';

export type PatientStatus =
  | 'lead'
  | 'consultation_scheduled'
  | 'consultation_done'
  | 'preop'
  | 'surgery_scheduled'
  | 'postop'
  | 'follow_up_complete';

export type ProcedureType =
  | 'rhinoplasty'
  | 'breast_augmentation'
  | 'liposuction'
  | 'facelift'
  | 'blepharoplasty'
  | 'abdominoplasty'
  | 'brow_lift'
  | 'other';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  preferredLanguage: Language;
  status: PatientStatus;
  procedure?: ProcedureType;
  consultationDate?: string;
  surgeryDate?: string;
  surgeonNotes?: string;
  bddRiskFlag: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  duration: number;
  type: 'consultation' | 'preop' | 'surgery' | 'postop_check';
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'no_show' | 'completed';
  procedure?: ProcedureType;
  notes?: string;
}

export interface WaitlistEntry {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  preferredLanguage: Language;
  procedure: ProcedureType;
  flexibleDates: boolean;
  addedAt: string;
  notified: boolean;
}

export interface PostOpCheckIn {
  id: string;
  patientId: string;
  patientName: string;
  surgeryDate: string;
  checkInDay: 1 | 7 | 30 | 90;
  scheduledAt: string;
  completedAt?: string;
  symptoms?: string;
  painLevel?: number;
  photo?: string;
  flaggedForReview: boolean;
  response?: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferredLanguage: Language;
  interestedProcedure?: ProcedureType;
  source: 'chatbot' | 'form' | 'whatsapp' | 'referral';
  qualificationScore: number;
  qualificationNotes: string;
  convertedToPatient: boolean;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  language: Language;
}

export interface TranslationRequest {
  text: string;
  sourceLang: Language;
  targetLang: Language;
}
