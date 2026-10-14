/**
 * Gemini Voice Configuration & Key Manager
 * مدیریت کلید هوش مصنوعی جمینای جهت تبدیل صوت آیفون به متن در بستر سرور و داکر
 */

export const GEMINI_API_KEY_STORAGE_KEY = 'parsmelk_gemini_api_key';

/**
 * دریافت کلید اختصاصی ذخیره شده در مرورگر
 */
export function getStoredGeminiApiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return (localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

/**
 * ذخیره کلید هوش مصنوعی در حافظه مرورگر
 */
export function setStoredGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const clean = (key || '').trim();
    if (clean) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Failed to save Gemini key to localStorage:', e);
  }
}

/**
 * دریافت هدرهای لازم برای ارسال کلید به اندپوینت‌های صوتی سرور
 */
export function getVoiceAuthHeaders(): Record<string, string> {
  const key = getStoredGeminiApiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (key) {
    headers['x-gemini-api-key'] = key;
  }
  return headers;
}

export interface VoiceStatusResponse {
  hasVoiceSupport: boolean;
  serverHasGeminiKey: boolean;
  clientHasGeminiKey: boolean;
  effectiveKeyConfigured: boolean;
  keyPreview: string;
  nodeEnv?: string;
  error?: string;
}

/**
 * استعلام وضعیت فعال بودن سرویس صوت و کلید جمینای از سرور داکر
 */
export async function checkVoiceServerStatus(): Promise<VoiceStatusResponse> {
  try {
    const headers = getVoiceAuthHeaders();
    const res = await fetch('/api/voice-status', {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    if (res.ok) {
      return await res.json();
    }
    return {
      hasVoiceSupport: false,
      serverHasGeminiKey: false,
      clientHasGeminiKey: Boolean(getStoredGeminiApiKey()),
      effectiveKeyConfigured: Boolean(getStoredGeminiApiKey()),
      keyPreview: 'خطای سرور',
      error: `کد خطای سرور: ${res.status}`,
    };
  } catch (err: any) {
    return {
      hasVoiceSupport: false,
      serverHasGeminiKey: false,
      clientHasGeminiKey: Boolean(getStoredGeminiApiKey()),
      effectiveKeyConfigured: Boolean(getStoredGeminiApiKey()),
      keyPreview: 'عدم ارتباط با سرور',
      error: err.message || 'خطا در ارتباط با سرور',
    };
  }
}
