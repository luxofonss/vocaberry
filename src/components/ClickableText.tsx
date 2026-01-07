import React, { useMemo, useCallback } from 'react';
import { Text, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { colors } from '../theme/colors';

interface ClickableTextProps {
  text: string;
  onWordPress: (word: string) => void;
  style?: StyleProp<TextStyle>;
}

// Regex to match words (alphanumeric with hyphens and apostrophes)
const WORD_REGEX = /^[a-zA-Z0-9-']+$/;
const SPLIT_REGEX = /([a-zA-Z0-9-']+)/;

export const ClickableText: React.FC<ClickableTextProps> = ({
  text,
  onWordPress,
  style,
}) => {
  const words = useMemo(() => text.split(' '), [text]);

  const handleWordPress = useCallback((word: string) => {
    onWordPress(word);
  }, [onWordPress]);

  const renderPart = useCallback((part: string, pIndex: number) => {
    const isWord = WORD_REGEX.test(part);

    if (isWord) {
      return (
        <Text
          key={pIndex}
          onPress={() => handleWordPress(part)}
          style={styles.word}
        >
          {part}
        </Text>
      );
    }
    return <Text key={pIndex}>{part}</Text>;
  }, [handleWordPress]);

  return (
    <Text style={[styles.container, style]}>
      {words.map((chunk, index) => {
        const parts = chunk.split(SPLIT_REGEX).filter(Boolean);

        return (
          <React.Fragment key={index}>
            {parts.map(renderPart)}
            {index < words.length - 1 && <Text> </Text>}
          </React.Fragment>
        );
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  container: {},
  word: {},
});