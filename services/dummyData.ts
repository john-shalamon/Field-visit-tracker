import { Visit, User, Inspection, Photo, VisitHistoryItem } from '@/types';
import { LocalStorage } from './localStorage';

const DUMMY_USERS: User[] = [
  {
    id: 'user_1',
    email: 'john.officer@field.com',
    full_name: 'John Smith',
    phone: '+1234567890',
    role: 'field_officer',
    department: 'Field Operations',
    zone: 'North Zone',
    employee_id: 'EMP001',
    is_active: true,
    created_at: '2025-01-15T08:00:00Z',
    updated_at: '2026-03-31T10:00:00Z',
  },
  {
    id: 'user_2',
    email: 'jane.visitor@field.com',
    full_name: 'Jane Doe',
    phone: '+1234567891',
    role: 'field_visitor',
    department: 'Field Operations',
    zone: 'South Zone',
    employee_id: 'EMP002',
    is_active: true,
    created_at: '2025-02-10T09:00:00Z',
    updated_at: '2026-03-30T14:00:00Z',
  },
  {
    id: 'user_3',
    email: 'bob.collector@field.com',
    full_name: 'Bob Johnson',
    phone: '+1234567892',
    role: 'collector',
    department: 'Data Collection',
    zone: 'East Zone',
    employee_id: 'EMP003',
    is_active: true,
    created_at: '2025-01-20T10:00:00Z',
    updated_at: '2026-03-29T16:00:00Z',
  },
  {
    id: 'user_4',
    email: 'alice.hod@field.com',
    full_name: 'Alice Manager',
    phone: '+1234567893',
    role: 'hod',
    department: 'Management',
    zone: 'Administration',
    employee_id: 'MGR001',
    is_active: true,
    created_at: '2024-12-01T08:00:00Z',
    updated_at: '2026-03-31T09:00:00Z',
  },
  {
    id: 'user_5',
    email: 'admin@field.com',
    full_name: 'Admin System',
    phone: '+1234567894',
    role: 'admin',
    department: 'IT Administration',
    zone: 'System',
    employee_id: 'SYS001',
    is_active: true,
    created_at: '2024-11-01T08:00:00Z',
    updated_at: '2026-03-31T10:30:00Z',
  },
];

