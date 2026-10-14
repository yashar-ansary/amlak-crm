// مسیر فایل: src/components/properties/VoicePropertyModal.tsx
// مدال هوشمند ثبت فایل ملک با صوت و گفتار
// پیاده‌سازی استاندارد و پایدار SpeechRecognition API با مدیریت وضعیت (State)
// درج تکه‌ای و بدون تکرار کلمات در اندروید، iOS و دسکتاپ

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  Check,
  Building2,
  MapPin,
  Phone,
  User,
  RotateCcw,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Volume2,
  FileText,
  Loader2,
  BedDouble,
  Layers,
  Calendar,
  DollarSign,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { SoundRecorder, RecordedAudioResult } from '../../utils/audioRecorder';
import { useCrm } from '../../context/CrmContext';
import { Property } from '../../types/crm';
import {
  parseVoicePropertyDescription,
  VOICE_PRESET_SCENARIOS,
  ParsedVoiceProperty,
} from '../../utils/voiceParser';
import {
  formatToman,
  toPersianDigits,
  PROPERTY_TYPE_NAMES,
  TRANSACTION_TYPE_NAMES,
} from '../../utils/jalali';
import {
  getSpeechRecognitionClass,
  isWebSpeechSupported,
  smartMergeTexts,
  deduplicateAdjacentWords,
  getCleanInterimText,
  isSecureContextEnvironment,
  isAndroidDevice,
  isIOSDevice,
  requestMicrophonePermission,
} from '../../utils/webSpeechService';

interface VoicePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToForm: (parsedData: ParsedVoiceProperty) => void;
}

