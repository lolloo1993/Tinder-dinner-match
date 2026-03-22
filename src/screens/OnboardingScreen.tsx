import React, { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { signIn, signUp } from '../services/auth';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen(_props: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          setError('Name is required.');
          return;
        }
        await signUp(email.trim(), password, name.trim());
      } else {
        await signIn(email.trim(), password);
      }
      // App.tsx listens to onAuthStateChange and will swap screens automatically.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>
        {mode === 'signup' ? 'Create account' : 'Sign in'}
      </Text>

      {mode === 'signup' && (
        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, borderRadius: 6 }}
        />
      )}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, borderRadius: 6 }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 12, borderRadius: 6 }}
      />

      {error !== null && (
        <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginBottom: 12 }} />
      ) : (
        <Button
          title={mode === 'signup' ? 'Sign up' : 'Sign in'}
          onPress={() => { void handleSubmit(); }}
        />
      )}

      <Button
        title={mode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        onPress={() => {
          setError(null);
          setMode(mode === 'signup' ? 'signin' : 'signup');
        }}
      />
    </View>
  );
}
