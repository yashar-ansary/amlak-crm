// مسیر فایل: src/components/settings/SettingsView.tsx
// نمای تنظیمات و اصلاح اطلاعات آژانس املاک، پروانه کسب، کمیسیون و سربرگ قراردادها

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  ShieldCheck,
  Phone,
  MapPin,
  Percent,
  FileText,
  Check,
  RotateCcw,
  CheckCircle2,
  Plus,
  Minus,
  Calculator,
  Zap,
  Cloud,
  HardDrive,
  Database,
  WifiOff,
  Download,
  Key,
  Mic,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useCrm, DEFAULT_AGENCY_SETTINGS } from '../../context/CrmContext';
import { toEnglishDigits, toPersianDigits, cleanDecimalInput, formatToman } from '../../utils/jalali';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
  checkVoiceServerStatus,
  VoiceStatusResponse,
} from '../../utils/geminiVoiceConfig';

export const SettingsView: React.FC = () => {
  const { agencySettings, updateAgencySettings, resetAgencySettings } = useCrm();

  const [formData, setFormData] = useState({
    ...agencySettings,
    defaultCommissionRate: agencySettings.defaultCommissionRate !== undefined ? agencySettings.defaultCommissionRate.toString() : '0.25',
    vatRate: agencySettings.vatRate !== undefined ? agencySettings.vatRate.toString() : '10',
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [geminiKeySaved, setGeminiKeySaved] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatusResponse | null>(null);
  const [isCheckingVoiceStatus, setIsCheckingVoiceStatus] = useState(false);

  useEffect(() => {
    setGeminiKeyInput(getStoredGeminiApiKey());
    handleCheckVoiceStatus();
  }, []);

  const handleCheckVoiceStatus = async () => {
    setIsCheckingVoiceStatus(true);
    const status = await checkVoiceServerStatus();
    setVoiceStatus(status);
    setIsCheckingVoiceStatus(false);
  };

  const handleSaveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredGeminiApiKey(geminiKeyInput);
    setGeminiKeySaved(true);
    setTimeout(() => setGeminiKeySaved(false), 3000);
    handleCheckVoiceStatus();
  };

  const handleClearGeminiKey = () => {
    setGeminiKeyInput('');
    setStoredGeminiApiKey('');
    handleCheckVoiceStatus();
  };

  const handleDownloadZip = async () => {
    setIsDownloadingZip(true);
    try {
      // استفاده از پارامتر زمان (t) جهت دور زدن کش مرورگرها و دریافت قطعی آخرین تغییرات
      const timestamp = Date.now();
      const res = await fetch(`/api/download-zip?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
        },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parsmelk-crm-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 500);
    } catch {
      window.location.href = `/api/download-zip?t=${Date.now()}`;
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawComm = cleanDecimalInput(formData.defaultCommissionRate);
    const parsedCommRate = parseFloat(rawComm);
    const rawVat = cleanDecimalInput(formData.vatRate);
    const parsedVatRate = parseFloat(rawVat);

    const newCommRate = !isNaN(parsedCommRate) && parsedCommRate >= 0 ? parsedCommRate : 0.25;
    const newVatRate = !isNaN(parsedVatRate) && parsedVatRate >= 0 ? parsedVatRate : 10;

    updateAgencySettings({
      agencyName: formData.agencyName.trim(),
      branchName: formData.branchName.trim(),
      managerName: formData.managerName.trim(),
      licenseNumber: formData.licenseNumber.trim(),
      phone: formData.phone.trim(),
      mobile: formData.mobile.trim(),
      city: formData.city.trim(),
      address: formData.address.trim(),
      website: formData.website?.trim(),
      defaultCommissionRate: newCommRate,
      vatRate: newVatRate,
      contractFooterNote: formData.contractFooterNote.trim(),
    });

    setFormData((prev) => ({
      ...prev,
      defaultCommissionRate: newCommRate.toString(),
      vatRate: newVatRate.toString(),
    }));

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    resetAgencySettings();
    setFormData({
      ...DEFAULT_AGENCY_SETTINGS,
      defaultCommissionRate: DEFAULT_AGENCY_SETTINGS.defaultCommissionRate.toString(),
      vatRate: DEFAULT_AGENCY_SETTINGS.vatRate.toString(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // افزایش یا کاهش پله‌ای نرخ کمیسیون
  const stepCommission = (delta: number) => {
    const current = parseFloat(cleanDecimalInput(formData.defaultCommissionRate)) || 0;
    const nextVal = Math.max(0, parseFloat((current + delta).toFixed(2)));
    setFormData((prev) => ({ ...prev, defaultCommissionRate: nextVal.toString() }));
  };

  // افزایش یا کاهش پله‌ای نرخ مالیات
  const stepVat = (delta: number) => {
    const current = parseFloat(cleanDecimalInput(formData.vatRate)) || 0;
    const nextVal = Math.max(0, parseFloat((current + delta).toFixed(1)));
    setFormData((prev) => ({ ...prev, vatRate: nextVal.toString() }));
  };

  const numericCommission = parseFloat(cleanDecimalInput(formData.defaultCommissionRate)) || 0;
  const sampleDealAmount = 10_000_000_000; // ده میلیارد تومان برای پیش‌نمایش
  const samplePartyComm = Math.round((sampleDealAmount * numericCommission) / 100);

  return (
    <div className="space-y-6">
      {/* هدر بخش تنظیمات */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30">
            <Settings className="h-5 w-5 text-violet-200" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">تنظیمات و اصلاح اطلاعات سامانه</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ویرایش نام بنگاه املاک، پروانه کسب اتحادیه، تلفن‌ها، نشانی و پارامترهای پیش‌فرض کمیسیون
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>بازنشانی به پیش‌فرض</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/35 p-4 text-xs font-bold text-emerald-300 animate-fade-in shadow-xl backdrop-blur-xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>اطلاعات آژانس املاک با موفقیت در سیستم ذخیره و اعمال گردید.</span>
        </div>
      )}

      {/* فرم اصلاح اطلاعات */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ۱. مشخصات عمومی آژانس املاک */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-xl shadow-black/25 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-white/10 pb-3">
            <Building2 className="h-4 w-4 text-emerald-400" />
            <span>مشخصات هویتی و ثبتی آژانس املاک</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-white">
                  نام برند و آژانس املاک <span className="text-emerald-300 font-semibold">(جایگزین عنوان «پارس ملک»)</span>
                </label>
                <span className="rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  عنوان اصلی سامانه
                </span>
              </div>
              <input
                type="text"
                value={formData.agencyName}
                onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                placeholder="مثال: املاک مهرگان، املاک پاسارگاد، پارس ملک"
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3.5 py-2.5 text-sm font-bold text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.09] focus:outline-none"
              />
              <span className="block mt-1.5 text-[11px] text-slate-400">
                این عنوان بلافاصله در نوار بالای صفحه، سایدبار، سربرگ مبایعه‌نامه‌ها و متن آگهی‌ها اعمال می‌گردد.
              </span>

              {/* پیش‌نمایش زنده در هدر */}
              <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[11px]">پیش‌نمایش در منوی بالا:</span>
                  <div className="flex items-center gap-1.5 font-bold text-white bg-white/[0.08] px-3 py-1 rounded-lg border border-white/15 shadow-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-tr from-violet-600 to-indigo-600 text-white text-[10px]">
                      {(formData.agencyName.trim() || 'پ').slice(0, 1)}
                    </span>
                    <span>{formData.agencyName.trim() || 'نام آژانس شما'}</span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">زنده</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                نام شعبه یا منطقه
              </label>
              <input
                type="text"
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                placeholder="مثال: شعبه سعادت‌آباد"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                مدیر مسئول / دارنده پروانه
              </label>
              <input
                type="text"
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                placeholder="مهندس علیرضا سلیمانی"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                شماره پروانه کسب اتحادیه
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="۱۴۰۲/۹۸۷-اتحادیه"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">شهر محل فعالیت</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="تهران"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* ۲. اطلاعات تماس و نشانی */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-xl shadow-black/25 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-white/10 pb-3">
            <Phone className="h-4 w-4 text-sky-400" />
            <span>اطلاعات تماس و نشانی دفتر</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                تلفن ثابت دفتر (خط ویژه)
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="021-22003344"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                تلفن همراه مدیریت
              </label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="09121112233"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">وب‌سایت دفتر املاک</label>
              <input
                type="text"
                value={formData.website || ''}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="www.parsmelk.ir"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">نشانی دقیق دفتر املاک</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="تهران، سعادت‌آباد، بالاتر از میدان کاج، نبش خیابان مروارید، پلاک ۱۸"
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
            />
          </div>
        </div>

        {/* ۳. تنظیمات مالی و قراردادها */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-xl shadow-black/25 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-white border-b border-white/10 pb-3">
            <Percent className="h-4 w-4 text-amber-400" />
            <span>تعرفه‌ها و متون سربرگ قراردادهای رسمی</span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* ۱. فیلد درصد پایه کمیسیون */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-200">
                  درصد پایه کمیسیون فروش (٪ از هر طرف)
                </label>
                <span className="text-[11px] text-amber-300 font-bold num-fa bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                  {toPersianDigits(formData.defaultCommissionRate || '0')} درصد
                </span>
              </div>

              {/* ورودی به همراه دکمه‌های پله‌ای + و - */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => stepCommission(-0.05)}
                  title="کاهش ۰.۰۵ درصد"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.defaultCommissionRate}
                    onChange={(e) => {
                      const cleaned = cleanDecimalInput(e.target.value);
                      setFormData({ ...formData, defaultCommissionRate: cleaned });
                    }}
                    placeholder="0.25"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs font-bold num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ٪
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => stepCommission(0.05)}
                  title="افزایش ۰.۰۵ درصد"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* گزینه‌های سریع و استاندارد */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[
                  { label: '۰.۲۵٪ (مصوب اتحادیه)', val: '0.25' },
                  { label: '۰.۵٪ (عرف بازار)', val: '0.5' },
                  { label: '۰.۷۵٪', val: '0.75' },
                  { label: '۱.۰٪', val: '1' },
                  { label: '۱.۵٪', val: '1.5' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setFormData({ ...formData, defaultCommissionRate: item.val })}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      formData.defaultCommissionRate === item.val
                        ? 'bg-amber-500/25 border border-amber-500/50 text-amber-200'
                        : 'bg-white/[0.04] border border-white/10 text-slate-400 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* پیش‌نمایش زنده محاسبه */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[11px] text-slate-300 flex items-center justify-between">
                <span className="text-slate-400">مثال معامله ۱۰ میلیارد تومانی:</span>
                <span className="font-bold text-emerald-400 num-fa">
                  {formatToman(samplePartyComm)} (هر طرف)
                </span>
              </div>
            </div>

            {/* ۲. فیلد درصد مالیات بر ارزش افزوده */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-200">
                  درصد مالیات بر ارزش افزوده (٪)
                </label>
                <span className="text-[11px] text-sky-300 font-bold num-fa bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-lg">
                  {toPersianDigits(formData.vatRate || '0')} درصد
                </span>
              </div>

              {/* ورودی مالیات به همراه دکمه‌های پله‌ای + و - */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => stepVat(-1)}
                  title="کاهش ۱ درصد"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.vatRate}
                    onChange={(e) => {
                      const cleaned = cleanDecimalInput(e.target.value);
                      setFormData({ ...formData, vatRate: cleaned });
                    }}
                    placeholder="10"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs font-bold num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
                  />
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ٪
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => stepVat(1)}
                  title="افزایش ۱ درصد"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white/[0.12] hover:text-white active:scale-95 transition-all"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* گزینه‌های سریع نرخ مالیات */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[
                  { label: '۱۰٪ (نرخ رسمی سال ۱۴۰۳ و ۱۴۰۴)', val: '10' },
                  { label: '۹٪ (نرخ سنوات قبل)', val: '9' },
                  { label: '۰٪ (معاف)', val: '0' },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setFormData({ ...formData, vatRate: item.val })}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                      formData.vatRate === item.val
                        ? 'bg-sky-500/25 border border-sky-500/50 text-sky-200'
                        : 'bg-white/[0.04] border border-white/10 text-slate-400 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-[11px] text-slate-300">
                <span className="text-slate-400">توضیح اتحادیه: </span>
                <span>طبق قانون بودجه، نرخ مالیات ارزش افزوده از سال ۱۴۰۳ برابر با ۱۰٪ است.</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              متن پاورقی و شروط مبایعه‌نامه و قراردادها
            </label>
            <textarea
              rows={2}
              value={formData.contractFooterNote}
              onChange={(e) => setFormData({ ...formData, contractFooterNote: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] p-3.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
            />
          </div>
        </div>

        {/* دکمه ذخیره نهایی */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:brightness-110 active:scale-95 transition-all"
          >
            <Check className="h-4 w-4 text-white" />
            <span>ذخیره و اعمال تنظیمات در سامانه</span>
          </button>
        </div>
      </form>

      {/* بخش وضعیت معماری لوکال و آفلاین سامانه */}
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-5 sm:p-6 space-y-4 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-emerald-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md">
              <Zap className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>معماری ۱۰۰٪ محلی و آفلاین سامانه (Local-First)</span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                  فعال
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                تمام اطلاعات املاک، مشتریان، قراردادها و حتی پردازش صوت می‌تواند کاملاً روی دستگاه شما بدون نیاز به اینترنت اجرا شود.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <HardDrive className="h-4 w-4" />
              <span>پایگاه داده محلی (LocalStorage)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              تمامی فایل‌ها و قراردادها به صورت خصوصی در مرورگر دستگاه شما ذخیره می‌شوند و هیچ دیتایی بدون اجازه به سرور خارجی ارسال نمی‌گردد.
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Zap className="h-4 w-4" />
              <span>موتور صوتی بومی و بدون اینترنت</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              امکان استخراج مبالغ، متراژ، رهن، اجاره و اطلاعات مالک با موتور پردازش فارسی ۱۰۰٪ کلاینت‌ساید بدون نیاز به اشتراک یا اینترنت.
            </p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-violet-300 font-bold">
              <Database className="h-4 w-4" />
              <span>پشتیبان‌گیری و جابجایی امن</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              با قابلیت خروجی JSON در بالای صفحه می‌توانید تمام داده‌های دیتابیس را به عنوان فایل پشتیبان ذخیره کرده و روی گوشی یا سیستم دیگر بازگردانی کنید.
            </p>
          </div>
        </div>
      </div>

      {/* بخش پیکربندی هوش مصنوعی تبدیل صوت آیفون (Gemini Voice Engine) */}
      <div className="rounded-3xl border border-violet-500/30 bg-violet-950/20 p-5 sm:p-6 space-y-4 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-violet-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 shrink-0">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>موتور هوش مصنوعی تبدیل صدای آیفون به متن (Gemini Speech)</span>
                {voiceStatus?.effectiveKeyConfigured ? (
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>فعال</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>نیازمند کلید</span>
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                راهنمای حل مشکل «صدایی دریافت نشد» در آیفون بر روی سرور شخصی داکر.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckVoiceStatus}
            disabled={isCheckingVoiceStatus}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.1] active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-violet-400 ${isCheckingVoiceStatus ? 'animate-spin' : ''}`} />
            <span>بررسی وضعیت اتصال</span>
          </button>
        </div>

        {/* جعبه راهنما و علت فنی */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 space-y-2 text-xs text-slate-300 leading-relaxed">
          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
            <HelpCircle className="h-4 w-4 shrink-0" />
            <span>چرا در پیش‌نمایش درست کار می‌کرد اما روی سرور داکر گفتار دریافت نمی‌شود؟</span>
          </div>
          <p>
            ۱. <strong>عدم پشتیبانی آیفون از وب‌اسپیچ:</strong> مرورگر سافاری در سیستم‌عامل iOS بر خلاف اندروید و ویندوز، فاقد قابلیت داخلی تشخیص گفتار فارسی در وب است. لذا سامانه فایل صوتی را ضبط کرده و برای تایپ دقیق به هوش مصنوعی گوگل جمینای ارسال می‌کند.
          </p>
          <p>
            ۲. <strong>کلید هوش مصنوعی در سرور داکر:</strong> در محیط پیش‌نمایش، کلید اختصاصی گوگل به صورت خودکار فعال بود؛ اما وقتی پروژه را با داکر روی سرور خود اجرا می‌کنید، باید متغیر <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300">GEMINI_API_KEY</code> در فایل <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-300">.env</code> سرور قرار داشته باشد یا کلید را در فرم زیر وارد کنید.
          </p>
          <p>
            ۳. <strong>پروتکل امن HTTPS:</strong> مرورگر آیفون تنها در سایت‌های دارای گواهی امنیتی SSL (آدرس شروع شده با https://) اجازه ضبط با میکروفون را صادر می‌کند.
          </p>
        </div>

        {/* فرم تنظیم یا ذخیره کلید هوش مصنوعی در کلاینت */}
        <form onSubmit={handleSaveGeminiKey} className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Key className="h-4 w-4 text-violet-400" />
              <span>روش سریع: ذخیره مستقیم کلید رایگان Gemini در مرورگر</span>
            </label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-violet-300 hover:text-violet-200 underline flex items-center gap-1"
            >
              <span>دریافت رایگان کلید از گوگل (۱ دقیقه)</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={geminiKeyInput}
              onChange={(e) => setGeminiKeyInput(e.target.value)}
              placeholder="کلید API خود را اینجا وارد کنید (مثال: AIzaSy...)"
              dir="ltr"
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-600/30 hover:bg-violet-500 active:scale-95 transition-all cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" />
                <span>ذخیره کلید</span>
              </button>
              {geminiKeyInput && (
                <button
                  type="button"
                  onClick={handleClearGeminiKey}
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-xs text-rose-300 hover:bg-rose-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  حذف
                </button>
              )}
            </div>
          </div>

          {geminiKeySaved && (
            <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>کلید با موفقیت در این مرورگر ذخیره شد و برای تبدیل صدای آیفون استفاده می‌شود.</span>
            </div>
          )}

          {/* وضعیت جاری اتصال */}
          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div>
              <span>وضعیت سرور: </span>
              <strong className={voiceStatus?.serverHasGeminiKey ? 'text-emerald-300' : 'text-amber-300'}>
                {voiceStatus?.serverHasGeminiKey ? 'دارای کلید در فایل .env سرور' : 'فاقد کلید در .env سرور'}
              </strong>
            </div>
            <div>
              <span>منبع کلید فعال: </span>
              <span className="text-white font-medium">{voiceStatus?.keyPreview || 'در حال بارگذاری...'}</span>
            </div>
          </div>
        </form>

        {/* روش سرور: ویرایش فایل env در داکر */}
        <div className="rounded-2xl border border-white/10 bg-black/40 p-3.5 text-xs space-y-2">
          <div className="font-semibold text-slate-200">
            <span>روش دائمی روی سرور داکر (توصیه برای تمام کاربران آیفون):</span>
          </div>
          <p className="text-[11px] text-slate-400">
            کافی است در مسیر پروژه روی سرور، فایل <code className="text-emerald-400 font-mono">.env</code> را باز کرده و خط زیر را اضافه نمایید، سپس داکر را با دستور <code className="text-emerald-400 font-mono">docker compose up -d</code> راه‌اندازی کنید:
          </p>
          <code className="block rounded-xl bg-black/70 p-2.5 font-mono text-[11px] text-emerald-400 dir-ltr text-left selection:bg-emerald-500/30">
            GEMINI_API_KEY="کلید_اختصاصی_گوگل_شما"
          </code>
        </div>
      </div>

      {/* بخش دانلود سورس کد کامل پروژه در قالب زیپ */}
      <div className="rounded-3xl border border-amber-500/30 bg-amber-950/20 p-5 sm:p-6 space-y-4 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md shrink-0">
              <Download className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>دانلود سورس کد کامل پروژه (فایل زیپ ZIP)</span>
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  آماده اجرا
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                شامل تمام کدهای فرانت‌اند، سرور، کانفیگ داکر (Dockerfile و docker-compose.yml) و کامپوننت‌ها بدون وابستگی خارجی.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isDownloadingZip}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Download className={`h-4 w-4 text-slate-950 ${isDownloadingZip ? 'animate-bounce' : ''}`} />
            <span>{isDownloadingZip ? 'در حال آماده‌سازی و دانلود ZIP...' : 'دانلود پروژه کامل (ZIP)'}</span>
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5 text-xs text-slate-300 space-y-2">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <span>دستور اجرای سریع با داکر پس از دانلود و آنزیپ:</span>
          </div>
          <code className="block rounded-xl bg-black/60 p-2.5 font-mono text-[11px] text-emerald-400 dir-ltr text-left selection:bg-emerald-500/30">
            docker compose up -d --build
          </code>
        </div>
      </div>

      {/* مدال تایید بازنشانی تنظیمات */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="بازنشانی مشخصات آژانس"
        message="آیا از بازنشانی مشخصات آژانس املاک به مقادیر اولیه و پیش‌فرض اطمینان دارید؟"
        confirmText="بله، بازنشانی شود"
        cancelText="انصراف"
        isDestructive={false}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};
