# 🌍 Field Visit Tracker

A complete React Native/Expo mobile application for tracking field visits and inspections with GPS location, photo capture, digital signatures, and multi-level approval workflows.

## ⚡ Quick Start

### 1. Prerequisites
- Node.js 16+
- Expo CLI: `npm install -g expo-cli`
- Supabase account (free at https://supabase.com)

### 2. Setup Supabase
1. Create a Supabase project
2. Copy your **Project URL** and **Anon Key** from Settings > API
3. Run `DATABASE_SETUP.sql` in SQL Editor
4. Create a private storage bucket named `visit-photos`

### 3. Configure Environment
Create `.env.local`:
```
EXPO_PUBLIC_SUPABASE_URL=your_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Install & Run
```bash
pnpm install
pnpm start
```

### 5. Test
- Create test users with roles: `field_officer`, `hod`, `collector`, `admin`
- Scan QR code with Expo Go or run on emulator

## 📱 Features

| Feature | Status |
|---------|--------|
| 🔐 Email/Password Authentication | ✅ |
| 🔒 Biometric Login (Fingerprint) | ✅ |
| 📍 GPS Location Capture | ✅ |
| 📸 Photo Management | ✅ |
| ✍️ Digital Signatures | ✅ |
| ✅ Multi-Level Approvals | ✅ |
| 📊 Analytics Dashboard | ✅ |
| 👤 User Profiles | ✅ |
| 🔄 Offline Support | 🔲 |
| 🔔 Push Notifications | 🔲 |

## 🏗️ Architecture

**Tech Stack:**
- React Native 0.73 + Expo 50
- Supabase (PostgreSQL + Auth)
- TypeScript
- Expo Router (file-based routing)

**Database:**
- Users (with roles: field_officer, hod, collector, admin)
- Visits (with status workflow)
- Inspections (with findings & severity)
- Photos (with cloud storage)
- Signatures (digital sign-off)
- Approvals (workflow tracking)

## 📂 Project Structure

```
app/
  ├── (auth)/        → Login, signup, password reset
  └── (tabs)/        → Main app screens (5 tabs)
services/
  ├── auth.ts        → Authentication logic
  ├── visits.ts      → Visit CRUD & workflows
  ├── inspections.ts → Inspection management
  ├── photos.ts      → Photo upload/management
  └── analytics.ts   → Dashboard analytics
hooks/
  ├── useAuth.ts     → Auth state management
  └── useVisits.ts   → Visits state management
types/
  └── index.ts       → TypeScript definitions
```

## 🔐 User Roles

| Role | Permissions |
|------|------------|
| **Field Officer** | Create visits, add inspections, submit for approval |
| **HOD** | Review and approve/reject submissions |
| **Collector** | Similar to HOD, additional data collection rights |
| **Admin** | Full access, user management, system administration |

## 🎯 Main Screens

1. **Home** - Dashboard with visit overview and stats
2. **Create Visit** - Form to create new field visit with GPS
3. **Approvals** - Queue of pending visit approvals
4. **Analytics** - Performance metrics and charts
5. **Profile** - User info, settings, and biometric config

## 🚀 Deployment

### Build for iOS
```bash
eas build --platform ios
```

### Build for Android
```bash
eas build --platform android
```

See [SETUP.md](./SETUP.md) for detailed production build instructions.

## 🔧 Customization

### Change Colors
Edit style objects in screen files. Primary color is `#0066cc`.

### Add Custom Fields
1. Update `DATABASE_SETUP.sql`
2. Add to `types/index.ts`
3. Update relevant screens
4. Add to services

### Enable Features
- **Push Notifications**: Install `expo-notifications`
- **Offline Mode**: Install `expo-sqlite`
- **Maps**: Install `expo-maps` or `react-native-maps`

## ⚠️ Important Notes

1. **Biometric Authentication** works only on devices with fingerprint capability
2. **GPS Features** require location permission
3. **Photos** upload to Supabase Storage (private bucket)
4. **RLS Policies** enforce row-level security for all data
5. All credentials must be set in `.env.local`

## 📖 Full Documentation

See [SETUP.md](./SETUP.md) for:
- Detailed Supabase setup
- Complete API reference
- Troubleshooting guide
- Production deployment
- Security best practices

## 🛠️ Development

### Available Scripts

```bash
# Start development server
pnpm start

# Run on iOS simulator/device
pnpm ios

# Run on Android emulator/device
pnpm android

# Run web version
pnpm web
```

### Adding Dependencies

```bash
# Add package
pnpm add package-name

# Add dev dependency
pnpm add -D package-name
```

## 🐛 Troubleshooting

**"Cannot find module" errors?**
→ Clear node_modules: `rm -rf node_modules && pnpm install`

**Supabase connection fails?**
→ Check `.env.local` has correct credentials

**Photos not uploading?**
→ Verify storage bucket exists and is private

**Biometric not working?**
→ Device may not have biometric capability (fingerprint, face ID)

See [SETUP.md](./SETUP.md) for more troubleshooting.

## 📱 System Requirements

**iOS:**
- iOS 13+
- iPhone/iPad with biometric capability (optional)

**Android:**
- Android 8.0+
- Device with GPS

## 🔒 Security Features

✅ Row Level Security (RLS) on all tables
✅ Encrypted connections (HTTPS/TLS)
✅ Secure token storage
✅ Biometric authentication
✅ Automatic session refresh
✅ Password reset flow
✅ Role-based access control

## 📊 Analytics Included

- Total visits and completion rates
- Status distribution (approved, rejected, pending)
- Approval turnaround times
- User performance metrics
- Rejection rate analysis
- Activity timeline charts

## 🎓 Learning Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Guide](https://reactnative.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📄 License

This project is provided as-is. Customize and use for your organization.

## 🤝 Support

For issues with:
- **Supabase**: Check their documentation or contact support
- **Expo**: Visit https://github.com/expo/expo/issues
- **React Native**: See https://reactnative.dev/help

## 🎉 What's Next?

After setup, you can:
1. Customize colors and branding
2. Add organization-specific fields
3. Integrate with existing systems
4. Deploy to app stores
5. Add offline synchronization
6. Implement push notifications
7. Create custom reports

---

**Ready to get started? Follow the [Quick Start](#-quick-start) guide above!**

Built with ❤️ using React Native, Expo, and Supabase
