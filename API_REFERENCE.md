# 📡 API Reference

Complete reference for all available services and hooks in the Field Visit Tracker app.

## Authentication Service

File: `services/auth.ts`

### signUp()
Register a new user account.

```typescript
import authService from '@/services/auth';

const { data, error } = await authService.signUp(
  email: string,      // User email
  password: string,   // Password (min 6 chars)
  fullName: string,   // Full name
  phone?: string      // Optional phone
);

// Returns: { data: { user, session }, error: null } | { data: null, error: Error }
```

**Example:**
```typescript
await authService.signUp(
  'john@example.com',
  'SecurePass123',
  'John Doe',
  '+1234567890'
);
```

---

### signIn()
Authenticate with email and password.

```typescript
const { data, error } = await authService.signIn(
  email: string,    // User email
  password: string  // Password
);

// Returns: { data: { user: User, session }, error: null }
```

---

### signOut()
Terminate current session.

```typescript
const { error } = await authService.signOut();
```

---

### getSession()
Get current authenticated session.

```typescript
const session: AuthSession | null = await authService.getSession();

// Returns: {
//   user: User,
//   session: {
//     access_token: string,
//     refresh_token: string,
//     expires_at: number
//   }
// } | null
```

---

### getUserProfile()
Get user profile from database.

```typescript
const user: User | null = await authService.getUserProfile(userId: string);
```

---

### biometricAuthenticate()
Authenticate using device biometrics.

```typescript
const { success, error } = await authService.biometricAuthenticate();
```

---

### enableBiometric()
Enable biometric authentication for user.

```typescript
const { error } = await authService.enableBiometric();
```

---

### disableBiometric()
Disable biometric authentication.

```typescript
const { error } = await authService.disableBiometric();
```

---

### resetPassword()
Send password reset email.

```typescript
const { data, error } = await authService.resetPassword(email: string);
```

---

## Visits Service

File: `services/visits.ts`

### createVisit()
Create a new field visit.

```typescript
import visitsService from '@/services/visits';

const { data, error } = await visitsService.createVisit(
  userId: string,
  visit: CreateVisitForm
);

// CreateVisitForm:
// {
//   title: string;
//   description?: string;
//   location_name: string;
//   latitude: number;
//   longitude: number;
//   visited_date: string; // "YYYY-MM-DD"
// }

// Returns: { data: Visit, error: null } | { data: null, error: Error }
```

**Example:**
```typescript
await visitsService.createVisit(userId, {
  title: 'School Inspection',
  description: 'Annual safety inspection',
  location_name: 'ABC Primary School',
  latitude: 40.7128,
  longitude: -74.0060,
  visited_date: '2024-01-15'
});
```

---

### getUserVisits()
Get all visits for a specific user.

```typescript
const { data, error } = await visitsService.getUserVisits(userId: string);

// Returns: { data: Visit[], error: null }
```

---

### getVisit()
Get a single visit by ID.

```typescript
const { data, error } = await visitsService.getVisit(visitId: string);

// Returns: { data: Visit, error: null }
```

---

### updateVisit()
Update visit details.

```typescript
const { data, error } = await visitsService.updateVisit(
  visitId: string,
  updates: Partial<Visit>
);

// Can update: title, description, location_name, latitude, longitude, visited_date
```

---

### submitVisit()
Submit visit for approval.

```typescript
const { data, error } = await visitsService.submitVisit(visitId: string);

// Changes status from 'draft' to 'submitted'
```

---

### getPendingApprovals()
Get visits awaiting approval.

```typescript
const { data, error } = await visitsService.getPendingApprovals(role: string);

// Returns: { data: Visit[], error: null }
```

---

### approveVisit()
Approve a submitted visit.

```typescript
const { data, error } = await visitsService.approveVisit(
  visitId: string,
  approverId: string
);

// Changes status to 'approved'
// Creates approval record
```

---

### rejectVisit()
Reject a visit with comments.

```typescript
const { data, error } = await visitsService.rejectVisit(
  visitId: string,
  approverId: string,
  comments: string
);

// Changes status to 'rejected'
// Stores rejection comments
```

---

### deleteVisit()
Delete a draft visit.

```typescript
const { error } = await visitsService.deleteVisit(visitId: string);
```

---

### getVisitsByDateRange()
Get visits within date range.

```typescript
const { data, error } = await visitsService.getVisitsByDateRange(
  userId: string,
  startDate: string,  // "YYYY-MM-DD"
  endDate: string     // "YYYY-MM-DD"
);
```

---

### getVisitsByStatus()
Get visits filtered by status.

```typescript
const { data, error } = await visitsService.getVisitsByStatus(
  userId: string,
  status: VisitStatus  // 'draft' | 'submitted' | 'approved' | 'rejected' | 'completed'
);
```

---

## Inspections Service

