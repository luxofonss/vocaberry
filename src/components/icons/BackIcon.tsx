import React from 'react';
import {
     Image,
     ImageStyle,
     StyleProp,
} from 'react-native';

interface BackIconProps {
     size?: number;
     style?: StyleProp<ImageStyle>;
     tintColor?: string;
}

export const BackIcon: React.FC<BackIconProps> = ({
     size = 24,
     style,
     tintColor,
}) => {
     return (
          <Image
               source={require('../../../assets/back.webp')}
               style={[
                    { width: size, height: size },
                    tintColor ? { tintColor } : null,
                    style,
               ]}
               resizeMode="contain"
          />
     );
};
