// User Types
export type UserRole = 'field_officer' | 'hod' | 'collector' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  department?: string;
  zone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Visit Types
export type VisitStatus = 'draft' | 'submitted' | 'pending_approval' | 'approved' | 'rejected' | 'completed';

export interface Visit {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  visited_date: string;
  status: VisitStatus;
  created_at: string;
  updated_at: string;
}

// Inspection Types
export type InspectionStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface Inspection {
  id: string;
  visit_id: string;
  inspector_name: string;
  inspection_type: string;
  status: InspectionStatus;
  findings: string;
  recommendations?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

// Photo Types
export interface Photo {
  id: string;
  visit_id: string;
  inspection_id?: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  caption?: string;
  created_at: string;
}

// Signature Types
export interface Signature {
  id: string;
  inspection_id: string;
  signed_by_user_id: string;
  signature_path: string;
  signed_at: string;
  signature_type: 'inspector' | 'hod' | 'collector';
}

// Approval Types
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: string;
  inspection_id: string;
  approver_id: string;
  approver_role: UserRole;
  status: ApprovalStatus;
  comments?: string;
  approved_at?: string;
  created_at: string;
}

// Analytics Types
export interface AnalyticsData {
  total_visits: number;
  completed_visits: number;
  pending_approvals: number;
  rejection_rate: number;
  visits_by_date: Array<{ date: string; count: number }>;
  visits_by_status: Record<VisitStatus, number>;
}

// Authentication Types
export interface AuthSession {
  user: User | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null;
}

// Form Types
export interface CreateVisitForm {
  title: string;
  description?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  visited_date: string;
}

export interface CreateInspectionForm {
  inspector_name: string;
  inspection_type: string;
  findings: string;
  recommendations?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}
