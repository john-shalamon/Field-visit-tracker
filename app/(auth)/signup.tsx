import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter, Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuth from '@/hooks/useAuth';
import { UserRole } from '@/types';

const ROLES: { value: UserRole; label: string; icon: string }[] = [
  { value: 'field_officer', label: 'Field Officer', icon: 'walk' },
  { value: 'hod', label: 'Head of Dept', icon: 'account-tie' },
  { value: 'collector', label: 'District Collector', icon: 'shield-account' },
  { value: 'admin', label: 'Administrator', icon: 'cog' },
];

const DEPARTMENTS = ['Revenue', 'Health', 'Education', 'Public Works', 'Agriculture', 'Social Welfare'];
const ZONES = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone'];

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, signIn, enableBiometric, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('field_officer');
  const [department, setDepartment] = useState('');
  const [zone, setZone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [error, setError] = useState('');

  const validateStep1 = () => {
    if (!fullName.trim()) return 'Full name is required';
    if (!email.trim()) return 'Email is required';
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) return 'Please enter a valid email';
    if (!phone.trim() || phone.length < 10) return 'Valid phone number is required';
    return null;
  };

  const validateStep2 = () => {
    if (!department) return 'Please select a department';
    if (!zone) return 'Please select a zone';
    return null;
  };

  const validateStep3 = () => {
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      setStep(3);
    }
  };

  const handleSignup = async () => {
    setError('');
    const err = validateStep3();
    if (err) { setError(err); return; }

    // final validation before submitting
    if (!email.trim() || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      console.log('Attempting to sign up with email:', email);
      await signUp({
        email,
        password,
        fullName,
        phone,
        role,
        department,
        zone,
        employeeId,
      });
      console.log('Sign up successful');

      // attempt auto-login
      try {
        console.log('Attempting auto-login after signup');
        await signIn(email, password);
        console.log('Auto-login successful');
        
        // ask to enable biometric (only on native platforms)
        if (Platform.OS !== 'web') {
          try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            if (compatible) {
              Alert.alert(
                'Enable Biometric?',
                'Would you like to login faster using fingerprint/face ID next time?',
                [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes', onPress: () => enableBiometric({ email, password }) },
                ]
              );
            }
          } catch (bioErr) {
            console.warn('Biometric check failed:', bioErr);
          }
        }
        router.replace('/(tabs)/home');
      } catch (autoLoginErr: any) {
        console.warn('Auto-login failed after signup:', autoLoginErr);
        Alert.alert('Registration Successful', 'Your account has been created. Please login.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ]);
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      const msg = err instanceof Error ? err.message : (err?.message || 'Registration failed');
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        Alert.alert(
          'Account Exists',
          'This email is already registered. Would you like to login instead?',
          [
            { text: 'Stay Here', style: 'cancel' },
            { text: 'Go to Login', onPress: () => router.replace('/(auth)/login') },
          ]
        );
      } else {
        setError(msg);
      }
    }
  };

  const ProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <View style={[styles.progressDot, s <= step && styles.progressDotActive]}>
            {s < step ? (
              <MaterialCommunityIcons name="check" size={14} color="white" />
            ) : (
              <Text style={[styles.progressNum, s <= step && styles.progressNumActive]}>{s}</Text>
            )}
          </View>
          {s < 3 && <View style={[styles.progressLine, s < step && styles.progressLineActive]} />}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            {step === 1 ? 'Personal Information' : step === 2 ? 'Official Details' : 'Set Password'}
          </Text>
        </View>

        <ProgressBar />

        <View style={styles.form}>
          {step === 1 && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="account" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput style={styles.inputWithIcon} placeholder="Enter full name" placeholderTextColor="#bbb" value={fullName} onChangeText={setFullName} />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="email-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput style={styles.inputWithIcon} placeholder="you@example.com" placeholderTextColor="#bbb" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="phone" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput style={styles.inputWithIcon} placeholder="+91 9876543210" placeholderTextColor="#bbb" keyboardType="phone-pad" value={phone} onChangeText={setPhone} maxLength={13} />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Employee ID</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="card-account-details" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput style={styles.inputWithIcon} placeholder="EMP-12345" placeholderTextColor="#bbb" value={employeeId} onChangeText={setEmployeeId} autoCapitalize="characters" />
                </View>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.sectionTitle}>Select Role</Text>
              <View style={styles.roleGrid}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.roleCard, role === r.value && styles.roleCardActive]}
                    onPress={() => setRole(r.value)}
                  >
                    <MaterialCommunityIcons name={r.icon as any} size={28} color={role === r.value ? '#0066cc' : '#999'} />
                    <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.sectionTitle}>Department</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {DEPARTMENTS.map((d) => (
                  <TouchableOpacity key={d} style={[styles.chip, department === d && styles.chipActive]} onPress={() => setDepartment(d)}>
                    <Text style={[styles.chipText, department === d && styles.chipTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.sectionTitle}>Zone</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {ZONES.map((z) => (
                  <TouchableOpacity key={z} style={[styles.chip, zone === z && styles.chipActive]} onPress={() => setZone(z)}>
                    <Text style={[styles.chipText, zone === z && styles.chipTextActive]}>{z}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          {step === 3 && (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Account Summary</Text>
                <Text style={styles.summaryItem}><Text style={styles.summaryLabel}>Name: </Text>{fullName}</Text>
                <Text style={styles.summaryItem}><Text style={styles.summaryLabel}>Email: </Text>{email}</Text>
                <Text style={styles.summaryItem}><Text style={styles.summaryLabel}>Role: </Text>{ROLES.find(r => r.value === role)?.label}</Text>
                <Text style={styles.summaryItem}><Text style={styles.summaryLabel}>Dept: </Text>{department}</Text>
                <Text style={styles.summaryItem}><Text style={styles.summaryLabel}>Zone: </Text>{zone}</Text>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput style={styles.inputWithIcon} placeholder="Min 6 characters" placeholderTextColor="#bbb" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-check" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput style={styles.inputWithIcon} placeholder="Re-enter password" placeholderTextColor="#bbb" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
                </View>
              </View>
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={step < 3 ? handleNext : handleSignup}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Text style={styles.buttonText}>{step < 3 ? 'Continue' : 'Create Account'}</Text>
                <MaterialCommunityIcons name={step < 3 ? 'arrow-right' : 'check'} size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity><Text style={styles.footerLink}>Sign In</Text></TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollContent: { flexGrow: 1, padding: 20 },
  header: { marginTop: 20, marginBottom: 16 },
  backButton: { marginBottom: 12, width: 40 },
  title: { fontSize: 28, fontWeight: '800', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#999', marginTop: 4 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  progressDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  progressDotActive: { backgroundColor: '#0066cc' },
  progressNum: { fontSize: 12, fontWeight: '700', color: '#999' },
  progressNumActive: { color: 'white' },
  progressLine: { width: 50, height: 3, backgroundColor: '#e0e0e0', marginHorizontal: 4 },
  progressLineActive: { backgroundColor: '#0066cc' },
  form: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, backgroundColor: '#fafafa' },
  inputIcon: { paddingLeft: 12 },
  inputWithIcon: { flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 16, color: '#333' },
  eyeIcon: { paddingRight: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12, marginTop: 8 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  roleCard: { width: '47%', padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#e0e0e0', alignItems: 'center', backgroundColor: '#fafafa' },
  roleCardActive: { borderColor: '#0066cc', backgroundColor: '#e3f2fd' },
  roleLabel: { fontSize: 12, color: '#999', marginTop: 6, fontWeight: '600' },
  roleLabelActive: { color: '#0066cc' },
  chipScroll: { marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8 },
  chipActive: { backgroundColor: '#0066cc' },
  chipText: { fontSize: 13, color: '#666', fontWeight: '600' },
  chipTextActive: { color: 'white' },
  summaryCard: { backgroundColor: '#f0f7ff', borderRadius: 10, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#d0e3f7' },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: '#0066cc', marginBottom: 8 },
  summaryItem: { fontSize: 13, color: '#555', marginBottom: 4 },
  summaryLabel: { fontWeight: '700', color: '#333' },
  error: { color: '#d32f2f', fontSize: 13, marginBottom: 12, textAlign: 'center', backgroundColor: '#ffebee', padding: 8, borderRadius: 6 },
  button: { flexDirection: 'row', backgroundColor: '#0066cc', paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, marginBottom: 20 },
  footerText: { color: '#666', fontSize: 14 },
  footerLink: { color: '#0066cc', fontSize: 14, fontWeight: '700' },
});
