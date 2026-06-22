export type UserRole = 'user' | 'department_user' | 'admin';

export interface Department {
  id: number;
  created_at: string;
  name: string;
  desc: string;
}

export interface Profile {
  id: string; // UUID
  created_at: string;
  full_name: string;
  role: UserRole;
  department_id: number | null;
}

export interface Grievance {
  id: number;
  created_at: string;
  title: string;
  description: string;
  dep_id: number | null;
  status: 'Pending' | 'Needs Review' | 'In Progress' | 'Resolved' | 'Rejected';
  ai_confidance: number | null; // Spelled with 'a' per DB schema
  resolved_at: string | null;
  assigned_by_ai: boolean;
  attachment: string;
  resolved_by: string | null; // UUID of resolver profile
  created_by: string | null; // UUID of creator profile
  
  // Relations for joins
  departments?: Department | null;
  creator?: Profile | null;
  resolver?: Profile | null;
}
