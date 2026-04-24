import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function validateToken(token: string): boolean {
  return /^\d{6}$/.test(token);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    connected: 'bg-green-500',
    ready: 'bg-green-500',
    disconnected: 'bg-red-500',
    maintenance: 'bg-yellow-500',
    printing: 'bg-blue-500',
    error: 'bg-red-500',
    pending: 'bg-gray-500',
    processing: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
  };
  return colors[status] || 'bg-gray-500';
}

export function playSound(type: 'success' | 'error' | 'scan' | 'alert') {
  if (typeof window === 'undefined') return;
  
  // You can add actual sound files later
  const frequencies: Record<string, number> = {
    success: 800,
    error: 400,
    scan: 600,
    alert: 500,
  };
  
  const context = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  
  oscillator.frequency.value = frequencies[type];
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
  
  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + 0.5);
}

// Lightweight client/server logger with env toggle
const DEBUG_ENABLED = (process.env.NEXT_PUBLIC_DEBUG_LOGS || '').toLowerCase() === 'true';

function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(date);
}

function baseLog(level: 'log' | 'info' | 'warn' | 'error', scope: string, ...args: any[]) {
  if (!DEBUG_ENABLED) return;
  const ts = formatTimestamp(new Date());
  const prefix = `[${ts}] [${scope}]`;
  // eslint-disable-next-line no-console
  (console as any)[level](prefix, ...args);
}

export const logger = {
  log: (scope: string, ...args: any[]) => baseLog('log', scope, ...args),
  info: (scope: string, ...args: any[]) => baseLog('info', scope, ...args),
  warn: (scope: string, ...args: any[]) => baseLog('warn', scope, ...args),
  error: (scope: string, ...args: any[]) => baseLog('error', scope, ...args),
  event: (scope: string, name: string, data?: Record<string, any>) =>
    baseLog('info', scope, { event: name, ...((data || {}) as any) }),
};

