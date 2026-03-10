# 🚀 Quick Reference Guide

## 5-Minute Setup

### Step 1: Create Supabase Project (2 min)
```
1. Go to https://supabase.com
2. Sign up/Login
3. Create new project
4. Wait for setup...
5. Go to Settings > API
6. Copy Project URL and Anon Key
```

### Step 2: Setup Database (1 min)
```
1. Open SQL Editor
2. Copy DATABASE_SETUP.sql contents
3. Paste into editor
4. Click Run
5. Done! ✅
```

### Step 3: Create Storage (1 min)
```
1. Go to Storage
2. New Bucket > "visit-photos" > Private > Create
3. Done! ✅
```

### Step 4: Configure App (1 min)
```
Create .env.local:
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### Step 5: Run App (1 min)
```bash
pnpm install
pnpm start
```

## Testing Credentials

### Test User 1 (Field Officer)
- Email: officer@test.com
- Password: Test@1234
- Role: field_officer

### Test User 2 (HOD)
- Email: hod@test.com
- Password: Test@1234
- Role: hod

### Test User 3 (Admin)
- Email: admin@test.com
- Password: Test@1234
- Role: admin

## Common Commands

```bash
# Start dev server
pnpm start

# Run on iOS
pnpm ios

# Run on Android
pnpm android

# Run on web
pnpm web

# Install dependencies
pnpm install

# Clean up
rm -rf node_modules && pnpm install
```

## File Locations

```
📂 App Entry
   └── app/_layout.tsx (Root layout)

📂 Authentication
   └── app/(auth)/
       ├── login.tsx
       ├── signup.tsx
       └── reset-password.tsx

📂 Main App Screens
   └── app/(tabs)/
       ├── home.tsx (Dashboard)
       ├── create.tsx (New Visit)
       ├── approvals.tsx (Review Queue)
       ├── analytics.tsx (Charts & Stats)
       └── profile.tsx (User Settings)

📂 Services (API Logic)
   └── services/
       ├── auth.ts
       ├── visits.ts
       ├── inspections.ts
       ├── photos.ts
       └── analytics.ts

📂 Hooks (State Management)
   └── hooks/
       ├── useAuth.ts
       └── useVisits.ts

📂 Types
   └── types/index.ts
```

## Key Database Tables

| Table | Purpose |
|-------|---------|
| users | User accounts & roles |
| visits | Field visit records |
| inspections | Inspection details |
| photos | Photo uploads |
| signatures | Digital signatures |
| approvals | Approval records |

## Screen Features

### 🏠 Home Screen
- Dashboard with visit stats
- List of all visits
- Quick access to create new visit
- Status indicators

### ➕ Create Visit Screen
- Fill visit details
- Auto-capture GPS location
- Manual location entry
- Set visit date
- Create & submit

### ✅ Approvals Screen
- Pending visits queue
- Approve/Reject buttons
- Add comments to rejections
- Real-time updates

### 📊 Analytics Screen
- Total visits count
- Completed/pending/rejected stats
- Status distribution charts
- Activity timeline
- Performance metrics

### 👤 Profile Screen
- User information
- Biometric settings
- Account status
- Help & support
- Sign out button

## API Usage Examples

### Create a Visit
```typescript
import useVisits from '@/hooks/useVisits';

const { createVisit } = useVisits(userId);

await createVisit({
  title: 'School Inspection',
  description: 'Regular inspection',
  location_name: 'ABC School',
  latitude: 40.7128,
  longitude: -74.0060,
  visited_date: '2024-01-15',
});
```

### Upload a Photo
```typescript
import photosService from '@/services/photos';

await photosService.uploadPhoto(
  visitId,
  inspectionId,
  photoUri,
  'Building entrance'
);
```

### Approve a Visit
```typescript
import visitsService from '@/services/visits';

await visitsService.approveVisit(visitId, approverUserId);
```

### Get Analytics
```typescript
import analyticsService from '@/services/analytics';

const data = await analyticsService.getAnalyticsDashboard(userId);
console.log(data.total_visits, data.completed_visits);
```

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL     → Supabase project URL
EXPO_PUBLIC_SUPABASE_ANON_KEY → Supabase anon key
```

## Role Permissions Matrix

```
                 Field    HOD    Collector  Admin
                Officer         
Create Visit       ✅      —        —        ✅
Submit Visit       ✅      —        —        ✅
Approve Visit      —       ✅       ✅       ✅
View Reports       ✅      ✅       ✅       ✅
Edit Users         —       —        —        ✅
Delete Data        —       —        —        ✅
```

## Debugging Tips

### Check Supabase Connection
```typescript
import supabase from '@/services/supabase';

// Test query
const { data, error } = await supabase.from('users').select('count');
console.log(data, error);
```

### Check Auth Status
```typescript
import authService from '@/services/auth';

const session = await authService.getSession();
console.log('Current user:', session?.user);
```

### Enable Debug Logs
Add to services:
```typescript
console.log('[v0] Debug message:', variable);
```

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "No database URL found" | Add `.env.local` with SUPABASE_URL |
| "Module not found" | Run `pnpm install` again |
| Photos not uploading | Check storage bucket exists and is private |
| Login fails | Verify user exists in Supabase auth |
| GPS not working | Enable location permission |
| Biometric fails | Device may not have biometric capability |

## Performance Tips

1. **Cache visited data** - Use useVisits hook
2. **Optimize photos** - Compress before upload
3. **Batch approvals** - Approve multiple at once
4. **Use indexes** - Database has indexes on common queries
5. **Lazy load** - Screenshots/photos load on demand

## Security Checklist

- ✅ Row Level Security (RLS) enabled
- ✅ Private storage bucket
- ✅ Secure token storage
- ✅ HTTPS for all requests
- ✅ Password hashing
- ✅ Session timeout
- ✅ Biometric support

## Customization Quick Tips

### Change App Colors
Find and replace in screen files:
- `#0066cc` → Your primary color
- `#4caf50` → Your success color
- `#f44336` → Your error color

### Change App Name
Edit `app.json`:
```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug"
  }
}
```

### Add New Field
1. Update `DATABASE_SETUP.sql` table
2. Add to `types/index.ts`
3. Update form component
4. Update service method

## Useful Links

- **Supabase Docs**: https://supabase.com/docs
- **Expo Docs**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **TypeScript**: https://www.typescriptlang.org
- **Expo Router**: https://docs.expo.dev/router/introduction/

## Version Info

- React Native: 0.73
- Expo: ~50.0
- TypeScript: ~5.3
- Supabase JS: ^2.38

## Need Help?

1. Check [SETUP.md](./SETUP.md) for detailed setup
2. Review [README.md](./README.md) for overview
3. Check Supabase logs for API errors
4. Check device console for app errors
5. Test with Expo Go first before building

## Next Steps

After running app:
1. ✅ Test authentication (login/signup)
2. ✅ Create a test visit
3. ✅ Upload a photo
4. ✅ Test approval workflow
5. ✅ Check analytics dashboard
6. ✅ Configure biometric auth
7. ✅ Customize branding
8. ✅ Deploy to app stores

---

**Happy developing! 🎉**
