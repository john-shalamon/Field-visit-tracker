# Field Visit Tracker - Complete Setup Guide

This is a complete React Native/Expo application for tracking field visits and inspections with GPS, photo capture, digital signatures, and approval workflows.

## Prerequisites

- Node.js 16+ and npm or pnpm
- Expo CLI: `npm install -g expo-cli`
- Supabase account (create at https://supabase.com)
- iOS or Android device/emulator for testing

## Step 1: Supabase Setup

### 1.1 Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Enter a project name (e.g., "field-visit-tracker")
4. Set a strong database password
5. Select your region
6. Click "Create new project"

### 1.2 Get Your Supabase Credentials

1. After project creation, go to Settings > API
2. Copy these values:
   - **Project URL** (SUPABASE_URL)
   - **Anon Public Key** (SUPABASE_ANON_KEY)

### 1.3 Set Up Database

1. Go to the SQL Editor in your Supabase dashboard
2. Click "New Query"
3. Copy the entire contents of `DATABASE_SETUP.sql`
4. Paste it into the SQL editor
5. Click "Run"
6. Wait for all commands to complete

### 1.4 Create Storage Bucket

1. Go to Storage > Buckets
2. Click "New bucket"
3. Name it `visit-photos`
4. Make it **private**
5. Click "Create bucket"
6. Go to Policies, and the RLS policies from the SQL script should be applied

### 1.5 Enable Email Authentication

1. Go to Authentication > Providers
2. Ensure "Email" is enabled
3. Go to Email Templates
4. (Optional) Customize email templates if needed

## Step 2: Local Development Setup

### 2.1 Install Dependencies

```bash
# Navigate to project directory
cd field-visit-tracker

# Install dependencies using pnpm
pnpm install

# Or if using npm
npm install
```

### 2.2 Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace with your actual Supabase credentials from Step 1.2

### 2.3 Fix Import Issue

There's a small import issue in the auth hook. Edit `hooks/useAuth.ts` and add this import at the top:

```typescript
import supabase from '@/services/supabase';
```

## Step 3: Run the App

### 3.1 Start Expo Development Server

```bash
pnpm start
# or
npm start
```

### 3.2 Run on Device/Emulator

**For iOS (Mac only):**
```bash
pnpm ios
```

**For Android:**
```bash
pnpm android
```

**For Web:**
```bash
pnpm web
```

Or scan the QR code with Expo Go app on your phone.

## Step 4: Test the App

### 4.1 Create Test Users

1. On the login screen, click "Sign up"
2. Create multiple test users with different roles
3. Go to Supabase > users table to update roles:
   - Edit user rows and set `role` to one of: `field_officer`, `hod`, `collector`, `admin`

### 4.2 Test Features

**Field Officer (field_officer):**
- Create new visits with GPS location
- Add inspections and photos
- Submit visits for approval

**HOD (Head of Department):**
- View pending approvals
- Approve or reject submissions
- View analytics

**Collector (collector):**
- Similar to HOD, can approve visits
- Different permissions setup

**Admin (admin):**
- Full access to all features and data

## Features

### 🌍 Core Features

✅ **Authentication**
- Email/password signup and login
- Password reset
- Biometric authentication (fingerprint)
- Secure session management

✅ **Field Visits**
- Create visits with title and description
- GPS location capture (automatic or manual)
- Visit date tracking
- Draft/submitted/approved/rejected workflow

✅ **Inspections**
- Create inspections for visits
- Inspector name and type
- Findings and recommendations
- Severity levels (low, medium, high, critical)

✅ **Photos**
- Capture photos with device camera
- Photo gallery management
- Photo captions
- Secure cloud storage with Supabase

✅ **Approvals**
- Multi-level approval workflow
- HOD and collector review
- Comments on rejections
- Approval tracking

✅ **Analytics Dashboard**
- Total visits and completion rates
- Status distribution charts
- Recent activity timeline
- Key performance metrics

✅ **User Profile**
- User information display
- Biometric settings
- Security preferences
- Account management

## Project Structure

```
field-visit-tracker/
├── app/
│   ├── _layout.tsx           # Root layout
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── reset-password.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── home.tsx          # Dashboard
│       ├── create.tsx        # New visit form
│       ├── approvals.tsx     # Approval queue
│       ├── analytics.tsx     # Analytics dashboard
│       └── profile.tsx       # User profile
├── services/
│   ├── supabase.ts          # Supabase client
│   ├── auth.ts              # Authentication service
│   ├── visits.ts            # Visits CRUD operations
│   ├── inspections.ts       # Inspections CRUD
│   ├── photos.ts            # Photo management
│   └── analytics.ts         # Analytics queries
├── hooks/
│   ├── useAuth.ts           # Auth context hook
│   └── useVisits.ts         # Visits state management
├── types/
│   └── index.ts             # TypeScript types
└── DATABASE_SETUP.sql       # Database schema

```

## API Reference

### Authentication Service

```typescript
import authService from '@/services/auth';

// Sign up
await authService.signUp(email, password, fullName, phone);

// Sign in
await authService.signIn(email, password);

// Sign out
await authService.signOut();

// Get session
const session = await authService.getSession();

// Biometric auth
await authService.biometricAuthenticate();

// Enable/disable biometric
await authService.enableBiometric();
await authService.disableBiometric();
```

### Visits Service

```typescript
import visitsService from '@/services/visits';

// Create visit
await visitsService.createVisit(userId, visitData);

// Get user visits
await visitsService.getUserVisits(userId);

// Update visit
await visitsService.updateVisit(visitId, updates);

// Submit visit for approval
await visitsService.submitVisit(visitId);

// Approve/reject visits
await visitsService.approveVisit(visitId, approverId);
await visitsService.rejectVisit(visitId, approverId, comments);

// Get visits by status
await visitsService.getVisitsByStatus(userId, status);
```

### Photos Service

```typescript
import photosService from '@/services/photos';

// Upload photo
await photosService.uploadPhoto(visitId, inspectionId, localUri, caption);

// Get visit photos
await photosService.getVisitPhotos(visitId);

// Get inspection photos
await photosService.getInspectionPhotos(inspectionId);

// Get photo download URL
await photosService.getPhotoDownloadUrl(filePath);

// Update photo caption
await photosService.updatePhotoCaption(photoId, caption);

// Delete photo
await photosService.deletePhoto(photoId, filePath);
```

### Analytics Service

```typescript
import analyticsService from '@/services/analytics';

// Get dashboard analytics
const analytics = await analyticsService.getAnalyticsDashboard(userId);

// Get inspection statistics
const stats = await analyticsService.getInspectionStats();

// Get user metrics
const metrics = await analyticsService.getUserMetrics(userId);

// Get approval turnaround time
const turnaround = await analyticsService.getApprovalTurnaroundTime();
```

## Customization

### Change App Colors

Edit the color values in each screen file:
- Primary color: `#0066cc` (blue)
- Success color: `#4caf50` (green)
- Warning color: `#ff9800` (orange)
- Error color: `#f44336` (red)

### Change App Name

1. Edit `app.json` - change the `name` field
2. Update package name in `app.json` for iOS/Android builds

### Add Custom User Fields

1. Edit `DATABASE_SETUP.sql` - add new columns to users table
2. Update `types/index.ts` - add fields to User interface
3. Update signup form in `app/(auth)/signup.tsx`
4. Update profile screen in `app/(tabs)/profile.tsx`

## Troubleshooting

### "No database URL found"
- Ensure `.env.local` file exists with correct credentials
- Check Supabase project is created and not paused

### "Fingerprint not available"
- Biometric features only work on devices with biometric capability
- The app gracefully handles this and falls back to password auth

### Photos not uploading
- Ensure storage bucket "visit-photos" exists and is private
- Check camera permissions are granted on device
- Verify RLS policies are correctly applied

### Login issues
- Verify user exists in Supabase auth
- Check email/password credentials
- Review auth logs in Supabase dashboard

### Locations not working
- Ensure location permission is granted
- Check GPS is enabled on device
- Some emulators have limited GPS support

## Building for Production

### iOS Build

```bash
# Generate iOS build
eas build --platform ios

# Or with local build
eas build --platform ios --local
```

### Android Build

```bash
# Generate Android build
eas build --platform android

# Or with local build
eas build --platform android --local
```

### Prepare for Submission

1. Get provisioning certificates (Apple Developer)
2. Set up Google Play signing key (Google Play)
3. Update version numbers in `app.json`
4. Run `eas build` with proper credentials

## Security Best Practices

✅ **Implemented:**
- Row Level Security (RLS) policies on all tables
- Secure token storage with AsyncStorage
- Biometric authentication support
- Password hashing with Supabase auth
- HTTPS/TLS for all API calls

**For Production:**
- Enable 2FA on Supabase account
- Regularly rotate API keys
- Monitor authentication logs
- Use environment-specific credentials
- Enable email verification for new users
- Set rate limits on authentication endpoints

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Expo Documentation**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev/docs
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

## License

This project is provided as-is for use with Supabase.

## Next Steps

1. Customize the app with your branding
2. Add additional fields specific to your use case
3. Integrate with your backend systems
4. Deploy to app stores (iOS App Store, Google Play)
5. Set up monitoring and analytics
6. Implement push notifications for approvals
7. Add offline mode with expo-sqlite

---

**Happy tracking! 🚀**
