import supabase from './supabase';
import { AnalyticsData } from '@/types';

export const analyticsService = {
  // Get analytics dashboard data
  async getAnalyticsDashboard(userId?: string): Promise<AnalyticsData | null> {
    if (!supabase) return null;
    try {
      // Total visits
      let visitsQuery = supabase.from('visits').select('*', { count: 'exact' });
      if (userId) {
        visitsQuery = visitsQuery.eq('user_id', userId);
      }
      const { count: totalVisits } = await visitsQuery;

      // Completed visits
      let completedQuery = supabase
        .from('visits')
        .select('*', { count: 'exact' })
        .eq('status', 'completed');
      if (userId) {
        completedQuery = completedQuery.eq('user_id', userId);
      }
      const { count: completedVisits } = await completedQuery;

      // Pending approvals
      let pendingQuery = supabase
        .from('visits')
        .select('*', { count: 'exact' })
        .in('status', ['submitted', 'pending_approval']);
      const { count: pendingApprovals } = await pendingQuery;

      // Rejection rate
      const { data: rejectedData } = await supabase
        .from('visits')
        .select('*')
        .eq('status', 'rejected');

      const rejectionRate =
        totalVisits && totalVisits > 0
          ? ((rejectedData?.length || 0) / totalVisits) * 100
          : 0;

      // Visits by status
      const { data: allVisits } = await supabase.from('visits').select('status');
      const visitsByStatus = allVisits?.reduce((acc: Record<string, number>, visit: any) => {
        acc[visit.status] = (acc[visit.status] || 0) + 1;
        return acc;
      }, {}) || {};

      // Visits by date (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: visitsByDateData } = await supabase
        .from('visits')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const visitsByDate = (visitsByDateData || []).reduce(
        (acc: Array<{ date: string; count: number }>, visit: any) => {
          const date = new Date(visit.created_at).toISOString().split('T')[0];
          const existing = acc.find((v) => v.date === date);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ date, count: 1 });
          }
          return acc;
        },
        []
      );

      return {
        total_visits: totalVisits || 0,
        completed_visits: completedVisits || 0,
        pending_approvals: pendingApprovals || 0,
        rejection_rate: rejectionRate,
        visits_by_date: visitsByDate,
        visits_by_status: visitsByStatus,
      };
    } catch (error) {
      console.error('Get analytics dashboard error:', error);
      return null;
    }
  },

  // Get visits by date range
  async getVisitsByDateRange(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error('Get visits by date range error:', error);
      return { data: null, error };
    }
  },

  // Get inspection statistics
  async getInspectionStats() {
    try {
      const { data: allInspections, error } = await supabase
        .from('inspections')
        .select('status, severity');

      if (error) throw error;

      const stats = {
        total_inspections: allInspections?.length || 0,
        by_status: allInspections?.reduce((acc: Record<string, number>, insp: any) => {
          acc[insp.status] = (acc[insp.status] || 0) + 1;
          return acc;
        }, {}),
        by_severity: allInspections?.reduce((acc: Record<string, number>, insp: any) => {
          acc[insp.severity || 'unknown'] = (acc[insp.severity || 'unknown'] || 0) + 1;
          return acc;
        }, {}),
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Get inspection stats error:', error);
      return { data: null, error };
    }
  },

  // Get user performance metrics
  async getUserMetrics(userId: string) {
    try {
      const { data: visits, error: visitsError } = await supabase
        .from('visits')
        .select('status')
        .eq('user_id', userId);

      if (visitsError) throw visitsError;

      const { data: inspections, error: inspecError } = await supabase
        .from('inspections')
        .select('inspection_type')
        .in('visit_id', visits?.map((v) => v.id) || []);

      if (inspecError) throw inspecError;

      return {
        data: {
          total_visits: visits?.length || 0,
          approved_visits: visits?.filter((v) => v.status === 'approved').length || 0,
          rejected_visits: visits?.filter((v) => v.status === 'rejected').length || 0,
          total_inspections: inspections?.length || 0,
        },
        error: null,
      };
    } catch (error) {
      console.error('Get user metrics error:', error);
      return { data: null, error };
    }
  },

  // Get approval turnaround time
  async getApprovalTurnaroundTime() {
    try {
      const { data: approvals, error } = await supabase
        .from('approvals')
        .select('created_at, approved_at');

      if (error) throw error;

      const turnaroundTimes = (approvals || [])
        .filter((a) => a.approved_at)
        .map((a) => {
          const createdDate = new Date(a.created_at).getTime();
          const approvedDate = new Date(a.approved_at).getTime();
          return (approvedDate - createdDate) / (1000 * 60 * 60); // in hours
        });

      const avgTurnaroundTime =
        turnaroundTimes.length > 0
          ? turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length
          : 0;

      return {
        data: {
          avg_hours: avgTurnaroundTime,
          min_hours: Math.min(...turnaroundTimes),
          max_hours: Math.max(...turnaroundTimes),
        },
        error: null,
      };
    } catch (error) {
      console.error('Get approval turnaround time error:', error);
      return { data: null, error };
    }
  },
};

export default analyticsService;
