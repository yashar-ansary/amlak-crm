// مسیر فایل: src/components/properties/PropertyFormModal.tsx
// فرم جامع ثبت و ویرایش فایل ملک با اعتبارسنجی فیلدهای تخصصی املاک ایران

import React, { useState, useEffect, useRef } from 'react';
import { X, Building2, Check, AlertCircle, Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
import { Property, PropertyType, TransactionType, PropertyStatus } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';
import {
  PROPERTY_TYPE_NAMES,
  TRANSACTION_TYPE_NAMES,
  toPersianDigits,
  toEnglishDigits,
  formatPriceCompact,
  cleanNumericValue,
  formatWithCommas,
  numberToPersianWords,
} from '../../utils/jalali';
import { ParsedVoiceProperty, parseVoicePropertyDescription } from '../../utils/voiceParser';
import {
  LiveSpeechRecognizer,
  isWebSpeechSupported,
  isSecureContextEnvironment,
  isIOSDevice,
  smartMergeTexts,
} from '../../utils/webSpeechService';
import { PriceInputField } from '../common/PriceInputField';

interface PropertyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editProperty?: Property | null;
  prefillVoiceData?: ParsedVoiceProperty | null;
  onOpenVoiceModal?: () => void;
}

export const PropertyFormModal: React.FC<PropertyFormModalProps> = ({
  isOpen,
  onClose,
  editProperty,
  prefillVoiceData,
  onOpenVoiceModal,
}) => {
  const { addProperty, updateProperty, agents, districts } = useCrm();

  const getDefaultFormData = () => ({
    propertyCode: `P-${Math.floor(100 + Math.random() * 900)}`,
    title: '',
    propertyType: 'APARTMENT' as PropertyType,
    transactionType: 'SALE' as TransactionType,
    status: 'ACTIVE' as PropertyStatus,
    priceTotal: '',
    pricePerMeter: '',
    deposit: '',
    monthlyRent: '',
    isConvertible: true,
    area: '',
    rooms: '2',
    floor: '1',
    totalFloors: '5',
    unitsPerFloor: '2',
    builtYear: '1402',
    hasParking: true,
    hasElevator: true,
    hasStorage: true,
    hasBalcony: true,
    coolingSystem: 'داکت اسپلیت',
    heatingSystem: 'پکیج و رادیاتور',
    documentType: 'سند تک‌برگ ملکی',
    direction: 'جنوبی',
    city: 'تهران',
    district: '',
    address: '',
    ownerName: '',
    ownerPhone: '',
    description: '',
    agentId: agents[0]?.id || 'agent-1',
  });

  const [formData, setFormData] = useState(getDefaultFormData());

  // اعمال داده‌های صوتی یا فایل در حال ویرایش و پاکسازی در هنگام بستن مدال
  useEffect(() => {
    if (!isOpen) {
      // پاکسازی کامل فرم هنگام بستن پنجره جهت جلوگیری از ماندن اطلاعات قبلی
      setFormData(getDefaultFormData());
      setError('');
      return;
    }

    if (editProperty) {
      setFormData({
        propertyCode: editProperty.propertyCode,
        title: editProperty.title,
        propertyType: editProperty.propertyType,
        transactionType: editProperty.transactionType,
        status: editProperty.status,
        priceTotal: editProperty.priceTotal?.toString() || '',
        pricePerMeter: editProperty.pricePerMeter?.toString() || '',
        deposit: editProperty.deposit?.toString() || '',
        monthlyRent: editProperty.monthlyRent?.toString() || '',
        isConvertible: editProperty.isConvertible,
        area: editProperty.area.toString(),
        rooms: editProperty.rooms.toString(),
        floor: editProperty.floor?.toString() || '1',
        totalFloors: editProperty.totalFloors?.toString() || '5',
        unitsPerFloor: editProperty.unitsPerFloor?.toString() || '2',
        builtYear: editProperty.builtYear?.toString() || '1401',
        hasParking: editProperty.hasParking,
        hasElevator: editProperty.hasElevator,
        hasStorage: editProperty.hasStorage,
        hasBalcony: editProperty.hasBalcony,
        coolingSystem: editProperty.coolingSystem || 'داکت اسپلیت',
        heatingSystem: editProperty.heatingSystem || 'پکیج و رادیاتور',
        documentType: editProperty.documentType || 'سند تک‌برگ ملکی',
        direction: editProperty.direction || 'جنوبی',
        city: editProperty.city || 'تهران',
        district: editProperty.district,
        address: editProperty.address,
        ownerName: editProperty.ownerName,
        ownerPhone: editProperty.ownerPhone,
        description: editProperty.description || '',
        agentId: editProperty.agentId,
      });
    } else if (prefillVoiceData) {
      const defaults = getDefaultFormData();
      const calculatedTotal = prefillVoiceData.priceTotal
        ? prefillVoiceData.priceTotal.toString()
        : prefillVoiceData.pricePerMeter && prefillVoiceData.area
          ? (prefillVoiceData.pricePerMeter * prefillVoiceData.area).toString()
          : '';

      setFormData({
        ...defaults,
        title: prefillVoiceData.title || defaults.title,
        propertyType: prefillVoiceData.propertyType || defaults.propertyType,
        transactionType: prefillVoiceData.transactionType || defaults.transactionType,
        priceTotal: calculatedTotal,
        pricePerMeter: prefillVoiceData.pricePerMeter?.toString() || '',
        deposit: prefillVoiceData.deposit?.toString() || '',
        monthlyRent: prefillVoiceData.monthlyRent !== undefined ? prefillVoiceData.monthlyRent.toString() : '',
        isConvertible: prefillVoiceData.isConvertible !== undefined ? prefillVoiceData.isConvertible : defaults.isConvertible,
        area: prefillVoiceData.area ? prefillVoiceData.area.toString() : '',
        rooms: prefillVoiceData.rooms !== undefined ? prefillVoiceData.rooms.toString() : defaults.rooms,
        floor: prefillVoiceData.floor !== undefined ? prefillVoiceData.floor.toString() : defaults.floor,
        totalFloors: prefillVoiceData.totalFloors !== undefined ? prefillVoiceData.totalFloors.toString() : defaults.totalFloors,
        unitsPerFloor: prefillVoiceData.unitsPerFloor !== undefined ? prefillVoiceData.unitsPerFloor.toString() : defaults.unitsPerFloor,
        builtYear: prefillVoiceData.builtYear !== undefined ? prefillVoiceData.builtYear.toString() : defaults.builtYear,
        hasParking: prefillVoiceData.hasParking ?? defaults.hasParking,
        hasElevator: prefillVoiceData.hasElevator ?? defaults.hasElevator,
        hasStorage: prefillVoiceData.hasStorage ?? defaults.hasStorage,
        hasBalcony: prefillVoiceData.hasBalcony ?? defaults.hasBalcony,
        district: prefillVoiceData.district || defaults.district,
        address: prefillVoiceData.address || defaults.address,
        ownerName:
          prefillVoiceData.ownerName && prefillVoiceData.ownerName !== 'مالک محترم'
            ? prefillVoiceData.ownerName
            : '',
        ownerPhone:
          prefillVoiceData.ownerPhone && prefillVoiceData.ownerPhone !== '09123456789'
            ? prefillVoiceData.ownerPhone
            : '',
        description: prefillVoiceData.description || defaults.description,
        documentType: prefillVoiceData.documentType || defaults.documentType,
      });
    } else {
      setFormData(getDefaultFormData());
    }
  }, [isOpen, editProperty, prefillVoiceData]);

  const [error, setError] = useState('');
  const [isRecordingDesc, setIsRecordingDesc] = useState(false);
  const [isProcessingDesc, setIsProcessingDesc] = useState(false);
  const [descRecordSeconds, setDescRecordSeconds] = useState(0);
  const descRecognizerRef = useRef<LiveSpeechRecognizer | null>(null);
  const descTimerRef = useRef<any>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const descBaseTextRef = useRef<string>('');

  // پاکسازی ریکوردر در صورت بستن مدال
  useEffect(() => {
    if (!isOpen) {
      if (descRecognizerRef.current) {
        try {
          descRecognizerRef.current.stop();
        } catch {}
        descRecognizerRef.current = null;
      }
      if (descTimerRef.current) {
        clearInterval(descTimerRef.current);
        descTimerRef.current = null;
      }
      setIsRecordingDesc(false);
      setIsProcessingDesc(false);
    }
  }, [isOpen]);

  const handleAutoFillFromDesc = () => {
    if (!formData.description.trim()) return;
    const parsed = parseVoicePropertyDescription(formData.description);
    setFormData((prev) => ({
      ...prev,
      title: parsed.title || prev.title,
      propertyType: parsed.propertyType || prev.propertyType,
      transactionType: parsed.transactionType || prev.transactionType,
      priceTotal: parsed.priceTotal?.toString() || prev.priceTotal,
      pricePerMeter: parsed.pricePerMeter?.toString() || prev.pricePerMeter,
      deposit: parsed.deposit?.toString() || prev.deposit,
      monthlyRent: parsed.monthlyRent?.toString() || prev.monthlyRent,
      isConvertible: parsed.isConvertible ?? prev.isConvertible,
      area: parsed.area?.toString() || prev.area,
      rooms: parsed.rooms?.toString() || prev.rooms,
      floor: parsed.floor?.toString() || prev.floor,
      totalFloors: parsed.totalFloors?.toString() || prev.totalFloors,
      unitsPerFloor: parsed.unitsPerFloor?.toString() || prev.unitsPerFloor,
      builtYear: parsed.builtYear?.toString() || prev.builtYear,
      hasParking: parsed.hasParking ?? prev.hasParking,
      hasElevator: parsed.hasElevator ?? prev.hasElevator,
      hasStorage: parsed.hasStorage ?? prev.hasStorage,
      hasBalcony: parsed.hasBalcony ?? prev.hasBalcony,
      district: parsed.district || prev.district,
      address: parsed.address || prev.address,
      ownerName: parsed.ownerName || prev.ownerName,
      ownerPhone: parsed.ownerPhone || prev.ownerPhone,
    }));
  };

  const handleFocusDescKeyboard = () => {
    setError('🎙️ کیبورد گوشی فعال شد! لطفاً دکمه میکروفون 🎙️ پایین کیبورد (کنار دکمه Space) را لمس کرده و توضیحات ملک را بیان فرمایید. متن به‌صورت ۱۰۰٪ آفلاین تایپ می‌شود.');
    if (descTextareaRef.current) {
      descTextareaRef.current.focus();
      descTextareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const toggleDescDictation = async () => {
    if (isRecordingDesc) {
      if (descTimerRef.current) {
        clearInterval(descTimerRef.current);
        descTimerRef.current = null;
      }
      setIsRecordingDesc(false);
      setIsProcessingDesc(false);

      if (descRecognizerRef.current) {
        try {
          const finalResult = descRecognizerRef.current.stop();
          if (finalResult) {
            setFormData((prev) => ({
              ...prev,
              description: prev.description
                ? smartMergeTexts(prev.description, finalResult)
                : finalResult,
            }));
          }
        } catch {}
        descRecognizerRef.current = null;
      }
      return;
    }

    setError('');

    // در صورتی که مرورگر از Web Speech API در این بستر امن پشتیبانی می‌کند
    if (isWebSpeechSupported() && isSecureContextEnvironment()) {
      setIsRecordingDesc(true);
      setDescRecordSeconds(0);
      descBaseTextRef.current = formData.description ? formData.description.trim() : '';

      descTimerRef.current = setInterval(() => {
        setDescRecordSeconds((s) => s + 1);
      }, 1000);

      try {
        const recognizer = new LiveSpeechRecognizer('fa-IR');
        descRecognizerRef.current = recognizer;
        recognizer.start({
          onLiveUpdate: ({ fullText }) => {
            if (fullText) {
              const combined = descBaseTextRef.current
                ? `${descBaseTextRef.current} ${fullText}`
                : fullText;
              setFormData((prev) => ({
                ...prev,
                description: combined,
              }));
            }
          },
          onError: (errMsg, isFatal) => {
            console.warn('Desc speech notice:', errMsg);
            if (isFatal) {
              setError(errMsg);
              setIsRecordingDesc(false);
              if (descTimerRef.current) clearInterval(descTimerRef.current);
            }
          },
          onEnd: () => {
            // پایان تکلم
          },
        });
      } catch (err: any) {
        console.warn('Speech recognizer failed:', err);
        handleFocusDescKeyboard();
        setIsRecordingDesc(false);
        if (descTimerRef.current) clearInterval(descTimerRef.current);
      }
    } else {
      // برای آیفون در محیط HTTP یا بدون وب‌اسپیچ: فعال‌سازی دیکته صوتی کیبورد گوشی (۱۰۰٪ آفلاین و بدون نیاز به جمینای)
      handleFocusDescKeyboard();
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('لطفاً عنوان فایل ملک را وارد کنید.');
      return;
    }
    if (!formData.district.trim()) {
      setError('لطفاً نام محله یا منطقه را مشخص فرمایید.');
      return;
    }
    if (!formData.area || parseFloat(toEnglishDigits(formData.area)) <= 0) {
      setError('لطفاً متراژ معتبر وارد کنید.');
      return;
    }
    if (!formData.ownerName.trim() || !formData.ownerPhone.trim()) {
      setError('نام و شماره تماس مالک برای پیگیری ضروری است.');
      return;
    }

    const selectedAgent = agents.find((a) => a.id === formData.agentId) || agents[0];
    const areaNum = parseFloat(toEnglishDigits(formData.area));
    const priceTotalNum = formData.priceTotal ? cleanNumericValue(formData.priceTotal) : undefined;
    const pricePerMeterNum =
      priceTotalNum && areaNum > 0 ? Math.round(priceTotalNum / areaNum) : undefined;

    const propertyPayload = {
      propertyCode: formData.propertyCode,
      title: formData.title,
      propertyType: formData.propertyType as PropertyType,
      transactionType: formData.transactionType as TransactionType,
      status: formData.status as any,
      priceTotal: priceTotalNum,
      pricePerMeter: pricePerMeterNum,
      deposit: formData.deposit ? cleanNumericValue(formData.deposit) : undefined,
      monthlyRent: formData.monthlyRent ? cleanNumericValue(formData.monthlyRent) : undefined,
      isConvertible: formData.isConvertible,
      area: areaNum,
      rooms: parseInt(toEnglishDigits(formData.rooms), 10) || 1,
      floor: formData.floor ? parseInt(toEnglishDigits(formData.floor), 10) : undefined,
      totalFloors: formData.totalFloors ? parseInt(toEnglishDigits(formData.totalFloors), 10) : undefined,
      unitsPerFloor: formData.unitsPerFloor ? parseInt(toEnglishDigits(formData.unitsPerFloor), 10) : undefined,
      builtYear: formData.builtYear ? parseInt(toEnglishDigits(formData.builtYear), 10) : undefined,
      hasParking: formData.hasParking,
      hasElevator: formData.hasElevator,
      hasStorage: formData.hasStorage,
      hasBalcony: formData.hasBalcony,
      coolingSystem: formData.coolingSystem,
      heatingSystem: formData.heatingSystem,
      documentType: formData.documentType,
      direction: formData.direction,
      city: formData.city,
      district: formData.district,
      address: formData.address,
      ownerName: formData.ownerName,
      ownerPhone: formData.ownerPhone,
      description: formData.description,
      agentId: selectedAgent.id,
      agentName: selectedAgent.fullName,
    };

    if (editProperty) {
      updateProperty(editProperty.id, propertyPayload);
    } else {
      addProperty(propertyPayload);
    }

    onClose();
  };

  // محاسبات آنی ارقام مالی جهت نمایش قیمت متری و معادل‌ها
  const currentAreaNum = parseFloat(toEnglishDigits(formData.area)) || 0;
  const currentPriceTotalNum = cleanNumericValue(formData.priceTotal);
  const calculatedPricePerMeter =
    currentPriceTotalNum > 0 && currentAreaNum > 0
      ? Math.round(currentPriceTotalNum / currentAreaNum)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/15 bg-[#0f1325]/95 shadow-2xl backdrop-blur-2xl max-h-[92vh] flex flex-col text-slate-100">
        {/* هدر مدال با تم گلس‌مورفیسم */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-6 py-3.5 sm:py-4 bg-white/[0.03] gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                {editProperty ? 'ویرایش مشخصات فایل ملک' : 'ثبت فایل ملک جدید در سیستم'}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate sm:whitespace-normal">
                ثبت کلیه مشخصات ثبتی، مشخصات فنی و ارقام مالی با تفکیک سه‌رقمی
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onOpenVoiceModal && !editProperty && (
              <button
                type="button"
                onClick={onOpenVoiceModal}
                className="flex items-center gap-1 sm:gap-1.5 rounded-xl bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 border border-purple-500/40 px-2 sm:px-3 py-1.5 text-xs font-semibold transition-colors"
              >
                <Mic className="h-3.5 w-3.5 text-purple-300 animate-pulse" />
                <span className="hidden sm:inline">پر کردن با صوت (AI)</span>
                <span className="sm:hidden text-[11px]">صوت هوشمند</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* بدنه فرم */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {onOpenVoiceModal && !editProperty && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-violet-900/40 via-purple-900/30 to-indigo-900/40 border border-violet-500/35 p-3.5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/35 shadow-md shadow-violet-500/20">
                  <Mic className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>ثبت فوق سریع با فرمان صوتی و هوش مصنوعی (Voice AI)</span>
                    <span className="rounded-full bg-violet-500/30 px-2 py-0.5 text-[10px] text-violet-200 border border-violet-400/30">پیشنهادی</span>
                  </div>
                  <div className="text-[11px] text-violet-200/80 mt-0.5 leading-relaxed">
                    با کلیک روی دکمه زیر، مرورگر از شما دسترسی میکروفون می‌خواهد تا مشخصات ملک را گفتاری بیان کنید و همه فیلدها خودکار پر شوند.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenVoiceModal}
                className="shrink-0 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/30 hover:brightness-110 active:scale-95 transition-all"
              >
                <Mic className="h-3.5 w-3.5" />
                <span>شروع ثبت با صوت</span>
              </button>
            </div>
          )}

          {/* بنر وضعیت تکمیل هوشمند با صوت */}
          {prefillVoiceData && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 p-3.5 text-xs text-emerald-200 backdrop-blur-md animate-fade-in">
              <Sparkles className="h-5 w-5 text-emerald-300 shrink-0 animate-pulse" />
              <div>
                <span className="font-bold text-emerald-100">فیلدهای این فرم با هوش مصنوعی و فرمان صوتی تکمیل شده است.</span>
                <p className="text-[11px] text-emerald-300/80 mt-0.5 leading-relaxed">
                  مشخصات استخراج شده در فیلدهای زیر جای‌گذاری شدند. می‌توانید مقادیر را بررسی یا اصلاح نموده و در پایان دکمه ثبت قطعی را بزنید.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* ۱. اطلاعات پایه معامله */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">کد فایل</label>
              <input
                type="text"
                value={formData.propertyCode}
                onChange={(e) => setFormData({ ...formData, propertyCode: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs font-bold text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع معامله</label>
              <select
                value={formData.transactionType}
                onChange={(e) =>
                  setFormData({ ...formData, transactionType: e.target.value as TransactionType })
                }
                className="w-full rounded-xl border border-white/10 bg-[#0e1226] px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
              >
                {Object.entries(TRANSACTION_TYPE_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع کاربری ملک</label>
              <select
                value={formData.propertyType}
                onChange={(e) =>
                  setFormData({ ...formData, propertyType: e.target.value as PropertyType })
                }
                className="w-full rounded-xl border border-white/10 bg-[#0e1226] px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
              >
                {Object.entries(PROPERTY_TYPE_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* عنوان آگهی */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">عنوان فایل ملک</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="مثال: آپارتمان ۱۶۰ متری ۳ خوابه نیاوران با ویو عالی"
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
            />
          </div>

          {/* ارقام مالی با جداسازی سه‌رقمی و نمایش معادل به حروف */}
          {formData.transactionType === 'SALE' || formData.transactionType === 'PRE_SALE' ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4.5 backdrop-blur-xl">
              <PriceInputField
                label="قیمت کل فروش (تومان)"
                value={formData.priceTotal}
                onChange={(raw) => setFormData({ ...formData, priceTotal: raw })}
                placeholder="مثال: 15,000,000,000"
                required
                quickPresets={[
                  { label: '+ ۱۰۰ م', amount: 100_000_000 },
                  { label: '+ ۵۰۰ م', amount: 500_000_000 },
                  { label: '+ ۱ میلیارد', amount: 1_000_000_000 },
                  { label: '+ ۵ میلیارد', amount: 5_000_000_000 },
                ]}
                secondaryInfo={
                  calculatedPricePerMeter > 0 ? (
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-500/30 bg-violet-950/40 px-3.5 py-2.5 text-xs text-violet-200">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="text-violet-300">قیمت هر متر مربع (بر اساس {toPersianDigits(currentAreaNum)} متر):</span>
                        <span className="font-mono font-bold text-white">{formatWithCommas(calculatedPricePerMeter, true)} تومان</span>
                      </div>
                      <span className="text-[11px] font-semibold text-violet-300">
                        {numberToPersianWords(calculatedPricePerMeter)} تومان
                      </span>
                    </div>
                  ) : currentAreaNum > 0 ? (
                    <div className="mt-1 text-[11px] text-slate-400">
                      قیمت هر متر مربع بر اساس متراژ وارد شده ({toPersianDigits(currentAreaNum)} متر) به صورت خودکار محاسبه خواهد شد.
                    </div>
                  ) : (
                    <div className="mt-1 text-[11px] text-slate-400">
                      پس از مشخص کردن متراژ، قیمت هر متر مربع به طور خودکار محاسبه و به حروف نمایش داده می‌شود.
                    </div>
                  )
                }
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4.5 space-y-4 backdrop-blur-xl">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PriceInputField
                  label="مبلغ ودیعه / رهن (تومان)"
                  value={formData.deposit}
                  onChange={(raw) => setFormData({ ...formData, deposit: raw })}
                  placeholder="مثال: 1,000,000,000"
                  quickPresets={[
                    { label: '+ ۵۰ م', amount: 50_000_000 },
                    { label: '+ ۱۰۰ م', amount: 100_000_000 },
                    { label: '+ ۵۰۰ م', amount: 500_000_000 },
                    { label: '+ ۱ میلیارد', amount: 1_000_000_000 },
                  ]}
                />
                <PriceInputField
                  label="اجاره ماهانه (تومان)"
                  value={formData.monthlyRent}
                  onChange={(raw) => setFormData({ ...formData, monthlyRent: raw })}
                  placeholder="مثال: 25,000,000"
                  quickPresets={[
                    { label: '+ ۱ م', amount: 1_000_000 },
                    { label: '+ ۵ م', amount: 5_000_000 },
                    { label: '+ ۱۰ م', amount: 10_000_000 },
                    { label: '+ ۲۰ م', amount: 20_000_000 },
                  ]}
                />
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <input
                  type="checkbox"
                  id="isConvertible"
                  checked={formData.isConvertible}
                  onChange={(e) => setFormData({ ...formData, isConvertible: e.target.checked })}
                  className="h-4 w-4 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="isConvertible" className="text-xs font-medium text-slate-300 cursor-pointer">
                  قابلیت تبدیل رهن و اجاره (بر اساس عرف تبدیل ۳ درصد اتحادیه)
                </label>
              </div>
            </div>
          )}

          {/* مشخصات ساختمانی و متراژ */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">متراژ (متر مربع)</label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="120"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">تعداد اتاق خواب</label>
              <input
                type="number"
                value={formData.rooms}
                onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                placeholder="2"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">طبقه واحد</label>
              <input
                type="number"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="3"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">کل طبقات ساختمان</label>
              <input
                type="number"
                value={formData.totalFloors}
                onChange={(e) => setFormData({ ...formData, totalFloors: e.target.value })}
                placeholder="5"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">واحد در هر طبقه</label>
              <input
                type="number"
                value={formData.unitsPerFloor}
                onChange={(e) => setFormData({ ...formData, unitsPerFloor: e.target.value })}
                placeholder="2"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">سال ساخت (شمسی)</label>
              <input
                type="number"
                value={formData.builtYear}
                onChange={(e) => setFormData({ ...formData, builtYear: e.target.value })}
                placeholder="1402"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
          </div>

          {/* امکانات ۴ گانه اصلی */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">امکانات رفاهی اصلی</label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 cursor-pointer hover:bg-white/[0.08] transition-colors">
                <input
                  type="checkbox"
                  checked={formData.hasParking}
                  onChange={(e) => setFormData({ ...formData, hasParking: e.target.checked })}
                  className="rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-slate-300">پارکینگ سندی</span>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 cursor-pointer hover:bg-white/[0.08] transition-colors">
                <input
                  type="checkbox"
                  checked={formData.hasElevator}
                  onChange={(e) => setFormData({ ...formData, hasElevator: e.target.checked })}
                  className="rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-slate-300">آسانسور</span>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 cursor-pointer hover:bg-white/[0.08] transition-colors">
                <input
                  type="checkbox"
                  checked={formData.hasStorage}
                  onChange={(e) => setFormData({ ...formData, hasStorage: e.target.checked })}
                  className="rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-slate-300">انباری سندی</span>
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-3 cursor-pointer hover:bg-white/[0.08] transition-colors">
                <input
                  type="checkbox"
                  checked={formData.hasBalcony}
                  onChange={(e) => setFormData({ ...formData, hasBalcony: e.target.checked })}
                  className="rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-slate-300">تراس / بالکن</span>
              </label>
            </div>
          </div>

          {/* موقعیت و آدرس */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">محله / منطقه</label>
                <span className="text-[10px] text-slate-400">بانک محلات متصل</span>
              </div>
              <input
                type="text"
                list="property-districts-list"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="انتخاب از لیست یا تایپ محله..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
              <datalist id="property-districts-list">
                {districts.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name} (منطقه {toPersianDigits(d.municipalityZone)} شهرداری)
                  </option>
                ))}
              </datalist>

              {/* نشانگر مظنه متری محله انتخابی */}
              {(() => {
                const matchedD = districts.find((d) => d.name === formData.district);
                if (!matchedD) return null;
                return (
                  <div className="mt-1.5 text-[11px] text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-xl flex items-center justify-between num-fa">
                    <span>مظنه منطقه {toPersianDigits(matchedD.municipalityZone)}:</span>
                    <span className="font-bold text-white">
                      متری {matchedD.avgSalePricePerMeter ? formatPriceCompact(matchedD.avgSalePricePerMeter) : '—'}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع سند</label>
              <input
                type="text"
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                placeholder="سند تک‌برگ شخصی، اوقافی، تعاونی..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">آدرس دقیق ملک</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="خیابان اصلی، کوچه، پلاک، زنگ (محرمانه نزد مشاور)"
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
            />
          </div>

          {/* اطلاعات مالک و مشاور پرونده */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">نام مالک</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="آقای / خانم..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">تلفن مالک</label>
              <input
                type="text"
                value={formData.ownerPhone}
                onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                placeholder="0912..."
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">مشاور مسئول</label>
              <select
                value={formData.agentId}
                onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-[#0e1226] px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* توضیحات تکمیلی با دیکته صوتی مستقیم */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">توضیحات و نکات کلیدی ملک</label>
              <div className="flex items-center gap-2">
                {formData.description.trim().length > 10 && (
                  <button
                    type="button"
                    onClick={handleAutoFillFromDesc}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/35 hover:bg-violet-600/30 transition-all font-semibold"
                    title="تحلیل این متن و پر کردن خودکار فیلدهای متراژ، قیمت، محله و خواب"
                  >
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    <span>تکمیل هوشمند سایر فیلدها از روی متن</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleFocusDescKeyboard}
                  title="باز کردن کیبورد جهت استفاده از دکمه میکروفون آیفون (۱۰۰٪ آفلاین)"
                  className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 transition-all font-medium"
                >
                  <Mic className="h-3 w-3 text-violet-400" />
                  <span>دیکته با کیبورد گوشی (🎙️)</span>
                </button>
                <button
                  type="button"
                  onClick={toggleDescDictation}
                  disabled={isProcessingDesc}
                  title="تایپ مستقیم با گفتار در مرورگر (Web Speech API)"
                  className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    isRecordingDesc
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : isProcessingDesc
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-white/[0.05] text-violet-300 border-white/10 hover:bg-white/[0.08]'
                  }`}
                >
                  {isProcessingDesc ? (
                    <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
                  ) : isRecordingDesc ? (
                    <MicOff className="h-3 w-3 text-rose-400" />
                  ) : (
                    <Mic className="h-3 w-3 text-emerald-400" />
                  )}
                  <span>
                    {isProcessingDesc
                      ? 'در حال پردازش گفتار...'
                      : isRecordingDesc
                      ? `در حال شنیدن... (${toPersianDigits(descRecordSeconds)} ثانیه) - کلیک برای توقف`
                      : 'تایپ زنده صوتی'}
                  </span>
                </button>
              </div>
            </div>

            {/* کادر وضعیت ضبط دیکته صوتی */}
            {isRecordingDesc && (
              <div className="mb-2 p-2.5 rounded-xl bg-rose-600/15 border border-rose-500/35 flex items-center justify-between text-xs animate-in fade-in">
                <span className="text-rose-200 font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-400 animate-ping" />
                  <span>میکروفون فعال است: صحبت فرمایید...</span>
                </span>
                <span className="text-[10px] text-rose-300 font-mono bg-rose-500/20 px-2 py-0.5 rounded-full">
                  {toPersianDigits(descRecordSeconds)}s
                </span>
              </div>
            )}

            <textarea
              ref={descTextareaRef}
              rows={3}
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
              }}
              placeholder="نورگیر، وضعیت مشاعات، شرایط بازدید، زمان تحویل، تمایل مالک به تخفیف یا تهاتر..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] p-3 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
            />
          </div>
        </form>

        {/* فوتر مدال */}
        <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4 bg-white/[0.02] rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-semibold text-white hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Check className="h-4 w-4" />
            <span>{editProperty ? 'ذخیره تغییرات' : 'ثبت قطعی فایل ملک'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
