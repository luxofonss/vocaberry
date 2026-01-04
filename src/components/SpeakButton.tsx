// Speak Button Component - Minimalistic Purple Style

import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import { colors } from '../theme/colors';
import { SpeechService } from '../services/SpeechService';

interface SpeakButtonProps {
  text: string;
  size?: 'small' | 'medium' | 'large';
}

export const SpeakButton: React.FC<SpeakButtonProps> = ({
  text,
  size = 'medium',
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const getSize = () => {
    switch (size) {
      case 'small':
        return { width: 36, height: 36, fontSize: 14 };
      case 'large':
        return { width: 56, height: 56, fontSize: 26 };
      default:
        return { width: 44, height: 44, fontSize: 20 };
    }
  };

  const dimensions = getSize();

  const handlePress = async () => {
    setIsSpeaking(true);
    
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.15,
        duration: 100,
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
    }, 1500);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: isSpeaking ? colors.primary : colors.primaryLight,
          },
        ]}
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
