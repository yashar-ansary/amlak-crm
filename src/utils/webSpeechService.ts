/**
 * Web Speech API Standard Service & Cross-Platform Utilities
 * پشتیبانی جامع، پایدار و منعطف از Web Speech API
 * بهینه‌سازی شده قطعی برای آیفون (iOS Safari)، اندروید (Google Chrome / Samsung Internet) و دسکتاپ
 * با حل قطعی باگ تکرار کلمات در کروم اندروید و تایپ همزمان در حین تکلم (Real-time Live Transcript)
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// بررسی پشتیبانی مرورگر از Web Speech API
export const isSecureContextEnvironment = (): boolean => {
  if (typeof window === 'undefined') return true;
  if (window.isSecureContext !== undefined) return window.isSecureContext;
  return (
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
};

export const getSpeechRecognitionClass = () => {
  if (typeof window === 'undefined') return null;
  return (
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    null
  );
};

export const isWebSpeechSupported = (): boolean => {
  return Boolean(getSpeechRecognitionClass());
};

export const isIOSDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

export const isAndroidDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent || '');
};

/**
 * درخواست صریح دسترسی به میکروفون به شیوه استاندارد
 * در مرورگر سافاری آیفون (iOS)، بدون فراخوانی getUserMedia در رویداد کلیک کاربر،
 * مرورگر دیالوگ اجازه دسترسی به میکروفون را نمایش نمی‌دهد و Web Speech مسدود می‌شود.
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    // در محیط‌های فاقد HTTPS (مانند http://IP:3000) در سافاری آیفون، mediaDevices به دلایل امنیتی مسدود است
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // بلافاصله ترک‌ها را متوقف می‌کنیم تا سخت‌افزار میکروفون برای SpeechRecognition آزاد باشد
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (err: any) {
    console.warn('Microphone permission request rejected:', err);
    return false;
  }
}

/**
 * نرمال‌سازی نویسه‌های فارسی برای مقایسه دقیق متنی
 */
export function normalizePersianSpeechText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, ' ') // حذف نیم‌فاصله‌ها و کاراکترهای نامرئی به فاصله
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[ة]/g, 'ه')
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1728)) // فارسی به انگلیسی موقت برای مقایسه
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * حذف کلمات و عبارات تکراری متوالی ناشی از باگ‌های سیستم صوتی موبایل
 * حل قطعی باگ کروم اندروید که کلمات را چندین بار تکرار می‌کند
 */
export function deduplicateAdjacentWords(text: string): string {
  if (!text) return '';
  const trimmed = text.replace(/\s+/g, ' ').trim();
  const words = trimmed.split(' ');
  if (words.length <= 1) return trimmed;

  const result: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const current = words[i];
    const prev = result[result.length - 1];

    // ۱. جلوگیری از تکرار کلمه واحد دقیقا پشت سر هم (مثلاً: آپارتمان آپارتمان -> آپارتمان)
    if (prev && normalizePersianSpeechText(prev) === normalizePersianSpeechText(current)) {
      continue;
    }

    // ۲. جلوگیری از تکرار دو کلمه پشت سر هم (مثلاً: سعادت آباد سعادت آباد -> سعادت آباد)
    if (result.length >= 2 && i < words.length - 1) {
      const prev2 = normalizePersianSpeechText(`${result[result.length - 2]} ${result[result.length - 1]}`);
      const next2 = normalizePersianSpeechText(`${current} ${words[i + 1]}`);
      if (prev2 === next2) {
        i++; // رد شدن از کلمه دوم عبارت تکراری
        continue;
      }
    }

    // ۳. جلوگیری از تکرار سه کلمه پشت سر هم (مثلاً: سه خوابه تک واحدی سه خوابه تک واحدی)
    if (result.length >= 3 && i < words.length - 2) {
      const prev3 = normalizePersianSpeechText(`${result[result.length - 3]} ${result[result.length - 2]} ${result[result.length - 1]}`);
      const next3 = normalizePersianSpeechText(`${current} ${words[i + 1]} ${words[i + 2]}`);
      if (prev3 === next3) {
        i += 2;
        continue;
      }
    }

    // ۴. جلوگیری از تکرار چهار کلمه پشت سر هم (مثلاً: در تاریخ بیست و پنج در تاریخ بیست و پنج)
    if (result.length >= 4 && i < words.length - 3) {
      const prev4 = normalizePersianSpeechText(`${result[result.length - 4]} ${result[result.length - 3]} ${result[result.length - 2]} ${result[result.length - 1]}`);
      const next4 = normalizePersianSpeechText(`${current} ${words[i + 1]} ${words[i + 2]} ${words[i + 3]}`);
      if (prev4 === next4) {
        i += 3;
        continue;
      }
    }

    result.push(current);
  }

  return result.join(' ');
}

