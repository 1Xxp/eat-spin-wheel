import { useState, useCallback } from 'react';
import { spin as spinApi } from '../api/endpoints';
import type { SpinResult } from '../api/types';

type SpinState = 'idle' | 'spinning' | 'done';

export function useSpin() {
  const [state, setState] = useState<SpinState>('idle');
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doSpin = useCallback(async () => {
    setState('spinning');
    setError(null);
    setResult(null);
    try {
      const res: any = await spinApi();
      setResult(res.data);
      setState('done');
    } catch {
      setError('抽取失败，请重试');
      setState('idle');
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setResult(null);
    setError(null);
  }, []);

  return { state, result, error, doSpin, reset };
}
