import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, DeviceEventEmitter, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import { getCurrentUser } from './src/services/auth';
import HomeScreen from './src/screens/HomeScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import CoupleLinkScreen from './src/screens/CoupleLinkScreen';

export type RootStackParamList = {
  Home: undefined;
  Onboarding: undefined;
  CoupleLink: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  // undefined = still loading, null = no couple yet, string = linked
  const [coupleId, setCoupleId] = useState<string | null | undefined>(undefined);

  async function fetchCoupleId() {
    const user = await getCurrentUser();
    setCoupleId(user?.couple_id ?? null);
  }

  useEffect(() => {
    // Resolve the initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        void fetchCoupleId();
      } else {
        setCoupleId(null);
      }
    });

    // React to login / logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        if (s) {
          void fetchCoupleId();
        } else {
          setCoupleId(null);
        }
      }
    );

    // CoupleLinkScreen emits this after a successful link
    const listener = DeviceEventEmitter.addListener('coupleLinked', () => {
      void fetchCoupleId();
    });

    return () => {
      subscription.unsubscribe();
      listener.remove();
    };
  }, []);

  // Still resolving session or profile
  const loading = coupleId === undefined;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          // State 1: no session → onboarding
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : coupleId === null ? (
          // State 2: logged in but not yet linked
          <Stack.Screen name="CoupleLink" component={CoupleLinkScreen} />
        ) : (
          // State 3: logged in and linked
          <Stack.Screen name="Home" component={HomeScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