/**
 * ادغام هوشمند دو رشته متنی به نحوی که همپوشانی کلمات مرزی حذف شود
 * برای اتصال جملات در طول مکث‌های صوتی بدون تکرار کلمات
 */
export function smartMergeTexts(base: string, next: string): string {
  const cleanBase = (base || '').trim();
  const cleanNext = (next || '').trim();
  if (!cleanBase) return deduplicateAdjacentWords(cleanNext);
  if (!cleanNext) return deduplicateAdjacentWords(cleanBase);

  const normBase = normalizePersianSpeechText(cleanBase);
  const normNext = normalizePersianSpeechText(cleanNext);

  // ۱. اگر متن جدید کاملاً مشابه یا بخشی از انتهای متن قبلی است
  if (normBase === normNext || normBase.endsWith(normNext)) {
    return deduplicateAdjacentWords(cleanBase);
  }

  // ۲. اگر متن جدید با متن قبلی شروع شده است (حالت تجمیعی کروم اندروید)
  if (normNext.startsWith(normBase)) {
    return deduplicateAdjacentWords(cleanNext);
  }

  // ۳. بررسی همپوشانی کلمات در مرز اتصال (از ۱ تا ۸ کلمه)
  const baseWords = cleanBase.split(/\s+/);
  const nextWords = cleanNext.split(/\s+/);

  const maxCheck = Math.min(baseWords.length, nextWords.length, 8);
  for (let k = maxCheck; k >= 1; k--) {
    const baseTail = baseWords.slice(-k).map(normalizePersianSpeechText).join(' ');
    const nextHead = nextWords.slice(0, k).map(normalizePersianSpeechText).join(' ');
    if (baseTail === nextHead) {
      const remainingNext = nextWords.slice(k).join(' ');
      const merged = remainingNext ? `${cleanBase} ${remainingNext}` : cleanBase;
      return deduplicateAdjacentWords(merged);
    }
  }

  return deduplicateAdjacentWords(`${cleanBase} ${cleanNext}`);
}

/**
 * پاکسازی متن موقت در حال تکلم از کلماتی که قبلاً در انتهای متن قطعی ثبت شده‌اند
 */
export function getCleanInterimText(confirmedText: string, rawInterim: string): string {
  const cleanInterim = (rawInterim || '').trim();
  if (!cleanInterim) return '';
  const cleanConfirmed = (confirmedText || '').trim();
  if (!cleanConfirmed) return deduplicateAdjacentWords(cleanInterim);

  const normConf = normalizePersianSpeechText(cleanConfirmed);
  const normInt = normalizePersianSpeechText(cleanInterim);

  if (normConf.endsWith(normInt) || normConf === normInt) {
    return '';
  }

  const confWords = cleanConfirmed.split(/\s+/);
  const intWords = cleanInterim.split(/\s+/);

  const maxCheck = Math.min(confWords.length, intWords.length, 6);
  for (let k = maxCheck; k >= 1; k--) {
    const confTail = confWords.slice(-k).map(normalizePersianSpeechText).join(' ');
    const intHead = intWords.slice(0, k).map(normalizePersianSpeechText).join(' ');
    if (confTail === intHead) {
      const remaining = intWords.slice(k).join(' ').trim();
      return deduplicateAdjacentWords(remaining);
    }
  }

  return deduplicateAdjacentWords(cleanInterim);
}

/**
 * کلاس کنترلر زنده شناسایی گفتار - کاملاً سازگار با iOS، اندروید و دسکتاپ
 * حل قطعی باگ‌های تکرار کلمه در کروم اندروید و قطعی در آیفون با مدیریت continuous: false و خودکارسازی شروع مجدد
 */
export class LiveSpeechRecognizer {
  private recognition: any = null;
  private isListening = false;
  private confirmedText = '';
  private currentInterim = '';
  private restartTimer: any = null;
  private lang = 'fa-IR';
  private onLiveUpdateCallback?: (state: {
    fullText: string;
    confirmedText: string;
    interimText: string;
    isFinal: boolean;
  }) => void;
  private onErrorCallback?: (errorMsg: string, isFatal: boolean) => void;
  private onEndCallback?: () => void;

  constructor(lang: string = 'fa-IR') {
    this.lang = lang;
  }

