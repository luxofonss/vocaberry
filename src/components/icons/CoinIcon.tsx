import React from 'react';
import {
     Image,
     ImageStyle,
     StyleProp,
} from 'react-native';

interface CoinIconProps {
     size?: number;
     style?: StyleProp<ImageStyle>;
     tintColor?: string;
}

export const CoinIcon: React.FC<CoinIconProps> = ({
     size = 18,
     style,
     tintColor,
}) => {
     return (
          <Image
               source={require('../../../assets/coin.webp')}
               style={[
                    { width: size, height: size },
                    tintColor ? { tintColor } : null,
                    style,
               ]}
               resizeMode="contain"
          />
     );
};
