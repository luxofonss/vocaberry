import React from 'react';
import {
     Image,
     ImageStyle,
     StyleProp,
} from 'react-native';

interface BookIconProps {
     size?: number;
     style?: StyleProp<ImageStyle>;
     tintColor?: string;
}

export const BookIcon: React.FC<BookIconProps> = ({
     size = 24,
     style,
     tintColor,
}) => {
     return (
          <Image
               source={require('../../../assets/book.png')}
               style={[
                    { width: size, height: size },
                    tintColor ? { tintColor } : null,
                    style,
               ]}
               resizeMode="contain"
          />
     );
};
