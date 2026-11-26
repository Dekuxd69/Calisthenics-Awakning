import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { rankForLevel } from '../lib/xp';
import { useStore } from '../store';
import { colors, radius, space, type } from '../theme';
import { RankBadge } from './RankBadge';
import { Button } from './ui';

export function LevelUpModal() {
  const { state, level, dispatch } = useStore();
  const visible = !!state.profile && level.level > state.seenLevel;
  const oldRank = rankForLevel(state.seenLevel);
  const rank = rankForLevel(level.level);
  const rankUp = rank.id !== oldRank.id;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => dispatch({ type: 'ackLevel' })}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={[type.small, { color: rank.color, textAlign: 'center' }]}>{rankUp ? 'NEW RANK UNLOCKED' : 'LEVEL UP'}</Text>
          <View style={{ alignItems: 'center', marginVertical: space.lg }}>
            <RankBadge rank={rank} size={110} />
          </View>
          <Text style={[type.display, { textAlign: 'center' }]}>Level {level.level}</Text>
          <Text style={[type.dim, { textAlign: 'center', marginTop: space.sm }]}>
            {rankUp ? `You are now ${rank.id}-Rank ${rank.title}. ${rank.blurb}` : `Keep going, ${rank.title}. Every rep counts.`}
          </Text>
          <Button label="Let's go" onPress={() => dispatch({ type: 'ackLevel' })} style={{ marginTop: space.xl }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(4,6,14,0.82)', alignItems: 'center', justifyContent: 'center', padding: space.xl },
  card: { width: '100%', maxWidth: 380, backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.xl, borderWidth: 1, borderColor: colors.border },
});
