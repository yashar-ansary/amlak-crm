// مسیر فایل: src/components/districts/DistrictsView.tsx
// نمای جامع مدیریت محله‌ها و مناطق شهری، قیمت‌های پایه و آمار فایل‌های مرتبط

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Building,
  Users,
  TrendingUp,
  Tag,
  Edit,
  Trash2,
  ArrowUpRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { District } from '../../types/crm';
import {
  formatPriceCompact,
  formatToman,
  toPersianDigits,
} from '../../utils/jalali';
import { DistrictFormModal } from './DistrictFormModal';
import { ConfirmModal } from '../common/ConfirmModal';

interface DistrictsViewProps {
  onNavigateToProperties?: (districtName: string) => void;
  onNavigateToClients?: (districtName: string) => void;
}

export const DistrictsView: React.FC<DistrictsViewProps> = ({
  onNavigateToProperties,
  onNavigateToClients,
}) => {
  const { districts, properties, clients, deleteDistrict } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'price_desc' | 'properties_count'>('name');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
  const [districtToDelete, setDistrictToDelete] = useState<District | null>(null);

  // لیست مناطق شهرداری موجود در داده‌ها
  const availableZones = useMemo(() => {
    const zones = Array.from(new Set(districts.map((d) => d.municipalityZone)));
    return zones.sort((a, b) => a - b);
  }, [districts]);

  // فیلتر و مرتب‌سازی محله‌ها
  const filteredDistricts = useMemo(() => {
    return districts
      .filter((d) => {
        const matchesQuery =
          !searchQuery.trim() ||
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesZone =
          selectedZone === 'ALL' || d.municipalityZone.toString() === selectedZone;

        return matchesQuery && matchesZone;
      })
      .sort((a, b) => {
        if (sortBy === 'price_desc') {
          return (b.avgSalePricePerMeter || 0) - (a.avgSalePricePerMeter || 0);
        }
        if (sortBy === 'properties_count') {
          const countA = properties.filter((p) => p.district === a.name).length;
          const countB = properties.filter((p) => p.district === b.name).length;
          return countB - countA;
        }
        return a.name.localeCompare(b.name, 'fa');
      });
  }, [districts, properties, searchQuery, selectedZone, sortBy]);

  // شاخص‌های آماری بالای صفحه
  const stats = useMemo(() => {
    const totalDistricts = districts.length;

    // گران‌ترین محله
    const sortedByPrice = [...districts].sort(
      (a, b) => (b.avgSalePricePerMeter || 0) - (a.avgSalePricePerMeter || 0)
    );
    const mostExpensive = sortedByPrice[0] || null;

    // محله با بیشترین فایل ملکی
    const districtPropCounts = districts.map((d) => ({
      name: d.name,
      count: properties.filter((p) => p.district === d.name).length,
    }));
    districtPropCounts.sort((a, b) => b.count - a.count);
    const topPropertyDistrict = districtPropCounts[0] || null;

    // کل متقاضیان فعال در مناطق
    const totalInterestedClients = clients.filter(
      (c) => c.preferredDistricts && c.preferredDistricts.length > 0
    ).length;

    return {
      totalDistricts,
      mostExpensive,
      topPropertyDistrict,
      totalInterestedClients,
    };
  }, [districts, properties, clients]);

  const handleOpenAdd = () => {
    setEditingDistrict(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (district: District) => {
    setEditingDistrict(district);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* هدر بخش و دکمه افزودن */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30">
            <MapPin className="h-5 w-5 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">مدیریت محله‌ها و مناطق شهری</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تعریف محدوده‌های جغرافیایی، مظنه متری خرید و رهن، پایش فایل‌های ملکی و تقاضای خریداران
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 sm:py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>افزودن محله جدید</span>
        </button>
      </div>

      {/* ردیف کارت‌های شاخص تحلیلی (KPI Metric Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* ۱. تعداد کل محله‌ها */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl shadow-xl shadow-black/25">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>محله‌های تحت پوشش</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <MapPin className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="num-fa text-2xl font-bold tracking-tight text-white">
              {toPersianDigits(stats.totalDistricts)}
            </span>
            <span className="text-xs text-slate-400">محله فعال</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            در <span className="font-semibold text-slate-200 num-fa">{toPersianDigits(availableZones.length)} منطقه</span> شهرداری تهران
          </div>
        </div>

        {/* ۲. گران‌ترین محله */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl shadow-xl shadow-black/25">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>بالاترین مظنه متری</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-bold text-white truncate">
              {stats.mostExpensive ? stats.mostExpensive.name : '—'}
            </span>
            <span className="text-xs text-slate-400">
              (منطقه {toPersianDigits(stats.mostExpensive?.municipalityZone || 1)})
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 num-fa">
            میانگین: <span className="font-bold text-amber-300">{formatPriceCompact(stats.mostExpensive?.avgSalePricePerMeter || 0)} / متر</span>
          </div>
        </div>

        {/* ۳. پرفایل‌ترین محله */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl shadow-xl shadow-black/25">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>بیشترین فایل سپرده‌شده</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Building className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-base font-bold text-white truncate">
              {stats.topPropertyDistrict ? stats.topPropertyDistrict.name : '—'}
            </span>
            <span className="num-fa text-xs font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-lg">
              {toPersianDigits(stats.topPropertyDistrict?.count || 0)} فایل
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            فایل‌های فروش و رهن آماده بازدید
          </div>
        </div>

        {/* ۴. تمرکز متقاضیان */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-2xl shadow-xl shadow-black/25">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>تقاضای فعال خریداران</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="num-fa text-2xl font-bold tracking-tight text-white">
              {toPersianDigits(stats.totalInterestedClients)}
            </span>
            <span className="text-xs text-slate-400">متقاضی با هدف مشخص</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            آماده انطباق با فایل‌های تازه
          </div>
        </div>
      </div>

      {/* نوار جستجو و فیلترها */}
      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-2xl shadow-xl shadow-black/25 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام محله، برچسب، یا توضیحات..."
            className="h-10 w-full rounded-2xl border border-white/10 bg-white/[0.05] pr-9 pl-3 text-xs text-white placeholder:text-slate-400 focus:border-violet-500 focus:bg-white/[0.09] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* فیلتر منطقه شهرداری */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>منطقه:</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#0e1226] px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="ALL">همه مناطق شهرداری</option>
              {availableZones.map((zone) => (
                <option key={zone} value={zone.toString()}>
                  منطقه {toPersianDigits(zone)}
                </option>
              ))}
            </select>
          </div>

          {/* مرتب‌سازی */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <span>ترتیب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'price_desc' | 'properties_count')}
              className="rounded-xl border border-white/10 bg-[#0e1226] px-3 py-2 text-xs text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="name">بر اساس نام محله</option>
              <option value="price_desc">گران‌ترین مظنه متری</option>
              <option value="properties_count">بیشترین تعداد فایل</option>
            </select>
          </div>
        </div>
      </div>

      {/* شبکه کارت‌های محله‌ها */}
      {filteredDistricts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center backdrop-blur-2xl">
          <MapPin className="mx-auto h-10 w-10 text-slate-500" />
          <h3 className="mt-3 text-sm font-bold text-white">محله‌ای با این مشخصات یافت نشد</h3>
          <p className="mt-1 text-xs text-slate-400">
            عبارت جستجو را تغییر دهید یا محله جدیدی به سیستم اضافه فرمایید.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white hover:from-emerald-500 hover:to-teal-500"
          >
            <Plus className="h-4 w-4" />
            <span>ثبت این محله در سامانه</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredDistricts.map((district) => {
            // محاسبه فایل‌های موجود در این محله
            const districtProperties = properties.filter((p) => p.district === district.name);
            // محاسبه خریداران متقاضی این محله
            const interestedClients = clients.filter(
              (c) =>
                c.preferredDistricts &&
                c.preferredDistricts.some((d) => d.includes(district.name) || district.name.includes(d))
            );

            return (
              <div
                key={district.id}
                className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/25 backdrop-blur-2xl hover:border-violet-500/40 hover:bg-white/[0.06] transition-all"
              >
                <div>
                  {/* هدر کارت محله */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{district.name}</h3>
                        <span className="num-fa text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                          منطقه {toPersianDigits(district.municipalityZone)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {district.city || 'تهران'} · {district.status === 'ACTIVE' ? 'فعال و پوشش کامل' : 'بایگانی'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(district)}
                        title="ویرایش محله"
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDistrictToDelete(district)}
                        title="حذف محله"
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* قیمت‌های مظنه */}
                  <div className="mt-4 rounded-2xl bg-white/[0.03] p-3.5 space-y-2 border border-white/10 backdrop-blur-md">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">میانگین متری فروش:</span>
                      <span className="font-bold text-white num-fa">
                        {district.avgSalePricePerMeter
                          ? formatToman(district.avgSalePricePerMeter)
                          : 'تعیین نشده'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">میانگین رهن کامل:</span>
                      <span className="font-bold text-slate-200 num-fa">
                        {district.avgRentDepositPerMeter
                          ? formatToman(district.avgRentDepositPerMeter)
                          : 'تعیین نشده'}
                      </span>
                    </div>
                  </div>

                  {/* برچسب‌ها و ویژگی‌ها */}
                  {district.tags && district.tags.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {district.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg bg-white/[0.06] border border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* توضیحات */}
                  {district.description && (
                    <p className="mt-3 text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {district.description}
                    </p>
                  )}
                </div>

                {/* فوتر کارت: آمار فایل‌ها، متقاضیان و لینک‌ها */}
                <div className="mt-5 border-t border-white/10 pt-4 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Building className="h-3.5 w-3.5 text-emerald-400" />
                      <span>فایل‌های فعال:</span>
                      <span className="font-bold text-white num-fa">
                        {toPersianDigits(districtProperties.length)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Users className="h-3.5 w-3.5 text-sky-400" />
                      <span>متقاضیان خواهان:</span>
                      <span className="font-bold text-white num-fa">
                        {toPersianDigits(interestedClients.length)}
                      </span>
                    </div>
                  </div>

                  {/* دکمه‌های ناوبری سریع به املاک یا مشتریان این محله */}
                  <div className="flex items-center gap-2 pt-1">
                    {onNavigateToProperties && (
                      <button
                        onClick={() => onNavigateToProperties(district.name)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] py-2 text-[11px] font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <span>فایل‌های ملکی</span>
                        <ArrowUpRight className="h-3 w-3 text-slate-400" />
                      </button>
                    )}

                    {onNavigateToClients && (
                      <button
                        onClick={() => onNavigateToClients(district.name)}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.05] py-2 text-[11px] font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <span>خریداران</span>
                        <ArrowUpRight className="h-3 w-3 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مدال ثبت و ویرایش محله */}
      <DistrictFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingDistrict(null);
        }}
        editDistrict={editingDistrict}
      />

      {/* مدال تایید حذف محله */}
      <ConfirmModal
        isOpen={!!districtToDelete}
        title="حذف محله از سیستم"
        message={`آیا از حذف محله «${districtToDelete?.name}» (منطقه ${districtToDelete?.municipalityZone}) از فهرست مناطق دفتر املاک اطمینان دارید؟`}
        confirmText="بله، حذف محله"
        cancelText="انصراف"
        onConfirm={() => {
          if (districtToDelete) {
            deleteDistrict(districtToDelete.id);
            setDistrictToDelete(null);
          }
        }}
        onCancel={() => setDistrictToDelete(null)}
      />
    </div>
  );
};
