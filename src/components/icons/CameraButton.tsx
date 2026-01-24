import React, { useRef, useCallback } from 'react';
import {
     TouchableOpacity,
     StyleSheet,
     Animated,
     Image,
     ViewStyle,
} from 'react-native';
import { colors } from '../../theme';

interface CameraButtonProps {
     onPress: () => void;
     size?: number;
     style?: ViewStyle | ViewStyle[];
}

export const CameraButton: React.FC<CameraButtonProps> = ({
     onPress,
     size = 32,
     style,
}) => {
     const scaleValue = useRef(new Animated.Value(1)).current;

     const handlePressIn = useCallback(() => {
          Animated.spring(scaleValue, {
               toValue: 0.9,
               useNativeDriver: true,
               tension: 100,
               friction: 5,
          }).start();
     }, [scaleValue]);

     const handlePressOut = useCallback(() => {
          Animated.spring(scaleValue, {
               toValue: 1,
               useNativeDriver: true,
               tension: 100,
               friction: 5,
          }).start();
     }, [scaleValue]);

     return (
          <Animated.View style={[{ transform: [{ scale: scaleValue }] }, style]}>
               <TouchableOpacity
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={0.7}
                    style={styles.button}
               >
                    <Image
                         source={require('../../../assets/camera.webp')}
                         style={{ width: size, height: size }}
                         resizeMode="contain"
                    />
               </TouchableOpacity>
          </Animated.View>
     );
};

const styles = StyleSheet.create({
     button: {
          alignItems: 'center',
          justifyContent: 'center',
     },
});
