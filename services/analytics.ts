import { AnalyticsData } from '@/types';
import { VisitStorage } from './localStorage';

export const analyticsService = {
  // Get analytics dashboard data
  async getAnalyticsDashboard(userId?: string): Promise<AnalyticsData | null> {
    try {
      const visits = await VisitStorage.getVisits();
      let filteredVisits = visits || [];

      if (userId) {
        filteredVisits = filteredVisits.filter(v => v.user_id === userId);
      }

      // Total visits
      const totalVisits = filteredVisits.length;

      // Completed visits (approved visits)
      const completedVisits = filteredVisits.filter(v => v.status === 'approved').length;

      // Pending approvals
      const pendingApprovals = filteredVisits.filter(v =>
        v.status === 'submitted'
      ).length;

      // Rejection rate
      const rejectedVisits = filteredVisits.filter(v => v.status === 'rejected').length;
      const rejectionRate = totalVisits > 0 ? (rejectedVisits / totalVisits) * 100 : 0;

      // Visits by status
      const visitsByStatus = filteredVisits.reduce((acc: Record<string, number>, visit) => {
        acc[visit.status] = (acc[visit.status] || 0) + 1;
        return acc;
      }, {});

      // Visits by date (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const visitsByDate = filteredVisits
        .filter(v => new Date(v.created_at) >= thirtyDaysAgo)
        .reduce((acc: Array<{ date: string; count: number }>, visit) => {
          const date = new Date(visit.created_at).toISOString().split('T')[0];
          const existing = acc.find((v) => v.date === date);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ date, count: 1 });
          }
          return acc;
        }, [])
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        total_visits: totalVisits,
        completed_visits: completedVisits,
        pending_approvals: pendingApprovals,
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
  async getVisitsByDateRange(startDate: string, endDate: string, userId?: string) {
    try {
      const visits = await VisitStorage.getVisits();
      let filteredVisits = visits?.filter(v => {
        const visitDate = new Date(v.created_at);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return visitDate >= start && visitDate <= end;
      }) || [];

      if (userId) {
        filteredVisits = filteredVisits.filter(v => v.user_id === userId);
      }

      return { data: filteredVisits, error: null };
    } catch (error) {
      console.error('Get visits by date range error:', error);
      return { data: null, error };
    }
  },

  // Get inspection statistics (placeholder - would need inspection storage)
  async getInspectionStats() {
    try {
      // For now, return placeholder data since inspections are not stored locally yet
      const stats = {
        total_inspections: 0,
        by_status: {},
        by_severity: {},
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
      const visits = await VisitStorage.getVisits();
      const userVisits = visits?.filter(v => v.user_id === userId) || [];

      return {
        data: {
          total_visits: userVisits.length,
          approved_visits: userVisits.filter((v) => v.status === 'approved').length,
          rejected_visits: userVisits.filter((v) => v.status === 'rejected').length,
          total_inspections: 0, // Placeholder
        },
        error: null,
      };
    } catch (error) {
      console.error('Get user metrics error:', error);
      return { data: null, error };
    }
  },

  // Get approval turnaround time (simplified for local)
  async getApprovalTurnaroundTime() {
    try {
      const visits = await VisitStorage.getVisits();
      const approvedVisits = visits?.filter(v => v.status === 'approved') || [];

      // Calculate time from submission to approval
      const turnaroundTimes = approvedVisits
        .filter(v => v.updated_at && v.created_at)
        .map(v => {
          const createdDate = new Date(v.created_at).getTime();
          const updatedDate = new Date(v.updated_at).getTime();
          return (updatedDate - createdDate) / (1000 * 60 * 60); // in hours
        });

      const avgTurnaroundTime = turnaroundTimes.length > 0
        ? turnaroundTimes.reduce((a, b) => a + b, 0) / turnaroundTimes.length
        : 0;

      const minTurnaroundTime = turnaroundTimes.length > 0 ? Math.min(...turnaroundTimes) : 0;
      const maxTurnaroundTime = turnaroundTimes.length > 0 ? Math.max(...turnaroundTimes) : 0;

      return {
        data: {
          avg_hours: avgTurnaroundTime,
          min_hours: minTurnaroundTime,
          max_hours: maxTurnaroundTime,
        },
        error: null,
      };
    } catch (error) {
      console.error('Get approval turnaround time error:', error);
      return { data: null, error };
    }
  },

  // Get visit trends
  async getVisitTrends(days: number = 30) {
    try {
      const visits = await VisitStorage.getVisits();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentVisits = visits?.filter(v => new Date(v.created_at) >= cutoffDate) || [];

      const trends = recentVisits.reduce((acc: Record<string, number>, visit) => {
        const date = new Date(visit.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      return { data: trends, error: null };
    } catch (error) {
      console.error('Get visit trends error:', error);
      return { data: null, error };
    }
  },
};

export default analyticsService;
