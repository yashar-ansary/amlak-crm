// مسیر فایل: src/components/contracts/ContractsView.tsx
// نمای فهرست قراردادها، مبایعه‌نامه‌ها و کمیسیون‌های محقق‌شده

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Printer,
  Trash2,
  CheckCircle2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { DealContract } from '../../types/crm';
import {
  formatToman,
  formatPriceCompact,
  toPersianDigits,
} from '../../utils/jalali';
import { ContractFormModal } from './ContractFormModal';
import { ContractPrintModal } from './ContractPrintModal';
import { ConfirmModal } from '../common/ConfirmModal';

export const ContractsView: React.FC = () => {
  const { contracts, deleteContract, stats } = useCrm();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContractForPrint, setSelectedContractForPrint] = useState<DealContract | null>(
    null
  );
  const [contractToDelete, setContractToDelete] = useState<DealContract | null>(null);

  return (
    <div className="space-y-6">
      {/* هدر و خلاصه ارقام معاملات */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
        <div>
          <h2 className="text-base font-bold text-white">قراردادها و معاملات قطعی دفتر املاک</h2>
          <p className="text-xs text-slate-400 mt-1">
            مجموع درآمد کمیسیون محقق‌شده:{' '}
            <span className="font-bold text-emerald-300 num-fa">
              {formatPriceCompact(stats.totalCommissionIncome)}
            </span>
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>تنظیم قرارداد جدید</span>
        </button>
      </div>

      {/* لیست قراردادها */}
      {contracts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center backdrop-blur-xl">
          <FileText className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-bold text-white">هیچ معامله‌ای ثبت نشده است</h3>
          <p className="mt-1 text-xs text-slate-400">
            برای ثبت اولین مبایعه‌نامه یا اجاره‌نامه روی دکمه «تنظیم قرارداد جدید» کلیک فرمایید.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((deal) => {
            const isSale = deal.contractType === 'SALE_CONTRACT';

            return (
              <div
                key={deal.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg shadow-black/20 backdrop-blur-xl hover:border-violet-500/40 hover:bg-white/[0.06] transition-all"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="num-fa font-bold text-xs bg-white/10 border border-white/15 text-white px-2.5 py-0.5 rounded-lg">
                        {deal.contractNumber}
                      </span>
                      <span className="text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                        {isSale ? 'مبایعه‌نامه فروش' : 'اجاره‌نامه مسکونی'}
                      </span>
                      <span className="text-slate-500">·</span>
                      <h3 className="text-sm font-bold text-white">{deal.propertyTitle}</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>
                        طرف اول: <strong className="text-slate-200">{deal.firstPartyName}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        طرف دوم: <strong className="text-slate-200">{deal.secondPartyName}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        تاریخ عقد: <span className="num-fa text-slate-200">{deal.signingDateJalali}</span>
                      </span>
                      <span>·</span>
                      <span>مشاور: {deal.agentName}</span>
                    </div>

                    <div className="text-xs text-slate-400">
                      نشانی ملک: {deal.propertyAddress}
                    </div>
                  </div>

                  {/* ارقام مالی */}
                  <div className="flex flex-wrap items-center gap-4 lg:flex-col lg:items-end">
                    <div className="text-left">
                      <div className="text-xs text-slate-400">ثمن معامله / ودیعه:</div>
                      <div className="text-sm font-bold text-white num-fa">
                        {formatPriceCompact(deal.totalAmount)}
                      </div>
                    </div>

                    <div className="text-left">
                      <div className="text-[11px] text-slate-400">کل کمیسیون دریافتی:</div>
                      <div className="text-xs font-bold text-emerald-400 num-fa">
                        {formatToman(deal.totalCommission)}
                      </div>
                    </div>
                  </div>

                  {/* دکمه‌های اقدام */}
                  <div className="flex items-center gap-2 border-t border-white/10 pt-3 lg:border-0 lg:pt-0">
                    <button
                      onClick={() => setSelectedContractForPrint(deal)}
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/15 hover:text-white transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5 text-slate-400" />
                      <span>مشاهده و چاپ مبایعه‌نامه</span>
                    </button>

                    <button
                      onClick={() => setContractToDelete(deal)}
                      title="حذف قرارداد"
                      className="rounded-xl border border-white/10 bg-white/[0.05] p-2 text-slate-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* مدال ثبت قرارداد */}
      <ContractFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
      />

      {/* مدال چاپ رسمی قرارداد */}
      <ContractPrintModal
        contract={selectedContractForPrint}
        isOpen={Boolean(selectedContractForPrint)}
        onClose={() => setSelectedContractForPrint(null)}
      />

      {/* مدال تایید حذف قرارداد */}
      <ConfirmModal
        isOpen={!!contractToDelete}
        title="حذف معامله و قرارداد"
        message={`آیا از حذف قرارداد رسمی شماره «${contractToDelete?.contractNumber}» اطمینان دارید؟`}
        confirmText="بله، حذف قرارداد"
        cancelText="انصراف"
        onConfirm={() => {
          if (contractToDelete) {
            deleteContract(contractToDelete.id);
            setContractToDelete(null);
          }
        }}
        onCancel={() => setContractToDelete(null)}
      />
    </div>
  );
};
