import React, { useState, useEffect } from 'react';
import { X, MapPin, Check, AlertCircle, Plus, Tag, Building2 } from 'lucide-react';
import { District } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';
import {
  formatToman,
  toEnglishDigits,
  toPersianDigits,
  formatWithCommas,
  cleanNumericValue,
  numberToPersianWords,
} from '../../utils/jalali';

interface DistrictFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editDistrict?: District | null;
}

const COMMON_TAGS = [
  'لوکس',
  'نوساز',
  'ویلایی',
  'برج‌باغ',
  'دسترسی مترو',
  'کوهپایه‌ای',
  'اداری و تجاری',
  'سفارت‌نشین',
  'دنج و خلوت',
  'اصیل',
  'خوش‌نقشه',
  'پرتقاضا',
  'سرمایه‌گذاری',
  'مشجر و سرسبز',
];

export const DistrictFormModal: React.FC<DistrictFormModalProps> = ({
  isOpen,
  onClose,
  editDistrict,
}) => {
  const { addDistrict, updateDistrict } = useCrm();

  const [name, setName] = useState('');
  const [municipalityZone, setMunicipalityZone] = useState('2');
  const [city, setCity] = useState('تهران');
  const [avgSalePricePerMeter, setAvgSalePricePerMeter] = useState('');
  const [avgRentDepositPerMeter, setAvgRentDepositPerMeter] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editDistrict) {
      setName(editDistrict.name);
      setMunicipalityZone(editDistrict.municipalityZone.toString());
      setCity(editDistrict.city || 'تهران');
      setAvgSalePricePerMeter(
        editDistrict.avgSalePricePerMeter ? formatWithCommas(editDistrict.avgSalePricePerMeter) : ''
      );
      setAvgRentDepositPerMeter(
        editDistrict.avgRentDepositPerMeter ? formatWithCommas(editDistrict.avgRentDepositPerMeter) : ''
      );
      setStatus(editDistrict.status || 'ACTIVE');
      setTags(editDistrict.tags || []);
      setDescription(editDistrict.description || '');
    } else {
      setName('');
      setMunicipalityZone('2');
      setCity('تهران');
      setAvgSalePricePerMeter('');
      setAvgRentDepositPerMeter('');
      setStatus('ACTIVE');
      setTags(['لوکس', 'نوساز']);
      setDescription('');
    }
    setError('');
  }, [editDistrict, isOpen]);

  if (!isOpen) return null;

  const handleToggleTag = (tagToToggle: string) => {
    if (tags.includes(tagToToggle)) {
      setTags(tags.filter((t) => t !== tagToToggle));
    } else {
      setTags([...tags, tagToToggle]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setNewTagInput('');
    }
  };

  const handlePriceChange = (val: string, setter: (v: string) => void) => {
    const numeric = cleanNumericValue(val);
    setter(numeric > 0 ? formatWithCommas(numeric) : '');
  };

  const addPriceDelta = (currentVal: string, delta: number, setter: (v: string) => void) => {
    const current = cleanNumericValue(currentVal);
    const nextVal = Math.max(0, current + delta);
    setter(nextVal > 0 ? formatWithCommas(nextVal) : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('لطفاً نام محله یا منطقه را وارد نمایید.');
      return;
    }

    const zoneNumber = parseInt(toEnglishDigits(municipalityZone), 10);
    if (isNaN(zoneNumber) || zoneNumber < 1 || zoneNumber > 22) {
      setError('منطقه شهرداری باید عددی بین ۱ تا ۲۲ باشد.');
      return;
    }

    const salePrice = cleanNumericValue(avgSalePricePerMeter);
    const rentDeposit = cleanNumericValue(avgRentDepositPerMeter);

    if (editDistrict) {
      updateDistrict(editDistrict.id, {
        name: name.trim(),
        municipalityZone: zoneNumber,
        city: city.trim(),
        avgSalePricePerMeter: salePrice,
        avgRentDepositPerMeter: rentDeposit,
        status,
        tags,
        description: description.trim(),
      });
    } else {
      addDistrict({
        name: name.trim(),
        municipalityZone: zoneNumber,
        city: city.trim(),
        avgSalePricePerMeter: salePrice,
        avgRentDepositPerMeter: rentDeposit,
        status,
        tags,
        description: description.trim(),
      });
    }

    onClose();
  };

  const saleNum = cleanNumericValue(avgSalePricePerMeter);
  const rentNum = cleanNumericValue(avgRentDepositPerMeter);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center bg-black/85 backdrop-blur-md overflow-y-auto p-0 sm:p-4">
      {/* پس‌زمینه برای کلیک بیرون مدال */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/15 bg-[#0e1226]/98 backdrop-blur-3xl shadow-2xl text-white max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* دستگیره لمسی بالای مدال در نسخه موبایل */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* هدر مدال ثابت */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {editDistrict ? `ویرایش محله «${editDistrict.name}»` : 'ثبت محله و منطقه جدید'}
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate sm:whitespace-normal">
                تعریف محدوده جغرافیایی، منطقه شهرداری و مظنه متری
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors shrink-0"
            title="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* بدنه اسکرول‌شونده فرم */}
        <form onSubmit={handleSubmit} id="districtForm" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4.5 overscroll-contain">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-500/15 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* نام محله و منطقه شهرداری */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                نام محله / منطقه <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: سعادت‌آباد، نیاوران، الهیه"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs font-semibold text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                منطقه شهرداری (۱ تا ۲۲) <span className="text-rose-400">*</span>
              </label>
              <select
                value={municipalityZone}
                onChange={(e) => setMunicipalityZone(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0e1226] px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
              >
                {Array.from({ length: 22 }, (_, i) => i + 1).map((z) => (
                  <option key={z} value={z.toString()}>
                    منطقه {toPersianDigits(z)} شهرداری
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* شهر و وضعیت پوشش */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">شهر محل فعالیت</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="تهران"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">وضعیت پوشش آژانس</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'ARCHIVED')}
                className="w-full rounded-xl border border-white/10 bg-[#0e1226] px-3.5 py-2.5 text-xs text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="ACTIVE">فعال (تحت پوشش و فایل‌گیری)</option>
                <option value="ARCHIVED">بایگانی / غیرفعال</option>
              </select>
            </div>
          </div>

          {/* شاخص‌های مظنه متری با جداسازی سه‌رقمی */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:p-4 space-y-3.5 backdrop-blur-md">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>شاخص‌های مظنه متری محله</span>
              <span className="text-[11px] font-normal text-slate-400">واحد: تومان به ازای هر متر مربع</span>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {/* میانگین متری فروش */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300">
                  میانگین متری خرید و فروش (تومان)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={avgSalePricePerMeter}
                    onChange={(e) => handlePriceChange(e.target.value, setAvgSalePricePerMeter)}
                    placeholder="مثال: ۱۳۵,۰۰۰,۰۰۰"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] pr-3.5 pl-24 py-2.5 text-xs font-bold num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
                  />
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium bg-[#131730] px-1.5 py-0.5 rounded-md border border-white/5">
                    تومان / متر
                  </span>
                </div>

                {/* کلیدهای سریع افزایش قیمت فروش */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {[
                    { label: '+۵ م', delta: 5_000_000 },
                    { label: '+۱۰ م', delta: 10_000_000 },
                    { label: '+۵۰ م', delta: 50_000_000 },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => addPriceDelta(avgSalePricePerMeter, btn.delta, setAvgSalePricePerMeter)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                    >
                      {btn.label}
                    </button>
                  ))}
                  {avgSalePricePerMeter && (
                    <button
                      type="button"
                      onClick={() => setAvgSalePricePerMeter('')}
                      className="px-2 py-1 rounded-lg text-[10px] text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors"
                    >
                      پاک کردن
                    </button>
                  )}
                </div>

                {saleNum > 0 && (
                  <div className="text-[11px] text-emerald-400 font-bold num-fa leading-normal break-words bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-xl">
                    معادل: {numberToPersianWords(saleNum, 'تومان')} / هر متر
                  </div>
                )}
              </div>

              {/* میانگین متری رهن کامل */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300">
                  میانگین رهن کامل متری (تومان)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={avgRentDepositPerMeter}
                    onChange={(e) => handlePriceChange(e.target.value, setAvgRentDepositPerMeter)}
                    placeholder="مثال: ۲۲,۰۰۰,۰۰۰"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] pr-3.5 pl-24 py-2.5 text-xs font-bold num-fa text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
                  />
                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium bg-[#131730] px-1.5 py-0.5 rounded-md border border-white/5">
                    تومان / متر
                  </span>
                </div>

                {/* کلیدهای سریع افزایش رهن */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {[
                    { label: '+۲ م', delta: 2_000_000 },
                    { label: '+۵ م', delta: 5_000_000 },
                    { label: '+۱۰ م', delta: 10_000_000 },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => addPriceDelta(avgRentDepositPerMeter, btn.delta, setAvgRentDepositPerMeter)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                    >
                      {btn.label}
                    </button>
                  ))}
                  {avgRentDepositPerMeter && (
                    <button
                      type="button"
                      onClick={() => setAvgRentDepositPerMeter('')}
                      className="px-2 py-1 rounded-lg text-[10px] text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 transition-colors"
                    >
                      پاک کردن
                    </button>
                  )}
                </div>

                {rentNum > 0 && (
                  <div className="text-[11px] text-sky-400 font-bold num-fa leading-normal break-words bg-sky-500/10 border border-sky-500/20 px-2.5 py-1.5 rounded-xl">
                    معادل: {numberToPersianWords(rentNum, 'تومان')} / هر متر
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ویژگی‌ها و برچسب‌های محله (انتخاب با یک لمس در موبایل) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                ویژگی‌ها و برچسب‌های محله
              </label>
              <span className="text-[11px] text-slate-400">
                لمس کنید تا فعال/غیرفعال شود
              </span>
            </div>

            {/* چیپ‌های انتخاب سریع برچسب */}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 rounded-xl bg-white/[0.02] border border-white/5">
              {COMMON_TAGS.map((t) => {
                const isSelected = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleToggleTag(t)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-emerald-500/25 border border-emerald-500/50 text-emerald-200 shadow-sm'
                        : 'bg-white/[0.04] border border-white/10 text-slate-400 hover:bg-white/[0.08] hover:text-slate-200'
                    }`}
                  >
                    {isSelected ? <Check className="h-3 w-3 text-emerald-300" /> : <Plus className="h-3 w-3 text-slate-500" />}
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>

            {/* اینپوت برچسب دلخواه */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  }
                }}
                placeholder="تایپ برچسب سفارشی جدید..."
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomTag}
                className="flex items-center gap-1 rounded-xl bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-white/20 border border-white/10 transition-colors shrink-0 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>افزودن</span>
              </button>
            </div>

            {/* برچسب‌های سفارشی انتخاب‌شده که در لیست مشترک نبودند */}
            {tags.filter((t) => !COMMON_TAGS.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags
                  .filter((t) => !COMMON_TAGS.includes(t))
                  .map((customTag) => (
                    <span
                      key={customTag}
                      className="inline-flex items-center gap-1 rounded-xl bg-violet-500/20 border border-violet-500/40 px-2.5 py-1 text-[11px] font-semibold text-violet-200"
                    >
                      <span>{customTag}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleTag(customTag)}
                        className="text-violet-300 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* توضیحات و بافت شهری */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              توضیحات، بافت شهری و دسترسی‌ها
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="خیابان‌های اصلی، مراکز خرید، وضعیت ترافیک و دسترسی به بزرگراه‌ها..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] p-3 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:bg-white/[0.08] focus:outline-none"
            />
          </div>
        </form>

        {/* فوتر مدال ثابت با دکمه‌های مناسب تاچ موبایل و safe area */}
        <div className="flex items-center gap-3 p-3.5 sm:px-6 sm:py-4 border-t border-white/10 bg-[#0e1226]/95 backdrop-blur-xl shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 sm:py-2.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors text-center"
          >
            انصراف
          </button>
          <button
            type="submit"
            form="districtForm"
            className="flex-[2] sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 sm:py-2.5 text-xs font-bold text-white hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950/40 active:scale-95 transition-all text-center"
          >
            <Check className="h-4 w-4" />
            <span>{editDistrict ? 'ذخیره تغییرات' : 'ثبت محله جدید'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
