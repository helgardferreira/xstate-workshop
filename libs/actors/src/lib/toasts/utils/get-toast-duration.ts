import type { ToastType } from '../types.js';

const defaultTimeouts: Record<ToastType, number> = {
  DEFAULT: 5000,
  error: 5000,
  info: 5000,
  loading: Infinity,
  success: 2000,
  warning: 5000,
};

export const getToastDuration = (
  duration: number | undefined,
  type: ToastType
) => duration ?? defaultTimeouts[type] ?? defaultTimeouts.DEFAULT;
