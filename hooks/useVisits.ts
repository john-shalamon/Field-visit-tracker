import { useState, useCallback, useEffect } from 'react';
import visitsService from '@/services/visits';
import { Visit, CreateVisitForm, VisitStatus } from '@/types';

export const useVisits = (userId?: string) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // Fetch user visits
  const fetchVisits = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await visitsService.getUserVisits(userId);
      if (result.error) throw result.error;
      setVisits(result.data || []);
    } catch (err) {
      setError(err);
      console.error('Fetch visits error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Auto-fetch on mount and when userId changes
  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  // Create visit
  const createVisit = useCallback(
    async (visitData: CreateVisitForm) => {
      if (!userId) throw new Error('User ID is required');
      setError(null);
      try {
        const result = await visitsService.createVisit(userId, visitData);
        if (result.error) throw result.error;
        setVisits([result.data, ...visits]);
        return result.data;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [userId, visits]
  );

  // Update visit
  const updateVisit = useCallback(
    async (visitId: string, updates: Partial<Visit>) => {
      setError(null);
      try {
        const result = await visitsService.updateVisit(visitId, updates);
        if (result.error) throw result.error;
        setVisits(visits.map((v) => (v.id === visitId ? result.data : v)));
        return result.data;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [visits]
  );

  // Submit visit
  const submitVisit = useCallback(
    async (visitId: string) => {
      setError(null);
      try {
        const result = await visitsService.submitVisit(visitId);
        if (result.error) throw result.error;
        setVisits(visits.map((v) => (v.id === visitId ? result.data : v)));
        return result.data;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [visits]
  );

  // Approve visit
  const approveVisit = useCallback(
    async (visitId: string, approverId: string) => {
      setError(null);
      try {
        const result = await visitsService.approveVisit(visitId, approverId);
        if (result.error) throw result.error;
        setVisits(visits.map((v) => (v.id === visitId ? result.data : v)));
        return result.data;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [visits]
  );

  // Reject visit
  const rejectVisit = useCallback(
    async (visitId: string, approverId: string, comments: string) => {
      setError(null);
      try {
        const result = await visitsService.rejectVisit(visitId, approverId, comments);
        if (result.error) throw result.error;
        setVisits(visits.map((v) => (v.id === visitId ? result.data : v)));
        return result.data;
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [visits]
  );

  // Delete visit
  const deleteVisit = useCallback(
    async (visitId: string) => {
      setError(null);
      try {
        const result = await visitsService.deleteVisit(visitId);
        if (result.error) throw result.error;
        setVisits(visits.filter((v) => v.id !== visitId));
      } catch (err) {
        setError(err);
        throw err;
      }
    },
    [visits]
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

  return {
    visits,
    loading,
    error,
    fetchVisits,
    createVisit,
    updateVisit,
    submitVisit,
    approveVisit,
    rejectVisit,
    deleteVisit,
    getVisitsByStatus,
    getPendingApprovals,
  };
};

export default useVisits;