  public isAvailable(): boolean {
    return isWebSpeechSupported();
  }

  public start(callbacks: {
    onLiveUpdate: (state: {
      fullText: string;
      confirmedText: string;
      interimText: string;
      isFinal: boolean;
    }) => void;
    onError?: (errorMsg: string, isFatal: boolean) => void;
    onEnd?: () => void;
    initialText?: string;
  }): boolean {
    const SpeechClass = getSpeechRecognitionClass();
    if (!SpeechClass) {
      callbacks.onError?.('مرورگر شما از Web Speech API پشتیبانی نمی‌کند.', true);
      return false;
    }

    this.onLiveUpdateCallback = callbacks.onLiveUpdate;
    this.onErrorCallback = callbacks.onError;
    this.onEndCallback = callbacks.onEnd;
    this.confirmedText = deduplicateAdjacentWords((callbacks.initialText || '').trim());
    this.currentInterim = '';
    this.isListening = true;

    this.createAndStartInstance();
    return true;
  }

  private createAndStartInstance() {
    if (!this.isListening) return;

    const SpeechClass = getSpeechRecognitionClass();
    if (!SpeechClass) return;

    if (this.recognition) {
      try {
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch {}
      this.recognition = null;
    }

    const sessionBaseText = this.confirmedText;

    try {
      const recognition = new SpeechClass();
      recognition.lang = this.lang;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      // در کروم اندروید continuous: false مانع از باگ تکرار کلمات می‌شود
      // در دسکتاپ و iOS سافاری continuous: true امکان صحبت پیوسته را فراهم می‌کند
      recognition.continuous = !isAndroidDevice();

      recognition.onresult = (event: any) => {
        if (!this.isListening) return;

        let sessionFinal = '';
        let sessionInterim = '';

        // پیمایش تمام نتایج نشست جاری از ابتدا جهت تضمین قطعی عدم تکرار کلمات
        for (let i = 0; i < event.results.length; i++) {
          const item = event.results[i];
          if (!item || !item[0]) continue;
          const transcript = (item[0].transcript || '').trim();
          if (!transcript) continue;

          if (item.isFinal) {
            sessionFinal = sessionFinal ? smartMergeTexts(sessionFinal, transcript) : transcript;
          } else {
            sessionInterim = sessionInterim ? `${sessionInterim} ${transcript}` : transcript;
          }
        }

        let currentConfirmed = sessionBaseText;
        if (sessionFinal) {
          currentConfirmed = smartMergeTexts(sessionBaseText, sessionFinal);
          this.confirmedText = deduplicateAdjacentWords(currentConfirmed);
        }

        const cleanInterim = getCleanInterimText(currentConfirmed, sessionInterim);
        this.currentInterim = cleanInterim;

        const fullText = [currentConfirmed, cleanInterim].filter(Boolean).join(' ').trim();
        const dedupedFull = deduplicateAdjacentWords(fullText);

        this.onLiveUpdateCallback?.({
          fullText: dedupedFull,
          confirmedText: this.confirmedText,
          interimText: cleanInterim,
          isFinal: Boolean(sessionFinal),
        });
      };

      recognition.onerror = (event: any) => {
        const error = event.error;
        console.warn('SpeechRecognition notice:', error);

        if (error === 'not-allowed' || error === 'service-not-allowed') {
          this.isListening = false;
          this.onErrorCallback?.(
            isIOSDevice()
              ? 'دسترسی به میکروفون مرورگر داده نشد. کیبورد فعال شد: دکمه میکروفون 🎙️ پایین کیبورد (کنار Space) را لمس کرده و صحبت فرمایید. یا در تنظیمات آیفون: Settings > Safari > Microphone را Allow فرمایید.'
              : 'دسترسی به میکروفون داده نشد. لطفاً در تنظیمات مرورگر مجوز میکروفون را فعال نمایید.',
            true
          );
          return;
        }

        if (error === 'language-not-supported') {
          console.warn('SpeechRecognition language notice:', this.lang);
          if (this.lang === 'fa-IR') {
            this.lang = 'fa';
            try {
              this.createAndStartInstance();
              return;
            } catch {}
          }
          return;
        }

        if (error === 'network') {
          this.isListening = false;
          this.onErrorCallback?.('سرور گفتار در این شبکه در دسترس نیست (خطای network). لطفاً اتصال اینترنت را بررسی فرمایید.', false);
          return;
        }

        if (error === 'no-speech' || error === 'aborted' || error === 'audio-capture') {
          // در سکوت یا قطع موقت، اگر کاربر هنوز دکمه توقف را نزده، ری‌استارت می‌شود
          return;
        }

        this.onErrorCallback?.(`وضعیت سرویس صوتی: ${error}`, false);
      };

      recognition.onend = () => {
        if (this.currentInterim) {
          this.confirmedText = smartMergeTexts(this.confirmedText, this.currentInterim);
          this.currentInterim = '';
        }

        if (this.isListening) {
          // ری‌استارت بلافاصله برای ضبط بدون وقفه در طول صحبت‌های طولانی
          if (this.restartTimer) clearTimeout(this.restartTimer);
          const restartDelay = isIOSDevice() ? 180 : isAndroidDevice() ? 80 : 100;
          this.restartTimer = setTimeout(() => {
            if (this.isListening) {
              this.createAndStartInstance();
            }
          }, restartDelay);
        } else {
          this.onEndCallback?.();
        }
      };

      recognition.start();
      this.recognition = recognition;
    } catch (err: any) {
      console.warn('SpeechRecognition start err:', err);
      if (this.isListening) {
        if (this.restartTimer) clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => {
          if (this.isListening) {
            this.createAndStartInstance();
          }
        }, 200);
      }
    }
  }

