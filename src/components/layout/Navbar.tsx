// مسیر فایل: src/components/layout/Navbar.tsx
// هدر و ناوبری بالای سامانه مطابق با ضوابط طراحی SaaS و قرارداد ۳ منطقه‌ای

import React, { useState } from 'react';
import {
  Building2,
  Plus,
  UserPlus,
  Calendar,
  Download,
  RotateCcw,
  Search,
  Mic,
  Settings,
  Award,
  Menu,
  X,
} from 'lucide-react';
import { getCurrentJalaliDate, formatJalaliReadable, toPersianDigits } from '../../utils/jalali';
import { useCrm } from '../../context/CrmContext';
import { ConfirmModal } from '../common/ConfirmModal';

interface NavbarProps {
  activeView: string;
  onNavigate?: (view: string) => void;
  onOpenNewProperty: () => void;
  onOpenNewClient: () => void;
  onOpenVoiceProperty: () => void;
  onOpenAuthModal?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
  onOpenNewProperty,
  onOpenNewClient,
  onOpenVoiceProperty,
  onOpenAuthModal,
  searchQuery,
  setSearchQuery,
  onOpenMobileMenu,
}) => {
  const { stats, exportDatabaseJson, resetToDefaults, agencySettings, currentUser } = useCrm();
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const currentJalali = getCurrentJalaliDate();

  const handleDownloadZip = async (e: React.MouseEvent) => {
    e.preventDefault();
    setShowToolsMenu(false);
    setIsDownloadingZip(true);
    try {
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

  const viewTitles: Record<string, string> = {
    dashboard: 'داشبورد مدیریت و تحلیل بنگاه',
    advisor: 'پنل اختصاصی مشاور و تقویم کاری',
    properties: 'بانک فایل‌های ملک و آگهی‌ها',
    districts: 'مدیریت و کارشناسی محله‌ها و مناطق',
    clients: 'مدیریت مشتریان و متقاضیان (CRM)',
    viewings: 'کارتابل بازدیدها و قرارهای ملاقات',
    contracts: 'ثبت معاملات، مبایعه‌نامه و اجاره‌نامه',
    matching: 'موتور تطبیق هوشمند تقاضا و فایل ملک',
    calculator: 'ماشین‌حساب تخصصی اتحادیه املاک',
    agents: 'تیم مشاوران و کارنامه عملکرد',
    settings: 'تنظیمات آژانس و سامانه',
  };

  return (
    <header className="sticky top-0 z-30 flex flex-col w-full border-b border-white/10 bg-[#0c1020]/90 backdrop-blur-2xl text-slate-100 shadow-md">
      <div className="flex h-16 w-full items-center justify-between px-3 sm:px-6 gap-2">
        {/* منطقه ۱: عنوان و منوی موبایل */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              title="منوی اصلی سامانه"
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-600/25">
              <Building2 className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs sm:text-base font-bold tracking-tight text-white truncate block">
                {agencySettings?.agencyName || 'پارس ملک'}
              </span>
              <span className="hidden md:inline text-xs font-medium text-slate-400 truncate">
                {viewTitles[activeView] || 'سامانه املاک'}
              </span>
            </div>
          </div>
        </div>

        {/* منطقه ۲: جستجوی سریع دسکتاپ و تقویم شمسی */}
        <div className="hidden md:flex items-center gap-4">
          <div className="relative w-48 lg:w-72">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی کد فایل، مشتری، محله، تلفن..."
              className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.05] pr-9 pl-3 text-xs text-white placeholder:text-slate-400 focus:border-violet-500 focus:bg-white/[0.09] focus:outline-none transition-all"
            />
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-300 bg-white/[0.04] px-3.5 py-1.5 rounded-xl border border-white/10">
            <Calendar className="h-3.5 w-3.5 text-violet-400" />
            <span className="font-medium text-white">
              {formatJalaliReadable(currentJalali)}
            </span>
            <span className="text-slate-600">·</span>
            <span className="num-fa text-slate-300">
              {toPersianDigits(stats.scheduledViewingsCount)} بازدید در نوبت
            </span>
          </div>
        </div>

        {/* منطقه ۳: دکمه‌های اقدام عملیاتی و حساب کاربری */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* دکمه جستجو در موبایل */}
          <button
            type="button"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            title="جستجوی فایل و مشتری"
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* ثبت صوتی */}
          <button
            type="button"
            onClick={onOpenVoiceProperty}
            className="flex h-8 sm:h-9 items-center gap-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 px-2.5 sm:px-3 text-xs font-semibold text-violet-200 transition-all active:scale-[0.98]"
            title="ثبت صوتی ملک با هوش مصنوعی"
          >
            <Mic className="h-3.5 w-3.5 text-violet-300" />
            <span className="hidden sm:inline">ثبت صوتی</span>
          </button>

          {/* ثبت فایل جدید */}
          <button
            type="button"
            onClick={onOpenNewProperty}
            className="flex h-8 sm:h-9 items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-2.5 sm:px-3 text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>ثبت فایل</span>
          </button>

          {/* ثبت مشتری */}
          <button
            type="button"
            onClick={onOpenNewClient}
            className="hidden sm:flex h-9 items-center gap-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-3 text-xs font-medium text-slate-200 transition-all active:scale-[0.98]"
          >
            <UserPlus className="h-3.5 w-3.5 text-slate-400" />
            <span>مشتری جدید</span>
          </button>

          {/* منوی یکپارچه کاربر و تنظیمات */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              title="حساب کاربری و گزینه‌های سامانه"
              className="flex h-8 sm:h-9 items-center gap-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-2 sm:px-2.5 text-xs text-white transition-all cursor-pointer"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-[11px]">
                {(currentUser?.fullName || agencySettings.managerName).slice(0, 2)}
              </div>
              <span className="hidden xl:inline text-xs font-medium text-slate-200 truncate max-w-[100px]">
                {currentUser?.fullName || agencySettings.managerName}
              </span>
            </button>

            {showToolsMenu && (
              <div className="absolute left-0 top-10 sm:top-11 mt-1 w-60 rounded-2xl border border-white/10 bg-[#0e1224]/98 p-2 shadow-2xl backdrop-blur-2xl z-50 text-slate-200 divide-y divide-white/5">
                <div className="px-3 py-2">
                  <div className="font-bold text-xs text-white">
                    {currentUser?.fullName || agencySettings.managerName}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {currentUser?.role === 'MANAGER' ? 'مدیر مسئول آژانس' : 'مشاور تخصصی املاک'}
                  </div>
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowToolsMenu(false);
                      onOpenAuthModal?.();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5 text-violet-400" />
                    <span>تغییر مشاور یا ورود</span>
                  </button>

                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowToolsMenu(false);
                        onNavigate('settings');
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 text-slate-400" />
                      <span>تنظیمات و اطلاعات آژانس</span>
                    </button>
                  )}
                </div>

                <div className="pt-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={isDownloadingZip}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{isDownloadingZip ? 'در حال آماده‌سازی...' : 'دانلود سورس پروژه (ZIP)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowToolsMenu(false);
                      exportDatabaseJson();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-sky-400" />
                    <span>خروجی فایل پشتیبان JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowToolsMenu(false);
                      setIsResetModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-rose-400" />
                    <span>بازنشانی داده‌های نمونه</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* نوار جستجوی باز شونده در موبایل */}
      {showMobileSearch && (
        <div className="md:hidden border-t border-white/10 px-3 py-2 bg-[#090c17]/95 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی کد فایل، مشتری، محله، تلفن..."
              className="h-8 w-full rounded-xl border border-white/10 bg-white/[0.06] pr-8 pl-3 text-xs text-white placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
              autoFocus
            />
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[11px] text-slate-400 hover:text-white px-1.5 py-1"
            >
              پاک
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowMobileSearch(false)}
            className="rounded-lg p-1 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* مدال تایید بازنشانی داده‌های دیتابیس */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="بازنشانی کل داده‌های سامانه"
        message="آیا از بازنشانی کلیه داده‌های CRM به مقادیر اولیه اطمینان دارید؟ تمام تغییرات به داده‌های پیش‌فرض برمی‌گردد."
        confirmText="بله، بازنشانی شود"
        cancelText="انصراف"
        onConfirm={resetToDefaults}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </header>
  );
};
