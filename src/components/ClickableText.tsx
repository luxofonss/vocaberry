import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity, StyleProp, TextStyle } from 'react-native';
import { colors } from '../theme/colors';

interface ClickableTextProps {
  text: string;
  onWordPress: (word: string) => void;
  style?: StyleProp<TextStyle>;
  highlightColor?: string;
}

export const ClickableText: React.FC<ClickableTextProps> = ({ 
    text, 
    onWordPress, 
    style,
    highlightColor = colors.primary
}) => {
  // Split text by spaces but keep punctuation attached to words initially
  const words = text.split(' ');

  return (
    <Text style={[styles.container, style]}>
      {words.map((chunk, index) => {
        // Simple heuristic to separate punctuation
        // This regex splits "word." into ["word", "."]
        // or "(word)" into ["(", "word", ")"]
        const parts = chunk.split(/([a-zA-Z0-9-']+)/).filter(p => p); 
        
        return (
          <React.Fragment key={index}>
            {parts.map((part, pIndex) => {
                // If part is a word (alphanumeric), make it clickable
                const isWord = /^[a-zA-Z0-9-']+$/.test(part);
                
                if (isWord) {
                    return (
                        <Text 
                            key={pIndex}
                            onPress={() => onWordPress(part)}
                            style={styles.word} 
                        >
                            {part}
                        </Text>
                    );
                }
                // Else render punctuation normally
                return <Text key={pIndex}>{part}</Text>;
            })}
            {/* Add space after chunk if not the last one */}
            {index < words.length - 1 && <Text> </Text>}
          </React.Fragment>
        );
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  container: {
    // Inherit text styles
  },
  word: {
      // Optional: underline or color to hint interactivity?
      // For now, keep it subtle, or user can assume all text is clickable.
      // Let's make it look normal but act interactive.
  },
});
