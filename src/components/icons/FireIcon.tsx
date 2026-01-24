import React from 'react';
import {
     Image,
     ImageStyle,
     StyleProp,
} from 'react-native';

interface FireIconProps {
     size?: number;
     style?: StyleProp<ImageStyle>;
     tintColor?: string;
}

export const FireIcon: React.FC<FireIconProps> = ({
     size = 24,
     style,
     tintColor,
}) => {
     return (
          <Image
               source={require('../../../assets/fire.webp')}
               style={[
                    { width: size, height: size },
                    tintColor ? { tintColor } : null,
                    style,
               ]}
               resizeMode="contain"
          />
     );
};
