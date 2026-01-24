// Speak Button Component - Claymorphism 3D Clay Design

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
  Image,
} from 'react-native';
import { colors, shadows, borderRadius } from '../../theme';
import { SpeechService } from '../../services/SpeechService';
import { ANIMATION } from '../../constants';
import { SpeakIcon } from './SpeakIcon';

type ButtonSize = 'small' | 'medium' | 'large';

interface SpeakButtonProps {
  audioUrl?: string;
  text?: string; // Fallback for TTS if audioUrl is not available
  size?: ButtonSize;
  isLoading?: boolean;
  iconHeight?: number;
}

interface SizeDimensions {
  width: number;
  height: number;
  fontSize: number;
}

const SIZE_CONFIG: Record<ButtonSize, SizeDimensions> = {
  small: { width: 40, height: 40, fontSize: 14 },
  medium: { width: 48, height: 48, fontSize: 20 },
  large: { width: 60, height: 60, fontSize: 26 },
} as const;

const SPEAKING_DURATION_MS = 1500;
const DISABLED_OPACITY = 0.4;

export const SpeakButton: React.FC<SpeakButtonProps> = ({
  audioUrl,
  text,
  size = 'medium',
  isLoading = false,
  iconHeight,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;

  const dimensions = useMemo(() => SIZE_CONFIG[size], [size]);
  const isDisabled = isLoading || (!audioUrl && !text);

  const handlePress = useCallback(async () => {
    if (isDisabled) return;

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

    try {
      // Prefer audio URL if available
      if (audioUrl && audioUrl.trim() !== '') {
        await SpeechService.playAudio(audioUrl);
        setIsSpeaking(false);
      } else if (text) {
        // Fallback to TTS
        SpeechService.speakWord(text);
        setTimeout(() => {
          setIsSpeaking(false);
        }, SPEAKING_DURATION_MS);
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('[SpeakButton] Error playing audio:', error);
      // Fallback to TTS if audio playback fails
      if (text) {
        SpeechService.speakWord(text);
        setTimeout(() => {
          setIsSpeaking(false);
        }, SPEAKING_DURATION_MS);
      } else {
        setIsSpeaking(false);
      }
    }
  }, [audioUrl, text, scaleValue, isDisabled]);

  const buttonStyle = useMemo(() => ({
    width: dimensions.width,
    height: dimensions.height,
    backgroundColor: 'transparent',
    opacity: isDisabled ? DISABLED_OPACITY : 1,
  }), [dimensions, isDisabled]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={[styles.button, buttonStyle]}
        onPress={handlePress}
        activeOpacity={isDisabled ? 1 : 0.6}
        disabled={isDisabled}
      >
        <SpeakIcon
          size={iconHeight || (isSpeaking ? dimensions.fontSize * 2 : dimensions.fontSize * 1.6)}
          style={styles.speakerImage}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};
const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  icon: {
    textAlign: 'center',
  },
  speakerImage: {
    // Sizing handled dynamically or via prop
  },
});
