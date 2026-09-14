export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export function getTelegramWebApp() {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp;
  }
  return null;
}

export function isInsideTelegram(): boolean {
  const tg = getTelegramWebApp();
  return Boolean(tg && (tg.initData || tg.platform !== 'unknown'));
}

export function getTelegramPlatform(): string {
  const tg = getTelegramWebApp();
  return tg?.platform || 'browser';
}

export function getTelegramUser(): TelegramUser | null {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
}

export function initTelegramApp() {
  const tg = getTelegramWebApp();
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();
    // Enable closing confirmation to prevent losing form drafts
    if (typeof tg.enableClosingConfirmation === 'function') {
      tg.enableClosingConfirmation();
    }
  } catch (err) {
    console.warn('[TelegramWebApp] Error initializing:', err);
  }
}

export function hapticFeedback(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) return;

  try {
    if (['success', 'warning', 'error'].includes(type)) {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch {}
}

export function closeTelegramApp() {
  const tg = getTelegramWebApp();
  if (tg?.close) {
    tg.close();
  }
}
