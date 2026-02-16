import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Brain, Trophy, RotateCcw, Clock } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';

interface Card {
  id: number;
  value: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = ['🎮', '🎯', '🎨', '🎭', '🎪', '🎸', '🎺', '🎻'];

export default function MemoryGame() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [matches, setMatches] = useState<number>(0);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameFinished, setGameFinished] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(0);

  const initializeGame = () => {
    const doubledEmojis = [...EMOJIS, ...EMOJIS];
    const shuffled = doubledEmojis
      .sort(() => Math.random() - 0.5)
      .map((value, index) => ({
        id: index,
        value,
        isFlipped: false,
        isMatched: false,
      }));
    
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setMatches(0);
    setGameStarted(false);
    setGameFinished(false);
    setTimer(0);
  };

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    
    if (gameStarted && !gameFinished) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000) as unknown as number;
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStarted, gameFinished]);

  useEffect(() => {
    if (matches === EMOJIS.length && gameStarted) {
      setGameFinished(true);
      setTimeout(() => {
        Alert.alert(
          '¡Felicidades!',
          `Has completado el juego en ${moves} movimientos y ${formatTime(timer)}`,
          [{ text: 'OK' }]
        );
      }, 500);
    }
  }, [matches, gameStarted, moves, timer]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCardPress = (cardId: number) => {
    if (!gameStarted) {
      setGameStarted(true);
    }

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length === 2) {
      return;
    }

    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);

    setCards((prevCards) =>
      prevCards.map((c) =>
        c.id === cardId ? { ...c, isFlipped: true } : c
      )
    );

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1);
      
      const [firstId, secondId] = newFlippedCards;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);

      if (firstCard && secondCard && firstCard.value === secondCard.value) {
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isMatched: true }
                : c
            )
          );
          setMatches(matches + 1);
          setFlippedCards([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards((prevCards) =>
            prevCards.map((c) =>
              c.id === firstId || c.id === secondId
                ? { ...c, isFlipped: false }
                : c
            )
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  if (gameFinished) {
    return (
      <>
        <Stack.Screen options={{ title: 'Memoria', headerShown: true }} />
        <View style={styles.container}>
          <View style={styles.finishContainer}>
            <Trophy size={80} color={COLORS.secondary} />
            <Text style={styles.finishTitle}>¡Excelente!</Text>
            <Text style={styles.finishSubtitle}>Has completado el juego</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Movimientos</Text>
                <Text style={styles.statValue}>{moves}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tiempo</Text>
                <Text style={styles.statValue}>{formatTime(timer)}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.resetButton} onPress={initializeGame}>
              <RotateCcw size={20} color={COLORS.white} />
              <Text style={styles.resetButtonText}>JUGAR DE NUEVO</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>VOLVER AL MENÚ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Memoria', headerShown: true }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Brain size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>Movimientos: {moves}</Text>
            </View>
            <View style={styles.infoItem}>
              <Clock size={20} color={COLORS.secondary} />
              <Text style={styles.infoText}>{formatTime(timer)}</Text>
            </View>
          </View>
          <Text style={styles.matchesText}>
            Parejas: {matches} / {EMOJIS.length}
          </Text>
        </View>

        <View style={styles.grid}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.card,
                (card.isFlipped || card.isMatched) && styles.cardFlipped,
                card.isMatched && styles.cardMatched,
              ]}
              onPress={() => handleCardPress(card.id)}
              disabled={card.isFlipped || card.isMatched}
            >
              {(card.isFlipped || card.isMatched) ? (
                <Text style={styles.cardEmoji}>{card.value}</Text>
              ) : (
                <Text style={styles.cardBack}>?</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.resetButtonGame} onPress={initializeGame}>
          <RotateCcw size={20} color={COLORS.white} />
          <Text style={styles.resetButtonText}>REINICIAR</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  matchesText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.primary,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  card: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardFlipped: {
    backgroundColor: COLORS.white,
  },
  cardMatched: {
    backgroundColor: COLORS.success,
    opacity: 0.7,
  },
  cardEmoji: {
    fontSize: 32,
  },
  cardBack: {
    fontSize: 40,
    fontWeight: '700' as const,
    color: COLORS.white,
  },
  resetButtonGame: {
    flexDirection: 'row',
    backgroundColor: COLORS.textLight,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
  },
  resetButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  finishContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  finishTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  finishSubtitle: {
    fontSize: 18,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    minWidth: 120,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.primary,
  },
  resetButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  backButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
