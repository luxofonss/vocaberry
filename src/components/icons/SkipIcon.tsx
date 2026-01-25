import React from 'react';
import {
     Image,
     ImageStyle,
     StyleProp,
} from 'react-native';

interface SkipIconProps {
     size?: number;
     style?: StyleProp<ImageStyle>;
     tintColor?: string;
}

export const SkipIcon: React.FC<SkipIconProps> = ({
     size = 24,
     style,
     tintColor,
}) => {
     return (
          <Image
               source={require('../../../assets/skip.png')}
               style={[
                    { width: size, height: size },
                    tintColor ? { tintColor } : null,
                    style,
               ]}
               resizeMode="contain"
          />
     );
};
