import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
  Alert,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter, Link } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useAuth from '@/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, biometricAuth, sendOtp, verifyOtp, enableBiometric, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState<'email' | 'otp'>('email');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const normalizePhone = (value: string) => {
    const cleaned = value.trim().replace(/[\s()-]/g, '');
    if (/^\+[1-9]\d{9,14}$/.test(cleaned)) return cleaned;
    if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
    if (/^[1-9]\d{9,14}$/.test(cleaned)) return `+${cleaned}`;
    return cleaned;
  };

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    try {
      console.log('Attempting to sign in with email:', email);
      await signIn(email, password);
      console.log('Sign in successful');

      // Only ask to enable biometric on native platforms
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
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMsg = err instanceof Error ? err.message : (err?.message || 'Login failed. Please try again.');
      setError(errorMsg);
    }
  };

  const handleOTPSend = async () => {
    setError('');
    
    if (!phone.trim()) {
      setError('Please enter your mobile number');
      return;
    }
    
    const normalizedPhone = normalizePhone(phone);
    if (!/^\+[1-9]\d{9,14}$/.test(normalizedPhone)) {
      setError('Enter a valid mobile number (e.g. +919876543210 or 9876543210)');
      return;
    }
    
    try {
      console.log('Attempting to send OTP to:', normalizedPhone);
      
      // Send OTP with explicit error handling
      const result = await sendOtp(normalizedPhone);
      
      if (result && result.error) {
        throw result.error;
      }
      
      // CRITICAL: Update both phone and otpSent state only after successful send
      setPhone(normalizedPhone);
      setOtpSent(true);
      setOtp(''); // Reset OTP input
      setError(''); // Clear any previous errors
      
      Alert.alert(
        'OTP Sent Successfully', 
        `A verification code has been sent to ${normalizedPhone}. Please check your messages and enter it below.`,
        [{ text: 'OK' }]
      );
      
      console.log('OTP sent. Waiting for user input.');
    } catch (err: any) {
      console.error('OTP send error:', err);
      const errorMsg = err?.message || err || 'Failed to send OTP. Please try again.';
      setError(errorMsg);
      
      // Don't set otpSent to true if there's an error
      setOtpSent(false);
      setOtp('');
      
      // Log additional error details for debugging
      console.error('Full error object:', JSON.stringify(err, null, 2));
    }
  };

  const handleOTPVerify = async () => {
    setError('');
    const normalizedPhone = normalizePhone(phone);
    
    if (!/^\+[1-9]\d{9,14}$/.test(normalizedPhone)) {
      setError('Please enter your phone in international format');
      return;
    }
    
    if (!otp || otp.length < 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    
    try {
      console.log('Verifying OTP for:', normalizedPhone);
      await verifyOtp(normalizedPhone, otp);
      
      Alert.alert('Success', 'You have been logged in successfully!');
      router.replace('/(tabs)/home');
    } catch (err: any) {
      console.error('OTP verification error:', err);
      const errorMsg = err.message || 'OTP verification failed. Please try again.';
      setError(errorMsg);
      
      // Allow retry - don't reset otpSent state
      setOtp('');
    }
  };

  const handleBiometric = async () => {
    try {
      const result = await biometricAuth();
      if (result?.success) {
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      Alert.alert('Biometric Failed', 'Please use email/password to login');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="shield-check" size={50} color="#0066cc" />
          </View>
          <Text style={styles.title}>Field Visit Tracker</Text>
          <Text style={styles.subtitle}>District-Level Inspection Management</Text>
          <Text style={styles.tagline}>Geo-Tagged  |  Secure  |  Transparent</Text>
        </View>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, loginMode === 'email' && styles.tabActive]}
            onPress={() => { setLoginMode('email'); setError(''); }}
          >
            <MaterialCommunityIcons name="email" size={18} color={loginMode === 'email' ? '#0066cc' : '#999'} />
            <Text style={[styles.tabText, loginMode === 'email' && styles.tabTextActive]}>Email</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, loginMode === 'otp' && styles.tabActive]}
            onPress={() => { setLoginMode('otp'); setError(''); setOtpSent(false); }}
          >
            <MaterialCommunityIcons name="cellphone" size={18} color={loginMode === 'otp' ? '#0066cc' : '#999'} />
            <Text style={[styles.tabText, loginMode === 'otp' && styles.tabTextActive]}>OTP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {loginMode === 'email' ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="email-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="you@example.com"
                    placeholderTextColor="#bbb"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                  />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="Enter your password"
                    placeholderTextColor="#bbb"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="white" /> : (
                  <>
                    <MaterialCommunityIcons name="login" size={20} color="white" />
                    <Text style={styles.buttonText}>Sign In</Text>
                  </>
                )}
              </TouchableOpacity>
              <Link href="/(auth)/reset-password" asChild>
                <TouchableOpacity><Text style={styles.link}>Forgot password?</Text></TouchableOpacity>
              </Link>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="phone" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="+91 9876543210"
                    placeholderTextColor="#bbb"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    editable={!otpSent}
                    maxLength={13}
                  />
                </View>
              </View>
              {otpSent && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Enter OTP</Text>
                  <View style={styles.otpContainer}>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <View key={i} style={[styles.otpBox, otp.length > i && styles.otpBoxFilled]}>
                        <Text style={styles.otpDigit}>{otp[i] || ''}</Text>
                      </View>
                    ))}
                  </View>
                  <TextInput
                    style={styles.hiddenOtpInput}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                    autoFocus
                    editable={!loading}
                  />
                  <TouchableOpacity 
                    onPress={() => { 
                      setOtpSent(false); 
                      setOtp(''); 
                      setPhone(phone.replace('+91', '')); // Remove country code for re-entry
                      setError('');
                    }}
                    disabled={loading}
                  >
                    <Text style={[styles.resendText, loading && styles.resendTextDisabled]}>
                      {loading ? 'Sending...' : 'Resend OTP'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={otpSent ? handleOTPVerify : handleOTPSend}
                disabled={loading}
              >
                <MaterialCommunityIcons name={otpSent ? 'check-circle' : 'send'} size={20} color="white" />
                <Text style={styles.buttonText}>{otpSent ? 'Verify OTP' : 'Send OTP'}</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {Platform.OS !== 'web' && (
            <TouchableOpacity style={styles.biometricButton} onPress={handleBiometric}>
              <MaterialCommunityIcons name="fingerprint" size={32} color="#0066cc" />
              <Text style={styles.biometricText}>Login with Fingerprint</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity><Text style={styles.footerLink}>Register Now</Text></TouchableOpacity>
          </Link>
        </View>
        <Text style={styles.copyright}>© 2025 District Field Visit Management System</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollContent: { flexGrow: 1, padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 24 },
  logoContainer: { width: 80, height: 80, borderRadius: 20, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', fontWeight: '500' },
  tagline: { fontSize: 12, color: '#0066cc', marginTop: 4, fontWeight: '600' },
  tabRow: { flexDirection: 'row', backgroundColor: '#e8ecef', borderRadius: 10, padding: 4, marginBottom: 20 },
  tab: { flex: 1, flexDirection: 'row', paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabActive: { backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  tabText: { fontSize: 14, color: '#999', fontWeight: '600' },
  tabTextActive: { color: '#0066cc' },
  form: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3, marginBottom: 20 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, backgroundColor: '#fafafa' },
  inputIcon: { paddingLeft: 12 },
  inputWithIcon: { flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 16, color: '#333' },
  eyeIcon: { paddingRight: 12 },
  error: { color: '#d32f2f', fontSize: 13, marginBottom: 12, textAlign: 'center', backgroundColor: '#ffebee', padding: 8, borderRadius: 6 },
  button: { flexDirection: 'row', backgroundColor: '#0066cc', paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  link: { color: '#0066cc', fontSize: 14, marginTop: 14, textAlign: 'center' },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  otpBox: { width: 44, height: 50, borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },
  otpBoxFilled: { borderColor: '#0066cc', backgroundColor: '#e3f2fd' },
  otpDigit: { fontSize: 22, fontWeight: '700', color: '#333' },
  hiddenOtpInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  resendText: { color: '#0066cc', textAlign: 'center', marginTop: 8, fontSize: 13, fontWeight: '600' },
  resendTextDisabled: { color: '#ccc', opacity: 0.6 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e0e0e0' },
  dividerText: { paddingHorizontal: 12, color: '#999', fontSize: 12, fontWeight: '600' },
  biometricButton: { alignItems: 'center', paddingVertical: 16, borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, backgroundColor: '#f5f7fa' },
  biometricText: { fontSize: 13, color: '#0066cc', marginTop: 6, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  footerText: { color: '#666', fontSize: 14 },
  footerLink: { color: '#0066cc', fontSize: 14, fontWeight: '700' },
  copyright: { textAlign: 'center', color: '#bbb', fontSize: 11, marginTop: 20, marginBottom: 10 },
});
