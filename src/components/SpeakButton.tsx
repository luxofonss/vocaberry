// Speak Button Component - Minimalistic Purple Style

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import { colors } from '../theme/colors';
import { SpeechService } from '../services/SpeechService';
import { ANIMATION } from '../constants';

type ButtonSize = 'small' | 'medium' | 'large';

interface SpeakButtonProps {
  text: string;
  size?: ButtonSize;
}

interface SizeDimensions {
  width: number;
  height: number;
  fontSize: number;
}

const SIZE_CONFIG: Record<ButtonSize, SizeDimensions> = {
  small: { width: 36, height: 36, fontSize: 14 },
  medium: { width: 44, height: 44, fontSize: 20 },
  large: { width: 56, height: 56, fontSize: 26 },
} as const;

const SPEAKING_DURATION_MS = 1500;

export const SpeakButton: React.FC<SpeakButtonProps> = ({
  text,
  size = 'medium',
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;

  const dimensions = useMemo(() => SIZE_CONFIG[size], [size]);

  const handlePress = useCallback(async () => {
    setIsSpeaking(true);

    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.15,
        duration: ANIMATION.fast,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    SpeechService.speakWord(text);

    setTimeout(() => {
      setIsSpeaking(false);
    }, SPEAKING_DURATION_MS);
  }, [text, scaleValue]);

  const buttonStyle = useMemo(() => ({
    width: dimensions.width,
    height: dimensions.height,
    backgroundColor: isSpeaking ? colors.primary : colors.primaryLight,
  }), [dimensions, isSpeaking]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={[styles.button, buttonStyle]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={[styles.icon, { fontSize: dimensions.fontSize }]}>
          {isSpeaking ? '🔊' : '🔈'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
  },
});