  public stop(): string {
    this.isListening = false;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (this.recognition) {
      try {
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }

    if (this.currentInterim) {
      this.confirmedText = smartMergeTexts(this.confirmedText, this.currentInterim);
      this.currentInterim = '';
    }

    const finalResult = deduplicateAdjacentWords(this.confirmedText.trim());
    this.confirmedText = finalResult;
    return finalResult;
  }

  public reset(initial: string = '') {
    this.stop();
    this.confirmedText = deduplicateAdjacentWords(initial.trim());
    this.currentInterim = '';
  }

  public getCurrentText(): string {
    const full = [this.confirmedText, this.currentInterim].filter(Boolean).join(' ').trim();
    return deduplicateAdjacentWords(full);
  }
}

export interface WebSpeechOptions {
  lang?: string;
  onResult?: (text: string, isFinal: boolean, interimPart: string) => void;
  onError?: (errorMessage: string, isFatal: boolean) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

/**
 * هوک ری‌اکت استاندارد Web Speech API با قابلیت مقاومت در برابر قطع و تکرار
 */
export function useWebSpeech(options: WebSpeechOptions = {}) {
  const { lang = 'fa-IR', onResult, onError, onStart, onEnd } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confirmedTranscript, setConfirmedTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognizerRef = useRef<LiveSpeechRecognizer | null>(null);

  useEffect(() => {
    setSpeechSupported(isWebSpeechSupported());
    recognizerRef.current = new LiveSpeechRecognizer(lang);

    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
        recognizerRef.current = null;
      }
    };
  }, [lang]);

  const startListening = useCallback(
    (initialText: string = '') => {
      setErrorMessage('');
      const cleanInitial = deduplicateAdjacentWords(initialText.trim());
      setTranscript(cleanInitial);
      setConfirmedTranscript(cleanInitial);
      setInterimText('');
      setIsListening(true);
      onStart?.();

      if (!recognizerRef.current) {
        recognizerRef.current = new LiveSpeechRecognizer(lang);
      }

      recognizerRef.current.start({
        initialText: cleanInitial,
        onLiveUpdate: ({ fullText, confirmedText, interimText: interim, isFinal }) => {
          setTranscript(fullText);
          setConfirmedTranscript(confirmedText);
          setInterimText(interim);
          onResult?.(fullText, isFinal, interim);
        },
        onError: (err, isFatal) => {
          setErrorMessage(err);
          onError?.(err, isFatal);
          if (isFatal) setIsListening(false);
        },
        onEnd: () => {
          setIsListening(false);
          onEnd?.();
        },
      });
    },
    [lang, onStart, onResult, onError, onEnd]
  );

  const stopListening = useCallback(() => {
    setIsListening(false);
    setInterimText('');
    if (recognizerRef.current) {
      const finalVal = recognizerRef.current.stop();
      setTranscript(finalVal);
      setConfirmedTranscript(finalVal);
      return finalVal;
    }
    return transcript;
  }, [transcript]);

  const clearTranscript = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.reset('');
    }
    setTranscript('');
    setConfirmedTranscript('');
    setInterimText('');
  }, []);

  return {
    isListening,
    transcript,
    confirmedTranscript,
    interimText,
    errorMessage,
    speechSupported,
    startListening,
    stopListening,
    clearTranscript,
    setTranscript,
  };
}
