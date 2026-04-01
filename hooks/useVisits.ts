import { useState, useCallback, useEffect } from 'react';
import visitsService from '@/services/visits';
import { Visit, CreateVisitForm, VisitStatus } from '@/types';
import { OfflineQueue } from '@/services/localStorage';

export const useVisits = (userId?: string, userRole?: string) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [syncing, setSyncing] = useState(false);
  const [offlineQueueLength, setOfflineQueueLength] = useState(0);

  // Check offline queue length
  const checkOfflineQueue = useCallback(async () => {
    try {
      const length = await OfflineQueue.getQueueLength();
      setOfflineQueueLength(length);
    } catch (error) {
      console.error('Error checking offline queue:', error);
    }
  }, []);

  // Sync offline data
  const syncOfflineData = useCallback(async () => {
    if (!userId) return;
    setSyncing(true);
    try {
      const result = await visitsService.syncOfflineData(userId);
      if (result.success) {
        // Refresh visits after sync
        await fetchVisits();
        await checkOfflineQueue();
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  }, [userId]);

  // Fetch user or admin visits
  const fetchVisits = useCallback(async () => {
    if (!userId) {
      console.warn('⚠️ fetchVisits called without userId');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log('🎣 Hook.fetchVisits called for user:', userId, 'role:', userRole);
      let result;
      if (userRole === 'admin' || userRole === 'hod' || userRole === 'collector') {
        console.log('   Fetching ALL visits (admin/hod/collector)');
        result = await visitsService.getAllVisits();
      } else {
        console.log('   Fetching user-specific visits');
        result = await visitsService.getUserVisits(userId);
      }
      if (result.error) {
        console.error('❌ Fetch error:', result.error);
        throw result.error;
      }
      console.log('✓ Fetched visits, total:', result.data?.length);
      setVisits(result.data || []);
    } catch (err) {
      console.error('❌ Fetch visits error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId, userRole]);

  // Auto-fetch on mount and when userId changes
  useEffect(() => {
    fetchVisits();
    checkOfflineQueue();
  }, [fetchVisits, checkOfflineQueue]);

  // Create visit
  const createVisit = useCallback(
    async (visitData: CreateVisitForm) => {
      if (!userId) throw new Error('User ID is required');
      setError(null);
      try {
        console.log('🎣 Hook.createVisit called for user:', userId);
        const result = await visitsService.createVisit(userId, visitData);
        if (result.error) {
          console.error('❌ Create visit returned error:', result.error);
          throw result.error;
        }
        console.log('✓ Visit created, updating hook state');
        setVisits((prevVisits) => {
          const updated = [result.data, ...prevVisits];
          console.log('   Hook state updated, new length:', updated.length);
          return updated;
        });
        return result.data;
      } catch (err) {
        console.error('❌ Hook.createVisit error:', err);
        setError(err);
        throw err;
      }
    },
    [userId]
  );

  // Update visit
  const updateVisit = useCallback(
    async (visitId: string, updates: Partial<Visit>) => {
      setError(null);
      try {
        const result = await visitsService.updateVisit(visitId, updates);
        if (result.error) throw result.error;
        setVisits((prevVisits) => prevVisits.map((v) => (v.id === visitId ? result.data : v)));
        return result.data;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    []
  );

  // Submit visit
  const submitVisit = useCallback(
    async (visitId: string, submittedById?: string, submittedByRole?: string) => {
      setError(null);
      try {
        console.log('🎣 Hook.submitVisit called for visit:', visitId);
        const result = await visitsService.submitVisit(visitId, submittedById || userId, submittedByRole);
        if (result.error) {
          console.error('❌ Submit visit returned error:', result.error);
          throw result.error;
        }
        console.log('✓ Visit submitted, updating hook state');
        console.log('   Updated visit status:', result.data?.status);
        setVisits((prevVisits) => {
          const updated = prevVisits.map((v) => (v.id === visitId ? result.data : v));
          console.log('   Hook visits updated, new list length:', updated.length);
          return updated;
        });
        return result.data;
      } catch (err) {
        console.error('❌ Hook.submitVisit error:', err);
        setError(err);
        throw err;
      }
    },
    [userId]
  );

  // Approve visit
  const approveVisit = useCallback(
    async (visitId: string, approverId: string, approverRole: string = 'hod') => {
      setError(null);
      try {
        const result = await visitsService.approveVisit(visitId, approverId, approverRole);
        if (result.error) throw result.error;
        setVisits((prevVisits) => prevVisits.map((v) => (v.id === visitId ? result.data : v)));
        return result.data;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    []
  );

  // Reject visit
  const rejectVisit = useCallback(
    async (visitId: string, approverId: string, comments: string, approverRole: string = 'hod') => {
      setError(null);
      try {
        const result = await visitsService.rejectVisit(visitId, approverId, comments, approverRole);
        if (result.error) throw result.error;
        setVisits((prevVisits) => prevVisits.map((v) => (v.id === visitId ? result.data : v)));
        return result.data;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    []
  );

  // Delete visit
  const deleteVisit = useCallback(
    async (visitId: string) => {
      setError(null);
      try {
        const result = await visitsService.deleteVisit(visitId);
        if (result.error) throw result.error;
        setVisits((prevVisits) => prevVisits.filter((v) => v.id !== visitId));
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    []
  );

  // Get visits by status
  const getVisitsByStatus = useCallback(
    async (status: VisitStatus) => {
      if (!userId) return [];
      setError(null);
      try {
        const result = await visitsService.getVisitsByStatus(userId, status);
        if (result.error) throw result.error;
        return result.data || [];
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [userId]
  );

  // Get pending approvals
  const getPendingApprovals = useCallback(async (role: string) => {
    setError(null);
    try {
      const result = await visitsService.getPendingApprovals(role);
      if (result.error) throw result.error;
      return result.data || [];
    } catch (err) {
      setError(err);
      throw err;
    }
  }, []);

  // Get all visits (admin)
  const getAllVisits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await visitsService.getAllVisits();
      if (result.error) throw result.error;
      return result.data || [];
    } catch (err) {
      setError(err);
      console.error('Get all visits error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Assign visit to collector
  const assignVisit = useCallback(
    async (visitId: string, collectorId: string, assignedById: string, assignedByRole: string) => {
      setError(null);
      try {
        const result = await visitsService.assignVisit(visitId, collectorId, assignedById, assignedByRole);
        if (result.error) throw result.error;
        setVisits((prevVisits) => prevVisits.map((v) => (v.id === visitId ? result.data : v)));
        return result.data;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    []
  );

  return {
    visits,
    loading,
    error,
    syncing,
    offlineQueueLength,
    fetchVisits,
    createVisit,
    updateVisit,
    submitVisit,
    approveVisit,
    rejectVisit,
    deleteVisit,
    getVisitsByStatus,
    getPendingApprovals,
    syncOfflineData,
    checkOfflineQueue,
    getAllVisits,
    assignVisit,
  };
};

export default useVisits;
