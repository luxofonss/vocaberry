// usePolling - Polling hook for checking data updates
import { useEffect, useRef, useCallback } from 'react';
import { PRACTICE_CONFIG } from '../constants';

interface UsePollingOptions {
     enabled: boolean;
     intervalMs?: number;
     timeoutMs?: number;
     onSuccess?: () => void;
     onTimeout?: () => void;
}

/**
 * Polls a condition function until it returns true or timeout is reached.
 * Useful for checking if async data (like images) has been loaded.
 * 
 * @param checkFn - Function that returns true when polling should stop
 * @param options - Polling configuration options
 */
export function usePolling(
     checkFn: () => Promise<boolean>,
     options: UsePollingOptions
) {
     const {
          enabled,
          intervalMs = PRACTICE_CONFIG.pollingIntervalMs,
          timeoutMs = PRACTICE_CONFIG.pollingTimeoutMs,
          onSuccess,
          onTimeout,
     } = options;

     const intervalRef = useRef<NodeJS.Timeout | null>(null);
     const timeoutRef = useRef<NodeJS.Timeout | null>(null);

     const cleanup = useCallback(() => {
          if (intervalRef.current) {
               clearInterval(intervalRef.current);
               intervalRef.current = null;
          }
          if (timeoutRef.current) {
               clearTimeout(timeoutRef.current);
               timeoutRef.current = null;
          }
     }, []);

     useEffect(() => {
          if (!enabled) {
               cleanup();
               return;
          }

          const poll = async () => {
               try {
                    const shouldStop = await checkFn();
                    if (shouldStop) {
                         cleanup();
                         onSuccess?.();
                    }
               } catch (error) {
                    console.error('[usePolling] Error:', error);
               }
          };

          // Start polling
          intervalRef.current = setInterval(poll, intervalMs);

          // Set timeout
          timeoutRef.current = setTimeout(() => {
               cleanup();
               onTimeout?.();
          }, timeoutMs);

          return cleanup;
     }, [enabled, checkFn, intervalMs, timeoutMs, onSuccess, onTimeout, cleanup]);

     return { stop: cleanup };
}