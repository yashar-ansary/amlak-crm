// مسیر فایل: src/components/calculator/CalculatorView.tsx
// ماشین‌حساب تخصصی اتحادیه مشاوران املاک، محاسبه قانونی کمیسیون و تبدیل رهن و اجاره

import React, { useState } from 'react';
import { Calculator, ArrowLeftRight, Check, ShieldCheck, Percent } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import {
  calculateSaleCommission,
  calculateRentCommission,
  convertDepositAndRent,
  formatToman,
  toPersianDigits,
  toEnglishDigits,
} from '../../utils/jalali';

export const CalculatorView: React.FC = () => {
  const { agencySettings } = useCrm();

  // تب‌های ماشین حساب
  const [activeTab, setActiveTab] = useState<'COMMISSION_SALE' | 'COMMISSION_RENT' | 'CONVERT_RENT'>(
    'COMMISSION_SALE'
  );

  // حالت ۱: کمیسیون فروش
  const [salePrice, setSalePrice] = useState('18500000000');
  const [agentSalePercent, setAgentSalePercent] = useState('40');

  // حالت ۲: کمیسیون رهن و اجاره
  const [rentDeposit, setRentDeposit] = useState('1200000000');
  const [monthlyRent, setMonthlyRent] = useState('28000000');
  const [agentRentPercent, setAgentRentPercent] = useState('40');

  // حالت ۳: تبدیل رهن و اجاره
  const [currentDeposit, setCurrentDeposit] = useState('1000000000');
  const [currentRent, setCurrentRent] = useState('30000000');
  const [targetDeposit, setTargetDeposit] = useState('1500000000');
  const [interestRate, setInterestRate] = useState('3'); // ۳ درصد عرفی

  // محاسبات فروش با نرخ مصوب تنظیمات
  const saleRate = agencySettings?.defaultCommissionRate !== undefined ? agencySettings.defaultCommissionRate : 0.25;
  const vatRate = agencySettings?.vatRate !== undefined ? agencySettings.vatRate : 10;
  const saleNum = parseFloat(toEnglishDigits(salePrice)) || 0;
  const saleCalc = calculateSaleCommission(saleNum, saleRate, vatRate);
  const agentSaleShare = Math.round(saleCalc.totalBase * ((parseFloat(agentSalePercent) || 40) / 100));

  // محاسبات رهن و اجاره
  const rentDepositNum = parseFloat(toEnglishDigits(rentDeposit)) || 0;
  const monthlyRentNum = parseFloat(toEnglishDigits(monthlyRent)) || 0;
  const rentCalc = calculateRentCommission(rentDepositNum, monthlyRentNum, vatRate);
  const agentRentShare = Math.round(rentCalc.totalBase * ((parseFloat(agentRentPercent) || 40) / 100));

  // محاسبات تبدیل
  const curDepNum = parseFloat(toEnglishDigits(currentDeposit)) || 0;
  const curRentNum = parseFloat(toEnglishDigits(currentRent)) || 0;
  const tarDepNum = parseFloat(toEnglishDigits(targetDeposit)) || 0;
  const intRateNum = parseFloat(toEnglishDigits(interestRate)) || 3;
  const conversionResult = convertDepositAndRent(curDepNum, curRentNum, tarDepNum, intRateNum);

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30">
            <Calculator className="h-5 w-5 text-violet-200" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">ماشین‌حساب تخصصی اتحادیه مشاوران املاک</h2>
            <p className="text-xs text-slate-400 mt-1">
              محاسبه تعرفه مصوب حق‌الزحمه دلالی، ارزش افزوده قانونی و فرمول‌های تبدیل رهن و اجاره
            </p>
          </div>
        </div>
      </div>

      {/* تب‌های سگمنتد ابزار */}
      <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1 w-fit backdrop-blur-xl">
        <button
          onClick={() => setActiveTab('COMMISSION_SALE')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'COMMISSION_SALE'
              ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          کمیسیون قانونی فروش
        </button>
        <button
          onClick={() => setActiveTab('COMMISSION_RENT')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'COMMISSION_RENT'
              ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          کمیسیون قانونی رهن و اجاره
        </button>
        <button
          onClick={() => setActiveTab('CONVERT_RENT')}
          className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === 'CONVERT_RENT'
              ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          تبدیل رهن به اجاره (عرفی)
        </button>
      </div>

      {/* بخش ۱: کمیسیون فروش */}
      {activeTab === 'COMMISSION_SALE' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-xl shadow-black/25 lg:col-span-6 space-y-4">
            <h3 className="text-sm font-bold text-white">ورود ارقام معامله خرید و فروش</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ثمن کل معامله (تومان)
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="10000000000"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
              <span className="block mt-1.5 text-[11px] text-violet-300 num-fa">
                معادل: {formatToman(saleNum)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                درصد سهم پورسانت مشاور پرونده (٪)
              </label>
              <input
                type="number"
                value={agentSalePercent}
                onChange={(e) => setAgentSalePercent(e.target.value)}
                placeholder="40"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>

            <div className="rounded-xl bg-white/[0.03] p-3.5 text-xs text-slate-300 leading-relaxed border border-white/10">
              <span className="font-bold text-white">مبنای قانونی اتحادیه: </span>
              ۰.۲۵٪ از کل ثمن معامله سهم هر یک از طرفین (خریدار و فروشنده) + ۱۰٪ مالیات بر ارزش افزوده.
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 via-[#10242b]/70 to-[#0e1226]/80 p-6 backdrop-blur-2xl shadow-xl shadow-black/25 lg:col-span-6 space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>نتیجه محاسبه رسمی کمیسیون فروش</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-xs">
                <span className="text-slate-300">سهم کمیسیون خریدار (بدون مالیات):</span>
                <span className="font-bold text-white num-fa">{formatToman(saleCalc.oneSideBase)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-xs">
                <span className="text-slate-300">مالیات بر ارزش افزوده سهم خریدار (۱۰٪):</span>
                <span className="font-bold text-white num-fa">{formatToman(saleCalc.oneSideVat)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2.5 text-xs">
                <span className="font-bold text-emerald-300">مجموع قابل پرداخت هر طرف (با مالیات):</span>
                <span className="font-bold text-emerald-400 num-fa">{formatToman(saleCalc.oneSideTotal)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-xs">
                <span className="font-bold text-white">کل درآمد کمیسیون دفتر (از هر دو طرف):</span>
                <span className="text-sm font-black text-white num-fa">{formatToman(saleCalc.totalBase)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-bold">سهم خالص مشاور پرونده ({agentSalePercent}٪):</span>
                <span className="text-sm font-bold text-emerald-400 num-fa">{formatToman(agentSaleShare)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* بخش ۲: کمیسیون رهن و اجاره */}
      {activeTab === 'COMMISSION_RENT' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-xl shadow-black/25 lg:col-span-6 space-y-4">
            <h3 className="text-sm font-bold text-white">ورود ارقام قرارداد اجاره</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                مبلغ قرض‌الحسنه / ودیعه (تومان)
              </label>
              <input
                type="number"
                value={rentDeposit}
                onChange={(e) => setRentDeposit(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
              <span className="block mt-1.5 text-[11px] text-violet-300 num-fa">
                معادل: {formatToman(rentDepositNum)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اجاره ماهانه (تومان)
              </label>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
              <span className="block mt-1.5 text-[11px] text-violet-300 num-fa">
                معادل: {formatToman(monthlyRentNum)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                درصد سهم پورسانت مشاور (٪)
              </label>
              <input
                type="number"
                value={agentRentPercent}
                onChange={(e) => setAgentRentPercent(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-950/60 via-[#19153a]/70 to-[#0e1226]/80 p-6 backdrop-blur-2xl shadow-xl shadow-black/25 lg:col-span-6 space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <ShieldCheck className="h-4 w-4 text-violet-400" />
              <span>نتیجه محاسبه کمیسیون رهن و اجاره</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-xs">
                <span className="text-slate-300">اجاره ماهانه هم‌ارز (با تبدیل ودیعه به اجاره):</span>
                <span className="font-bold text-white num-fa">
                  {formatToman(rentCalc.equivalentMonthlyRent)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-xs">
                <span className="text-slate-300">سهم کمیسیون هر طرف (یک‌چهارم اجاره هم‌ارز):</span>
                <span className="font-bold text-white num-fa">{formatToman(rentCalc.oneSideBase)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-violet-500/30 pb-2.5 text-xs">
                <span className="font-bold text-violet-300">مجموع قابل پرداخت هر طرف (با ۱۰٪ مالیات):</span>
                <span className="font-bold text-violet-200 num-fa">{formatToman(rentCalc.oneSideTotal)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-xs">
                <span className="font-bold text-white">کل درآمد کمیسیون دفتر:</span>
                <span className="text-sm font-black text-white num-fa">{formatToman(rentCalc.totalBase)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-violet-300 font-bold">سهم مشاور ({agentRentPercent}٪):</span>
                <span className="text-sm font-bold text-violet-200 num-fa">{formatToman(agentRentShare)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* بخش ۳: تبدیل رهن و اجاره */}
      {activeTab === 'CONVERT_RENT' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-xl shadow-black/25 lg:col-span-6 space-y-4">
            <h3 className="text-sm font-bold text-white">مشخصات اولیه و تبدیل دلخواه</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">ودیعه فعلی (تومان)</label>
                <input
                  type="number"
                  value={currentDeposit}
                  onChange={(e) => setCurrentDeposit(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">اجاره فعلی (تومان)</label>
                <input
                  type="number"
                  value={currentRent}
                  onChange={(e) => setCurrentRent(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ودیعه مدنظر جدید (تومان)
              </label>
              <input
                type="number"
                value={targetDeposit}
                onChange={(e) => setTargetDeposit(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                درصد عرف تبدیل (معمولاً ۳ درصد = صدی ۳ میلیون)
              </label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="3"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-br from-sky-950/60 via-[#102035]/70 to-[#0e1226]/80 p-6 backdrop-blur-2xl shadow-xl shadow-black/25 lg:col-span-6 space-y-5">
            <div className="flex items-center gap-2 text-white font-bold text-xs">
              <ArrowLeftRight className="h-4 w-4 text-sky-400" />
              <span>نتیجه تبدیل رهن و اجاره</span>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-white/[0.04] p-4.5 border border-white/10 text-xs space-y-2">
                <span className="text-slate-400">مبلغ ودیعه جدید:</span>
                <div className="text-base font-bold text-white num-fa">
                  {formatToman(conversionResult.newDeposit)}
                </div>
              </div>

              <div className="rounded-2xl bg-white/[0.04] p-4.5 border border-white/10 text-xs space-y-2">
                <span className="text-slate-400">اجاره ماهانه جدید محاسبه‌شده:</span>
                <div className="text-base font-black text-sky-300 num-fa">
                  {formatToman(conversionResult.newRent)}
                </div>
              </div>

              <div className="text-xs text-slate-300 bg-white/[0.03] p-3.5 rounded-2xl border border-white/10">
                اختلاف ماهانه اجاره:{' '}
                <span className="font-bold text-white num-fa">
                  {formatToman(conversionResult.monthlyDifference)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
