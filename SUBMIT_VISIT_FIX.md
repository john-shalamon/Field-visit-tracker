# Submit Visit Functionality - Local Storage Fix

## Problem Identified
The Submit Visit button was not working properly. When users entered data and clicked "Submit Visit," the data was being stored locally but not appearing correctly on the dashboard with the proper status.

## Root Causes Fixed

### 1. Missing User Context in Submit Action
**File**: `services/visits.ts` & `hooks/useVisits.ts`
- **Issue**: The `submitVisit()` function was not passing the user ID and role when updating the visit history
- **Fix**: Now properly captures `submittedById` and `submittedByRole` from the user who submitted the visit
- **Impact**: Visit history now correctly records who submitted and when

### 2. Hook State Not Properly Updated
**File**: `hooks/useVisits.ts`
- **Issue**: The `submitVisit` hook callback wasn't properly updating state after submission
- **Fix**: Added dependency on `userId` so it can properly attribute submissions to the correct user
- **Impact**: After submission, the hook state is correctly updated with submitted status

### 3. Incomplete Visit Submission Flow
**File**: `app/(tabs)/create.tsx`
- **Issue**: The form was only saving basic visit data but not:
  - Photos captured by the user
  - Inspection findings and recommendations  
  - Passing user credentials to the submit action
- **Fix**: Enhanced the submission flow to:
  - Capture and store photos metadata with the visit
  - Store inspection data if user added it
  - Pass user ID and role to the submitVisit function
  - Provide better logging and error handling

### 4. Improved Error Handling
- **Added validation** to check if visit was successfully submitted (status changes to "submitted")
- **Better console logging** to track the entire flow for debugging
- **User-friendly alerts** confirming draft save or visit submission

## Changes Made

### Updated Files:

#### 1. `services/visits.ts`
```typescript
// Now properly captures user context
async submitVisit(visitId: string, submittedById?: string, submittedByRole?: string) {
  // ... enhanced logging to show:
  // - Visit found and current status
  // - User submitting and their role
  // - Final status after submission
}
```

#### 2. `hooks/useVisits.ts`
```typescript
// Now passes user context and handles state updates
const submitVisit = useCallback(
  async (visitId: string, submittedById?: string, submittedByRole?: string) => {
    // Fixed dependency array to include userId
    // Properly updates hook state with new visit status
  },
  [userId]  // Added userId as dependency
);
```

#### 3. `app/(tabs)/create.tsx`
```typescript
// Enhanced handleSubmit to:
// 1. Capture inspection data if user added it
// 2. Store photos metadata with the visit
// 3. Pass user context when submitting
// 4. Include better logging and validation
```

## Data Flow After Submit

1. **User fills form** → Enters title, description, location, date, photos, inspection data
2. **Clicks "Submit Visit"** → Triggers handleSubmit(false)
3. **Visit is created** → Basic visit saved with status='draft'
4. **Metadata saved** → Photos and inspection data added to visit record
5. **Visit submitted** → Status changed to 'submitted' with user/timestamp in history
6. **Redirects to home** → User navigates to dashboard
7. **Home fetches visits** → useFocusEffect triggers fetchVisits()
8. **Visit appears** → Shows with 'submitted' status in the dashboard

## Local Storage Structure

Visits are now stored with complete metadata:
```typescript
{
  id: string;
  user_id: string;
  title: string;
  description?: string;
  location_name: string;
  latitude: number;
  longitude: number;
  visited_date: string;
  status: 'draft' | 'submitted' | ... ;
  photos?: Array<{ uri: string; timestamp: string }>;
  inspection?: {
    inspection_type: string;
    findings: string;
    recommendations?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  };
  history: HistoryItem[];
  created_at: string;
  updated_at: string;
}
```

## Verification Steps

1. ✅ Create a new visit with title and location
2. ✅ (Optional) Add photos and inspection data
3. ✅ Click "Submit Visit" button
4. ✅ Confirm submission in alert
5. ✅ Navigate to Home dashboard
6. ✅ Verify visit appears with 'submitted' status
7. ✅ Check console logs for proper flow execution

## Testing Checklist

- [ ] Draft save works (visit status = 'draft')
- [ ] Submit works (visit status = 'submitted')
- [ ] Photos are saved with visit
- [ ] Inspection data is saved with visit
- [ ] Visit appears on home dashboard after submission
- [ ] Visit history shows correct user/role who submitted
- [ ] No reload required - visit appears immediately when navigating back
- [ ] Admin/HOD can see all submitted visits
- [ ] Field officers only see their own visits

## Troubleshooting

If visits still don't appear:
1. Check browser console for errors
2. Open DevTools → Application → Local Storage
3. Look for visits in localStorage under "visits" key
4. Verify user is logged in (user.id is set)
5. Check that fetchVisits() is being called when home screen focuses

## Future Enhancements

- [ ] Add real image storage (Base64 encoding in localStorage)
- [ ] Implement pending approvals workflow
- [ ] Add email notifications for submitted visits
- [ ] Create backup/export functionality for local data
- [ ] Implement data sync when app goes online (if needed later)