export const VoicePropertyModal: React.FC<VoicePropertyModalProps> = ({
  isOpen,
  onClose,
  onApplyToForm,
}) => {
  const { addProperty, agents } = useCrm();

  // ۱. وضعیت‌های عمومی ضبط و صدا
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [speechActive, setSpeechActive] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [audioResult, setAudioResult] = useState<RecordedAudioResult | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // ۲. مدیریت وضعیت (State) برای تایپ صوتی تکه‌ای، پایدار و بدون تکرار
  const [transcript, setTranscript] = useState('');
  const [confirmedText, setConfirmedText] = useState('');
  const [interimText, setInterimText] = useState('');

  // ۳. وضعیت پردازش و نتایج هوشمند
  const [parsedProperty, setParsedProperty] = useState<ParsedVoiceProperty | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [speechNotice, setSpeechNotice] = useState('');
  const [successSaved, setSuccessSaved] = useState(false);

  // رفرنس‌ها برای مدیریت رویدادهای غیرهمگام SpeechRecognition بدون تکرار کلمه
  const confirmedTextRef = useRef('');
  const interimTextRef = useRef('');
  const sessionBaseTextRef = useRef('');
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const shouldKeepListeningRef = useRef(false);
  const restartTimerRef = useRef<any>(null);
  const networkErrorCountRef = useRef(0);

  const soundRecorderRef = useRef<SoundRecorder | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const nativeAudioCaptureRef = useRef<HTMLInputElement | null>(null);

  // پردازش مجدد متن توسط تجزیه‌گر هوشمند
  const handleReprocessText = useCallback((textToProcess?: string) => {
    const text = (textToProcess ?? confirmedTextRef.current ?? transcript).trim();
    if (!text) return;
    const parsed = parseVoicePropertyDescription(text);
    setParsedProperty(parsed);
  }, [transcript]);

  // رویداد onResult اختصاصی: تفکیک تکه‌ای عبارات و جلوگیری از تکرار کلمات در اندروید و دسکتاپ
  const handleSpeechResult = useCallback((event: any) => {
    if (!shouldKeepListeningRef.current) return;

    let sessionFinal = '';
    let sessionInterim = '';

    // پیمایش تمام نتایج نشست جاری از ابتدا جهت تضمین قطعی عدم تکرار کلمات
    for (let i = 0; i < event.results.length; i++) {
      const resultItem = event.results[i];
      if (!resultItem || !resultItem[0]) continue;
      const text = (resultItem[0].transcript || '').trim();
      if (!text) continue;

      if (resultItem.isFinal) {
        sessionFinal = sessionFinal ? smartMergeTexts(sessionFinal, text) : text;
      } else {
        sessionInterim = sessionInterim ? `${sessionInterim} ${text}` : text;
      }
    }

    // الف) اگر تکه قطعی جدید (isFinal: true) رسید، با متن پیش از نشست ادغام و تکرارها حذف می‌شود
    let currentConfirmed = sessionBaseTextRef.current;
    if (sessionFinal) {
      currentConfirmed = smartMergeTexts(sessionBaseTextRef.current, sessionFinal);
      const cleanConfirmed = deduplicateAdjacentWords(currentConfirmed);
      confirmedTextRef.current = cleanConfirmed;
      setConfirmedText(cleanConfirmed);
      handleReprocessText(cleanConfirmed);
    }

    // ب) اگر تکه در حال تکلم است، با مرز متن قبلی تراز و پاکسازی می‌شود
    const cleanInterim = getCleanInterimText(currentConfirmed, sessionInterim);
    interimTextRef.current = cleanInterim;
    setInterimText(cleanInterim);

    const liveFull = [currentConfirmed, cleanInterim]
      .filter(Boolean)
      .join(' ')
      .trim();
    const dedupedLive = deduplicateAdjacentWords(liveFull);
    setTranscript(dedupedLive);
  }, [handleReprocessText]);

  // ساخت و اجرای نمونه SpeechRecognition با تنظیمات پایدار و مستقل از ریکوردر سخت‌افزاری
  const startRecognitionInstance = useCallback(() => {
    const SpeechClass = getSpeechRecognitionClass();
    if (!SpeechClass) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    sessionBaseTextRef.current = confirmedTextRef.current;

    try {
      const recognition = new SpeechClass();
      recognition.lang = 'fa-IR';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      // در کروم اندروید continuous: false مانع از باگ تکرار کلمات می‌شود
      // در دسکتاپ و iOS سافاری continuous: true تایپ پیوسته و بدون قطعی در حین صحبت را فراهم می‌کند
      recognition.continuous = !isAndroidDevice();

      recognition.onresult = handleSpeechResult;

      recognition.onaudiostart = () => {
        setSpeechActive(true);
      };

      recognition.onspeechstart = () => {
        setSpeechActive(true);
      };

      recognition.onspeechend = () => {
        setSpeechActive(false);
      };

      recognition.onaudioend = () => {
        setSpeechActive(false);
      };

      recognition.onerror = (event: any) => {
        const error = event.error;
        console.warn('SpeechRecognition status:', error);

        if (error === 'not-allowed' || error === 'service-not-allowed') {
          shouldKeepListeningRef.current = false;
          isListeningRef.current = false;
          setIsRecording(false);
          setErrorMessage(
            isIOSDevice()
              ? 'دسترسی به میکروفون در آیفون تایید نشد. لطفاً در پنجره باز شده گزینه Allow را بزنید یا در تنظیمات آیفون (Settings > Safari > Microphone) دسترسی را فعال فرمایید.'
              : 'دسترسی به میکروفون مجاز نیست. لطفاً در نوار آدرس مرورگر روی علامت قفل یا میکروفون کلیک کرده و دسترسی را مجاز (Allow) فرمایید.'
          );
          return;
        }

        if (error === 'language-not-supported') {
          console.warn('Language notice on speech recognition:', recognition.lang);
          if (recognition.lang === 'fa-IR') {
            try {
              recognition.lang = 'fa';
              recognition.start();
              return;
            } catch {}
          }
          setErrorMessage('موتور تشخیص گفتار مرورگر نیاز به بررسی تنظیمات دارد. لطفاً مشخصات ملک را در کادر زیر بنویسید.');
          return;
        }

        if (error === 'network') {
          networkErrorCountRef.current = (networkErrorCountRef.current || 0) + 1;
          console.warn('SpeechRecognition network error count:', networkErrorCountRef.current);
          if (networkErrorCountRef.current >= 2) {
            shouldKeepListeningRef.current = false;
            setIsRecording(false);
            setSpeechNotice('سرویس آنلاین تشخیص گفتار مرورگر با خطای شبکه مواجه شد. لطفاً اتصال اینترنت خود را بررسی فرمایید.');
          }
          return;
        }

        if (error === 'audio-capture') {
          console.warn('Microphone hardware is busy or in use.');
          return;
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setSpeechActive(false);

        // تبدیل متن موقت باقی‌مانده به متن قطعی
        if (interimTextRef.current) {
          const merged = smartMergeTexts(confirmedTextRef.current, interimTextRef.current);
          const clean = deduplicateAdjacentWords(merged);
          confirmedTextRef.current = clean;
          sessionBaseTextRef.current = clean;
          interimTextRef.current = '';
          setConfirmedText(clean);
          setInterimText('');
          setTranscript(clean);
          handleReprocessText(clean);
        } else {
          sessionBaseTextRef.current = confirmedTextRef.current;
        }

        // اگر کاربر هنوز دکمه توقف را نزده، ری‌استارت یکپارچه برای حفظ جریان صحبت
        if (shouldKeepListeningRef.current) {
          if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
          const restartDelay = isIOSDevice() ? 180 : isAndroidDevice() ? 80 : 120;
          restartTimerRef.current = setTimeout(() => {
            if (shouldKeepListeningRef.current) {
              startRecognitionInstance();
            }
          }, restartDelay);
        } else {
          setIsRecording(false);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      isListeningRef.current = true;
    } catch (err: any) {
      console.warn('SpeechRecognition start err:', err);
      if (shouldKeepListeningRef.current) {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (shouldKeepListeningRef.current) {
            startRecognitionInstance();
          }
        }, 200);
      }
    }
  }, [handleSpeechResult, handleReprocessText]);

  // لغو کامل ضبط و شناسایی صوتی
  const handleCancelRecording = useCallback(() => {
    shouldKeepListeningRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    isListeningRef.current = false;

    if (soundRecorderRef.current) {
      soundRecorderRef.current.cancel();
      soundRecorderRef.current = null;
    }

    setIsRecording(false);
    setVolumeLevel(0);
  }, []);

  // ریست کامل وضعیت‌ها
  const handleReset = useCallback(() => {
    handleCancelRecording();
    setAudioResult(null);
    setTranscript('');
    setConfirmedText('');
    setInterimText('');
    confirmedTextRef.current = '';
    interimTextRef.current = '';
    setParsedProperty(null);
    setErrorMessage('');
    setSpeechNotice('');
    setSuccessSaved(false);
    setIsProcessing(false);
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setIsPlayingAudio(false);
  }, [handleCancelRecording]);

  // پاکسازی هنگام باز و بسته شدن مدال
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
    return () => {
      handleCancelRecording();
    };
  }, [isOpen, handleReset, handleCancelRecording]);

  // ثانیه‌شمار مدت زمان ضبط
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording]);

  // دریافت و استخراج مشخصات از فایل صوتی یا ویس‌مموز آیفون
  const handleNativeAudioFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setSpeechNotice('صوت با موفقیت از ریکوردر گوشی دریافت شد. در حال تبدیل به متن فارسی و استخراج مشخصات ملک...');
    setErrorMessage('');

    try {
      const mime = file.type || (isIOSDevice() ? 'audio/mp4' : 'audio/webm');
      const audioDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const audioBase64 = audioDataUrl.split(',')[1];
      if (audioBase64) {
        const transRes = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64,
            mimeType: mime,
          }),
        });

        if (transRes.ok) {
          const transData = await transRes.json();
          if (transData.success && transData.transcript) {
            const finalSpeechText = transData.transcript;
            setTranscript(finalSpeechText);
            setConfirmedText(finalSpeechText);
            confirmedTextRef.current = finalSpeechText;
            const localParsed = parseVoicePropertyDescription(finalSpeechText);
            setParsedProperty(localParsed);
            setSpeechNotice('متن و مشخصات فایل با موفقیت استخراج شد.');
          } else {
            setErrorMessage(transData.error || 'صدایی از فایل دریافت نشد.');
          }
        }
      }
    } catch (err: any) {
      console.warn('Native audio capture error:', err);
      setErrorMessage('خطا در پردازش فایل صوتی: ' + (err.message || 'نامشخص'));
    } finally {
      setIsProcessing(false);
    }
  };

  // ۱. شروع مستقیم ضبط و تایپ همزمان در حین تکلم (پشتیبانی تضمینی از آیفون، اندروید و دسکتاپ)
  const handleStartRecording = () => {
    setErrorMessage('');
    setSpeechNotice('');
    setSuccessSaved(false);
    networkErrorCountRef.current = 0;

    const isCurrentIOS = isIOSDevice();

    // بررسی پشتیبانی SpeechRecognition API در مرورگر (فقط برای غیر آیفون)
    if (!isCurrentIOS && !isWebSpeechSupported()) {
      setErrorMessage('مرورگر شما از SpeechRecognition API پشتیبانی نمی‌کند. لطفاً از مرورگر گوگل کروم یا مایکروسافت اج استفاده فرمایید.');
      return;
    }

    if (!isSecureContextEnvironment()) {
      setSpeechNotice('هشدار امنیتی: مرورگرها فقط در پروتکل امن HTTPS با گواهی معتبر یا localhost اجازه دسترسی به میکروفون را صادر می‌کنند.');
    }

    // آماده‌سازی وضعیت‌ها
    confirmedTextRef.current = '';
    interimTextRef.current = '';
    sessionBaseTextRef.current = '';
    setConfirmedText('');
    setInterimText('');
    setTranscript('');
    setParsedProperty(null);

    shouldKeepListeningRef.current = true;
    setIsRecording(true);
    setRecordingSeconds(0);
    setVolumeLevel(45);

    if (isCurrentIOS) {
      // در آیفون: سیستم وب‌کیت اپل فاقد تشخیص گفتار فارسی است؛ لذا صوت مستقیماً با SoundRecorder ضبط و توسط هوش مصنوعی پیاده‌سازی می‌شود
      try {
        const recorder = new SoundRecorder();
        soundRecorderRef.current = recorder;
        recorder.start((vol) => {
          setVolumeLevel(vol);
        }).catch((err) => {
          console.error('Mic start error on iOS:', err);
          setIsRecording(false);
          shouldKeepListeningRef.current = false;
          setErrorMessage('دسترسی به میکروفون در آیفون مجاز نشد. لطفاً در پنجره تایید گزینه Allow را بزنید یا در Settings > Safari > Microphone دسترسی را فعال نمایید.');
        });
        setSpeechNotice('🎙️ در حال ضبط صدای شما در آیفون... لطفاً مشخصات ملک را بیان فرمایید و پس از پایان، دکمه توقف را لمس نمایید.');
      } catch (e: any) {
        console.warn('SoundRecorder error on iOS:', e);
      }
    } else {
      // در اندروید و دسکتاپ: شروع همگام تشخیص گفتار زنده
      startRecognitionInstance();
    }
  };

  // ۲. توقف ضبط و استخراج هوشمند مشخصات ملک (تایپ خودکار و پشتیبانی کامل از آیفون)
  const handleStopAndProcess = async () => {
    shouldKeepListeningRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    // توقف SpeechRecognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    setSpeechActive(false);

    // توقف SoundRecorder و دریافت داده‌های صوتی ضبط‌شده
    let recordedAudio: RecordedAudioResult | null = null;
    if (soundRecorderRef.current && soundRecorderRef.current.isRecording) {
      try {
        recordedAudio = await soundRecorderRef.current.stop();
        setAudioResult(recordedAudio);
      } catch (recErr) {
        console.warn('SoundRecorder stop error:', recErr);
      }
    }
    soundRecorderRef.current = null;

    // نهایی‌سازی متن تکه‌ای گفتار از وب‌اسپیچ
    if (interimTextRef.current) {
      const merged = smartMergeTexts(confirmedTextRef.current, interimTextRef.current);
      confirmedTextRef.current = deduplicateAdjacentWords(merged);
      interimTextRef.current = '';
    }
    let finalSpeechText = deduplicateAdjacentWords(confirmedTextRef.current || transcript);

    setIsRecording(false);
    setIsProcessing(true);
    setErrorMessage('');

    // در صورتی که متن از وب‌اسپیچ دریافت نشده باشد (دقیقاً در آیفون که مرورگر وب‌کیت فاقد وب‌اسپیچ فارسی است)
    if (!finalSpeechText && recordedAudio && recordedAudio.base64) {
      setSpeechNotice('در حال تبدیل هوشمند صوت به متن فارسی و استخراج مشخصات...');
      try {
        const transRes = await fetch('/api/transcribe-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: recordedAudio.base64,
            mimeType: recordedAudio.mimeType,
          }),
        });

        if (transRes.ok) {
          const transData = await transRes.json();
          if (transData.success && transData.transcript) {
            finalSpeechText = transData.transcript;
            setTranscript(finalSpeechText);
            setConfirmedText(finalSpeechText);
            confirmedTextRef.current = finalSpeechText;
            setSpeechNotice('');
          }
        }
      } catch (transErr) {
        console.warn('Transcribe fetch error:', transErr);
      }
    }

    setConfirmedText(finalSpeechText);
    setInterimText('');
    setTranscript(finalSpeechText);

    // ۱. پردازش محلی آنی مشخصات فایل ملک بر پایه الگوریتم‌های فارسی NLP
    if (finalSpeechText) {
      const localParsed = parseVoicePropertyDescription(finalSpeechText);
      setParsedProperty(localParsed);
    }

    try {
      // ۲. ارسال متن یا صوت به اندپوینت سرور
      if (finalSpeechText || (recordedAudio && recordedAudio.base64)) {
        const response = await fetch('/api/parse-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: finalSpeechText,
            audioBase64: recordedAudio?.base64,
            mimeType: recordedAudio?.mimeType,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.parsedProperty) {
            setParsedProperty(data.parsedProperty);
          }
          if (!finalSpeechText && data.transcript) {
            finalSpeechText = data.transcript;
            setTranscript(finalSpeechText);
            setConfirmedText(finalSpeechText);
            confirmedTextRef.current = finalSpeechText;
          }
        }
      } else {
        setErrorMessage('صدایی دریافت نشد یا صحبت خیلی کوتاه بود. لطفاً مجدداً دکمه شروع ضبط را بزنید و واضح‌تر صحبت فرمایید یا مشخصات را در کادر بنویسید.');
      }
    } catch (err: any) {
      console.warn('Local parser fallback active:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // استفاده از سناریوهای آماده تست
  const handleSelectPreset = (presetText: string) => {
    setTranscript(presetText);
    confirmedTextRef.current = presetText;
    setConfirmedText(presetText);
    setInterimText('');
    interimTextRef.current = '';
    setErrorMessage('');
    setSuccessSaved(false);
    handleReprocessText(presetText);
  };

  // پخش و مکث صدای ضبط شده
  const togglePlayAudio = () => {
    if (!audioElementRef.current && audioResult?.dataUrl) {
      const audio = new Audio(audioResult.dataUrl);
      audio.onended = () => setIsPlayingAudio(false);
      audioElementRef.current = audio;
    }

    if (audioElementRef.current) {
      if (isPlayingAudio) {
        audioElementRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioElementRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  // ثبت نهایی مستقیم ملک در سامانه CRM
  const handleDirectSave = () => {
    if (!parsedProperty) return;

    const assignedAgent = agents[0] || { id: 'agent-1', fullName: 'مشاور املاک' };
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const newProperty: Property = {
      id: `prop-${Date.now()}`,
      propertyCode: `P-${codeNum}`,
      title: parsedProperty.title || 'ملک ثبت‌شده با صوت',
      transactionType: parsedProperty.transactionType,
      propertyType: parsedProperty.propertyType,
      status: 'ACTIVE',
      priceTotal: parsedProperty.priceTotal,
      pricePerMeter: parsedProperty.pricePerMeter,
      deposit: parsedProperty.deposit,
      monthlyRent: parsedProperty.monthlyRent,
      isConvertible: parsedProperty.isConvertible,
      area: parsedProperty.area || 100,
      rooms: parsedProperty.rooms || 2,
      floor: parsedProperty.floor,
      totalFloors: parsedProperty.totalFloors,
      unitsPerFloor: parsedProperty.unitsPerFloor,
      builtYear: parsedProperty.builtYear,
      city: 'تهران',
      district: parsedProperty.district || 'تهران',
      address: parsedProperty.address || parsedProperty.district || '',
      hasParking: parsedProperty.hasParking,
      hasElevator: parsedProperty.hasElevator,
      hasStorage: parsedProperty.hasStorage,
      hasBalcony: parsedProperty.hasBalcony,
      documentType: parsedProperty.documentType || 'سند تک‌برگ',
      ownerName: parsedProperty.ownerName || 'مالک نامشخص',
      ownerPhone: parsedProperty.ownerPhone || '',
      agentId: assignedAgent.id,
      agentName: assignedAgent.fullName,
      description: transcript.trim() || parsedProperty.description,
      createdAtJalali: '1405/07/18',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addProperty(newProperty);
    setSuccessSaved(true);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${toPersianDigits(mins.toString().padStart(2, '0'))}:${toPersianDigits(s.toString().padStart(2, '0'))}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden flex flex-col max-h-[92vh]">
        {/* هدر مدال */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                ثبت هوشمند ملک با صوت
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-normal">
                  تایپ زنده SpeechRecognition
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                مشخصات ملک را به زبان ساده بیان کنید؛ سیستم به‌صورت همزمان تایپ و تفکیک می‌کند
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* بدنه اسکرول‌پذیر */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* پیام موفقیت */}
          {successSaved && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-700 dark:text-emerald-300 animate-fadeIn">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="font-bold">فایل ملک با موفقیت در سامانه ثبت شد!</p>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                  در حال بستن پنجره و به‌روزرسانی لیست املاک...
                </p>
              </div>
            </div>
          )}

          {/* هشدار محیط غیرامن HTTP در داکر یا سرور */}
          {!isSecureContextEnvironment() && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs leading-relaxed space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-100 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>نیاز به HTTPS جهت دسترسی به میکروفون در سرور و داکر</span>
              </div>
              <p>
                مرورگرها (گوگل کروم، سافاری، فایرفاکس) به دلایل امنیتی فقط از طریق <strong>HTTPS</strong> یا <strong>localhost</strong> اجازه فعال‌سازی میکروفون و تایپ صوتی را می‌دهند.
              </p>
              <div className="bg-amber-100/60 dark:bg-amber-900/40 p-2 rounded-lg font-mono text-[11px] text-amber-950 dark:text-amber-200 dir-ltr text-left">
                راهکار: راه‌اندازی Nginx Proxy با گواهی SSL (Let's Encrypt) یا افزودن IP سرور به insecure-origins کروم
              </div>
            </div>
          )}

          {/* پیام خطا */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <p className="flex-1">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage('')}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1"
              >
                بستن
              </button>
            </div>
          )}

          {/* پیام راهنما و وضعیت سرویس صوتی */}
          {speechNotice && (
            <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-start gap-2.5 text-sky-800 dark:text-sky-200 text-xs leading-relaxed animate-fadeIn">
              <Info className="w-4 h-4 shrink-0 text-sky-500 mt-0.5" />
              <p className="flex-1">{speechNotice}</p>
              <button
                type="button"
                onClick={() => setSpeechNotice('')}
                className="text-sky-500 hover:text-sky-700 text-xs font-bold px-2 py-0.5"
              >
                بستن
              </button>
            </div>
          )}

          {/* بخش اصلی ضبط صدا و ویژوالایزر */}
          <div className="relative rounded-2xl bg-gradient-to-b from-slate-50 to-indigo-50/40 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200 dark:border-slate-700/60 p-6 flex flex-col items-center justify-center text-center">
            {/* دکمه مرکزی میکروفون */}
            <div className="relative my-2">
              {isRecording && (
                <>
                  <div className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping" />
                  <div className="absolute -inset-6 rounded-full bg-rose-500/10 animate-pulse" />
                </>
              )}

              <button
                type="button"
                onClick={isRecording ? handleStopAndProcess : handleStartRecording}
                disabled={isProcessing}
                className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center text-white shadow-xl transition-all transform active:scale-95 ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-700 ring-4 ring-rose-400/40 shadow-rose-500/40'
                    : 'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 ring-4 ring-indigo-400/20 shadow-indigo-500/30'
                } ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isProcessing ? (
                  <Loader2 className="w-9 h-9 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-9 h-9" />
                ) : (
                  <Mic className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* وضعیت و تایمر ضبط */}
            <div className="mt-4 space-y-1">
              {isRecording ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-lg">
                    <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
                    <span>در حال شنیدن و تایپ زنده گفتار...</span>
                    <span className="font-mono text-base bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                      {formatTimer(recordingSeconds)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    برای اتمام و استخراج هوشمند اطلاعات، روی دکمه کلیک کنید
                  </p>
                </>
              ) : isProcessing ? (
                <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال تفکیک و استخراج مشخصات فایل ملک...</span>
                </div>
              ) : (
                <>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">
                    برای شروع، دکمه میکروفون را لمس کنید و صحبت کنید
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isIOSDevice()
                      ? 'پشتیبانی تضمینی از آیفون (iOS) • تبدیل صوت به متن و استخراج مشخصات ملک'
                      : 'تایپ همزمان در حین تکلم • سیستم هوشمند استخراج مشخصات ملک'}
                  </p>
                  {isIOSDevice() && (
                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={() => nativeAudioCaptureRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-600 shadow-sm"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                        ضبط با Voice Memos / ضبط‌صوت آیفون
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ورودی مخفی دریافت فایل صوتی در آیفون */}
            <input
              ref={nativeAudioCaptureRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleNativeAudioFileCapture}
            />

            {/* ویژوالایزر امواج صوتی در زمان ضبط */}
            {isRecording && (
              <div className="mt-4 flex items-center justify-center gap-1.5 h-10 w-full max-w-xs">
                {Array.from({ length: 16 }).map((_, i) => {
                  const factor = Math.sin((i / 16) * Math.PI);
                  const dynamicHeight = speechActive
                    ? Math.max(10, Math.round(34 * factor * (0.6 + 0.4 * Math.sin(recordingSeconds * 3 + i))))
                    : Math.max(6, Math.round(20 * factor * (0.4 + 0.3 * Math.sin(recordingSeconds * 2 + i))));
                  return (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        speechActive
                          ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-t from-rose-500 to-indigo-500'
                      }`}
                      style={{ height: `${dynamicHeight}px` }}
                    />
                  );
                })}
              </div>
            )}

            {/* دکمه‌های کنترل ضبط */}
            {isRecording && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleStopAndProcess}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
                >
                  <Check className="w-4 h-4" />
                  پایان ضبط و استخراج
                </button>
                <button
                  type="button"
                  onClick={handleCancelRecording}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  لغو
                </button>
              </div>
            )}

            {/* پخش صدای ضبط‌شده در صورت وجود */}
            {audioResult && !isRecording && (
              <div className="mt-4 flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <button
                  type="button"
                  onClick={togglePlayAudio}
                  className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition"
                  title="پخش صوت ضبط‌شده"
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span>صوت ضبط‌شده ({toPersianDigits(audioResult.durationSeconds)} ثانیه)</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 mr-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  ضبط دوباره
                </button>
              </div>
            )}
          </div>


          {/* کادر متن پیاده‌شده و ویرایشگر */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                متن گفتار پیاده‌شده (تایپ همزمان و پایدار):
              </label>
              <div className="flex items-center gap-2">
                {isRecording && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    تایپ صوتی زنده
                  </span>
                )}
                {transcript && (
                  <button
                    type="button"
                    onClick={() => handleReprocessText()}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" />
                    پردازش مجدد این متن
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <textarea
                ref={textareaRef}
                rows={3}
                value={transcript}
                onChange={(e) => {
                  const val = e.target.value;
                  setTranscript(val);
                  confirmedTextRef.current = val;
                  setConfirmedText(val);
                  setInterimText('');
                  handleReprocessText(val);
                }}
                placeholder={
                  isRecording
                    ? 'در حال شنیدن و تایپ زنده گفتار شما بدون تکرار کلمات...'
                    : 'متن سخنان شما پس از ضبط در اینجا قرار می‌گیرد، یا می‌توانید مشخصات ملک را مستقیماً در اینجا تایپ فرمایید...'
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
              />
              {isRecording && interimText && (
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 px-1">
                  <span className="text-indigo-500 font-bold">تکه در حال پردازش:</span>
                  <span className="italic text-slate-600 dark:text-slate-300">{interimText}</span>
                </div>
              )}
            </div>
          </div>

          {/* پیش‌فرض‌های تست سریع */}
          <div className="space-y-1.5">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              یا از نمونه‌های آماده تست کنید:
            </p>
            <div className="flex flex-wrap gap-2">
              {VOICE_PRESET_SCENARIOS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset.text)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* کارت نمایش فیلدهای استخراج‌شده */}
          {parsedProperty && (
            <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-slate-900 p-5 space-y-4 animate-fadeIn shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-indigo-900/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                    {parsedProperty.title || 'مشخصات استخراج‌شده فایل ملک'}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                    {TRANSACTION_TYPE_NAMES[parsedProperty.transactionType] || 'معامله'}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold">
                    {PROPERTY_TYPE_NAMES[parsedProperty.propertyType] || 'ملک'}
                  </span>
                </div>
              </div>

              {/* شبکه جزئیات */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {parsedProperty.area ? (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-slate-400 dark:text-slate-500 block">متراژ:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block">
                      {toPersianDigits(parsedProperty.area)} متر مربع
                    </span>
                  </div>
                ) : null}

                {parsedProperty.rooms ? (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-slate-400 dark:text-slate-500 block">تعداد خواب:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block">
                      {toPersianDigits(parsedProperty.rooms)} خواب
                    </span>
                  </div>
                ) : null}

                {parsedProperty.priceTotal ? (
                  <div className="col-span-2 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                    <span className="text-emerald-700 dark:text-emerald-400 block font-medium">قیمت کل:</span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm mt-0.5 block">
                      {formatToman(parsedProperty.priceTotal)} تومان
                    </span>
                  </div>
                ) : null}

                {parsedProperty.deposit ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                    <span className="text-emerald-700 dark:text-emerald-400 block font-medium">ودیعه (رهن):</span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm mt-0.5 block">
                      {formatToman(parsedProperty.deposit)} تومان
                    </span>
                  </div>
                ) : null}

                {parsedProperty.monthlyRent ? (
                  <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                    <span className="text-blue-700 dark:text-blue-400 block font-medium">اجاره ماهانه:</span>
                    <span className="font-bold text-blue-800 dark:text-blue-300 text-sm mt-0.5 block">
                      {formatToman(parsedProperty.monthlyRent)} تومان
                    </span>
                  </div>
                ) : null}

                {parsedProperty.district ? (
                  <div className="col-span-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-slate-400 dark:text-slate-500 block">موقعیت / محله:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block">
                      {parsedProperty.district} {parsedProperty.address ? `(${parsedProperty.address})` : ''}
                    </span>
                  </div>
                ) : null}

                {parsedProperty.ownerName || parsedProperty.ownerPhone ? (
                  <div className="col-span-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60">
                    <span className="text-slate-400 dark:text-slate-500 block">مشخصات مالک:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-0.5 block">
                      {parsedProperty.ownerName || 'مالک'} {parsedProperty.ownerPhone ? `- ${toPersianDigits(parsedProperty.ownerPhone)}` : ''}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* برچسب‌های امکانات */}
              <div className="flex flex-wrap gap-2 pt-1">
                {parsedProperty.hasParking && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                    ✓ پارکینگ
                  </span>
                )}
                {parsedProperty.hasElevator && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                    ✓ آسانسور
                  </span>
                )}
                {parsedProperty.hasStorage && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                    ✓ انباری
                  </span>
                )}
                {parsedProperty.hasBalcony && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                    ✓ بالکن / تراس
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* فوتر مدال و اکشن‌ها */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition"
          >
            بستن
          </button>

          <div className="flex items-center gap-2">
            {parsedProperty && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onApplyToForm(parsedProperty);
                    onClose();
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  انتقال به فرم دستی ملک
                </button>

                <button
                  type="button"
                  onClick={handleDirectSave}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition transform active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  ثبت مستقیم در سیستم
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
