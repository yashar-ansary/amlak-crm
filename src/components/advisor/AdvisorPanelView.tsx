// مسیر فایل: src/components/advisor/AdvisorPanelView.tsx
// پنل اختصاصی مشاور املاک با تقویم کامل شمسی و موتور هوشمند ثبت کارهای روزانه با صوت

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Mic,
  MicOff,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Plus,
  Trash2,
  Edit2,
  Phone,
  Home,
  FileText,
  Users,
  Search,
  Filter,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CalendarCheck,
  AlertCircle,
  Briefcase,
  Layers,
  Award,
  ShieldCheck,
  Check,
  RefreshCw,
  FolderOpen,
  Send,
  Smartphone,
  UploadCloud,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { DailyTask, TaskCategory, TaskPriority, TaskStatus, Agent } from '../../types/crm';
import {
  getCurrentJalaliDate,
  formatJalaliReadable,
  formatJalaliWithWeekday,
  toPersianDigits,
  toEnglishDigits,
  PERSIAN_MONTHS,
  PERSIAN_WEEKDAYS_SHORT,
  PERSIAN_WEEKDAYS_FULL,
  getJalaliMonthGrid,
  addDaysToJalaliDate,
  TASK_CATEGORY_INFO,
  TASK_PRIORITY_INFO,
} from '../../utils/jalali';
import { parseVoiceDailyTask, ParsedVoiceTask } from '../../utils/voiceTaskParser';
import { SoundRecorder } from '../../utils/audioRecorder';
import {
  LiveSpeechRecognizer,
  isWebSpeechSupported,
  requestMicrophonePermission,
  isIOSDevice,
} from '../../utils/webSpeechService';

