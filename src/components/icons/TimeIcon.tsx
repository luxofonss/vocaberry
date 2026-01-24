import React from 'react';
import {
     Image,
     ImageStyle,
     StyleProp,
} from 'react-native';

interface TimeIconProps {
     size?: number;
     style?: StyleProp<ImageStyle>;
     tintColor?: string;
}

export const TimeIcon: React.FC<TimeIconProps> = ({
     size = 18,
     style,
     tintColor,
}) => {
     return (
          <Image
               source={require('../../../assets/time.png')}
               style={[
                    { width: size, height: size },
                    tintColor ? { tintColor } : null,
                    style,
               ]}
               resizeMode="contain"
          />
     );
};
