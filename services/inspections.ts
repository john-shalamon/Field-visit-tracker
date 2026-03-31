import supabase from './supabase';
import { Inspection, CreateInspectionForm } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const inspectionsService = {
  // Create a new inspection
  async createInspection(visitId: string, inspection: CreateInspectionForm) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    try {
      const { data, error } = await supabase
        .from('inspections')
        .insert([
          {
            id: uuidv4(),
            visit_id: visitId,
            ...inspection,
            status: 'draft',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Create inspection error:', error);
      return { data: null, error };
    }
  },

  // Get inspections for a visit
  async getVisitInspections(visitId: string) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('visit_id', visitId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get visit inspections error:', error);
      return { data: null, error };
    }
  },

  // Get a single inspection
  async getInspection(inspectionId: string) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', inspectionId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get inspection error:', error);
      return { data: null, error };
    }
  },

  // Update inspection
  async updateInspection(inspectionId: string, updates: Partial<Inspection>) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    try {
      const { data, error } = await supabase
        .from('inspections')
        .update(updates)
        .eq('id', inspectionId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Update inspection error:', error);
      return { data: null, error };
    }
  },

  // Submit inspection for approval
  async submitInspection(inspectionId: string) {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    try {
      const { data, error } = await supabase
        .from('inspections')
        .update({ status: 'pending' })
        .eq('id', inspectionId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Submit inspection error:', error);
      return { data: null, error };
    }
  },

  // Get pending inspections
  async getPendingInspections() {
    if (!supabase) return { data: null, error: { message: 'Supabase not configured' } };
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get pending inspections error:', error);
      return { data: null, error };
    }
  },

  // Approve inspection
  async approveInspection(inspectionId: string, approver_id: string) {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .update({ status: 'approved' })
        .eq('id', inspectionId)
        .select()
        .single();

      if (error) throw error;

      // Create approval record
      await supabase
        .from('approvals')
        .insert([
          {
            id: uuidv4(),
            inspection_id: inspectionId,
            approver_id,
            approver_role: 'hod',
            status: 'approved',
            approved_at: new Date().toISOString(),
          },
        ]);

      return { data, error: null };
    } catch (error) {
      console.error('Approve inspection error:', error);
      return { data: null, error };
    }
  },

  // Reject inspection
  async rejectInspection(inspectionId: string, approver_id: string, comments: string) {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .update({ status: 'rejected' })
        .eq('id', inspectionId)
        .select()
        .single();

      if (error) throw error;

      // Create rejection record
      await supabase
        .from('approvals')
        .insert([
          {
            id: uuidv4(),
            inspection_id: inspectionId,
            approver_id,
            approver_role: 'hod',
            status: 'rejected',
            comments,
          },
        ]);

      return { data, error: null };
    } catch (error) {
      console.error('Reject inspection error:', error);
      return { data: null, error };
    }
  },

  // Delete inspection
  async deleteInspection(inspectionId: string) {
    try {
      const { error } = await supabase
        .from('inspections')
        .delete()
        .eq('id', inspectionId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Delete inspection error:', error);
      return { error };
    }
  },

  // Get inspections by severity
  async getInspectionsBySeverity(severity: string) {
    try {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('severity', severity)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get inspections by severity error:', error);
      return { data: null, error };
    }
  },
};

export default inspectionsService;