const DUMMY_VISITS: Visit[] = [
  // Completed visits
  {
    id: 'visit_001',
    user_id: 'user_1',
    title: 'Bridge Inspection - Main Street',
    description: 'Routine structural inspection of main bridge. Found minor cracks in concrete.',
    location_name: 'Main Street Bridge',
    latitude: 8.173963,
    longitude: 77.249589,
    visited_date: '2026-03-28T10:30:00Z',
    status: 'completed',
    priority: 'high',
    history: [
      {
        action: 'created',
        by_user_id: 'user_1',
        by_user_role: 'field_officer',
        timestamp: '2026-03-28T10:30:00Z',
      },
      {
        action: 'submitted',
        by_user_id: 'user_1',
        by_user_role: 'field_officer',
        timestamp: '2026-03-28T11:00:00Z',
      },
      {
        action: 'approved',
        by_user_id: 'user_4',
        by_user_role: 'hod',
        timestamp: '2026-03-28T15:30:00Z',
      },
      {
        action: 'completed',
        by_user_id: 'user_4',
        by_user_role: 'hod',
        timestamp: '2026-03-29T09:00:00Z',
      },
    ],
    created_at: '2026-03-28T10:30:00Z',
    updated_at: '2026-03-29T09:00:00Z',
  },
  {
    id: 'visit_002',
    user_id: 'user_2',
    title: 'Road Condition Assessment - Highway 5',
    description: 'Assessment of road deterioration and pothole mapping. Multiple hazards identified.',
    location_name: 'Highway 5, South Entry',
    latitude: 8.182963,
    longitude: 77.258589,
    visited_date: '2026-03-27T14:00:00Z',
    status: 'completed',
    priority: 'critical',
    history: [
      {
        action: 'created',
        by_user_id: 'user_2',
        by_user_role: 'field_visitor',
        timestamp: '2026-03-27T14:00:00Z',
      },
      {
        action: 'submitted',
        by_user_id: 'user_2',
        by_user_role: 'field_visitor',
        timestamp: '2026-03-27T15:30:00Z',
      },
      {
        action: 'approved',
        by_user_id: 'user_4',
        by_user_role: 'hod',
        timestamp: '2026-03-27T16:00:00Z',
      },
      {
        action: 'completed',
        by_user_id: 'user_4',
        by_user_role: 'hod',
        timestamp: '2026-03-28T10:00:00Z',
      },
    ],
    created_at: '2026-03-27T14:00:00Z',
    updated_at: '2026-03-28T10:00:00Z',
  },
  // Approved visits
  {
    id: 'visit_003',
    user_id: 'user_3',
    title: 'Building Safety Inspection - Tech Park',
    description: 'Fire safety system verification and building code compliance check.',
    location_name: 'Tech Park Building A',
    latitude: 8.165963,
    longitude: 77.240589,
    visited_date: '2026-03-26T09:00:00Z',
    status: 'approved',
    priority: 'high',
    history: [
      {
        action: 'created',
        by_user_id: 'user_3',
        by_user_role: 'collector',
        timestamp: '2026-03-26T09:00:00Z',
      },
      {
        action: 'submitted',
        by_user_id: 'user_3',
        by_user_role: 'collector',
        timestamp: '2026-03-26T11:30:00Z',
      },
      {
        action: 'approved',
        by_user_id: 'user_4',
        by_user_role: 'hod',
        timestamp: '2026-03-26T14:00:00Z',
      },
    ],
    created_at: '2026-03-26T09:00:00Z',
    updated_at: '2026-03-26T14:00:00Z',
  },
  {
    id: 'visit_004',
    user_id: 'user_1',
    title: 'Water Supply Pipeline - Downtown District',
    description: 'Inspection of water main pipes for leakage and integrity.',
    location_name: 'Downtown Water Supply',
    latitude: 8.175963,
    longitude: 77.252589,
    visited_date: '2026-03-25T08:30:00Z',
    status: 'approved',
    priority: 'high',
    history: [
      {
        action: 'created',
        by_user_id: 'user_1',
        by_user_role: 'field_officer',
        timestamp: '2026-03-25T08:30:00Z',
      },
      {
        action: 'submitted',
        by_user_id: 'user_1',
        by_user_role: 'field_officer',
        timestamp: '2026-03-25T10:00:00Z',
      },
      {
        action: 'approved',
        by_user_id: 'user_4',
        by_user_role: 'hod',
        timestamp: '2026-03-25T13:00:00Z',
      },
    ],
    created_at: '2026-03-25T08:30:00Z',
    updated_at: '2026-03-25T13:00:00Z',
  },
  // Pending approval visits
  {
    id: 'visit_005',
    user_id: 'user_2',
    title: 'Electrical Grid Maintenance - West Zone',
    description: 'Preventive maintenance of electrical distribution lines.',
    location_name: 'West Zone Substation',
    latitude: 8.155963,
    longitude: 77.230589,
    visited_date: '2026-03-30T13:00:00Z',
    status: 'pending_approval',
    priority: 'medium',
    history: [
      {
        action: 'created',
        by_user_id: 'user_2',
        by_user_role: 'field_visitor',
        timestamp: '2026-03-30T13:00:00Z',
      },
      {
        action: 'submitted',
        by_user_id: 'user_2',
        by_user_role: 'field_visitor',
        timestamp: '2026-03-30T16:00:00Z',
      },
    ],
    created_at: '2026-03-30T13:00:00Z',
    updated_at: '2026-03-30T16:00:00Z',
  },
  {
    id: 'visit_006',
    user_id: 'user_3',
    title: 'Sewerage System Check - North District',
    description: 'Regular maintenance check of drainage and sewerage infrastructure.',
    location_name: 'North District Drainage',
    latitude: 8.190963,
    longitude: 77.265589,
    visited_date: '2026-03-29T10:00:00Z',
    status: 'pending_approval',
    priority: 'medium',
    history: [
      {
        action: 'created',
        by_user_id: 'user_3',
        by_user_role: 'collector',
        timestamp: '2026-03-29T10:00:00Z',
      },
      {
        action: 'submitted',
        by_user_id: 'user_3',
        by_user_role: 'collector',
        timestamp: '2026-03-29T12:30:00Z',
      },
    ],
    created_at: '2026-03-29T10:00:00Z',
    updated_at: '2026-03-29T12:30:00Z',
  },
  // Rejected visit
  {
    id: 'visit_007',
    user_id: 'user_1',
    title: 'Traffic Signal Replacement - Main Intersection',
    description: 'Installation of new LED traffic signals. Incomplete documentation.',
    location_name: 'Main Street Intersection',
    latitude: 8.178963,
    longitude: 77.255589,
    visited_date: '2026-03-24T11:00:00Z',
    status: 'rejected',
    priority: 'low',
    history: [
      {
        action: 'created',
        by_user_id: 'user_1',
        by_user_role: 'field_officer',
        timestamp: '2026-03-24T11:00:00Z',
      },
      {
        action: 'submitted',
        by_user_id: 'user_1',
        by_user_role: 'field_officer',
        timestamp: '2026-03-24T13:30:00Z',
      },
      {
        action: 'rejected',
        by_user_id: 'user_4',
        by_user_role: 'hod',
        timestamp: '2026-03-24T15:00:00Z',
        details: 'Missing photos and inspection report',
      },
    ],
    created_at: '2026-03-24T11:00:00Z',
    updated_at: '2026-03-24T15:00:00Z',
  },
  // Draft visits
  {
    id: 'visit_008',
    user_id: 'user_2',
    title: 'Streetlight Survey - Central Avenue',
    description: 'Draft: Survey of streetlight conditions and energy efficiency.',
    location_name: 'Central Avenue',
    latitude: 8.172963,
    longitude: 77.245589,
    visited_date: '2026-03-31T10:00:00Z',
    status: 'draft',
    priority: 'low',
    history: [
      {
        action: 'created',
        by_user_id: 'user_2',
        by_user_role: 'field_visitor',
        timestamp: '2026-03-31T10:00:00Z',
      },
    ],
    created_at: '2026-03-31T10:00:00Z',
    updated_at: '2026-03-31T10:00:00Z',
  },
  {
    id: 'visit_009',
    user_id: 'user_3',
    title: 'Park Maintenance Assessment - Central Park',
    description: 'Draft: Assessment of park infrastructure and facilities maintenance.',
    location_name: 'Central Park',
    latitude: 8.168963,
    longitude: 77.238589,
    visited_date: '2026-03-31T14:00:00Z',
    status: 'draft',
    priority: 'low',
    history: [
      {
        action: 'created',
        by_user_id: 'user_3',
        by_user_role: 'collector',
        timestamp: '2026-03-31T14:00:00Z',
      },
    ],
    created_at: '2026-03-31T14:00:00Z',
    updated_at: '2026-03-31T14:00:00Z',
  },
  // More completed visits for analytics
  {
    id: 'visit_010',
    user_id: 'user_1',
    title: 'Municipal Building Inspection',
    description: 'Annual compliance inspection of municipal building.',
    location_name: 'Municipal Office Building',
    latitude: 8.170963,
    longitude: 77.242589,
    visited_date: '2026-03-23T09:00:00Z',
    status: 'completed',
    priority: 'high',
    history: [
      {
        action: 'created',
        by_user_id: 'user_1',
        by_user_role: 'field_officer',
        timestamp: '2026-03-23T09:00:00Z',
      },
      {
        action: 'submitted',
        by_user_id: 'user_1',
        by_user_role: 'field_officer',
        timestamp: '2026-03-23T11:00:00Z',
      },
      {
        action: 'approved',
        by_user_id: 'user_4',
        by_user_role: 'hod',
        timestamp: '2026-03-23T14:00:00Z',
      },
      {
        action: 'completed',
        by_user_id: 'user_4',
        by_user_role: 'hod',
        timestamp: '2026-03-24T10:00:00Z',
      },
    ],
    created_at: '2026-03-23T09:00:00Z',
    updated_at: '2026-03-24T10:00:00Z',
  },
];

