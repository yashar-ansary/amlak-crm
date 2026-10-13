// مسیر فایل: src/components/contracts/ContractPrintModal.tsx
// مدال پیش‌نویس رسمی مبایعه‌نامه و اجاره‌نامه با فرمت چاپی استاندارد اتحادیه املاک

import React from 'react';
import { X, Printer, ShieldCheck, Building2 } from 'lucide-react';
import { DealContract } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';
import { formatToman, toPersianDigits } from '../../utils/jalali';

interface ContractPrintModalProps {
  contract: DealContract | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContractPrintModal: React.FC<ContractPrintModalProps> = ({
  contract,
  isOpen,
  onClose,
}) => {
  const { agencySettings } = useCrm();
  if (!isOpen || !contract) return null;

  const isSale = contract.contractType === 'SALE_CONTRACT';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/15 bg-[#0e1226]/95 backdrop-blur-3xl shadow-2xl max-h-[95vh] flex flex-col text-white">
        {/* نوار ابزار بالا */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02] print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <span className="text-sm font-bold text-white">
              پیش‌نمایش پیش‌نویس قرارداد رسمی (کد: {contract.contractNumber})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:brightness-110 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>چاپ نسخه رسمی (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* سند قرارداد برای چاپ و مشاهده */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="bg-white text-slate-900 font-sans leading-relaxed text-xs space-y-5 p-8 rounded-2xl shadow-xl print:p-0 print:shadow-none">
          {/* سربرگ قرارداد */}
          <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-right text-[11px] text-slate-600">
                <div>جمهوری اسلامی ایران</div>
                <div>اتحادیه صنف مشاورین املاک</div>
              </div>
              <div className="text-center">
                <h1 className="text-base font-black text-slate-900">
                  {isSale ? 'مبایعه‌نامه اموال غیرمنقول (فروش)' : 'قرارداد اجاره اماکن مسکونی / تجاری'}
                </h1>
                <div className="text-[11px] text-slate-500 font-medium">
                  دفتر املاک و مستغلات {agencySettings?.agencyName || 'پارس ملک'} {agencySettings?.branchName ? `(${agencySettings.branchName})` : ''}
                </div>
              </div>
              <div className="text-left text-[11px] text-slate-600">
                <div>شماره ثبت: <span className="font-bold num-fa">{contract.contractNumber}</span></div>
                <div>تاریخ تنظیم: <span className="font-bold num-fa">{contract.signingDateJalali}</span></div>
              </div>
            </div>
          </div>

          {/* ماده ۱: طرفین قرارداد */}
          <div className="space-y-2">
            <h2 className="font-bold text-slate-900 text-xs border-r-2 border-slate-800 pr-2">
              ماده ۱ - مشخصات طرفین قرارداد
            </h2>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>
                <span className="font-bold text-slate-800">
                  {isSale ? 'طرف اول (فروشنده): ' : 'طرف اول (موجر): '}
                </span>
                <span>{contract.secondPartyName}</span>
                <span className="mr-2 num-fa text-slate-600">تلفن: {contract.secondPartyPhone}</span>
                {contract.secondPartyNationalCode && (
                  <span className="mr-2 num-fa text-slate-600">
                    کد ملی: {contract.secondPartyNationalCode}
                  </span>
                )}
              </div>
              <div>
                <span className="font-bold text-slate-800">
                  {isSale ? 'طرف دوم (خریدار): ' : 'طرف دوم (مستاجر): '}
                </span>
                <span>{contract.firstPartyName}</span>
                <span className="mr-2 num-fa text-slate-600">تلفن: {contract.firstPartyPhone}</span>
              </div>
            </div>
          </div>

          {/* ماده ۲: موضوع قرارداد و مشخصات مورد معامله */}
          <div className="space-y-2">
            <h2 className="font-bold text-slate-900 text-xs border-r-2 border-slate-800 pr-2">
              ماده ۲ - موضوع و مشخصات مورد معامله
            </h2>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p>
                عبارت است از انتقال قطعی / اجاره عین مستاجره یک واحد ملک به کد رهگیری{' '}
                <span className="font-bold num-fa">{contract.propertyCode}</span> تحت عنوان «
                <span className="font-bold">{contract.propertyTitle}</span>» واقع در نشانی:{' '}
                <span className="font-bold">{contract.propertyAddress}</span> با جمیع توابع، منضمات شرعی و عرفی اعم از انشعابات آب، برق، گاز، پارکینگ و انباری.
              </p>
            </div>
          </div>

          {/* ماده ۳: ثمن معامله یا مال‌الاجاره */}
          <div className="space-y-2">
            <h2 className="font-bold text-slate-900 text-xs border-r-2 border-slate-800 pr-2">
              ماده ۳ - مبالغ و ثمن معامله
            </h2>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              {isSale ? (
                <div>
                  <span>ثمن کل معامله مبلغ </span>
                  <span className="font-black text-slate-900 num-fa">{formatToman(contract.totalAmount)}</span>
                  <span> تعیین گردید که خریدار متعهد به تادیه آن در مواعد مقرر به فروشنده می‌باشد.</span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div>
                    <span>مبلغ قرض‌الحسنه (ودیعه): </span>
                    <span className="font-black text-slate-900 num-fa">{formatToman(contract.totalAmount)}</span>
                  </div>
                  <div>
                    <span>مال‌الاجاره ماهانه: </span>
                    <span className="font-black text-slate-900 num-fa">{formatToman(contract.monthlyRentAmount)}</span>
                    <span> که در ابتدای هر ماه شمسی مستاجر به حساب موجر کارسازی می‌نماید.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ماده ۴: شروط و زمان تحویل و تنظیم سند */}
          <div className="space-y-2">
            <h2 className="font-bold text-slate-900 text-xs border-r-2 border-slate-800 pr-2">
              ماده ۴ - تحویل و تنظیم سند
            </h2>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p>
                مورد معامله در تاریخ <span className="font-bold num-fa">{contract.handoverDateJalali || 'موعد مقرر'}</span> به‌صورت تخلیه و بدون معارض تحویل طرف دوم می‌گردد. طرفین متعهد شدند در تاریخ{' '}
                <span className="font-bold num-fa">{contract.notaryDateJalali || 'توافقی'}</span> جهت تنظیم سند رسمی در دفترخانه حضور به هم رسانند.
              </p>
              {contract.termsConditions && (
                <p className="mt-2 text-slate-700 border-t border-slate-200 pt-2">
                  <span className="font-bold">شروط خاص: </span>
                  {contract.termsConditions}
                </p>
              )}
            </div>
          </div>

          {/* ماده ۵: حق‌الزحمه مشاورین املاک */}
          <div className="space-y-2">
            <h2 className="font-bold text-slate-900 text-xs border-r-2 border-slate-800 pr-2">
              ماده ۵ - حق‌الزحمه مشاور املاک
            </h2>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <p>
                طرفین قرارداد متعهد و ملزم گردیدند که حق‌الزحمه کارشناسی و دلالی مشاور املاک را به میزان قانونی به مبلغ{' '}
                <span className="font-bold num-fa">{formatToman(contract.totalCommission)}</span> به علاوه مالیات بر ارزش افزوده به مبلغ{' '}
                <span className="font-bold num-fa">{formatToman(contract.vatAmount)}</span> همزمان با امضای این سند پرداخت نمایند.
              </p>
            </div>
          </div>

          {/* محل امضاها */}
          <div className="pt-8 border-t border-slate-300">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="border border-slate-200 rounded-lg p-4 h-28 flex flex-col justify-between">
                <span className="font-bold text-slate-800">امضا و اثر انگشت طرف اول</span>
                <span className="text-[10px] text-slate-400">فروشنده / موجر</span>
              </div>
              <div className="border border-slate-200 rounded-lg p-4 h-28 flex flex-col justify-between">
                <span className="font-bold text-slate-800">امضا و اثر انگشت طرف دوم</span>
                <span className="text-[10px] text-slate-400">خریدار / مستاجر</span>
              </div>
              <div className="border border-slate-200 rounded-lg p-4 h-28 flex flex-col justify-between">
                <span className="font-bold text-slate-800">شهود معامله</span>
                <span className="text-[10px] text-slate-400">شاهد ۱ و شاهد ۲</span>
              </div>
              <div className="border border-slate-200 rounded-lg p-4 h-28 flex flex-col justify-between bg-emerald-50/50">
                <span className="font-bold text-emerald-900">مهر و امضای مشاور املاک</span>
                <span className="text-[10px] text-emerald-700">دفتر معاملات {agencySettings?.agencyName || 'پارس ملک'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