export const AdvisorPanelView: React.FC = () => {
  const {
    currentUser,
    agents,
    loginAsAgent,
    dailyTasks,
    addDailyTask,
    updateDailyTask,
    deleteDailyTask,
    toggleTaskStatus,
    properties,
    clients,
    viewings,
  } = useCrm();

  // تاریخ جاری تقویم شمسی
  const todayStr = useMemo(() => getCurrentJalaliDate(), []);
  const todayParts = useMemo(() => {
    const p = todayStr.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
    return { jy: p[0] || 1405, jm: p[1] || 7, jd: p[2] || 18 };
  }, [todayStr]);

  // استیت‌های تقویم شمسی (سال و ماه انتخاب شده جهت نمایش در گرید)
  const [selectedJy, setSelectedJy] = useState<number>(todayParts.jy);
  const [selectedJm, setSelectedJm] = useState<number>(todayParts.jm);
  const [selectedDateJalali, setSelectedDateJalali] = useState<string>(todayStr);

  // تغییر تاریخ و همگام‌سازی سال و ماه تقویم با تاریخ انتخابی
  const selectDateAndSyncCalendar = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('/')) return;
    setSelectedDateJalali(dateStr);
    const parts = dateStr.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
    if (parts.length === 3 && parts[0] && parts[1]) {
      setSelectedJy(parts[0]);
      setSelectedJm(parts[1]);
    }
  };

  // فیلتر مشاور (اگر مدیر باشد می‌تواند بین مشاوران جابجا شود)
  const activeAgentId = currentUser?.agentId || currentUser?.id || 'agent-2';
  const currentAgent = useMemo(() => {
    return agents.find((a) => a.id === activeAgentId) || agents[0];
  }, [agents, activeAgentId]);

  // استیت‌های ضبط صوت و متن دستوری
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [confirmedVoiceTranscript, setConfirmedVoiceTranscript] = useState('');
  const [interimVoiceTranscript, setInterimVoiceTranscript] = useState('');
  const [typedVoiceInput, setTypedVoiceInput] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);

  // وب اسپیک، آنالیز زنده صوت و ضبط مدیا هماهنگ با موبایل و دسکتاپ
  const recognitionRef = useRef<any>(null);
  const recognitionRestartTimeoutRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const isRecordingRef = useRef<boolean>(false);
  const recordedMimeTypeRef = useRef<string>('audio/webm');
  const advisorSoundRecorderRef = useRef<SoundRecorder | null>(null);
  const speechRecognizerRef = useRef<LiveSpeechRecognizer | null>(null);
  const nativeAudioCaptureRef = useRef<HTMLInputElement | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const sessionFinalTextRef = useRef<string>('');
  const lastInterimRef = useRef<string>('');
  const typedInputRef = useRef<HTMLInputElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const advisorRestartAttemptsRef = useRef<number>(0);

  // پخش ویس تسک‌ها
  const [playingTaskId, setPlayingTaskId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // فیلترهای لیست کارها
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // استیت مدال افزودن/ویرایش دستی
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);

  // فرم کار دستی
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<TaskCategory>('CALL');
  const [formPriority, setFormPriority] = useState<TaskPriority>('MEDIUM');
  const [formDateJalali, setFormDateJalali] = useState(selectedDateJalali);
  const [formTime, setFormTime] = useState('16:00');
  const [formClientName, setFormClientName] = useState('');
  const [formPropertyCode, setFormPropertyCode] = useState('');

  // تولید روزهای ماه شمسی انتخاب شده
  const monthGrid = useMemo(() => {
    return getJalaliMonthGrid(selectedJy, selectedJm);
  }, [selectedJy, selectedJm]);

  // نقشه تعداد و اولویت کارهای هر روز ماه برای نشانگرهای تقویم
  const dayTaskMap = useMemo(() => {
    const map = new Map<string, { count: number; hasUrgent: boolean; completedCount: number }>();
    dailyTasks
      .filter((t) => !activeAgentId || t.agentId === activeAgentId)
      .forEach((t) => {
        const cur = map.get(t.dateJalali) || { count: 0, hasUrgent: false, completedCount: 0 };
        cur.count += 1;
        if (t.priority === 'URGENT') cur.hasUrgent = true;
        if (t.status === 'COMPLETED') cur.completedCount += 1;
        map.set(t.dateJalali, cur);
      });
    return map;
  }, [dailyTasks, activeAgentId]);

  // کارهای روز انتخاب شده
  const tasksForSelectedDate = useMemo(() => {
    return dailyTasks.filter((t) => {
      const matchAgent = !activeAgentId || t.agentId === activeAgentId;
      const matchDate = t.dateJalali === selectedDateJalali;
      return matchAgent && matchDate;
    });
  }, [dailyTasks, activeAgentId, selectedDateJalali]);

  // کارهای فیلتر شده روز
  const filteredTasks = useMemo(() => {
    return tasksForSelectedDate.filter((t) => {
      const matchCategory = filterCategory === 'ALL' || t.category === filterCategory;
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'PENDING' && t.status !== 'COMPLETED') ||
        (filterStatus === 'COMPLETED' && t.status === 'COMPLETED');
      const matchSearch =
        !searchQuery.trim() ||
        t.title.includes(searchQuery) ||
        (t.description && t.description.includes(searchQuery)) ||
        (t.clientName && t.clientName.includes(searchQuery)) ||
        (t.propertyCode && t.propertyCode.includes(searchQuery));
      return matchCategory && matchStatus && matchSearch;
    });
  }, [tasksForSelectedDate, filterCategory, filterStatus, searchQuery]);

  // آمار مشاور جاری
  const advisorStats = useMemo(() => {
    const myProperties = properties.filter((p) => p.agentId === activeAgentId);
    const myViewings = viewings.filter((v) => v.agentId === activeAgentId);
    const todayTasks = dailyTasks.filter(
      (t) => (!activeAgentId || t.agentId === activeAgentId) && t.dateJalali === todayStr
    );
    const completedToday = todayTasks.filter((t) => t.status === 'COMPLETED').length;
    const pendingToday = todayTasks.length - completedToday;
    const progressPercent =
      todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 100;

    return {
      propertiesCount: myProperties.length,
      viewingsCount: myViewings.length,
      totalTodayTasks: todayTasks.length,
      completedToday,
      pendingToday,
      progressPercent,
    };
  }, [properties, viewings, dailyTasks, activeAgentId, todayStr]);

  // جابجایی ماه تقویم
  const handlePrevMonth = () => {
    if (selectedJm === 1) {
      setSelectedJy((y) => y - 1);
      setSelectedJm(12);
    } else {
      setSelectedJm((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedJm === 12) {
      setSelectedJy((y) => y + 1);
      setSelectedJm(1);
    } else {
      setSelectedJm((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setSelectedJy(todayParts.jy);
    setSelectedJm(todayParts.jm);
    setSelectedDateJalali(todayStr);
  };

  // تشخیص دستگاه موبایل، سیستم‌عامل iOS و وضعیت امنیتی محیط اجرا (HTTPS / داکر)
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isMobileDevice =
    typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isSecureContextActive = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : true;
  const isMediaDevicesAvailable = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
  const isInsecureMobile = isMobileDevice && (!isSecureContextActive || !isMediaDevicesAvailable);

  // تحلیل زنده دامنه صدای ورودی برای نمایش گرافیکی امواج صوتی
  const startAudioAnalysis = (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      audioSourceRef.current = source;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!analyserRef.current || !isRecordingRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const currentVol = Math.min(100, Math.round((average / 65) * 100));
        setVolumeLevel(currentVol);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.warn('Audio visualization notice:', err);
    }
  };

  const stopAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect();
      } catch {}
      audioSourceRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setVolumeLevel(0);
  };

  // شروع ضبط واقعی صدای مشاور با ریکوردر استاندارد و تایپ همزمان گفتار در حین صحبت
  const startRecording = async () => {
    setVoiceNotice(null);
    setVoiceTranscript('');
    setConfirmedVoiceTranscript('');
    setInterimVoiceTranscript('');

    // درخواست صریح دسترسی به میکروفون (ضروری برای سافاری آیفون جهت باز شدن پنجره دسترسی میکروفون)
    const hasMicPermission = await requestMicrophonePermission();
    if (!hasMicPermission) {
      setVoiceNotice(
        isIOSDevice()
          ? 'دسترسی به میکروفون در آیفون تایید نشد. لطفاً در پنجره باز شده دکمه Allow را بزنید یا در تنظیمات آیفون (Settings > Safari > Microphone) دسترسی را فعال فرمایید.'
          : 'دسترسی به میکروفون مجاز نشد. لطفاً در مرورگر اجازه دسترسی به میکروفون را فعال فرمایید.'
      );
      return;
    }

    setIsRecording(true);
    isRecordingRef.current = true;
    setRecordingSeconds(0);
    setVolumeLevel(40);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1);
    }, 1000);

    // ۱. در دستگاه‌های اندروید و دسکتاپ، تایپ زنده با LiveSpeechRecognizer
    if (isWebSpeechSupported() && !isIOSDevice()) {
      try {
        const recognizer = new LiveSpeechRecognizer('fa-IR');
        speechRecognizerRef.current = recognizer;
        recognizer.start({
          onLiveUpdate: ({ fullText, confirmedText, interimText }) => {
            setVoiceTranscript(fullText);
            setConfirmedVoiceTranscript(confirmedText);
            setInterimVoiceTranscript(interimText);
          },
          onError: (errNotice) => {
            console.warn('Speech recognition notice:', errNotice);
          },
        });
      } catch (speechErr) {
        console.warn('Speech recognizer init notice:', speechErr);
      }
    } else {
      // در مرورگرهای فاقد Web Speech (مانند فایرفاکس)، ضبط فایل صوتی انجام می‌شود
      try {
        const recorder = new SoundRecorder();
        advisorSoundRecorderRef.current = recorder;
        await recorder.start((vol) => {
          setVolumeLevel(vol);
        });
      } catch (err: any) {
        console.error('Advisor mic start error:', err);
        setIsRecording(false);
        isRecordingRef.current = false;
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setVoiceNotice('دسترسی به میکروفون مجاز نشد. لطفاً در مرورگر اجازه دسترسی به میکروفون را فعال فرمایید.');
      }
    }
  };

  // پردازش مشترک صوت و متن و ثبت کار در تقویم
  const processVoiceTaskData = async (
    audioDataUrl: string | undefined,
    mimeType: string,
    spokenText: string
  ) => {
    const cleanSpoken = (spokenText || '').trim();

    if (!cleanSpoken && !audioDataUrl) {
      setIsProcessingVoice(false);
      setVoiceNotice('هیچ صدا یا متنی دریافت نشد. در صورت عدم ضبط در موبایل، می‌توانید از دکمه «ضبط با ریکوردر گوشی» استفاده کرده یا متن کار را تایپ فرمایید.');
      return;
    }

    setIsProcessingVoice(true);

    try {
      let parsed: ParsedVoiceTask | null = null;

      // ۱. ارسال درخواست به اندپوینت هوشمند پردازش صوت سرور با فرمت دقیق صوتی موبایل
      try {
        const response = await fetch('/api/parse-voice-task', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: audioDataUrl ? audioDataUrl.split(',')[1] : undefined,
            mimeType: mimeType || (isIOS ? 'audio/mp4' : 'audio/webm'),
            text: cleanSpoken || undefined,
            currentJalaliDate: todayStr,
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.parsedTask && resData.parsedTask.title && resData.parsedTask.dateJalali) {
            parsed = {
              title: resData.parsedTask.title,
              description: resData.parsedTask.description || (cleanSpoken && cleanSpoken !== resData.parsedTask.title ? cleanSpoken : undefined),
              category: resData.parsedTask.category || 'OTHER',
              priority: resData.parsedTask.priority || 'MEDIUM',
              dateJalali: resData.parsedTask.dateJalali,
              time: resData.parsedTask.time || '16:00',
              clientName: resData.parsedTask.clientName,
              propertyCode: resData.parsedTask.propertyCode,
              confidenceScore: 95,
            };
            if (!cleanSpoken && resData.transcript) {
              spokenText = resData.transcript;
            }
          }
        }
      } catch (apiErr) {
        console.warn('API voice task parse fallback:', apiErr);
      }

      // ۲. در صورت بروز هرگونه مشکل شبکه، استفاده آنی از پارسر محلی فوق‌دقیق
      if (!parsed) {
        parsed = parseVoiceDailyTask(cleanSpoken, todayStr);
      }

      const targetDate = parsed.dateJalali || todayStr;

      // ثبت کار روزانه در تقویم
      const newTask = addDailyTask({
        agentId: currentAgent.id,
        agentName: currentAgent.fullName,
        title: parsed.title,
        description: parsed.description,
        category: parsed.category,
        priority: parsed.priority,
        status: 'PENDING',
        dateJalali: targetDate,
        time: parsed.time || '16:00',
        clientName: parsed.clientName,
        propertyCode: parsed.propertyCode,
        hasVoiceRecording: Boolean(audioDataUrl),
        voiceAudioUrl: audioDataUrl,
        voiceTranscript: spokenText || cleanSpoken,
      });

      // جابجایی خودکار تقویم و باز شدن روی همان روز و ماهی که کار برای آن ثبت شده
      selectDateAndSyncCalendar(targetDate);

      setVoiceNotice(`کار با موفقیت در تاریخ «${formatJalaliWithWeekday(targetDate)}» ثبت شد: «${newTask.title}»`);
      setVoiceTranscript('');
      setTypedVoiceInput('');
    } catch (err: any) {
      setVoiceNotice('خطا در پردازش صوت: ' + (err.message || 'نامشخص'));
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const stopRecordingAndProcess = async (manualText?: string) => {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setVolumeLevel(0);

    let audioDataUrl: string | undefined = undefined;
    let mimeType = 'audio/webm';

    if (advisorSoundRecorderRef.current && advisorSoundRecorderRef.current.isRecording) {
      try {
        const result = await advisorSoundRecorderRef.current.stop();
        audioDataUrl = result.dataUrl;
        mimeType = result.mimeType;
      } catch (err: any) {
        console.warn('SoundRecorder stop notice:', err);
      }
    }
    advisorSoundRecorderRef.current = null;

    const spokenText = (manualText || typedVoiceInput || voiceTranscript || '').trim();

    if (!spokenText && !audioDataUrl) {
      setVoiceNotice('هیچ صدا یا متنی دریافت نشد. لطفاً صحبت فرمایید یا متن کار را تایپ نمایید.');
      return;
    }

    await processVoiceTaskData(audioDataUrl, mimeType, spokenText);
  };

  // دریافت و پردازش صوت با ریکوردر بومی گوشی (Voice Memos در آیفون / ضبط‌صوت اندروید)
  const handleNativeAudioFileCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingVoice(true);
    setVoiceNotice('صوت از ریکوردر گوشی دریافت شد. در حال پردازش و استخراج هوشمند کار با هوش مصنوعی...');

    try {
      const mime = file.type || (isIOS ? 'audio/mp4' : 'audio/webm');
      const audioDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      await processVoiceTaskData(audioDataUrl, mime, '');
    } catch (err: any) {
      setVoiceNotice('خطا در بارگذاری فایل صوتی موبایل: ' + err.message);
      setIsProcessingVoice(false);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // تست سریع با عبارات نمونه
  const handleQuickPrompt = (promptText: string) => {
    stopRecordingAndProcess(promptText);
  };

  // پخش ویس ضبط شده یک کار
  const handleTogglePlayVoice = (task: DailyTask) => {
    if (!task.voiceAudioUrl) return;

    if (playingTaskId === task.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingTaskId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(task.voiceAudioUrl);
      audioPlayerRef.current = audio;
      setPlayingTaskId(task.id);

      audio.onended = () => {
        setPlayingTaskId(null);
      };
      audio.onerror = () => {
        setPlayingTaskId(null);
      };

      audio.play().catch(() => setPlayingTaskId(null));
    }
  };

  // باز کردن مدال برای ایجاد یا ویرایش دستی
  const handleOpenTaskModal = (task?: DailyTask) => {
    if (task) {
      setEditingTask(task);
      setFormTitle(task.title);
      setFormDescription(task.description || '');
      setFormCategory(task.category);
      setFormPriority(task.priority);
      setFormDateJalali(task.dateJalali);
      setFormTime(task.time || '16:00');
      setFormClientName(task.clientName || '');
      setFormPropertyCode(task.propertyCode || '');
    } else {
      setEditingTask(null);
      setFormTitle('');
      setFormDescription('');
      setFormCategory('CALL');
      setFormPriority('MEDIUM');
      setFormDateJalali(selectedDateJalali);
      setFormTime('16:00');
      setFormClientName('');
      setFormPropertyCode('');
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTaskForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingTask) {
      updateDailyTask(editingTask.id, {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        category: formCategory,
        priority: formPriority,
        dateJalali: formDateJalali,
        time: formTime,
        clientName: formClientName.trim() || undefined,
        propertyCode: formPropertyCode.trim() || undefined,
      });
    } else {
      addDailyTask({
        agentId: currentAgent.id,
        agentName: currentAgent.fullName,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        category: formCategory,
        priority: formPriority,
        status: 'PENDING',
        dateJalali: formDateJalali,
        time: formTime,
        clientName: formClientName.trim() || undefined,
        propertyCode: formPropertyCode.trim() || undefined,
      });
    }

    setIsTaskModalOpen(false);
  };

  return (
    <div className="space-y-5 select-none animate-in fade-in duration-200">
      {/* سربرگ مشخصات مشاور و خلاصه عملکرد روزانه */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* پروفایل مشاور */}
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-lg shadow-sm">
              {currentAgent.fullName.slice(0, 2)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  پنل کاری {currentAgent.fullName}
                </h1>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-300 border border-white/10">
                  {currentAgent.role === 'MANAGER' ? 'مدیر مسئول آژانس' : 'مشاور املاک'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 num-fa">
                <span>تلفن: {currentAgent.phone}</span>
                <span className="text-slate-600">·</span>
                <span>پورسانت: {toPersianDigits(currentAgent.commissionRate)}٪</span>
                <span className="text-slate-600">·</span>
                <span>امروز: {formatJalaliReadable(todayStr)}</span>
              </div>
            </div>
          </div>

          {/* ویجت‌های آماری سریع */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-right">
              <div className="text-[11px] text-slate-400">پیشرفت کارهای امروز</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-emerald-400 num-fa">
                  {toPersianDigits(advisorStats.completedToday)}
                </span>
                <span className="text-xs text-slate-400">از</span>
                <span className="text-xs font-semibold text-white num-fa">
                  {toPersianDigits(advisorStats.totalTodayTasks)}
                </span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${advisorStats.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-right">
              <div className="text-[11px] text-slate-400">کارهای در انتظار امروز</div>
              <div className="text-base font-bold text-amber-300 num-fa mt-0.5">
                {toPersianDigits(advisorStats.pendingToday)}
              </div>
              <div className="text-[10px] text-slate-400">نیاز به اقدام</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-right">
              <div className="text-[11px] text-slate-400">بازدیدهای هماهنگ‌شده</div>
              <div className="text-base font-bold text-indigo-300 num-fa mt-0.5">
                {toPersianDigits(advisorStats.viewingsCount)}
              </div>
              <div className="text-[10px] text-slate-400">تحت مسئولیت من</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-right">
              <div className="text-[11px] text-slate-400">فایل‌های فعال من</div>
              <div className="text-base font-bold text-sky-300 num-fa mt-0.5">
                {toPersianDigits(advisorStats.propertiesCount)}
              </div>
              <div className="text-[10px] text-slate-400">ملک سپرده‌شده</div>
            </div>
          </div>
        </div>

        {/* سوییچر بین مشاوران در صورت داشتن دسترسی مدیریت یا تست */}
        {agents.length > 1 && (
          <div className="relative mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Briefcase className="h-3.5 w-3.5 text-violet-400" />
              <span>مشاهده کارتابل مشاور:</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => loginAsAgent(agent.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    currentAgent.id === agent.id
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'bg-white/[0.05] text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {agent.fullName}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* دو ستون اصلی: ستون تقویم شمسی + ستون ثبت صوتی و مدیریت کارها */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ستون اول: تقویم هوشمند شمسی (۵ ستون در دسکتاپ) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-white/15 bg-[#0e1326]/90 p-4 sm:p-5 backdrop-blur-2xl shadow-xl shadow-black/25">
            {/* نوار بالای تقویم: جابجایی ماه و دکمه امروز */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-violet-400" />
                <div className="font-black text-white text-base">
                  {PERSIAN_MONTHS[selectedJm - 1]} {toPersianDigits(selectedJy)}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1 text-xs font-semibold rounded-xl border border-violet-500/30 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 transition-colors"
                >
                  امروز
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="ماه قبل"
                  className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  title="ماه بعد"
                  className="flex h-7 w-7 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* سرفصل روزهای هفته (شنبه تا جمعه) */}
            <div className="grid grid-cols-7 gap-1 pt-3 pb-2 text-center text-xs font-bold text-slate-400">
              {PERSIAN_WEEKDAYS_FULL.map((name, idx) => (
                <div key={name} className={idx === 6 ? 'text-rose-400' : 'text-slate-400'}>
                  <span className="hidden sm:inline">{name}</span>
                  <span className="sm:hidden">{PERSIAN_WEEKDAYS_SHORT[idx]}</span>
                </div>
              ))}
            </div>

            {/* شبکه روزهای ماه شمسی */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {/* خانه‌های خالی پیش از شروع ماه */}
              {Array.from({ length: monthGrid.startEmptyDays }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-11 sm:h-14 rounded-2xl bg-white/[0.01]" />
              ))}

              {/* روزهای ماه */}
              {monthGrid.days.map((day) => {
                const isSelected = day.dateJalali === selectedDateJalali;
                const isToday = day.isToday;
                const taskSummary = dayTaskMap.get(day.dateJalali);

                return (
                  <button
                    key={day.dateJalali}
                    type="button"
                    onClick={() => selectDateAndSyncCalendar(day.dateJalali)}
                    className={`relative flex flex-col items-center justify-between p-1.5 h-12 sm:h-14 rounded-2xl transition-all group ${
                      isSelected
                        ? 'bg-gradient-to-b from-violet-600 to-indigo-600 text-white font-black shadow-lg shadow-violet-600/30 ring-2 ring-violet-400 scale-[1.03] z-10'
                        : isToday
                        ? 'border border-violet-500/50 bg-violet-500/10 text-white font-bold'
                        : day.isWeekend
                        ? 'border border-rose-500/20 bg-rose-500/[0.04] text-rose-300 hover:bg-rose-500/10'
                        : 'border border-white/5 bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:border-white/15'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-bold num-fa">
                      {day.dayNumberPersian}
                    </span>

                    {/* بج یا نشانگر کارهای روز */}
                    {taskSummary && taskSummary.count > 0 ? (
                      <div className="flex items-center gap-0.5">
                        <span
                          className={`flex items-center justify-center text-[10px] num-fa font-bold px-1 rounded-full ${
                            isSelected
                              ? 'bg-white text-violet-900'
                              : taskSummary.hasUrgent
                              ? 'bg-rose-500 text-white animate-pulse'
                              : 'bg-violet-500/40 text-violet-200'
                          }`}
                        >
                          {toPersianDigits(taskSummary.count)}
                        </span>
                      </div>
                    ) : (
                      <span className="h-1.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* راهنمای وضعیت تقویم */}
            <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                <span>روز انتخاب شده</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                <span>کار فوری / اضطراری</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>روز جاری (امروز)</span>
              </div>
            </div>
          </div>

          {/* کارت خلاصه ماه */}
          <div className="rounded-3xl border border-white/10 bg-[#0e1326]/60 p-4 text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between text-white font-bold">
              <span>گزارش ماه {PERSIAN_MONTHS[selectedJm - 1]}</span>
              <span className="num-fa text-violet-300">
                {toPersianDigits(dailyTasks.length)} کل کارهای ثبت شده
              </span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              با کلیک روی هر روز تقویم، کارهای روزانه آن تاریخ نمایش داده می‌شوند. برای ثبت سریع کار،
              می‌توانید صدای خود را ضبط کرده یا متن کار را با ساعت دلخواه بیان کنید.
            </p>
          </div>
        </div>

        {/* ستون دوم: ثبت صوتی و کارتابل کارهای روزانه (۷ ستون در دسکتاپ) */}
        <div className="lg:col-span-7 space-y-4">
          {/* کارت ثبت سریع صوتی کارهای روزانه */}
          <div className="relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-[#151c3d]/90 via-[#0e1329]/95 to-[#0b0e1f] p-5 backdrop-blur-2xl shadow-xl shadow-violet-950/20">
            <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-violet-600/30 blur-2xl" />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md">
                    <Mic className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm sm:text-base font-black text-white">
                    ثبت هوشمند کار با صوت (دستیار مشاور)
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  برای تاریخ: <span className="text-violet-300 font-bold">{formatJalaliReadable(selectedDateJalali)}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenTaskModal()}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-white/15 bg-white/[0.05] text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Plus className="h-3.5 w-3.5 text-violet-400" />
                <span>ثبت دستی فرم</span>
              </button>
            </div>

            {/* دکمه ضبط صدا و رابط کاربری گفتار */}
            <div className="relative mt-4 flex flex-col items-center justify-center py-4 px-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
              {isRecording ? (
                <div className="flex flex-col items-center gap-3 w-full animate-in fade-in py-2">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute h-24 w-24 rounded-full bg-rose-500/25 animate-ping" />
                    <span className="absolute h-20 w-20 rounded-full bg-rose-500/40 animate-pulse" />
                    <button
                      type="button"
                      onClick={() => stopRecordingAndProcess()}
                      className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-xl shadow-rose-600/40 hover:bg-rose-700 transition-all cursor-pointer ring-4 ring-rose-500/30 active:scale-95"
                      title="اتمام ضبط و ثبت کار روزانه"
                    >
                      <Square className="h-7 w-7" />
                    </button>
                  </div>

                  {/* ویژوالایزر امواج صوتی بلادرنگ متناسب با تن صدای کاربر */}
                  <div className="flex items-center justify-center gap-1.5 h-8 my-1">
                    {[0.3, 0.6, 0.9, 0.5, 0.8, 1.2, 0.7, 1.1, 0.9, 1.3, 0.6, 1.0, 0.4, 0.8].map((factor, idx) => {
                      const effectiveVol = volumeLevel > 2 ? volumeLevel : 25;
                      const barHeight = Math.max(6, Math.min(32, Math.round(effectiveVol * factor * 0.4 + 4)));
                      return (
                        <span
                          key={idx}
                          style={{ height: `${barHeight}px` }}
                          className="w-1.5 rounded-full bg-gradient-to-t from-violet-500 to-rose-400 transition-all duration-75"
                        />
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 px-3 py-1 text-rose-300 font-bold text-xs num-fa">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>زمان ضبط: {toPersianDigits(recordingSeconds)} ثانیه</span>
                    </span>

                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border ${
                      volumeLevel > 2
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                    }`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>{volumeLevel > 2 ? `سیگنال صدا: ${toPersianDigits(volumeLevel)}٪ (دریافت زنده)` : 'میکروفون فعال (در حال شنیدن)'}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-0.5">
                    در حال گوش دادن... مشخصات کار را بگویید و برای ثبت نهایی، دکمه قرمز را لمس کنید.
                  </p>
                </div>
              ) : isProcessingVoice ? (
                <div className="flex flex-col items-center gap-2 py-3 text-violet-300 font-bold text-sm">
                  <RefreshCw className="h-7 w-7 animate-spin text-violet-400" />
                  <span>در حال استخراج عنوان، زمان، اولویت و مشخصات کار...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={startRecording}
                      className="group relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title="شروع ضبط صوت در مرورگر"
                    >
                      <Mic className="h-8 w-8 text-white group-hover:animate-pulse" />
                    </button>

                  </div>

                  <div>
                    <span className="text-sm font-bold text-white block">
                      برای ثبت صوتی کار روزانه، دکمه میکروفون را لمس کنید
                    </span>
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      هوش مصنوعی جزئیات کار، تاریخ شمسی، ساعت و اولویت را استخراج کرده و در تقویم ثبت می‌کند.
                    </span>
                  </div>
                </div>
              )}

              {/* اینپوت مخفی برای بارگذاری فایل صوتی در صورت نیاز */}
              <input
                ref={nativeAudioCaptureRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleNativeAudioFileCapture}
              />

              {/* نمایش وضعیت و متن گفتار */}
              {(isRecording || voiceTranscript) && (
                <div className="w-full mt-3 p-4 rounded-2xl bg-gradient-to-br from-violet-600/15 via-indigo-600/10 to-[#0e1329] border border-violet-500/40 text-right text-xs text-violet-200 animate-in fade-in shadow-lg">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-violet-500/20">
                    <span className="font-bold flex items-center gap-2 text-violet-300 text-xs sm:text-sm">
                      <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
                      <span>{isRecording ? 'در حال ضبط صدا...' : 'متن کار ثبت‌شده:'}</span>
                    </span>
                    {isRecording && (
                      <span className="text-[11px] text-rose-300 font-bold flex items-center gap-1.5 bg-rose-500/20 border border-rose-500/35 px-2.5 py-0.5 rounded-full">
                        <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
                        <span>ضبط زنده میکروفون ({toPersianDigits(recordingSeconds)} ثانیه)</span>
                      </span>
                    )}
                  </div>
                  <div className="p-3 rounded-xl bg-black/35 border border-white/10">
                    <p className="text-white font-bold text-sm sm:text-base min-h-[2.2rem] leading-relaxed select-text">
                      {voiceTranscript ? (
                        <span>{voiceTranscript}</span>
                      ) : (
                        <span className="text-slate-400 font-normal italic text-xs flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                          <span>در حال ضبط صدا... مشخصات کار خود را بفرمایید (مثال: «فردا ساعت ده صبح بازدید ملک نیاوران با آقای رضایی») سپس دکمه توقف را بزنید.</span>
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* ورودی متنی برای تایپ مستقیم دستورات صوتی / متنی */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (typedVoiceInput.trim()) {
                    stopRecordingAndProcess(typedVoiceInput.trim());
                  }
                }}
                className="w-full mt-3 flex items-center gap-2"
              >
                <input
                  ref={typedInputRef}
                  type="text"
                  value={typedVoiceInput}
                  onChange={(e) => setTypedVoiceInput(e.target.value)}
                  placeholder="یا متن کار را با کیبورد گوشی تایپ یا دیکته کنید (مثال: در تاریخ ۲۵ مهر ساعت ۵ عصر جلسه با آقای احمدی)"
                  className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all text-right"
                />
                <button
                  type="submit"
                  disabled={!typedVoiceInput.trim() || isProcessingVoice}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-violet-700/20"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>ثبت هوشمند</span>
                </button>
              </form>

              {/* پیام اطلاع‌رسانی وضعیت */}
              {voiceNotice && (
                <div className="w-full mt-3 p-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-right text-xs text-slate-200 flex items-center justify-between">
                  <span>{voiceNotice}</span>
                  <button
                    type="button"
                    onClick={() => setVoiceNotice(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* عبارات صوتی نمونه برای تست سریع */}
            <div className="relative mt-3.5">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                عبارات نمونه با تاریخ‌های مختلف جهت تست فوری (کلیک برای ثبت خودکار):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'در تاریخ ۲۵ مهر کاره بازدید ملک سعادت‌آباد با آقای محمدی ثبت بشه',
                  'برای بیست و پنجم مهر جلسه مهم بررسی مبایعه‌نامه ساعت ۱۰ صبح',
                  'در تاریخ ۲۵ کاره پیگیری قرارداد ثبت بشه',
                  'روز سه‌شنبه جلسه با مهندس حسینی در سعادت‌آباد ساعت ۴ عصر',
                  '۱۵ آبان کارشناسی و عکسبرداری از واحد جدید ساعت ۶ عصر',
                  'فردا ساعت ۱۱ صبح پیگیری فوری استعلام دارایی و شهرداری',
                  'شنبه هفته بعد ساعت ۵ عصر جلسه با خریدار',
                  'یک هفته دیگر سررسید چک معامله',
                ].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => handleQuickPrompt(sample)}
                    className="text-[11px] px-2.5 py-1 rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-violet-600/20 hover:border-violet-500/30 transition-all text-right cursor-pointer"
                  >
                    «{sample}»
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* کارتابل لیست کارهای روزانه تاریخ انتخاب شده */}
          <div className="rounded-3xl border border-white/15 bg-[#0e1326]/90 p-5 backdrop-blur-2xl shadow-xl shadow-black/25 space-y-4">
            {/* سربرگ لیست کارها */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-violet-400" />
                <h3 className="text-base font-bold text-white">
                  برنامه کاری {formatJalaliWithWeekday(selectedDateJalali)}
                </h3>
                <span className="text-xs num-fa font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {toPersianDigits(tasksForSelectedDate.length)} کار
                </span>
              </div>

              {/* فیلتر وضعیت کارها */}
              <div className="flex items-center gap-1 rounded-xl bg-white/[0.05] p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                    filterStatus === 'ALL'
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  همه
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('PENDING')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                    filterStatus === 'PENDING'
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  در انتظار
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('COMPLETED')}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all ${
                    filterStatus === 'COMPLETED'
                      ? 'bg-violet-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  انجام شده
                </button>
              </div>
            </div>

            {/* فیلتر دسته‌بندی و جستجو */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در عنوان، شرح، مشتری یا کد ملک..."
                  className="w-full h-8.5 rounded-xl border border-white/10 bg-white/[0.04] pr-8 pl-3 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-8.5 rounded-xl border border-white/10 bg-[#0e1326] px-3 text-xs text-slate-300 focus:border-violet-500 focus:outline-none"
              >
                <option value="ALL">همه دسته‌بندی‌ها</option>
                <option value="CALL">تماس تلفنی</option>
                <option value="VIEWING">بازدید ملک</option>
                <option value="MEETING">جلسه و نشست</option>
                <option value="CONTRACT">عقد قرارداد</option>
                <option value="INSPECTION">کارشناسی و عکس</option>
                <option value="FOLLOW_UP">پیگیری پرونده</option>
                <option value="OTHER">سایر امور</option>
              </select>
            </div>

            {/* لیست کارت‌های کار روزانه */}
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
                <FolderOpen className="h-10 w-10 text-slate-600 mb-2" />
                <div className="text-sm font-bold text-slate-300">
                  کاری برای این تاریخ یافت نشد
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  می‌توانید با زدن دکمه میکروفون بالا یا دکمه زیر، کار جدیدی برای تاریخ {formatJalaliReadable(selectedDateJalali)} ثبت کنید.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenTaskModal()}
                  className="mt-4 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold shadow-md hover:bg-violet-700 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>ثبت کار جدید</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTasks.map((task) => {
                  const catInfo = TASK_CATEGORY_INFO[task.category] || TASK_CATEGORY_INFO.OTHER;
                  const prioInfo = TASK_PRIORITY_INFO[task.priority] || TASK_PRIORITY_INFO.MEDIUM;
                  const isCompleted = task.status === 'COMPLETED';

                  return (
                    <div
                      key={task.id}
                      className={`group relative rounded-2xl border p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCompleted
                          ? 'border-white/5 bg-white/[0.02] opacity-75'
                          : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06] shadow-sm'
                      }`}
                    >
                      {/* بخش تیک وضعیت و عنوان */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleTaskStatus(task.id)}
                          title={isCompleted ? 'علامت‌گذاری به عنوان در انتظار' : 'علامت‌گذاری به عنوان انجام شده'}
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all ${
                            isCompleted
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-white/20 bg-white/[0.05] text-transparent hover:border-violet-400'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-xs font-bold transition-all ${
                                isCompleted
                                  ? 'line-through text-slate-500'
                                  : 'text-white group-hover:text-violet-200'
                              }`}
                            >
                              {task.title}
                            </span>

                            {/* بج دسته‌بندی */}
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catInfo.bg} ${catInfo.text} ${catInfo.border}`}
                            >
                              {catInfo.label}
                            </span>

                            {/* بج اولویت */}
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${prioInfo.bg} ${prioInfo.text} ${prioInfo.border} ${prioInfo.glow}`}
                            >
                              {prioInfo.label}
                            </span>
                          </div>

                          {task.description && (
                            <p
                              className={`text-[11px] mt-1 leading-relaxed ${
                                isCompleted ? 'text-slate-600 line-through' : 'text-slate-400'
                              }`}
                            >
                              {task.description}
                            </p>
                          )}

                          {/* اطلاعات زمانی، مخاطب و کد ملک */}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-400 num-fa">
                            {task.time && (
                              <span className="flex items-center gap-1 text-slate-300">
                                <Clock className="h-3 w-3 text-violet-400" />
                                <span>ساعت {toPersianDigits(task.time)}</span>
                              </span>
                            )}
                            {task.clientName && (
                              <span className="flex items-center gap-1 text-slate-300">
                                <User className="h-3 w-3 text-sky-400" />
                                <span>{task.clientName}</span>
                              </span>
                            )}
                            {task.propertyCode && (
                              <span className="flex items-center gap-1 text-slate-300">
                                <Home className="h-3 w-3 text-emerald-400" />
                                <span>کد {task.propertyCode}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* دکمه‌های عملیات (پخش صوت، ویرایش، حذف) */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {task.voiceAudioUrl && (
                          <button
                            type="button"
                            onClick={() => handleTogglePlayVoice(task)}
                            title={playingTaskId === task.id ? 'توقف پخش ویس' : 'پخش ویس ضبط شده'}
                            className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
                              playingTaskId === task.id
                                ? 'border-rose-500 bg-rose-500/20 text-rose-300 animate-pulse'
                                : 'border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20'
                            }`}
                          >
                            {playingTaskId === task.id ? (
                              <Square className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenTaskModal(task)}
                          title="ویرایش کار"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteDailyTask(task.id)}
                          title="حذف کار"
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* مدال افزودن یا ویرایش دستی کار روزانه */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-[#0e1224] p-5 sm:p-6 shadow-2xl text-slate-100 overflow-hidden">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-violet-400" />
                <h3 className="text-base font-bold text-white">
                  {editingTask ? 'ویرایش کار روزانه' : 'ثبت کار روزانه جدید'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveTaskForm} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  عنوان کار روزانه:
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: تماس با آقای محمدی جهت هماهنگی بازدید واحد مروارید"
                  className="w-full h-10 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    دسته‌بندی کار:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as TaskCategory)}
                    className="w-full h-9.5 rounded-xl border border-white/10 bg-[#0e1224] px-3 text-xs text-white focus:border-violet-500 focus:outline-none"
                  >
                    <option value="CALL">تماس تلفنی</option>
                    <option value="VIEWING">بازدید ملک</option>
                    <option value="MEETING">جلسه و نشست</option>
                    <option value="CONTRACT">عقد قرارداد و مبایعه‌نامه</option>
                    <option value="INSPECTION">کارشناسی و تصویربرداری</option>
                    <option value="FOLLOW_UP">پیگیری و استعلام پرونده</option>
                    <option value="OTHER">سایر امور اداری / شخصی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    اولویت کار:
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
                    className="w-full h-9.5 rounded-xl border border-white/10 bg-[#0e1224] px-3 text-xs text-white focus:border-violet-500 focus:outline-none"
                  >
                    <option value="LOW">عادی</option>
                    <option value="MEDIUM">متوسط</option>
                    <option value="HIGH">مهم</option>
                    <option value="URGENT">فوری و اضطراری</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    تاریخ شمسی (مثال ۱۴۰۵/۰۷/۱۸):
                  </label>
                  <input
                    type="text"
                    required
                    value={formDateJalali}
                    onChange={(e) => setFormDateJalali(e.target.value)}
                    className="w-full h-9.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">ساعت موعد:</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full h-9.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    نام متقاضی یا مالک (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    placeholder="مثال: آقای مهندس نیک‌نژاد"
                    className="w-full h-9.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    کد فایل ملک (اختیاری):
                  </label>
                  <input
                    type="text"
                    value={formPropertyCode}
                    onChange={(e) => setFormPropertyCode(e.target.value)}
                    placeholder="مثال: P-101"
                    className="w-full h-9.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-xs text-white focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  توضیحات و نکات تکمیلی:
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="جزییات، شماره تماس یا نکاتی که باید به خاطر داشته باشید..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] p-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-xs text-white shadow-lg hover:brightness-110 transition-all"
                >
                  {editingTask ? 'ذخیره تغییرات' : 'ثبت کار در تقویم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
