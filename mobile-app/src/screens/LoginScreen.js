import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { login } from '../services/authService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useContext(AuthContext);
  const { colors, isDark } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.success) {
        signIn(data.data.token, data.data.user);
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: colors.subText }]}>Sign in to continue</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={colors.subText}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={colors.subText}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>

            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <Text style={[styles.footerText, { color: colors.subText }]}>{"Don't have an account? "}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={[styles.linkText, { color: colors.primary }]}>Sign up for free</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: {
    borderRadius: 16, // Stripe rounded.xl container
    padding: 28,
    shadowColor: '#003770',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
  },
  header: { marginBottom: 28, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: '300', marginBottom: 4, letterSpacing: -0.64 }, // Sohne thin display
  subtitle: { fontSize: 14, fontWeight: '300', letterSpacing: -0.2 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '400', marginBottom: 6, letterSpacing: 0 },
  input: {
    borderWidth: 1,
    borderRadius: 6, // Stripe text-input rounded.sm (6px)
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '300',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 9999, // Stripe button-primary-pill
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#003770',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: 'white', fontWeight: '400', fontSize: 15, letterSpacing: 0 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    borderTopWidth: 1,
    paddingTop: 20
  },
  footerText: { fontSize: 14, fontWeight: '300' },
  linkText: { fontWeight: '400', fontSize: 14 },
});