import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, RotateCcw } from 'lucide-react-native';
import { COLORS, SPACING } from '@/constants/theme';

const { width } = Dimensions.get('window');
const GRID_SIZE = 18;
const CELL_SIZE = Math.floor((width - 40) / GRID_SIZE);
const BOARD_SIZE = GRID_SIZE * CELL_SIZE;
const GAME_SPEED = 120;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>([
    { x: 8, y: 9 },
    { x: 7, y: 9 },
    { x: 6, y: 9 },
  ]);
  const [food, setFood] = useState<Position>({ x: 12, y: 9 });
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      attempts++;
    } while (
      attempts < maxAttempts &&
      currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)
    );
    
    return newFood;
  }, []);

  const checkCollision = useCallback((head: Position, body: Position[]): boolean => {
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    
    return body.some(segment => segment.x === head.x && segment.y === head.y);
  }, []);

  const moveSnake = useCallback(() => {
    if (isGameOver || !isPlaying) return;

    directionRef.current = nextDirectionRef.current;

    setSnake((prevSnake) => {
      const head = { ...prevSnake[0] };
      
      switch (directionRef.current) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      if (checkCollision(head, prevSnake)) {
        setIsGameOver(true);
        setIsPlaying(false);
        const finalScore = score;
        setTimeout(() => {
          Alert.alert(
            '¡Game Over!', 
            `Puntuación: ${finalScore}`,
            [{ text: 'OK' }]
          );
        }, 100);
        return prevSnake;
      }

      const newSnake = [head];

      if (head.x === food.x && head.y === food.y) {
        newSnake.push(...prevSnake);
        setScore((prev) => prev + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.push(...prevSnake.slice(0, -1));
      }

      return newSnake;
    });
  }, [isGameOver, isPlaying, food, score, checkCollision, generateFood]);

  useEffect(() => {
    if (!isPlaying) return;
    
    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [isPlaying, moveSnake]);

  const changeDirection = (newDirection: Direction) => {
    if (!isPlaying) return;

    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };

    if (opposites[directionRef.current] !== newDirection) {
      nextDirectionRef.current = newDirection;
    }
  };

  const resetGame = () => {
    const initialSnake = [
      { x: 8, y: 9 },
      { x: 7, y: 9 },
      { x: 6, y: 9 },
    ];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    directionRef.current = 'RIGHT';
    nextDirectionRef.current = 'RIGHT';
    setIsGameOver(false);
    setScore(0);
    setIsPlaying(false);
  };

  const startGame = () => {
    if (isGameOver) {
      resetGame();
      setTimeout(() => setIsPlaying(true), 100);
    } else {
      setIsPlaying(true);
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Snake', 
          headerShown: true,
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }} 
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreLabel}>PUNTUACIÓN</Text>
            <Text style={styles.scoreValue}>{score}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.actionButton, !isPlaying && styles.actionButtonActive]} 
            onPress={startGame}
            disabled={isPlaying}
          >
            {!isPlaying ? (
              isGameOver ? (
                <RotateCcw size={20} color={COLORS.white} />
              ) : (
                <Play size={20} color={COLORS.white} fill={COLORS.white} />
              )
            ) : (
              <Play size={20} color={COLORS.textLight} fill={COLORS.textLight} />
            )}
            <Text style={[styles.actionButtonText, !isPlaying && styles.actionButtonTextActive]}>
              {isGameOver ? 'REINICIAR' : (isPlaying ? 'JUGANDO' : 'EMPEZAR')}
            </Text>
          </TouchableOpacity>
        </View>

        {isGameOver && (
          <View style={styles.gameOverBanner}>
            <Text style={styles.gameOverText}>¡GAME OVER!</Text>
          </View>
        )}

        <View style={styles.gameBoardContainer}>
          <View style={styles.gameBoard}>
            {snake.map((segment, index) => (
              <View
                key={`snake-${index}`}
                style={[
                  styles.snakeSegment,
                  index === 0 ? styles.snakeHead : styles.snakeBody,
                  {
                    left: segment.x * CELL_SIZE,
                    top: segment.y * CELL_SIZE,
                  },
                ]}
              />
            ))}
            
            <View
              style={[
                styles.food,
                {
                  left: food.x * CELL_SIZE,
                  top: food.y * CELL_SIZE,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => changeDirection('UP')}
            disabled={!isPlaying}
          >
            <ArrowUp size={28} color={isPlaying ? COLORS.white : COLORS.textLight} />
          </TouchableOpacity>

          <View style={styles.horizontalControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => changeDirection('LEFT')}
              disabled={!isPlaying}
            >
              <ArrowLeft size={28} color={isPlaying ? COLORS.white : COLORS.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => changeDirection('DOWN')}
              disabled={!isPlaying}
            >
              <ArrowDown size={28} color={isPlaying ? COLORS.white : COLORS.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => changeDirection('RIGHT')}
              disabled={!isPlaying}
            >
              <ArrowRight size={28} color={isPlaying ? COLORS.white : COLORS.textLight} />
            </TouchableOpacity>
          </View>
        </View>


      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
    alignItems: 'stretch',
  },
  scoreBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: COLORS.primary,
    marginTop: 4,
  },
  gameOverBanner: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    elevation: 4,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gameOverText: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: COLORS.white,
    letterSpacing: 1,
  },
  gameBoardContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  gameBoard: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: '#66bb6a',
  },
  snakeSegment: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  snakeHead: {
    backgroundColor: '#2e7d32',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1b5e20',
  },
  snakeBody: {
    backgroundColor: '#66bb6a',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  food: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    backgroundColor: '#ff5252',
    borderRadius: CELL_SIZE / 2,
    borderWidth: 2,
    borderColor: '#d32f2f',
  },
  controls: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  horizontalControls: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    gap: SPACING.md,
    alignItems: 'center',
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButtonActive: {
    backgroundColor: COLORS.secondary,
    elevation: 4,
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: COLORS.textLight,
    letterSpacing: 0.5,
  },
  actionButtonTextActive: {
    color: COLORS.white,
    fontWeight: '700' as const,
  },
});
