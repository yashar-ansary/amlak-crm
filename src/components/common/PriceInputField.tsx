// مسیر فایل: src/components/common/PriceInputField.tsx
// کامپوننت فیلد ورود قیمت با جداسازی سه‌رقمی خودکار و نمایش همزمان معادل به حروف و خلاصه بازاری

import React from 'react';
import { Banknote, X, Plus } from 'lucide-react';
import {
  toPersianDigits,
  toEnglishDigits,
  formatWithCommas,
  cleanNumericValue,
  numberToPersianWords,
  formatPriceCompact,
} from '../../utils/jalali';

export interface PricePreset {
  label: string;
  amount: number;
}

interface PriceInputFieldProps {
  label: string;
  value: string | number | undefined;
  onChange: (rawValue: string, formattedValue: string, numericValue: number) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  unit?: string;
  quickPresets?: PricePreset[];
  secondaryInfo?: React.ReactNode;
  helperText?: string;
  className?: string;
}

export const PriceInputField: React.FC<PriceInputFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'مثال: 15,000,000,000',
  required = false,
  disabled = false,
  id,
  unit = 'تومان',
  quickPresets,
  secondaryInfo,
  helperText,
  className = '',
}) => {
  // مقدار عددی خالص
  const numericVal = cleanNumericValue(value);
  // نمایش جداسازی سه‌رقمی در فیلد متنی
  const displayValue = numericVal > 0 ? formatWithCommas(numericVal, true) : '';

  // تبدیل به حروف فارسی
  const persianWords = numericVal > 0 ? numberToPersianWords(numericVal, unit) : '';
  // فرمت خلاصه بازاری (مثال: ۱۵.۵ میلیارد تومان)
  const compactText = numericVal > 0 ? formatPriceCompact(numericVal) : '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const cleanNum = cleanNumericValue(rawInput);
    if (cleanNum === 0 && rawInput.trim() === '') {
      onChange('', '', 0);
      return;
    }
    const rawStr = cleanNum.toString();
    const formatted = formatWithCommas(cleanNum, true);
    onChange(rawStr, formatted, cleanNum);
  };

  const handleAddPreset = (amountToAdd: number) => {
    const current = numericVal || 0;
    const newTotal = current + amountToAdd;
    const rawStr = newTotal.toString();
    const formatted = formatWithCommas(newTotal, true);
    onChange(rawStr, formatted, newTotal);
  };

  const handleClear = () => {
    onChange('', '', 0);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-200">
          {label} {required && <span className="text-rose-400">*</span>}
        </label>
        {numericVal > 0 && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
            title="پاک کردن مبلغ"
          >
            <X className="h-3 w-3" />
            <span>پاک کردن</span>
          </button>
        )}
      </div>

      {/* ورودی متن با جداسازی ۳ رقمی */}
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={displayValue}
          onChange={handleInputChange}
          placeholder={toPersianDigits(placeholder)}
          disabled={disabled}
          className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-left font-mono text-sm font-semibold tracking-wider text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.09] focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:bg-white/[0.02] disabled:text-slate-500 transition-all"
        />
        <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-medium text-slate-400">
          {unit}
        </div>
      </div>

      {/* نمایش همزمان معادل به حروف فارسی و خلاصه بازاری */}
      {numericVal > 0 ? (
        <div className="rounded-xl border border-violet-500/25 bg-violet-950/30 p-2.5 text-xs text-violet-200 backdrop-blur-md shadow-sm transition-all">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-xs">
              <Banknote className="h-3 w-3" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5 leading-snug">
                <span className="font-semibold text-slate-300">معادل به حروف:</span>
                <span className="font-bold text-violet-300">{persianWords}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>نمایش بازاری:</span>
                <span className="rounded-md bg-violet-500/20 px-2 py-0.5 font-bold text-violet-200 border border-violet-500/30">
                  {compactText}
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-slate-300">{toPersianDigits(formatWithCommas(numericVal, false))} {unit}</span>
              </div>
            </div>
          </div>
        </div>
      ) : helperText ? (
        <p className="text-[11px] text-slate-400">{helperText}</p>
      ) : null}

      {/* دکمه‌های مقادیر سریع و پرکاربرد */}
      {quickPresets && quickPresets.length > 0 && !disabled && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-slate-400 ml-1">افزایش سریع:</span>
          {quickPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAddPreset(preset.amount)}
              className="inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:border-violet-500/40 hover:bg-white/[0.1] active:scale-95 transition-all"
            >
              <Plus className="h-2.5 w-2.5 text-violet-400" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* اطلاعات تکمیلی ثانویه (مثلاً قیمت متری محاسبه شده) */}
      {secondaryInfo && <div className="pt-0.5">{secondaryInfo}</div>}
    </div>
  );
};
