import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Gamepad2 } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getResponsiveSize = (baseSize: number) => {
  const scale = SCREEN_WIDTH / 375;
  return Math.round(baseSize * Math.min(Math.max(scale, 0.8), 1.2));
};

interface Game {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
}

const GAMES: Game[] = [
  {
    id: '1',
    name: 'Snake',
    description: 'Clásico juego de la serpiente. Mueve la serpiente y recoge comida sin chocarte.',
    route: '/snake',
    icon: '🐍',
  },
  {
    id: '2',
    name: 'Trivia',
    description: 'Pon a prueba tus conocimientos con preguntas de cultura general.',
    route: '/trivia',
    icon: '🧠',
  },
  {
    id: '3',
    name: 'Memoria',
    description: 'Encuentra todas las parejas en el menor tiempo posible.',
    route: '/memoria',
    icon: '🎴',
  },
];

export default function JuegosScreen() {
  const router = useRouter();

  const handleGamePress = (game: Game) => {
    if (game.route) {
      router.push(game.route as any);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false} pointerEvents="auto">
      <View style={styles.header}>
        <Gamepad2 size={getResponsiveSize(48)} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Centro de Entretenimiento</Text>
        <Text style={styles.headerSubtitle}>
          Disfruta de estos juegos mientras esperas tu próximo viaje
        </Text>
      </View>

      <View style={styles.gamesGrid}>
        {GAMES.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[styles.gameCard, !game.route && styles.gameCardDisabled, styles.gameCardMargin]}
            onPress={() => handleGamePress(game)}
            disabled={!game.route}
          >
            <Text style={styles.gameIcon}>{game.icon}</Text>
            <Text style={styles.gameName}>{game.name}</Text>
            <Text style={styles.gameDescription}>{game.description}</Text>
            {game.route && (
              <View style={styles.playButton}>
                <Text style={styles.playButtonText}>JUGAR</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  headerTitle: {
    fontSize: getResponsiveSize(24),
    fontWeight: '700' as const,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  headerSubtitle: {
    fontSize: getResponsiveSize(14),
    color: COLORS.textLight,
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
  },
  gamesGrid: {
  },
  gameCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gameCardDisabled: {
    opacity: 0.6,
  },
  gameCardMargin: {
    marginBottom: SPACING.md,
  },
  gameIcon: {
    fontSize: getResponsiveSize(48),
    marginBottom: SPACING.md,
  },
  gameName: {
    fontSize: getResponsiveSize(20),
    fontWeight: '700' as const,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  gameDescription: {
    fontSize: getResponsiveSize(14),
    color: COLORS.textLight,
    lineHeight: getResponsiveSize(20),
    marginBottom: SPACING.md,
  },
  playButton: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  playButtonText: {
    color: COLORS.white,
    fontSize: getResponsiveSize(14),
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
});
