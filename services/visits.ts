import { Visit, CreateVisitForm, VisitStatus } from '@/types';
import { VisitStorage, OfflineQueue, SyncStatus } from './localStorage';
import { v4 as uuidv4 } from 'uuid';

export const visitsService = {
  // Create a new visit
  async createVisit(userId: string, visit: CreateVisitForm) {
    try {
      const localVisit: Visit = {
        id: uuidv4(),
        user_id: userId,
        ...visit,
        status: 'draft' as VisitStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await VisitStorage.addVisit(localVisit);

      return { data: localVisit, error: null };
    } catch (error) {
      console.error('Create visit error:', error);
      return { data: null, error };
    }
  },

  // Get all visits for a user
  async getUserVisits(userId: string) {
    try {
      const visits = await VisitStorage.getVisits();
      const userVisits = visits?.filter(v => v.user_id === userId) || [];
      return { data: userVisits, error: null };
    } catch (error) {
      console.error('Get user visits error:', error);
      return { data: null, error };
    }
  },

  // Get a single visit
  async getVisit(visitId: string) {
    try {
      const visits = await VisitStorage.getVisits();
      const visit = visits?.find(v => v.id === visitId);
      return { data: visit || null, error: visit ? null : { message: 'Visit not found' } };
    } catch (error) {
      console.error('Get visit error:', error);
      return { data: null, error };
    }
  },

  // Update visit
  async updateVisit(visitId: string, updates: Partial<Visit>) {
    try {
      await VisitStorage.updateVisit(visitId, { ...updates, updated_at: new Date().toISOString() });

      const visits = await VisitStorage.getVisits();
      const updatedVisit = visits?.find(v => v.id === visitId);
      return { data: updatedVisit, error: null };
    } catch (error) {
      console.error('Update visit error:', error);
      return { data: null, error };
    }
  },

  // Submit visit for approval
  async submitVisit(visitId: string) {
    try {
      await VisitStorage.updateVisit(visitId, {
        status: 'submitted' as VisitStatus,
        updated_at: new Date().toISOString()
      });

      const visits = await VisitStorage.getVisits();
      const updatedVisit = visits?.find(v => v.id === visitId);
      return { data: updatedVisit, error: null };
    } catch (error) {
      console.error('Submit visit error:', error);
      return { data: null, error };
    }
  },

  // Get pending approvals (local implementation)
  async getPendingApprovals() {
    try {
      const visits = await VisitStorage.getVisits();
      const pendingVisits = visits?.filter(v => v.status === 'submitted') || [];
      return { data: pendingVisits, error: null };
    } catch (error) {
      console.error('Get pending approvals error:', error);
      return { data: null, error };
    }
  },

  // Approve visit
  async approveVisit(visitId: string, approverId: string) {
    try {
      await VisitStorage.updateVisit(visitId, {
        status: 'approved' as VisitStatus,
        updated_at: new Date().toISOString()
      });

      const visits = await VisitStorage.getVisits();
      const updatedVisit = visits?.find(v => v.id === visitId);
      return { data: updatedVisit, error: null };
    } catch (error) {
      console.error('Approve visit error:', error);
      return { data: null, error };
    }
  },

  // Reject visit
  async rejectVisit(visitId: string, approverId: string, comments: string) {
    try {
      await VisitStorage.updateVisit(visitId, {
        status: 'rejected' as VisitStatus,
        updated_at: new Date().toISOString()
      });

      const visits = await VisitStorage.getVisits();
      const updatedVisit = visits?.find(v => v.id === visitId);
      return { data: updatedVisit, error: null };
    } catch (error) {
      console.error('Reject visit error:', error);
      return { data: null, error };
    }
  },

  // Delete visit
  async deleteVisit(visitId: string) {
    try {
      await VisitStorage.removeVisit(visitId);
      return { error: null };
    } catch (error) {
      console.error('Delete visit error:', error);
      return { error };
    }
  },

  // Get visits by date range
  async getVisitsByDateRange(userId: string, startDate: string, endDate: string) {
    try {
      const visits = await VisitStorage.getVisits();
      const filtered = visits?.filter(v =>
        v.user_id === userId &&
        v.visited_date >= startDate &&
        v.visited_date <= endDate
      ) || [];
      return { data: filtered, error: null };
    } catch (error) {
      console.error('Get visits by date range error:', error);
      return { data: null, error };
    }
  },

  // Get visits by status
  async getVisitsByStatus(userId: string, status: VisitStatus) {
    try {
      const visits = await VisitStorage.getVisits();
      const filtered = visits?.filter(v => v.user_id === userId && v.status === status) || [];
      return { data: filtered, error: null };
    } catch (error) {
      console.error('Get visits by status error:', error);
      return { data: null, error };
    }
  },

  // Get all visits (for admin purposes)
  async getAllVisits() {
    try {
      const visits = await VisitStorage.getVisits();
      return { data: visits || [], error: null };
    } catch (error) {
      console.error('Get all visits error:', error);
      return { data: null, error };
    }
  },

  // Get visit statistics
  async getVisitStats(userId: string) {
    try {
      const visits = await VisitStorage.getVisits();
      const userVisits = visits?.filter(v => v.user_id === userId) || [];

      const stats = {
        total: userVisits.length,
        draft: userVisits.filter(v => v.status === 'draft').length,
        submitted: userVisits.filter(v => v.status === 'submitted').length,
        approved: userVisits.filter(v => v.status === 'approved').length,
        rejected: userVisits.filter(v => v.status === 'rejected').length,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Get visit stats error:', error);
      return { data: null, error };
    }
  },
};

export default visitsService;
