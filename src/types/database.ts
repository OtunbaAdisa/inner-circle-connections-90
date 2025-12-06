export type AppRole = 'super_admin' | 'admin' | 'participant';

export type AgeBand = 'trailblazers' | 'creatives' | 'luminaries' | 'pillars' | 'icons';

export type CircleLevel = 'outer' | 'middle' | 'inner';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  force_password_change: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Event {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  end_time: string;
  qr_code_url: string | null;
  status: 'upcoming' | 'active' | 'ended';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgeBandLogo {
  id: string;
  event_id: string;
  band_name: AgeBand;
  logo_url: string;
  created_at: string;
}

export interface PhysicalTable {
  id: string;
  event_id: string;
  table_name: string;
  number_of_seats: number;
  created_at: string;
}

export interface ParticipantProfile {
  id: string;
  user_id: string;
  event_id: string;
  full_name: string;
  birthday: string;
  age: number;
  age_band: AgeBand;
  selfie_url: string | null;
  virtual_seat_index: number | null;
  circle_level: CircleLevel;
  physical_table_id: string | null;
  physical_seat_number: number | null;
  checked_in_at: string;
  created_at: string;
  updated_at: string;
}

export interface CirclePromotion {
  id: string;
  promoter_id: string;
  target_participant_id: string;
  event_id: string;
  promoted_to: CircleLevel;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  requester_id: string;
  target_id: string;
  event_id: string;
  status: ConnectionStatus;
  message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  event_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ParticipantNote {
  id: string;
  author_id: string;
  target_participant_id: string;
  event_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface ParticipantWithPromotion extends ParticipantProfile {
  promotion?: CirclePromotion;
  myPromotedLevel?: CircleLevel;
}

export interface ConnectionWithParticipant extends Connection {
  requester_profile?: ParticipantProfile;
  target_profile?: ParticipantProfile;
  age_band_logo?: string;
}

// Age band display info
export const AGE_BAND_INFO: Record<AgeBand, { label: string; range: string; color: string }> = {
  trailblazers: { label: 'Trailblazers', range: '13-24', color: 'bg-emerald-500' },
  creatives: { label: 'Creatives', range: '25-40', color: 'bg-blue-500' },
  luminaries: { label: 'Luminaries', range: '41-55', color: 'bg-purple-500' },
  pillars: { label: 'Pillars', range: '56-65', color: 'bg-amber-500' },
  icons: { label: 'Icons', range: '65+', color: 'bg-rose-500' },
};

// Calculate age from birthday
export function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Get age band from age
export function getAgeBand(age: number): AgeBand {
  if (age >= 13 && age <= 24) return 'trailblazers';
  if (age >= 25 && age <= 40) return 'creatives';
  if (age >= 41 && age <= 55) return 'luminaries';
  if (age >= 56 && age <= 65) return 'pillars';
  return 'icons';
}