const DUMMY_INSPECTIONS: Inspection[] = [
  {
    id: 'insp_001',
    visit_id: 'visit_001',
    inspector_name: 'John Smith',
    inspection_type: 'Structural',
    status: 'approved',
    findings: 'Minor cracks found in the concrete structure. Paint peeling in several areas. Overall structural integrity is good.',
    recommendations: 'Apply concrete sealant to cracks. Repaint affected areas. Schedule follow-up inspection in 6 months.',
    severity: 'low',
    created_at: '2026-03-28T10:30:00Z',
    updated_at: '2026-03-28T14:00:00Z',
  },
  {
    id: 'insp_002',
    visit_id: 'visit_002',
    inspector_name: 'Jane Doe',
    inspection_type: 'Road Assessment',
    status: 'approved',
    findings: 'Multiple potholes identified (5-8 inches deep). Surface degradation in 3 sections. Drainage issues causing water pooling.',
    recommendations: 'Immediate repair of potholes. Overlay asphalt on degraded sections. Clear drainage system. Budget: $50,000',
    severity: 'critical',
    created_at: '2026-03-27T14:00:00Z',
    updated_at: '2026-03-27T16:00:00Z',
  },
  {
    id: 'insp_003',
    visit_id: 'visit_003',
    inspector_name: 'Bob Johnson',
    inspection_type: 'Fire Safety',
    status: 'approved',
    findings: 'Fire extinguishers present and properly maintained. Exit signs functional. Sprinkler system operational. One blocked emergency exit door.',
    recommendations: 'Clear emergency exit immediately. Monthly fire drills recommended. Update emergency procedures.',
    severity: 'medium',
    created_at: '2026-03-26T09:00:00Z',
    updated_at: '2026-03-26T12:00:00Z',
  },
];

