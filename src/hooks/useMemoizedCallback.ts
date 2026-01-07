// useMemoizedCallback - Stable callback reference
import { useCallback, useRef } from 'react';

/**
 * Creates a stable callback reference that always calls the latest function.
 * Useful when you need a stable reference but the callback depends on changing values.
 * 
 * @param callback - The callback function
 * @returns A stable callback reference
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
     callback: T
): T {
     const callbackRef = useRef<T>(callback);

     // Update ref on every render
     callbackRef.current = callback;

     // Return stable callback that calls the latest function
     return useCallback(
          ((...args) => callbackRef.current(...args)) as T,
          []
     );
}