File: `services/inspections.ts`

### createInspection()
Create inspection for a visit.

```typescript
import inspectionsService from '@/services/inspections';

const { data, error } = await inspectionsService.createInspection(
  visitId: string,
  inspection: CreateInspectionForm
);

// CreateInspectionForm:
// {
//   inspector_name: string;
//   inspection_type: string;
//   findings: string;
//   recommendations?: string;
//   severity?: 'low' | 'medium' | 'high' | 'critical';
// }
```

---

### getVisitInspections()
Get all inspections for a visit.

```typescript
const { data, error } = await inspectionsService.getVisitInspections(visitId: string);

// Returns: { data: Inspection[], error: null }
```

---

### getInspection()
Get single inspection.

```typescript
const { data, error } = await inspectionsService.getInspection(inspectionId: string);
```

---

### updateInspection()
Update inspection details.

```typescript
const { data, error } = await inspectionsService.updateInspection(
  inspectionId: string,
  updates: Partial<Inspection>
);
```

---

### submitInspection()
Submit inspection for approval.

```typescript
const { data, error } = await inspectionsService.submitInspection(inspectionId: string);

// Changes status to 'pending'
```

---

### getPendingInspections()
Get pending inspections.

```typescript
const { data, error } = await inspectionsService.getPendingInspections();

// Returns all inspections with status 'pending'
```

---

### approveInspection()
Approve an inspection.

```typescript
const { data, error } = await inspectionsService.approveInspection(
  inspectionId: string,
  approverId: string
);
```

---

### rejectInspection()
Reject an inspection.

```typescript
const { data, error } = await inspectionsService.rejectInspection(
  inspectionId: string,
  approverId: string,
  comments: string
);
```

---

### deleteInspection()
Delete inspection.

```typescript
const { error } = await inspectionsService.deleteInspection(inspectionId: string);
```

---

### getInspectionsBySeverity()
Get inspections by severity level.

```typescript
const { data, error } = await inspectionsService.getInspectionsBySeverity(
  severity: 'low' | 'medium' | 'high' | 'critical'
);
```

---

## Photos Service

File: `services/photos.ts`

### uploadPhoto()
Upload photo to cloud storage.

```typescript
import photosService from '@/services/photos';

const { data, error } = await photosService.uploadPhoto(
  visitId: string,
  inspectionId: string | null,
  localUri: string,      // Local file path
  caption?: string
);

// Returns: { data: Photo, error: null }
```

**Example:**
```typescript
await photosService.uploadPhoto(
  visitId,
  inspectionId,
  'file:///path/to/photo.jpg',
  'Building entrance photo'
);
```

---

### getVisitPhotos()
Get all photos for a visit.

```typescript
const { data, error } = await photosService.getVisitPhotos(visitId: string);

// Returns: { data: Photo[], error: null }
```

---

### getInspectionPhotos()
Get photos for an inspection.

```typescript
const { data, error } = await photosService.getInspectionPhotos(inspectionId: string);
```

---

### getPhoto()
Get single photo.

```typescript
const { data, error } = await photosService.getPhoto(photoId: string);
```

---

### getPhotoDownloadUrl()
Get public download URL for photo.

```typescript
const { data, error } = await photosService.getPhotoDownloadUrl(filePath: string);

// Returns: { data: string (URL), error: null }
```

---

### updatePhotoCaption()
Update photo caption.

```typescript
const { data, error } = await photosService.updatePhotoCaption(
  photoId: string,
  caption: string
);
```

---

### deletePhoto()
Delete photo from storage.

```typescript
const { error } = await photosService.deletePhoto(
  photoId: string,
  filePath: string
);

// Deletes from both storage and database
```

---

### getAllPhotos()
Get all photos (admin only).

```typescript
const { data, error } = await photosService.getAllPhotos();
```

---

## Analytics Service

File: `services/analytics.ts`

### getAnalyticsDashboard()
Get comprehensive dashboard data.

```typescript
import analyticsService from '@/services/analytics';

const analytics = await analyticsService.getAnalyticsDashboard(userId?: string);

// Returns: {
//   total_visits: number;
//   completed_visits: number;
//   pending_approvals: number;
//   rejection_rate: number;
//   visits_by_date: Array<{ date: string; count: number }>;
//   visits_by_status: Record<VisitStatus, number>;
// }
```

**Example:**
```typescript
const data = await analyticsService.getAnalyticsDashboard(userId);
console.log(data.total_visits);        // 45
console.log(data.completion_rate);     // 84.2%
console.log(data.pending_approvals);   // 3
```

---

### getVisitsByDateRange()
Get visits within date range.

```typescript
const { data, error } = await analyticsService.getVisitsByDateRange(
  startDate: string,  // "YYYY-MM-DD"
  endDate: string     // "YYYY-MM-DD"
);
```

