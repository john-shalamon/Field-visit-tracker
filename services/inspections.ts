import { Inspection, CreateInspectionForm } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const INSPECTIONS_STORAGE_KEY = 'local_inspections';

// Local inspection storage
class LocalInspectionStorage {
  static async getInspections(): Promise<Inspection[]> {
    try {
      const inspectionsJson = await AsyncStorage.getItem(INSPECTIONS_STORAGE_KEY);
      return inspectionsJson ? JSON.parse(inspectionsJson) : [];
    } catch (error) {
      console.error('Error getting inspections:', error);
      return [];
    }
  }

  static async saveInspections(inspections: Inspection[]): Promise<void> {
    try {
      await AsyncStorage.setItem(INSPECTIONS_STORAGE_KEY, JSON.stringify(inspections));
    } catch (error) {
      console.error('Error saving inspections:', error);
      throw error;
    }
  }

  static async addInspection(inspection: Inspection): Promise<void> {
    const inspections = await this.getInspections();
    inspections.push(inspection);
    await this.saveInspections(inspections);
  }

  static async updateInspection(inspectionId: string, updates: Partial<Inspection>): Promise<void> {
    const inspections = await this.getInspections();
    const index = inspections.findIndex(i => i.id === inspectionId);
    if (index !== -1) {
      inspections[index] = { ...inspections[index], ...updates };
      await this.saveInspections(inspections);
    }
  }

  static async removeInspection(inspectionId: string): Promise<void> {
    const inspections = await this.getInspections();
    const filteredInspections = inspections.filter(i => i.id !== inspectionId);
    await this.saveInspections(filteredInspections);
  }

  static async findInspectionById(inspectionId: string): Promise<Inspection | null> {
    const inspections = await this.getInspections();
    return inspections.find(i => i.id === inspectionId) || null;
  }
}

export const inspectionsService = {
  // Create a new inspection
  async createInspection(visitId: string, inspection: CreateInspectionForm) {
    try {
      const localInspection: Inspection = {
        id: uuidv4(),
        visit_id: visitId,
        ...inspection,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await LocalInspectionStorage.addInspection(localInspection);

      return { data: localInspection, error: null };
    } catch (error) {
      console.error('Create inspection error:', error);
      return { data: null, error };
    }
  },

  // Get inspections for a visit
  async getVisitInspections(visitId: string) {
    try {
      const inspections = await LocalInspectionStorage.getInspections();
      const visitInspections = inspections.filter(i => i.visit_id === visitId);
      return { data: visitInspections, error: null };
    } catch (error) {
      console.error('Get visit inspections error:', error);
      return { data: null, error };
    }
  },

  // Get a single inspection
  async getInspection(inspectionId: string) {
    try {
      const inspection = await LocalInspectionStorage.findInspectionById(inspectionId);
      return { data: inspection, error: inspection ? null : { message: 'Inspection not found' } };
    } catch (error) {
      console.error('Get inspection error:', error);
      return { data: null, error };
    }
  },

  // Update inspection
  async updateInspection(inspectionId: string, updates: Partial<Inspection>) {
    try {
      await LocalInspectionStorage.updateInspection(inspectionId, {
        ...updates,
        updated_at: new Date().toISOString()
      });

      const inspection = await LocalInspectionStorage.findInspectionById(inspectionId);
      return { data: inspection, error: null };
    } catch (error) {
      console.error('Update inspection error:', error);
      return { data: null, error };
    }
  },

  // Submit inspection for approval
  async submitInspection(inspectionId: string) {
    try {
      await LocalInspectionStorage.updateInspection(inspectionId, {
        status: 'pending',
        updated_at: new Date().toISOString()
      });

      const inspection = await LocalInspectionStorage.findInspectionById(inspectionId);
      return { data: inspection, error: null };
    } catch (error) {
      console.error('Submit inspection error:', error);
      return { data: null, error };
    }
  },

  // Get pending inspections
  async getPendingInspections() {
    try {
      const inspections = await LocalInspectionStorage.getInspections();
      const pendingInspections = inspections.filter(i => i.status === 'pending');
      return { data: pendingInspections, error: null };
    } catch (error) {
      console.error('Get pending inspections error:', error);
      return { data: null, error };
    }
  },

  // Approve inspection
  async approveInspection(inspectionId: string, approver_id: string) {
    try {
      await LocalInspectionStorage.updateInspection(inspectionId, {
        status: 'approved',
        updated_at: new Date().toISOString()
      });

      const inspection = await LocalInspectionStorage.findInspectionById(inspectionId);
      return { data: inspection, error: null };
    } catch (error) {
      console.error('Approve inspection error:', error);
      return { data: null, error };
    }
  },

  // Reject inspection
  async rejectInspection(inspectionId: string, approver_id: string, comments: string) {
    try {
      await LocalInspectionStorage.updateInspection(inspectionId, {
        status: 'rejected',
        updated_at: new Date().toISOString()
      });

      const inspection = await LocalInspectionStorage.findInspectionById(inspectionId);
      return { data: inspection, error: null };
    } catch (error) {
      console.error('Reject inspection error:', error);
      return { data: null, error };
    }
  },

  // Delete inspection
  async deleteInspection(inspectionId: string) {
    try {
      await LocalInspectionStorage.removeInspection(inspectionId);
      return { error: null };
    } catch (error) {
      console.error('Delete inspection error:', error);
      return { error };
    }
  },

  // Get inspections by severity
  async getInspectionsBySeverity(severity: string) {
    try {
      const inspections = await LocalInspectionStorage.getInspections();
      const filteredInspections = inspections.filter(i => i.severity === severity);
      return { data: filteredInspections, error: null };
    } catch (error) {
      console.error('Get inspections by severity error:', error);
      return { data: null, error };
    }
  },

  // Get all inspections
  async getAllInspections() {
    try {
      const inspections = await LocalInspectionStorage.getInspections();
      return { data: inspections, error: null };
    } catch (error) {
      console.error('Get all inspections error:', error);
      return { data: null, error };
    }
  },

  // Get inspection statistics
  async getInspectionStats() {
    try {
      const inspections = await LocalInspectionStorage.getInspections();

      const stats = {
        total: inspections.length,
        draft: inspections.filter(i => i.status === 'draft').length,
        pending: inspections.filter(i => i.status === 'pending').length,
        approved: inspections.filter(i => i.status === 'approved').length,
        rejected: inspections.filter(i => i.status === 'rejected').length,
        by_severity: {
          low: inspections.filter(i => i.severity === 'low').length,
          medium: inspections.filter(i => i.severity === 'medium').length,
          high: inspections.filter(i => i.severity === 'high').length,
          critical: inspections.filter(i => i.severity === 'critical').length,
        },
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Get inspection stats error:', error);
      return { data: null, error };
    }
  },
};

export default inspectionsService;
