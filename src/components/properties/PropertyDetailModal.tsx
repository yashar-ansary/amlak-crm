// مسیر فایل: src/components/properties/PropertyDetailModal.tsx
// مدال نمایش جزئیات کامل فایل ملک با قابلیت صدور فیش مشخصات چاپی و اشتراک در پیام‌رسان‌ها

import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Calendar,
  Building,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { Property } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';
import {
  formatToman,
  formatPriceCompact,
  toPersianDigits,
  PROPERTY_TYPE_NAMES,
  TRANSACTION_TYPE_NAMES,
} from '../../utils/jalali';

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenScheduleViewing: (property: Property) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  isOpen,
  onClose,
  onOpenScheduleViewing,
}) => {
  const { findMatchesForProperty, agencySettings } = useCrm();
  const [copied, setCopied] = useState(false);
  const [printMode, setPrintMode] = useState(false);

  if (!isOpen || !property) return null;

  const matches = findMatchesForProperty(property);

  // آماده‌سازی متن آگهی برای ارسال در پیام‌رسان‌ها
  const shareText = `🏢 معرفی فایل ملکی - ${agencySettings?.agencyName || 'سامانه املاک'}
کد فایل: ${property.propertyCode}
عنوان: ${property.title}
نوع معامله: ${TRANSACTION_TYPE_NAMES[property.transactionType]}
محله: ${property.district}
متراژ: ${toPersianDigits(property.area)} متر | ${toPersianDigits(property.rooms)} خواب | طبقه ${toPersianDigits(property.floor || 1)}
امکانات: ${property.hasParking ? 'پارکینگ ' : ''}${property.hasElevator ? 'آسانسور ' : ''}${property.hasStorage ? 'انباری ' : ''}${property.hasBalcony ? 'تراس' : ''}
${property.transactionType === 'SALE' ? `قیمت کل: ${formatPriceCompact(property.priceTotal)}` : `رهن: ${formatPriceCompact(property.deposit)} | اجاره: ${formatToman(property.monthlyRent)}`}
مشاور مسئول: ${property.agentName}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl sm:rounded-3xl border border-white/15 bg-[#0e1226]/95 backdrop-blur-3xl shadow-2xl max-h-[94vh] flex flex-col text-white">
        {/* هدر مدال مشخصات پرونده ملک */}
        <div className="border-b border-white/10 px-4 sm:px-6 py-3.5 sm:py-4 bg-white/[0.02]">
          <div className="flex items-center justify-between gap-3">
            {/* برچسب‌های مشخصات پرونده */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="flex items-center gap-1 text-[11px] font-bold text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-lg">
                <Building className="h-3 w-3 text-violet-300" />
                <span>شناسنامه پرونده ملک</span>
              </span>
              <span className="num-fa text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                کد: {property.propertyCode}
              </span>
              <span className="text-[11px] font-semibold text-slate-300 bg-white/[0.06] border border-white/10 px-2 py-0.5 rounded-lg">
                {TRANSACTION_TYPE_NAMES[property.transactionType]} · {PROPERTY_TYPE_NAMES[property.propertyType]}
              </span>
            </div>

            {/* دکمه‌های اقدام بالای هدر */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopy}
                title="کپی مشخصات فایل برای واتساپ و تلگرام"
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/15 hover:text-white transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{copied ? 'کپی شد' : 'کپی آگهی'}</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                title="چاپ شناسنامه پرونده ملک"
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/15 hover:text-white transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">چاپ</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                title="بستن"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* ردیف دوم هدر: عنوان کامل پرونده و موقعیت */}
          <div className="mt-2.5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
            <h2 className="text-sm sm:text-base font-bold text-white leading-snug">
              {property.title}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
              <MapPin className="h-3 w-3 text-violet-400" />
              <span>محله {property.district} · {toPersianDigits(property.area)} متر</span>
            </div>
          </div>
        </div>

        {/* محتوای اصلی مشخصات ملک */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {/* کارت مالی و قیمت */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4.5 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400">
                  نوع معامله: {TRANSACTION_TYPE_NAMES[property.transactionType]} · {PROPERTY_TYPE_NAMES[property.propertyType]}
                </span>
                <div className="mt-1 text-lg font-bold text-white num-fa">
                  {property.transactionType === 'SALE' ? (
                    <div>
                      <span>{formatPriceCompact(property.priceTotal)}</span>
                      {property.pricePerMeter && (
                        <span className="mr-3 text-xs font-normal text-slate-400">
                          (هر متر: {formatToman(property.pricePerMeter)})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <span>ودیعه: {formatPriceCompact(property.deposit)}</span>
                      <span className="text-white/20">|</span>
                      <span>اجاره: {formatToman(property.monthlyRent)}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenScheduleViewing(property)}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white hover:brightness-110 transition-all shadow-lg shadow-emerald-600/30 active:scale-95"
              >
                <Calendar className="h-4 w-4" />
                <span>هماهنگی بازدید برای مشتری</span>
              </button>
            </div>
          </div>

          {/* مشخصات مهندسی و فنی */}
          <div>
            <h3 className="text-xs font-bold text-white mb-3">مشخصات ساختمانی و فیزیکی</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              <div className="rounded-xl border border-white/10 p-3 bg-white/[0.03]">
                <span className="text-slate-400">متراژ زیربنا:</span>
                <div className="num-fa font-bold text-white mt-1">{toPersianDigits(property.area)} متر مربع</div>
              </div>
              <div className="rounded-xl border border-white/10 p-3 bg-white/[0.03]">
                <span className="text-slate-400">تعداد اتاق:</span>
                <div className="num-fa font-bold text-white mt-1">{toPersianDigits(property.rooms)} خواب</div>
              </div>
              <div className="rounded-xl border border-white/10 p-3 bg-white/[0.03]">
                <span className="text-slate-400">طبقه و واحد:</span>
                <div className="num-fa font-bold text-white mt-1">
                  طبقه {toPersianDigits(property.floor || 1)} از {toPersianDigits(property.totalFloors || 5)}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 p-3 bg-white/[0.03]">
                <span className="text-slate-400">سال ساخت:</span>
                <div className="num-fa font-bold text-white mt-1">{toPersianDigits(property.builtYear || 1400)} شمسی</div>
              </div>
            </div>
          </div>

          {/* تجهیزات و امکانات */}
          <div>
            <h3 className="text-xs font-bold text-white mb-2">امکانات رفاهی و تاسیسات</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
              <div className={`flex items-center gap-1.5 p-2.5 rounded-xl border ${property.hasParking ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-white/[0.02] text-slate-500'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>پارکینگ سندی</span>
              </div>
              <div className={`flex items-center gap-1.5 p-2.5 rounded-xl border ${property.hasElevator ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-white/[0.02] text-slate-500'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>آسانسور</span>
              </div>
              <div className={`flex items-center gap-1.5 p-2.5 rounded-xl border ${property.hasStorage ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-white/[0.02] text-slate-500'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>انباری اختصاصی</span>
              </div>
              <div className={`flex items-center gap-1.5 p-2.5 rounded-xl border ${property.hasBalcony ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-white/[0.02] text-slate-500'}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>تراس / بالکن</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300">
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5">
                سرمایش: <span className="font-semibold text-white">{property.coolingSystem || 'کولر آبی'}</span>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5">
                گرمایش: <span className="font-semibold text-white">{property.heatingSystem || 'پکیج'}</span>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5">
                وضعیت سند: <span className="font-semibold text-white">{property.documentType || 'سند شش‌دانگ'}</span>
              </div>
            </div>
          </div>

          {/* موقعیت مکانی و آدرس */}
          <div>
            <h3 className="text-xs font-bold text-white mb-2">موقعیت مکانی</h3>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <MapPin className="h-3.5 w-3.5 text-violet-400" />
                <span>{property.city} · منطقه {property.district}</span>
              </div>
              <p className="text-slate-300">{property.address || 'آدرس ثبت شده نزد مشاور'}</p>
            </div>
          </div>

          {/* اطلاعات مالک و مشاور مسئول */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <User className="h-3.5 w-3.5 text-amber-400" />
                <span>مشخصات مالک (محرمانه)</span>
              </div>
              <div>نام مالک: <span className="font-semibold text-white">{property.ownerName}</span></div>
              <div className="flex items-center gap-2">
                <span className="text-amber-200/80">تلفن تماس:</span>
                <a href={`tel:${property.ownerPhone}`} className="num-fa font-bold text-amber-300 hover:underline">
                  {property.ownerPhone}
                </a>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <Building className="h-3.5 w-3.5 text-violet-400" />
                <span>مشاور مسئول پرونده</span>
              </div>
              <div>کارشناس: <span className="font-semibold text-white">{property.agentName}</span></div>
              <div className="text-slate-400">تاریخ ثبت در سامانه: <span className="num-fa text-slate-300">{property.createdAtJalali}</span></div>
            </div>
          </div>

          {/* توضیحات */}
          {property.description && (
            <div>
              <h3 className="text-xs font-bold text-white mb-1">توضیحات و یادداشت مشاور</h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.03] p-3.5 rounded-xl border border-white/10">
                {property.description}
              </p>
            </div>
          )}

          {/* مشتریان بالقوه منطبق با این ملک */}
          {matches.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4.5 backdrop-blur-xl">
              <h3 className="text-xs font-bold text-emerald-300 mb-2.5">
                متقاضیان پیشنهادی سیستم برای این ملک ({toPersianDigits(matches.length)} خریدار منطبق)
              </h3>
              <div className="space-y-2">
                {matches.slice(0, 3).map(({ client, score }) => (
                  <div key={client.id} className="flex items-center justify-between bg-white/[0.04] p-3 rounded-xl border border-white/10 text-xs">
                    <div>
                      <span className="font-bold text-white">{client.fullName}</span>
                      <span className="mr-2 text-slate-400 num-fa">تلفن: {client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="num-fa font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-[11px]">
                        {toPersianDigits(score)}٪ تطبیق
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
