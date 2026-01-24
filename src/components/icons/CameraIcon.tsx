import React from 'react';
import {
     Image,
     ImageStyle,
     StyleProp,
} from 'react-native';

interface CameraIconProps {
     size?: number;
     style?: StyleProp<ImageStyle>;
     tintColor?: string;
}

export const CameraIcon: React.FC<CameraIconProps> = ({
     size = 32,
     style,
     tintColor,
}) => {
     return (
          <Image
               source={require('../../../assets/camera.webp')}
               style={[
                    { width: size, height: size },
                    tintColor ? { tintColor } : null,
                    style,
               ]}
               resizeMode="contain"
          />
     );
};
