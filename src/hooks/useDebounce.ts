// useDebounce - Debounce hook for search inputs
import { useState, useEffect } from 'react';

/**
 * Debounces a value by the specified delay.
 * Useful for search inputs to prevent excessive API calls.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay = 300): T {
     const [debouncedValue, setDebouncedValue] = useState<T>(value);

     useEffect(() => {
          const timer = setTimeout(() => {
               setDebouncedValue(value);
          }, delay);

          return () => {
               clearTimeout(timer);
          };
     }, [value, delay]);

     return debouncedValue;
}