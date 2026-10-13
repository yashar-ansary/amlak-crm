// مسیر فایل: src/components/properties/PropertiesView.tsx
// نمای فهرست و بانک فایل‌های ملکی با فیلترهای پیشرفته و کارت‌های استاندارد

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Filter,
  Search,
  Building,
  MapPin,
  Maximize2,
  Trash2,
  Edit,
  Eye,
  SlidersHorizontal,
  Mic,
} from 'lucide-react';
import { Property, TransactionType, PropertyType } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';
import {
  formatPriceCompact,
  formatToman,
  toPersianDigits,
  PROPERTY_TYPE_NAMES,
  TRANSACTION_TYPE_NAMES,
} from '../../utils/jalali';
import { PropertyFormModal } from './PropertyFormModal';
import { PropertyDetailModal } from './PropertyDetailModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface PropertiesViewProps {
  onOpenNewProperty: () => void;
  onOpenVoiceProperty?: () => void;
  selectedPropertyId?: string | null;
  onSelectProperty: (id: string | null) => void;
  onOpenScheduleViewing: (property: Property) => void;
  searchQuery: string;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  onOpenNewProperty,
  onOpenVoiceProperty,
  selectedPropertyId,
  onSelectProperty,
  onOpenScheduleViewing,
  searchQuery,
}) => {
  const { properties, deleteProperty, districts } = useCrm();

  // فیلترها
  const [transactionFilter, setTransactionFilter] = useState<string>('ALL');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('');
  const [minRoomsFilter, setMinRoomsFilter] = useState<string>('ALL');
  const [onlyWithParking, setOnlyWithParking] = useState(false);
  const [onlyWithElevator, setOnlyWithElevator] = useState(false);

  // وضعیت ویرایش
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  // ملک انتخابی برای مشاهده جزئیات
  const activeProperty = useMemo(() => {
    return properties.find((p) => p.id === selectedPropertyId) || null;
  }, [properties, selectedPropertyId]);

  // لیست مناطق منحصر‌به‌فرد جهت انتخاب در فیلتر
  const availableDistricts = useMemo(() => {
    const set = new Set([
      ...districts.map((d) => d.name),
      ...properties.map((p) => p.district),
    ]);
    return Array.from(set)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'fa'));
  }, [properties, districts]);

  // اعمال فیلترها
  const filteredProperties = useMemo(() => {
    return properties.filter((prop) => {
      // جستجوی متنی
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          prop.title.toLowerCase().includes(q) ||
          prop.propertyCode.toLowerCase().includes(q) ||
          prop.district.toLowerCase().includes(q) ||
          prop.ownerName.toLowerCase().includes(q) ||
          prop.ownerPhone.includes(q);
        if (!matchesQuery) return false;
      }

      // فیلتر نوع معامله
      if (transactionFilter !== 'ALL' && prop.transactionType !== transactionFilter) {
        return false;
      }

      // فیلتر نوع ملک
      if (propertyTypeFilter !== 'ALL' && prop.propertyType !== propertyTypeFilter) {
        return false;
      }

      // فیلتر محله
      if (districtFilter && prop.district !== districtFilter) {
        return false;
      }

      // فیلتر تعداد خواب
      if (minRoomsFilter !== 'ALL' && prop.rooms < parseInt(minRoomsFilter, 10)) {
        return false;
      }

      // فیلتر پارکینگ و آسانسور
      if (onlyWithParking && !prop.hasParking) return false;
      if (onlyWithElevator && !prop.hasElevator) return false;

      return true;
    });
  }, [
    properties,
    searchQuery,
    transactionFilter,
    propertyTypeFilter,
    districtFilter,
    minRoomsFilter,
    onlyWithParking,
    onlyWithElevator,
  ]);

  return (
    <div className="space-y-6">
      {/* ردیف بالا: تب‌های نوع معامله و دکمه ثبت ملک */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        {/* تب‌های سگمنتد مجاز طبق ضوابط طراحی */}
        <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setTransactionFilter('ALL')}
            className={`rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold shrink-0 transition-all ${
              transactionFilter === 'ALL'
                ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            همه فایل‌ها ({toPersianDigits(properties.length)})
          </button>
          <button
            type="button"
            onClick={() => setTransactionFilter('SALE')}
            className={`rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold shrink-0 transition-all ${
              transactionFilter === 'SALE'
                ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            فروش و خرید
          </button>
          <button
            type="button"
            onClick={() => setTransactionFilter('RENT')}
            className={`rounded-xl px-2.5 sm:px-3 py-1.5 text-xs font-semibold shrink-0 transition-all ${
              transactionFilter === 'RENT'
                ? 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            رهن و اجاره
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onOpenVoiceProperty && (
            <button
              type="button"
              onClick={onOpenVoiceProperty}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:brightness-110 active:scale-95 transition-all"
            >
              <Mic className="h-4 w-4 text-violet-200 animate-pulse" />
              <span className="hidden sm:inline">ثبت صوتی فایل (Voice AI)</span>
              <span className="sm:hidden">ثبت با صوت</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenNewProperty}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">ثبت فایل ملک جدید</span>
            <span className="sm:hidden">ملک جدید</span>
          </button>
        </div>
      </div>

      {/* نوار فیلترهای چندگانه */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-xs backdrop-blur-2xl shadow-lg shadow-black/20">
        {/* فیلتر کاربری ملک */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">نوع کاربری</label>
          <select
            value={propertyTypeFilter}
            onChange={(e) => setPropertyTypeFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0e1226]/90 px-3 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="ALL">همه انواع کاربری</option>
            {Object.entries(PROPERTY_TYPE_NAMES).map(([key, name]) => (
              <option key={key} value={key} className="bg-[#0e1226] text-white">
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* فیلتر محله */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">محله و منطقه</label>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0e1226]/90 px-3 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="">همه محله‌ها</option>
            {availableDistricts.map((district) => (
              <option key={district} value={district} className="bg-[#0e1226] text-white">
                {district}
              </option>
            ))}
          </select>
        </div>

        {/* فیلتر حداقل خواب */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">حداقل خواب</label>
          <select
            value={minRoomsFilter}
            onChange={(e) => setMinRoomsFilter(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#0e1226]/90 px-3 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="ALL">فرقی ندارد</option>
            <option value="1">حداقل ۱ خواب</option>
            <option value="2">حداقل ۲ خواب</option>
            <option value="3">حداقل ۳ خواب</option>
            <option value="4">۴ خواب به بالا</option>
          </select>
        </div>

        {/* چک‌باکس‌های پارکینگ و آسانسور */}
        <div className="flex items-center gap-4 col-span-2 pt-4">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={onlyWithParking}
              onChange={(e) => setOnlyWithParking(e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"
            />
            <span>حتماً پارکینگ‌دار</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={onlyWithElevator}
              onChange={(e) => setOnlyWithElevator(e.target.checked)}
              className="rounded border-white/20 bg-white/10 text-violet-600 focus:ring-violet-500"
            />
            <span>دارای آسانسور</span>
          </label>
        </div>
      </div>

      {/* شبکه نمایش کارت‌های املاک */}
      {filteredProperties.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-xl">
          <Building className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-white">هیچ فایلی با این مشخصات یافت نشد</h3>
          <p className="mt-1 text-xs text-slate-400">
            فیلترها را تغییر دهید یا فایل جدیدی در سیستم ثبت نمایید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((prop) => (
            <div
              key={prop.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg shadow-black/20 backdrop-blur-xl hover:border-violet-500/40 hover:bg-white/[0.06] transition-all"
            >
              <div>
                {/* هدر کارت: کد فایل و نوع معامله */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="num-fa font-bold text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                      {prop.propertyCode}
                    </span>
                    <span>·</span>
                    <span>{PROPERTY_TYPE_NAMES[prop.propertyType]}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-violet-300 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-lg">
                    {TRANSACTION_TYPE_NAMES[prop.transactionType]}
                  </span>
                </div>

                {/* عنوان ملک */}
                <h3
                  onClick={() => onSelectProperty(prop.id)}
                  className="text-sm font-bold text-white hover:text-violet-300 cursor-pointer line-clamp-1 transition-colors"
                >
                  {prop.title}
                </h3>

                {/* موقعیت مکانی و متراژ */}
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300 font-medium">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {prop.district}
                  </span>
                  <span>·</span>
                  <span className="num-fa font-medium text-slate-200">
                    {toPersianDigits(prop.area)} متر
                  </span>
                  <span>·</span>
                  <span className="num-fa font-medium text-slate-200">
                    {toPersianDigits(prop.rooms)} خواب
                  </span>
                  {prop.floor && (
                    <>
                      <span>·</span>
                      <span className="num-fa text-slate-400">
                        طبقه {toPersianDigits(prop.floor)}
                      </span>
                    </>
                  )}
                </div>

                {/* امکانات کلیدی */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                  {prop.hasParking && <span className="bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-md">پارکینگ سندی</span>}
                  {prop.hasElevator && <span className="bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-md">آسانسور</span>}
                  {prop.hasStorage && <span className="bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-md">انباری</span>}
                  {prop.hasBalcony && <span className="bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded-md">تراس</span>}
                </div>
              </div>

              {/* بخش پایین کارت: مبالغ و اقدامات */}
              <div className="mt-5 border-t border-white/10 pt-3">
                <div className="mb-3">
                  {prop.transactionType === 'SALE' ? (
                    <div>
                      <div className="text-sm font-bold text-white num-fa">
                        {formatPriceCompact(prop.priceTotal)}
                      </div>
                      {prop.pricePerMeter && (
                        <div className="text-[11px] text-slate-400 num-fa">
                          متری: {formatToman(prop.pricePerMeter)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white num-fa">
                        ودیعه: {formatPriceCompact(prop.deposit)}
                      </div>
                      <div className="text-[11px] text-slate-400 num-fa">
                        اجاره ماهانه: {formatToman(prop.monthlyRent)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectProperty(prop.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] py-2 text-xs font-semibold text-slate-200 hover:bg-white/15 hover:text-white transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    <span>مشاهده مشخصات</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingProperty(prop);
                      setIsFormOpen(true);
                    }}
                    title="ویرایش فایل"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-400 hover:bg-violet-600/30 hover:border-violet-500/50 hover:text-violet-200 transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => setPropertyToDelete(prop)}
                    title="حذف فایل"
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-slate-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* مدال جزئیات فایل */}
      <PropertyDetailModal
        property={activeProperty}
        isOpen={Boolean(activeProperty)}
        onClose={() => onSelectProperty(null)}
        onOpenScheduleViewing={(p) => {
          onSelectProperty(null);
          onOpenScheduleViewing(p);
        }}
      />

      {/* مدال ویرایش فایل */}
      <PropertyFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProperty(null);
        }}
        editProperty={editingProperty}
        onOpenVoiceModal={onOpenVoiceProperty}
      />

      {/* مدال تایید حذف فایل ملک */}
      <ConfirmModal
        isOpen={!!propertyToDelete}
        title="حذف فایل ملک از سیستم"
        message={`آیا از حذف دائم فایل ملک کد «${propertyToDelete?.propertyCode}» (${propertyToDelete?.title}) اطمینان دارید؟`}
        confirmText="بله، حذف فایل"
        cancelText="انصراف"
        onConfirm={() => {
          if (propertyToDelete) {
            deleteProperty(propertyToDelete.id);
            setPropertyToDelete(null);
          }
        }}
        onCancel={() => setPropertyToDelete(null)}
      />
    </div>
  );
};
