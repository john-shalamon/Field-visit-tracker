import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { authService } from '@/services/auth';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp' | 'newpass'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendReset = async () => {
    setError('');
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) { setError('Please enter a valid email'); return; }
    setLoading(true);
    try {
      const result = await authService.resetPassword(email);
      if (result.error) throw result.error;
      setStep('otp');
      Alert.alert('Reset Link Sent', `A password reset link has been sent to ${email}. Check your inbox.`);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otp.length < 4) { setError('Please enter the verification code'); return; }
    setStep('newpass');
  };

  const handleResetPassword = () => {
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    Alert.alert('Password Reset', 'If your account exists, you will receive a password reset email. Please check your inbox and follow the link.', [
      { text: 'Back to Login', onPress: () => router.replace('/(auth)/login') },
    ]);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={step === 'email' ? 'lock-reset' : step === 'otp' ? 'email-check' : 'lock-plus'}
            size={48} color="#0066cc"
          />
        </View>
        <Text style={styles.title}>
          {step === 'email' ? 'Reset Password' : step === 'otp' ? 'Verification' : 'New Password'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'email' ? 'Enter your email to receive a reset code' :
           step === 'otp' ? 'Enter the code sent to your email' :
           'Create a new secure password'}
        </Text>

        <View style={styles.stepIndicator}>
          {['email', 'otp', 'newpass'].map((s, i) => (
            <React.Fragment key={s}>
              <View style={[styles.stepDot, (['email', 'otp', 'newpass'].indexOf(step) >= i) && styles.stepDotActive]} />
              {i < 2 && <View style={[styles.stepLine, (['email', 'otp', 'newpass'].indexOf(step) > i) && styles.stepLineActive]} />}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.form}>
          {step === 'email' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#999" style={styles.inputIcon} />
                <TextInput style={styles.inputWithIcon} placeholder="you@example.com" placeholderTextColor="#bbb" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
              </View>
            </View>
          )}

          {step === 'otp' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification Code</Text>
              <View style={styles.otpRow}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={[styles.otpBox, otp.length > i && styles.otpBoxFilled]}>
                    <Text style={styles.otpDigit}>{otp[i] || ''}</Text>
                  </View>
                ))}
              </View>
              <TextInput style={styles.hiddenInput} keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} autoFocus />
            </View>
          )}

          {step === 'newpass' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput style={styles.inputWithIcon} placeholder="Min 6 characters" placeholderTextColor="#bbb" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
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
            onPress={step === 'email' ? handleSendReset : step === 'otp' ? handleVerifyOtp : handleResetPassword}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Text style={styles.buttonText}>
                  {step === 'email' ? 'Send Reset Code' : step === 'otp' ? 'Verify Code' : 'Reset Password'}
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  scrollContent: { flexGrow: 1, padding: 20 },
  backButton: { marginTop: 20, marginBottom: 20, width: 40 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: '#1a1a1a', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 4, marginBottom: 24 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#e0e0e0' },
  stepDotActive: { backgroundColor: '#0066cc' },
  stepLine: { width: 40, height: 3, backgroundColor: '#e0e0e0', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: '#0066cc' },
  form: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, backgroundColor: '#fafafa' },
  inputIcon: { paddingLeft: 12 },
  inputWithIcon: { flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 16, color: '#333' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  otpBox: { width: 44, height: 50, borderWidth: 2, borderColor: '#e0e0e0', borderRadius: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fafafa' },
  otpBoxFilled: { borderColor: '#0066cc', backgroundColor: '#e3f2fd' },
  otpDigit: { fontSize: 22, fontWeight: '700', color: '#333' },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  error: { color: '#d32f2f', fontSize: 13, marginBottom: 12, textAlign: 'center', backgroundColor: '#ffebee', padding: 8, borderRadius: 6 },
  button: { flexDirection: 'row', backgroundColor: '#0066cc', paddingVertical: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