---

### getInspectionStats()
Get inspection statistics.

```typescript
const { data, error } = await analyticsService.getInspectionStats();

// Returns: {
//   total_inspections: number;
//   by_status: Record<string, number>;
//   by_severity: Record<string, number>;
// }
```

---

### getUserMetrics()
Get user performance metrics.

```typescript
const { data, error } = await analyticsService.getUserMetrics(userId: string);

// Returns: {
//   total_visits: number;
//   approved_visits: number;
//   rejected_visits: number;
//   total_inspections: number;
// }
```

---

### getApprovalTurnaroundTime()
Get approval speed statistics.

```typescript
const { data, error } = await analyticsService.getApprovalTurnaroundTime();

// Returns: {
//   avg_hours: number;
//   min_hours: number;
//   max_hours: number;
// }
```

---

## React Hooks

### useAuth()

File: `hooks/useAuth.ts`

State management for authentication.

```typescript
import useAuth from '@/hooks/useAuth';

const {
  user,                    // Current user | null
  loading,                 // Loading state
  signUp,                  // Async function
  signIn,                  // Async function
  signOut,                 // Async function
  biometricAuth,           // Async function
  enableBiometric,         // Async function
  disableBiometric,        // Async function
} = useAuth();
```

**Example:**
```typescript
const { user, loading, signIn } = useAuth();

if (loading) return <ActivityIndicator />;

if (user) {
  return <Text>Welcome {user.full_name}</Text>;
}

await signIn(email, password);
```

---

### useVisits()

File: `hooks/useVisits.ts`

State management for visits.

```typescript
import useVisits from '@/hooks/useVisits';

const {
  visits,                  // Visit[]
  loading,                 // boolean
  error,                   // Error | null
  fetchVisits,             // Async function
  createVisit,             // Async function
  updateVisit,             // Async function
  submitVisit,             // Async function
  approveVisit,            // Async function
  rejectVisit,             // Async function
  deleteVisit,             // Async function
  getVisitsByStatus,       // Async function
  getPendingApprovals,     // Async function
} = useVisits(userId?: string);
```

**Example:**
```typescript
const { visits, createVisit, loading } = useVisits(userId);

useEffect(() => {
  // Hook auto-fetches on mount
}, []);

const handleCreate = async () => {
  await createVisit({
    title: 'New Visit',
    location_name: 'Location',
    latitude: 0,
    longitude: 0,
    visited_date: '2024-01-15'
  });
};

return (
  <FlatList
    data={visits}
    renderItem={({ item }) => <Text>{item.title}</Text>}
  />
);
```

---

## Type Definitions

All types are defined in `types/index.ts`

### User
```typescript
interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: 'field_officer' | 'hod' | 'collector' | 'admin';
  department?: string;
  zone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Visit
```typescript
interface Visit {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  visited_date: string;
  status: 'draft' | 'submitted' | 'pending_approval' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
}
```

### Inspection
```typescript
interface Inspection {
  id: string;
  visit_id: string;
  inspector_name: string;
  inspection_type: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  findings: string;
  recommendations?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}
```

### Photo
```typescript
interface Photo {
  id: string;
  visit_id: string;
  inspection_id?: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  caption?: string;
  created_at: string;
}
```

### Approval
```typescript
interface Approval {
  id: string;
  inspection_id: string;
  approver_id: string;
  approver_role: 'field_officer' | 'hod' | 'collector' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: string;
  created_at: string;
}
```

---

## Error Handling

All services return a standard format:

```typescript
// Success
{ data: <any>, error: null }

// Error
{ data: null, error: <Error> }
```

Handle errors consistently:

```typescript
const { data, error } = await someService.doSomething();

if (error) {
  console.error('Operation failed:', error.message);
  Alert.alert('Error', error.message);
  return;
}

console.log('Success:', data);
```

---

## Best Practices

1. **Always handle errors** - Check error field after every async call
2. **Use hooks** - Leverage useAuth and useVisits for state management
3. **Validate input** - Check data before API calls
4. **Cache data** - Reuse hook data instead of refetching
5. **Loading states** - Show loading indicator during operations
6. **Error feedback** - Show user-friendly error messages

---

## Rate Limits

Supabase default limits:
- Auth: 4 requests/sec per IP
- API: Depends on your plan
- Storage: Bandwidth limited by plan

Monitor usage in Supabase dashboard.

---

## Pagination

Not yet implemented but ready for:

```typescript
// Future enhancement
const { data } = await visitsService.getUserVisits(userId, {
  page: 1,
  limit: 20,
  orderBy: 'created_at',
  ascending: false
});
```

---

## Additional Resources

- Full example usage in screen files (`app/(tabs)/*.tsx`)
- Service implementations in `services/`
- Hook implementations in `hooks/`

---

**Happy coding! 🚀**
