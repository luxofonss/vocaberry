// LazyImage - Optimized image component with loading state and caching
import React, { useState, useCallback, memo } from 'react';
import {
     Image,
     View,
     StyleSheet,
     ActivityIndicator,
     ImageStyle,
     ViewStyle,
     ImageResizeMode,
} from 'react-native';
import { colors } from '../theme/colors';

interface LazyImageProps {
     uri: string | null | undefined;
     style?: ImageStyle;
     containerStyle?: ViewStyle;
     resizeMode?: ImageResizeMode;
     placeholder?: React.ReactNode;
     showLoader?: boolean;
}

/**
 * Optimized image component with:
 * - Loading state indicator
 * - Error handling with fallback
 * - Memoization to prevent unnecessary re-renders
 */
const LazyImageComponent: React.FC<LazyImageProps> = ({
     uri,
     style,
     containerStyle,
     resizeMode = 'cover',
     placeholder,
     showLoader = true,
}) => {
     const [isLoading, setIsLoading] = useState(true);
     const [hasError, setHasError] = useState(false);

     const handleLoadStart = useCallback(() => {
          setIsLoading(true);
          setHasError(false);
     }, []);

     const handleLoadEnd = useCallback(() => {
          setIsLoading(false);
     }, []);

     const handleError = useCallback(() => {
          setIsLoading(false);
          setHasError(true);
     }, []);

     const isValidUri = uri && uri.trim() !== '';

     if (!isValidUri || hasError) {
          return (
               <View style={[styles.container, containerStyle, style]}>
                    {placeholder || (
                         <View style={styles.placeholder}>
                              <ActivityIndicator size="small" color={colors.primary} />
                         </View>
                    )}
               </View>
          );
     }

     return (
          <View style={[styles.container, containerStyle]}>
               <Image
                    source={{ uri }}
                    style={[styles.image, style]}
                    resizeMode={resizeMode}
                    onLoadStart={handleLoadStart}
                    onLoadEnd={handleLoadEnd}
                    onError={handleError}
               />
               {isLoading && showLoader && (
                    <View style={styles.loaderOverlay}>
                         <ActivityIndicator size="small" color={colors.primary} />
                    </View>
               )}
          </View>
     );
};

export const LazyImage = memo(LazyImageComponent);

const styles = StyleSheet.create({
     container: {
          overflow: 'hidden',
          backgroundColor: colors.backgroundSoft,
     },
     image: {
          width: '100%',
          height: '100%',
     },
     placeholder: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
     },
     loaderOverlay: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255,255,255,0.5)',
     },
});