import React from 'react';
import {
     Image,
     ImageStyle,
     StyleProp,
} from 'react-native';

interface MicroIconProps {
     size?: number;
     style?: StyleProp<ImageStyle>;
     tintColor?: string;
}

export const MicroIcon: React.FC<MicroIconProps> = ({
     size = 24,
     style,
     tintColor,
}) => {
     return (
          <Image
               source={require('../../../assets/micro.webp')}
               style={[
                    { width: size, height: size },
                    tintColor ? { tintColor } : null,
                    style,
               ]}
               resizeMode="contain"
          />
     );
};
