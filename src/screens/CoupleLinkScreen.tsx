import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Clipboard,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DeviceEventEmitter } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CoupleLinkError, getMyCode, linkCouple } from '../services/couples';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'CoupleLink'>;

const ERROR_MESSAGES: Record<string, string> = {
  SELF_LINK: "That's your own code — share it with your partner instead.",
  PARTNER_NOT_FOUND: 'No account found with that code. Double-check and try again.',
  ALREADY_LINKED: "You're already linked to a partner.",
};

export default function CoupleLinkScreen(_props: Props) {
  const [myCode, setMyCode] = useState<string | null>(null);
  const [partnerCode, setPartnerCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMyCode()
      .then(setMyCode)
      .catch(() => setMyCode(null));
  }, []);

  function handleCopy() {
    if (!myCode) return;
    Clipboard.setString(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLink() {
    setError(null);
    setLoading(true);
    try {
      await linkCouple(partnerCode);
      // Signal App.tsx to re-fetch the user profile; conditional navigator
      // will swap to HomeScreen automatically once couple_id is set.
      DeviceEventEmitter.emit('coupleLinked');
    } catch (e) {
      if (e instanceof CoupleLinkError) {
        setError(ERROR_MESSAGES[e.code] ?? e.message);
      } else {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}>
        Link with your partner
      </Text>
      <Text style={{ marginBottom: 24, color: '#555' }}>
        Share your code or enter your partner's code to get started.
      </Text>

      {/* Own code */}
      <Text style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>
        YOUR CODE
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
        <Text style={{ fontSize: 36, fontWeight: 'bold', letterSpacing: 6, marginRight: 16 }}>
          {myCode ?? '------'}
        </Text>
        <Button
          title={copied ? 'Copied!' : 'Copy'}
          onPress={handleCopy}
          disabled={!myCode}
        />
      </View>

      {/* Partner code input */}
      <Text style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>
        PARTNER'S CODE
      </Text>
      <TextInput
        value={partnerCode}
        onChangeText={(t) => setPartnerCode(t.toUpperCase().slice(0, 6))}
        placeholder="e.g. AB3XY2"
        autoCapitalize="characters"
        maxLength={6}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 16,
          borderRadius: 6,
          fontSize: 20,
          letterSpacing: 4,
        }}
      />

      {error !== null && (
        <Text style={{ color: 'red', marginBottom: 12 }}>{error}</Text>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginBottom: 12 }} />
      ) : (
        <Button
          title="Link Up"
          onPress={() => { void handleLink(); }}
          disabled={partnerCode.length < 6}
        />
      )}
    </View>
  );
}
