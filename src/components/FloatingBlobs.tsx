import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export const FloatingBlobs: React.FC = () => {
     const blob1Anim = useRef(new Animated.Value(0)).current;
     const blob2Anim = useRef(new Animated.Value(0)).current;
     const blob3Anim = useRef(new Animated.Value(0)).current;

     useEffect(() => {
          const createAnimation = (anim: Animated.Value, duration: number) => {
               return Animated.loop(
                    Animated.sequence([
                         Animated.timing(anim, {
                              toValue: 1,
                              duration,
                              useNativeDriver: true,
                         }),
                         Animated.timing(anim, {
                              toValue: 0,
                              duration,
                              useNativeDriver: true,
                         }),
                    ])
               );
          };

          createAnimation(blob1Anim, 8000).start();
          createAnimation(blob2Anim, 10000).start();
          createAnimation(blob3Anim, 12000).start();
     }, [blob1Anim, blob2Anim, blob3Anim]);

     const getBlobStyle = (anim: Animated.Value, x: number, y: number) => ({
          transform: [
               {
                    translateY: anim.interpolate({
                         inputRange: [0, 1],
                         outputRange: [y, y - 20],
                    }),
               },
               {
                    rotate: anim.interpolate({
                         inputRange: [0, 1],
                         outputRange: ['0deg', '5deg'],
                    }),
               },
          ],
     });

     return (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
               <Animated.View
                    style={[
                         styles.blob,
                         {
                              backgroundColor: `${colors.primary}10`,
                              width: width * 0.9,
                              height: width * 0.9,
                              left: -width * 0.2,
                              top: -height * 0.1,
                              shadowColor: colors.primary,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.2,
                              shadowRadius: 50,
                         },
                         getBlobStyle(blob1Anim, 0, 0),
                    ]}
               />
               <Animated.View
                    style={[
                         styles.blob,
                         {
                              backgroundColor: `${colors.secondary}10`,
                              width: width * 0.8,
                              height: width * 0.8,
                              right: -width * 0.3,
                              top: height * 0.3,
                              shadowColor: colors.secondary,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.2,
                              shadowRadius: 50,
                         },
                         getBlobStyle(blob2Anim, 0, 0),
                    ]}
               />
               <Animated.View
                    style={[
                         styles.blob,
                         {
                              backgroundColor: `${colors.tertiary}10`,
                              width: width * 1.0,
                              height: width * 1.0,
                              left: -width * 0.3,
                              bottom: -height * 0.2,
                              shadowColor: colors.tertiary,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.2,
                              shadowRadius: 50,
                         },
                         getBlobStyle(blob3Anim, 0, 0),
                    ]}
               />
          </View>
     );
};

const styles = StyleSheet.create({
     blob: {
          position: 'absolute',
          borderRadius: 999,
     },
});

