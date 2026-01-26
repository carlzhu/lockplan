import { useRef, useCallback } from 'react';

/**
 * 防抖 Hook
 * @param callback 要执行的回调函数
 * @param delay 延迟时间（毫秒），默认 300ms
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
};

/**
 * 节流 Hook（防止短时间内多次触发）
 * @param callback 要执行的回调函数
 * @param delay 节流时间（毫秒），默认 1000ms
 */
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 1000
): ((...args: Parameters<T>) => void) => {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRunRef.current >= delay) {
        // 立即执行
        lastRunRef.current = now;
        callback(...args);
      } else {
        // 在延迟时间后执行（如果没有新的调用）
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callback(...args);
        }, delay - (now - lastRunRef.current));
      }
    },
    [callback, delay]
  );
};

/**
 * 单次执行 Hook（防止重复提交）
 * 适用于提交按钮等场景
 */
export const useSingleExecution = <T extends (...args: any[]) => Promise<any>>(
  callback: T
): [(...args: Parameters<T>) => Promise<void>, boolean] => {
  const isExecutingRef = useRef<boolean>(false);

  const execute = useCallback(
    async (...args: Parameters<T>) => {
      if (isExecutingRef.current) {
        console.log('操作正在进行中，请勿重复点击');
        return;
      }

      isExecutingRef.current = true;

      try {
        await callback(...args);
      } finally {
        isExecutingRef.current = false;
      }
    },
    [callback]
  );

  return [execute, isExecutingRef.current];
};