const DUMMY_PHOTOS: Photo[] = [
  {
    id: 'photo_001',
    visit_id: 'visit_001',
    inspection_id: 'insp_001',
    file_path: '/photos/bridge_crack_001.jpg',
    file_name: 'bridge_crack_001.jpg',
    file_size: 2048576,
    mime_type: 'image/jpeg',
    caption: 'Crack on bridge surface',
    created_at: '2026-03-28T10:45:00Z',
  },
  {
    id: 'photo_002',
    visit_id: 'visit_001',
    inspection_id: 'insp_001',
    file_path: '/photos/bridge_overall_001.jpg',
    file_name: 'bridge_overall_001.jpg',
    file_size: 1824576,
    mime_type: 'image/jpeg',
    caption: 'Overall bridge condition',
    created_at: '2026-03-28T11:00:00Z',
  },
  {
    id: 'photo_003',
    visit_id: 'visit_002',
    inspection_id: 'insp_002',
    file_path: '/photos/road_pothole_001.jpg',
    file_name: 'road_pothole_001.jpg',
    file_size: 3048576,
    mime_type: 'image/jpeg',
    caption: 'Large pothole on highway',
    created_at: '2026-03-27T14:15:00Z',
  },
  {
    id: 'photo_004',
    visit_id: 'visit_002',
    inspection_id: 'insp_002',
    file_path: '/photos/road_degradation_001.jpg',
    file_name: 'road_degradation_001.jpg',
    file_size: 2548576,
    mime_type: 'image/jpeg',
    caption: 'Road surface degradation',
    created_at: '2026-03-27T14:30:00Z',
  },
];

export const dummyDataService = {
  /**
   * Initialize dummy data - call once on app startup
   */
  async initializeDummyData(): Promise<void> {
    try {
      console.log('🚀 Initializing dummy data...');

      // Check if dummy data already exists
      const existingVisits = await LocalStorage.getArray<Visit>('visits');
      const initTimestamp = await LocalStorage.getItem('dummy_data_init_time');
      const now = Date.now();
      
      // Reinitialize if:
      // 1. No visits exist, OR
      // 2. It's been more than 24 hours since last init, OR
      // 3. No init timestamp exists
      const shouldReinit = !existingVisits || existingVisits.length === 0;
      
      if (existingVisits && existingVisits.length > 0 && initTimestamp) {
        const lastInitTime = parseInt(initTimestamp);
        const hoursSinceInit = (now - lastInitTime) / (1000 * 60 * 60);
        if (hoursSinceInit < 24) {
          console.log('✓ Dummy data already initialized. Skipping...');
          return;
        }
      }

      if (!shouldReinit && existingVisits && existingVisits.length > 0) {
        console.log('✓ Dummy data already initialized. Skipping...');
        return;
      }

      // Initialize all data
      await Promise.all([
        LocalStorage.setArray('users', DUMMY_USERS),
        LocalStorage.setArray('visits', DUMMY_VISITS),
        LocalStorage.setArray('inspections', DUMMY_INSPECTIONS),
        LocalStorage.setArray('photos', DUMMY_PHOTOS),
        LocalStorage.setItem('dummy_data_init_time', now.toString()),
      ]);

      console.log('✓ Dummy data initialized successfully!');
      console.log(`  - Users: ${DUMMY_USERS.length}`);
      console.log(`  - Visits: ${DUMMY_VISITS.length}`);
      console.log(`  - Inspections: ${DUMMY_INSPECTIONS.length}`);
      console.log(`  - Photos: ${DUMMY_PHOTOS.length}`);
    } catch (error) {
      console.error('❌ Error initializing dummy data:', error);
      throw error;
    }
  },

  /**
   * Clear dummy data if needed
   */
  async clearDummyData(): Promise<void> {
    try {
      console.log('🗑️ Clearing dummy data...');
      await Promise.all([
        LocalStorage.removeItem('users'),
        LocalStorage.removeItem('visits'),
        LocalStorage.removeItem('inspections'),
        LocalStorage.removeItem('photos'),
      ]);
      console.log('✓ Dummy data cleared');
    } catch (error) {
      console.error('❌ Error clearing dummy data:', error);
      throw error;
    }
  },

  /**
   * Reset to fresh dummy data (clear + reinitialize)
   */
  async resetDummyData(): Promise<void> {
    await this.clearDummyData();
    await this.initializeDummyData();
  },
};

export const initializeDummyData = async (): Promise<void> => {
  return dummyDataService.initializeDummyData();
};

export default dummyDataService;
