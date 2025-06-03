import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

interface AnimatedAvatarProps {
  isWalking: boolean;
  onAnimationComplete?: () => void;
  size?: number;
  direction?: 'left' | 'right';
}

export default function AnimatedAvatar({ 
  isWalking, 
  onAnimationComplete,
  size = 40,
  direction = 'right'
}: AnimatedAvatarProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const [walkFrame, setWalkFrame] = useState<number>(0);
  const walkInterval = useRef<ReturnType<typeof setInterval>>(null);

  // מערך של אימוג'ים המייצגים הליכה
  const walkingFrames = ['🚶‍♂️', '🏃‍♂️'];

  useEffect(() => {
    if (isWalking) {
      // אנימציית קפיצה קלה בזמן הליכה
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -3,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          })
        ])
      ).start();

      // החלפת פריימים של ההליכה
      walkInterval.current = setInterval(() => {
        setWalkFrame(prev => (prev + 1) % walkingFrames.length);
      }, 300);
    } else {
      // עצירת אנימציות ההליכה
      bounceAnim.stopAnimation();
      if (walkInterval.current) {
        clearInterval(walkInterval.current);
      }
      setWalkFrame(0);
      onAnimationComplete?.();
    }

    return () => {
      if (walkInterval.current) {
        clearInterval(walkInterval.current);
      }
    };
  }, [isWalking]);

  const emojiSize = Math.floor(size * 0.9);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: bounceAnim },
            { scaleX: direction === 'left' ? -1 : 1 }
          ]
        }
      ]}
    >
      <Text style={[
        styles.emoji,
        { fontSize: emojiSize }
      ]}>
        {walkingFrames[walkFrame]}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    textAlign: 'center',
  }
}); 