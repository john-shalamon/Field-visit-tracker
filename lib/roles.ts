import { UserRole } from '@/types';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  field_officer: [
    'create_visit',
    'edit_own_visit',
    'submit_visit',
    'view_own_visits',
    'capture_photo',
    'add_inspection',
  ],
  field_visitor: [
    'create_visit',
    'edit_own_visit',
    'submit_visit',
    'view_own_visits',
    'capture_photo',
    'add_inspection',
  ],
  collector: [
    'create_visit',
    'edit_own_visit',
    'submit_visit',
    'view_own_visits',
    'capture_photo',
  ],
  hod: [
    'view_all_visits',
    'approve_visit',
    'reject_visit',
    'view_reports',
    'view_approvals',
  ],
  admin: [
    'view_all_visits',
    'manage_users',
    'manage_roles',
    'approve_visit',
    'reject_visit',
    'view_reports',
    'export_data',
    'view_analytics',
  ],
};

export const hasPermission = (role: UserRole | undefined, permission: string): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

export const isAdmin = (role?: UserRole) => role === 'admin';
export const isHOD = (role?: UserRole) => role === 'hod';
export const isOfficer = (role?: UserRole) =>
  role === 'field_officer' || role === 'field_visitor' || role === 'collector';
