import supabase from './supabase';
import { Visit, CreateVisitForm, VisitStatus } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export const visitsService = {
  // Create a new visit
  async createVisit(userId: string, visit: CreateVisitForm) {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }
    try {
      const { data, error } = await supabase
        .from('visits')
        .insert([
          {
            id: uuidv4(),
            user_id: userId,
            ...visit,
            status: 'draft',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Create visit error:', error);
      return { data: null, error };
    }
  },

  // Get all visits for a user
  async getUserVisits(userId: string) {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get user visits error:', error);
      return { data: null, error };
    }
  },

  // Get a single visit
  async getVisit(visitId: string) {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('id', visitId)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get visit error:', error);
      return { data: null, error };
    }
  },

  // Update visit
  async updateVisit(visitId: string, updates: Partial<Visit>) {
    try {
      const { data, error } = await supabase
        .from('visits')
        .update(updates)
        .eq('id', visitId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Update visit error:', error);
      return { data: null, error };
    }
  },

  // Submit visit for approval
  async submitVisit(visitId: string) {
    try {
      const { data, error } = await supabase
        .from('visits')
        .update({ status: 'submitted' as VisitStatus })
        .eq('id', visitId)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Submit visit error:', error);
      return { data: null, error };
    }
  },

  // Get visits pending approval
  async getPendingApprovals(role: string) {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('status', 'submitted')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get pending approvals error:', error);
      return { data: null, error };
    }
  },

  // Approve visit
  async approveVisit(visitId: string, approverId: string) {
    try {
      // Update visit status
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .update({ status: 'approved' as VisitStatus })
        .eq('id', visitId)
        .select()
        .single();

      if (visitError) throw visitError;

      // Create approval record
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert([
          {
            id: uuidv4(),
            inspection_id: visitId,
            approver_id: approverId,
            status: 'approved',
            approved_at: new Date().toISOString(),
          },
        ]);

      if (approvalError) throw approvalError;

      return { data: visitData, error: null };
    } catch (error) {
      console.error('Approve visit error:', error);
      return { data: null, error };
    }
  },

  // Reject visit
  async rejectVisit(visitId: string, approverId: string, comments: string) {
    try {
      // Update visit status
      const { data: visitData, error: visitError } = await supabase
        .from('visits')
        .update({ status: 'rejected' as VisitStatus })
        .eq('id', visitId)
        .select()
        .single();

      if (visitError) throw visitError;

      // Create rejection record
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert([
          {
            id: uuidv4(),
            inspection_id: visitId,
            approver_id: approverId,
            status: 'rejected',
            comments,
          },
        ]);

      if (approvalError) throw approvalError;

      return { data: visitData, error: null };
    } catch (error) {
      console.error('Reject visit error:', error);
      return { data: null, error };
    }
  },

  // Delete visit
  async deleteVisit(visitId: string) {
    try {
      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', visitId);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Delete visit error:', error);
      return { error };
    }
  },

  // Get visits by date range
  async getVisitsByDateRange(userId: string, startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', userId)
        .gte('visited_date', startDate)
        .lte('visited_date', endDate)
        .order('visited_date', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get visits by date range error:', error);
      return { data: null, error };
    }
  },

  // Get visits by status
  async getVisitsByStatus(userId: string, status: VisitStatus) {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', userId)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get visits by status error:', error);
      return { data: null, error };
    }
  },
};

export default visitsService;
