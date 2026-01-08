import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { colors, shadows, borderRadius } from '../theme';

interface SkeletonLoaderProps {
     width: DimensionValue;
     height: DimensionValue;
     borderRadius?: number;
     style?: ViewStyle;
}

/**
 * Animated skeleton placeholder for loading states - Claymorphism Design
 * Uses pulse animation with soft clay-like appearance
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
     width,
     height,
     borderRadius: customBorderRadius = borderRadius.clayCard,
     style,
}) => {
     const opacity = useRef(new Animated.Value(0.6)).current;

     useEffect(() => {
          const animation = Animated.loop(
               Animated.sequence([
                    Animated.timing(opacity, {
                         toValue: 1,
                         duration: 700,
                         useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                         toValue: 0.6,
                         duration: 700,
                         useNativeDriver: true,
                    }),
               ])
          );
          animation.start();
          return () => animation.stop();
     }, [opacity]);

     return (
          <Animated.View
               style={[
                    styles.skeleton,
                    {
                         width,
                         height,
                         borderRadius: customBorderRadius,
                    },
                    { opacity },
                    style,
               ]}
          />
     );
};

const styles = StyleSheet.create({
     // Claymorphism skeleton - soft primary clay appearance
     skeleton: {
          backgroundColor: colors.primaryLighter,
          borderTopWidth: 1,
          borderTopColor: colors.primaryLight,
          borderBottomWidth: 1,
          borderBottomColor: colors.primarySoft,
          borderLeftWidth: 0,
          borderRightWidth: 0,
     },
});