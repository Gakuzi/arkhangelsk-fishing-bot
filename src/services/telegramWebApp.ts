export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface ThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  bottom_bar_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
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

export function getThemeParams(): ThemeParams {
  const tg = getTelegramWebApp();
  return tg?.themeParams || {};
}

export function initTelegramApp() {
  const tg = getTelegramWebApp();
  if (!tg) return;

  try {
    tg.ready();
    tg.expand();

    // Set header & background color to match dark поморский aesthetic
    if (tg.setHeaderColor) {
      tg.setHeaderColor('#020617'); // slate-950
    }
    if (tg.setBackgroundColor) {
      tg.setBackgroundColor('#020617');
    }

    // Enable closing confirmation to prevent losing drafts
    if (typeof tg.enableClosingConfirmation === 'function') {
      tg.enableClosingConfirmation();
    }
  } catch (err) {
    console.warn('[TelegramWebApp] Error initializing:', err);
  }
}

export function hapticFeedback(
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'light'
) {
  const tg = getTelegramWebApp();
  if (!tg?.HapticFeedback) return;

  try {
    if (type === 'selection') {
      tg.HapticFeedback.selectionChanged();
    } else if (['success', 'warning', 'error'].includes(type)) {
      tg.HapticFeedback.notificationOccurred(type);
    } else {
      tg.HapticFeedback.impactOccurred(type);
    }
  } catch {}
}

/**
 * Configure native Telegram MainButton (bottom sticky action button)
 */
export function setMainButton(options: {
  text: string;
  onClick: () => void;
  isVisible?: boolean;
  isActive?: boolean;
  color?: string;
  textColor?: string;
}) {
  const tg = getTelegramWebApp();
  if (!tg?.MainButton) return;

  try {
    tg.MainButton.setText(options.text);
    if (options.color) tg.MainButton.setParams({ color: options.color, text_color: options.textColor || '#ffffff' });

    // Remove previous click handlers to prevent duplicates
    tg.MainButton.offClick();
    tg.MainButton.onClick(options.onClick);

    if (options.isActive !== false) {
      tg.MainButton.enable();
    } else {
      tg.MainButton.disable();
    }

    if (options.isVisible !== false) {
      tg.MainButton.show();
    } else {
      tg.MainButton.hide();
    }
  } catch (err) {
    console.warn('[TelegramWebApp] MainButton error:', err);
  }
}

export function hideMainButton() {
  const tg = getTelegramWebApp();
  if (tg?.MainButton?.isVisible) {
    try {
      tg.MainButton.hide();
      tg.MainButton.offClick();
    } catch {}
  }
}

/**
 * Configure native Telegram BackButton (top left navigation)
 */
export function setBackButton(onClick: () => void, isVisible = true) {
  const tg = getTelegramWebApp();
  if (!tg?.BackButton) return;

  try {
    tg.BackButton.offClick();
    tg.BackButton.onClick(onClick);
    if (isVisible) {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }
  } catch {}
}

export function hideBackButton() {
  const tg = getTelegramWebApp();
  if (tg?.BackButton?.isVisible) {
    try {
      tg.BackButton.hide();
      tg.BackButton.offClick();
    } catch {}
  }
}

/**
 * Send data directly back to the bot chat using official Telegram.WebApp.sendData
 */
export function sendDataToBot(data: any): boolean {
  const tg = getTelegramWebApp();
  if (!tg) return false;

  try {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    if (typeof tg.sendData === 'function') {
      tg.sendData(serialized);
      hapticFeedback('success');
      return true;
    }
  } catch (err) {
    console.warn('[TelegramWebApp] sendData failed:', err);
  }
  return false;
}

/**
 * Show native Telegram alert modal
 */
export function showAlert(message: string, callback?: () => void) {
  const tg = getTelegramWebApp();
  if (tg?.showAlert) {
    tg.showAlert(message, callback);
  } else {
    alert(message);
    if (callback) callback();
  }
}

/**
 * Show native Telegram confirm dialog
 */
export function showConfirm(message: string, callback: (confirmed: boolean) => void) {
  const tg = getTelegramWebApp();
  if (tg?.showConfirm) {
    tg.showConfirm(message, callback);
  } else {
    const res = confirm(message);
    callback(res);
  }
}

/**
 * Open external URL or Telegram link
 */
export function openTelegramLink(url: string) {
  const tg = getTelegramWebApp();
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(url);
  } else {
    window.open(url, '_blank');
  }
}

export function openLink(url: string) {
  const tg = getTelegramWebApp();
  if (tg?.openLink) {
    tg.openLink(url);
  } else {
    window.open(url, '_blank');
  }
}

export function closeTelegramApp() {
  const tg = getTelegramWebApp();
  if (tg?.close) {
    tg.close();
  }
}

export interface LocationResult {
  lat: number;
  lon: number;
  accuracy?: number;
  source: 'telegram_native' | 'browser_gps' | 'fallback';
}

/**
 * Request real geolocation using Telegram LocationManager (API 7.0+) or HTML5 Geolocation API
 */
export async function requestTelegramLocation(): Promise<LocationResult | null> {
  const tg = getTelegramWebApp();

  // 1. Check native Telegram LocationManager
  if (tg?.LocationManager) {
    try {
      const locManager = tg.LocationManager;
      
      const getPos = () => new Promise<LocationResult | null>((resolve) => {
        locManager.getLocation((data: any) => {
          if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            resolve({
              lat: data.latitude,
              lon: data.longitude,
              accuracy: data.horizontal_accuracy,
              source: 'telegram_native'
            });
          } else {
            resolve(null);
          }
        });
      });

      if (!locManager.isInited) {
        await new Promise<void>((resolve) => {
          locManager.init(() => resolve());
        });
      }

      const tgLoc = await getPos();
      if (tgLoc) return tgLoc;
    } catch (err) {
      console.warn('[TelegramWebApp] LocationManager failed:', err);
    }
  }

  // 2. HTML5 browser geolocation fallback
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      return {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        source: 'browser_gps'
      };
    } catch (err) {
      console.warn('[TelegramWebApp] Browser geolocation failed:', err);
    }
  }

  return null;
}

