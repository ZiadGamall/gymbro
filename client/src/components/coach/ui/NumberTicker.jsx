import { useState, useEffect } from 'react';

/**
 * Animates a number from 0 to `value` using ease-out quartic.
 * @param {{ value: number, duration?: number, delay?: number, className?: string }} props
 */
export function NumberTicker({ value, duration = 1.5, delay = 0.4, className = '' }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let raf;
    let startTime = null;
    const delayMs = delay * 1000;
    const durationMs = duration * 1000;

    const tick = (timestamp) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed < delayMs) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const progress = Math.min((elapsed - delayMs) / durationMs, 1);
      // ease-out quartic: fast start, smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * value));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, delay]);

  return <span className={className}>{count}</span>;
}
