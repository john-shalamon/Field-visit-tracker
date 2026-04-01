import { Visit, CreateVisitForm, VisitStatus } from '@/types';
import { VisitStorage, OfflineQueue, SyncStatus } from './localStorage';
import { v4 as uuidv4 } from 'uuid';

export const visitsService = {
  // Create a new visit
  async createVisit(userId: string, visit: CreateVisitForm) {
    try {
      console.log('🆕 Creating visit for user:', userId);
      console.log('   Data:', visit);
      
      const localVisit: Visit = {
        id: uuidv4(),
        user_id: userId,
        ...visit,
        status: 'draft' as VisitStatus,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('📦 Visit object created:', localVisit.id, localVisit);

      await VisitStorage.addVisit(localVisit);

      console.log('✓ Visit successfully stored in localStorage');
      return { data: localVisit, error: null };
    } catch (error) {
      console.error('❌ Create visit error:', error);
      return { data: null, error: new Error(error instanceof Error ? error.message : String(error)) };
    }
  },

  // Get all visits for a user
  async getUserVisits(userId: string) {
    try {
      const visits = await VisitStorage.getVisits();
      const userVisits = visits?.filter(v => v.user_id === userId) || [];
      console.log(`🔍 Retrieved ${userVisits.length} visits for user ${userId} (total visits in store: ${visits?.length})`);
      
      // If user has no visits yet, show them demo visits for exploration
      if (userVisits.length === 0 && visits && visits.length > 0) {
        console.log('📊 No visits for this user yet. Showing demo visits for reference...');
        return { data: visits, error: null }; // Show all visits as demo data
      }
      
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
  async submitVisit(visitId: string, submittedById?: string, submittedByRole?: string) {
    try {
      console.log('📤 Submitting visit:', visitId);
      
      const visits = await VisitStorage.getVisits();
      const visit = visits?.find(v => v.id === visitId);
      
      if (!visit) {
        console.error('❌ Visit not found:', visitId);
        console.log('   Available visits:', visits?.map(v => v.id));
        return { data: null, error: new Error('Visit not found') };
      }

      console.log('✓ Visit found, current status:', visit.status);
      console.log('   Visit details:', { id: visit.id, user_id: visit.user_id, title: visit.title });

      const historyEntry = visit?.history || [];
      const updatedHistory = historyEntry.concat({
        action: 'submitted' as const,
        by_user_id: submittedById || visit.user_id || '',
        by_user_role: (submittedByRole as any) || 'field_officer',
        timestamp: new Date().toISOString(),
        details: 'Visit submitted for approval',
      });

      await VisitStorage.updateVisit(visitId, {
        status: 'submitted' as VisitStatus,
        updated_at: new Date().toISOString(),
        history: updatedHistory,
      });
      
      console.log('✓ Visit status updated to submitted in localStorage');

      const updatedVisits = await VisitStorage.getVisits();
      const updatedVisit = updatedVisits?.find(v => v.id === visitId);
      
      console.log('✓ Visit submitted successfully, new status:', updatedVisit?.status);
      return { data: updatedVisit, error: null };
    } catch (error) {
      console.error('❌ Submit visit error:', error);
      return { data: null, error: new Error(error instanceof Error ? error.message : String(error)) };
    }
  },

  // Get pending approvals (local implementation)
  async getPendingApprovals(role?: string) {
    try {
      const visits = await VisitStorage.getVisits();
      let pendingVisits = visits?.filter(v => v.status === 'submitted' || v.status === 'pending_approval') || [];

      // Non-admin/hod users only see their own approvals
      if (role && role !== 'admin' && role !== 'hod') {
        pendingVisits = pendingVisits.filter((v) => v.assigned_to === undefined || v.assigned_to === null);
      }

      return { data: pendingVisits, error: null };
    } catch (error) {
      console.error('Get pending approvals error:', error);
      return { data: null, error };
    }
  },

  // Approve visit
  async approveVisit(visitId: string, approverId: string, approverRole: string = 'hod') {
    try {
      const visits = await VisitStorage.getVisits();
      const visit = visits?.find(v => v.id === visitId);

      const updatedHistory = (visit?.history || []).concat({
        action: 'approved',
        by_user_id: approverId,
        by_user_role: approverRole as any,
        timestamp: new Date().toISOString(),
        details: 'Visit approved',
      });

      await VisitStorage.updateVisit(visitId, {
        status: 'approved' as VisitStatus,
        updated_at: new Date().toISOString(),
        history: updatedHistory,
      });

      const updatedVisits = await VisitStorage.getVisits();
      const updatedVisit = updatedVisits?.find(v => v.id === visitId);
      return { data: updatedVisit, error: null };
    } catch (error) {
      console.error('Approve visit error:', error);
      return { data: null, error };
    }
  },

  // Reject visit
  async rejectVisit(visitId: string, approverId: string, comments: string, approverRole: string = 'hod') {
    try {
      const visits = await VisitStorage.getVisits();
      const visit = visits?.find(v => v.id === visitId);

      const updatedHistory = (visit?.history || []).concat({
        action: 'rejected',
        by_user_id: approverId,
        by_user_role: approverRole as any,
        timestamp: new Date().toISOString(),
        details: `Visit rejected: ${comments}`,
      });

      await VisitStorage.updateVisit(visitId, {
        status: 'rejected' as VisitStatus,
        updated_at: new Date().toISOString(),
        history: updatedHistory,
      });

      const updatedVisits = await VisitStorage.getVisits();
      const updatedVisit = updatedVisits?.find(v => v.id === visitId);
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

  // Assign visit to a collector (admin/hod)
  async assignVisit(visitId: string, collectorId: string, assignedById: string, assignedByRole: string = 'hod') {
    try {
      const visits = await VisitStorage.getVisits();
      const visit = visits?.find((v) => v.id === visitId);
      if (!visit) return { data: null, error: { message: 'Visit not found' } };

      const updatedHistory = (visit.history || []).concat({
        action: 'assigned',
        by_user_id: assignedById,
        by_user_role: assignedByRole as any,
        timestamp: new Date().toISOString(),
        details: `Assigned to collector ${collectorId}`,
      });

      await VisitStorage.updateVisit(visitId, {
        assigned_to: collectorId,
        status: 'pending_approval' as VisitStatus,
        updated_at: new Date().toISOString(),
        history: updatedHistory,
      });

      const updatedVisits = await VisitStorage.getVisits();
      const updatedVisit = updatedVisits?.find((v) => v.id === visitId);
      return { data: updatedVisit, error: null };
    } catch (error) {
      console.error('Assign visit error:', error);
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

  // Sync offline data (stub for now - all data is local)
  async syncOfflineData(userId: string) {
    try {
      // In a real implementation, this would sync with a backend
      // For now, just return success since all data is stored locally
      return { success: true, synced: 0 };
    } catch (error) {
      console.error('Sync offline data error:', error);
      return { success: false, error };
    }
  },
};

export default visitsService;
