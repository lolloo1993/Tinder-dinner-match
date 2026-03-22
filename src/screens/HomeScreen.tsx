import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { fetchWeeklyMatches } from '../services/matches';
import { fetchSwipedRecipeIds, fetchWeeklyRecipes } from '../services/recipes';
import { getPartnerSwipeCount } from '../services/swipes';
import type { Match } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const WEEKLY_GOAL = 5;

export default function HomeScreen({ navigation }: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [swipedCount, setSwipedCount] = useState(0);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [partnerSwipeCount, setPartnerSwipeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const [m, swipedIds, recipes, partnerCount] = await Promise.all([
      fetchWeeklyMatches(),
      fetchSwipedRecipeIds(),
      fetchWeeklyRecipes(),
      getPartnerSwipeCount(),
    ]);
    setMatches(m);
    setSwipedCount(swipedIds.length);
    setTotalRecipes(recipes.length);
    setPartnerSwipeCount(partnerCount);
  }

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().finally(() => setRefreshing(false));
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const allSwiped = totalRecipes > 0 && swipedCount >= totalRecipes;
  const progressPct = `${Math.min(matches.length / WEEKLY_GOAL, 1) * 100}%`;

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>
        This week's matches
      </Text>

      {/* Match count + progress bar */}
      <Text style={{ fontSize: 16, marginBottom: 8 }}>
        {matches.length} / {WEEKLY_GOAL} matches this week
      </Text>
      <View
        style={{
          height: 8,
          backgroundColor: '#eee',
          borderRadius: 4,
          marginBottom: 24,
        }}
      >
        <View
          style={{
            height: 8,
            width: progressPct,
            backgroundColor: '#4CAF50',
            borderRadius: 4,
          }}
        />
      </View>

      {/* Partner status */}
      <Text style={{ marginBottom: 24, color: '#555' }}>
        {partnerSwipeCount > 0
          ? `Your partner has swiped ${partnerSwipeCount} card${partnerSwipeCount === 1 ? '' : 's'}`
          : 'Waiting for your partner to start...'}
      </Text>

      {/* Match list or empty state */}
      {matches.length === 0 ? (
        <Text style={{ color: '#888', marginBottom: 24 }}>
          No matches yet — start swiping!
        </Text>
      ) : (
        matches.map((match) => (
          <View
            key={match.id}
            style={{
              padding: 12,
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontWeight: '600' }}>
              {match.recipes?.title ?? match.recipe_id}
            </Text>
            {match.recipes?.description != null ? (
              <Text style={{ color: '#666', marginTop: 4 }}>
                {match.recipes.description}
              </Text>
            ) : null}
          </View>
        ))
      )}

      <Button
        title={allSwiped ? "You're all caught up!" : 'Start Swiping'}
        onPress={() => navigation.navigate('Swipe')}
        disabled={allSwiped}
      />
    </ScrollView>
  );
}
