// مسیر فایل: src/utils/jalali.ts
// توابع محاسباتی تقویم شمسی، تبدیل ارز و فرمول‌های اتحادیه مشاوران املاک

/**
 * تبدیل ارقام انگلیسی به فارسی
 */
export function toPersianDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = input.toString();
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی (برای فرم‌ها، محاسبات و پردازش)
 */
export function toEnglishDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  let res = input.toString();
  // ارقام فارسی ۰-۹
  const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  for (let i = 0; i < 10; i++) {
    res = res.replace(persianDigits[i], i.toString());
  }
  // ارقام عربی ٠-٩
  const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  for (let i = 0; i < 10; i++) {
    res = res.replace(arabicDigits[i], i.toString());
  }
  return res;
}

/**
 * استانداردسازی و پاکسازی اعداد اعشاری (درصد کمیسیون، مالیات، متراژ)
 * تبدیل ممیز فارسی ٫، اسلش /، ویرگول ، و ارقام فارسی/عربی به اعشار استاندارد انگلیسی
 */
export function cleanDecimalInput(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  let str = toEnglishDigits(input);
  // تبدیل ممیز فارسی (U+066B)، ویرگول فارسی (U+060C)، کاما و اسلش به نقطه اعشار
  str = str.replace(/[٫،,/]/g, '.');
  // حذف کاراکترهای نامعتبر غیر از ارقام و نقطه
  str = str.replace(/[^0-9.]/g, '');
  // جلوگیری از ثبت چند نقطه اعشار متوالی
  const parts = str.split('.');
  if (parts.length > 2) {
    str = parts[0] + '.' + parts.slice(1).join('');
  }
  return str;
}

/**
 * الگوریتم استاندارد تبدیل تاریخ میلادی به هجری شمسی (جلالی)
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy: number;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

/**
 * نام ماه‌های تقویم شمسی
 */
export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

/**
 * دریافت تاریخ روز به صورت شمسی استاندارد (مثال: ۱۴۰۴/۰۷/۱۵)
 */
export function getCurrentJalaliDate(): string {
  const now = new Date();
  const [jy, jm, jd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const monthStr = jm < 10 ? `0${jm}` : `${jm}`;
  const dayStr = jd < 10 ? `0${jd}` : `${jd}`;
  return `${jy}/${monthStr}/${dayStr}`;
}

/**
 * فرمت متنی خوانا برای تاریخ شمسی (مثال: ۱۵ مهر ۱۴۰۴)
 */
export function formatJalaliReadable(jalaliDateStr: string): string {
  if (!jalaliDateStr || !jalaliDateStr.includes('/')) return jalaliDateStr || '';
  const parts = jalaliDateStr.split('/');
  if (parts.length !== 3) return jalaliDateStr;
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const monthName = PERSIAN_MONTHS[monthIndex] || parts[1];
  return `${toPersianDigits(day)} ${monthName} ${toPersianDigits(year)}`;
}

/**
 * فرمت سه‌رقمی قیمت‌ها با کاما (به تومان)
 */
export function formatToman(amount: number | undefined | null, showUnit = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '۰ تومان';
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${toPersianDigits(formatted)}${showUnit ? ' تومان' : ''}`;
}

/**
 * جداسازی سه‌رقمی عدد با کاما (پشتیبانی از ارقام فارسی و انگلیسی)
 */
export function formatWithCommas(value: string | number | undefined | null, toPersian = true): string {
  if (value === undefined || value === null || value === '') return '';
  const english = toEnglishDigits(value.toString()).replace(/[^0-9]/g, '');
  if (!english) return '';
  const formatted = english.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return toPersian ? toPersianDigits(formatted) : formatted;
}

/**
 * استخراج عدد خام تمیز شده از هر ورودی متنی یا دارای کاما
 */
export function cleanNumericValue(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === '') return 0;
  const english = toEnglishDigits(value.toString()).replace(/[^0-9]/g, '');
  return parseInt(english, 10) || 0;
}

const PERSIAN_ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const PERSIAN_TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const PERSIAN_TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const PERSIAN_HUNDREDS = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const PERSIAN_SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون', 'کوادریلیون'];

function chunkToPersianWords(n: number): string {
  if (n === 0) return '';
  const h = Math.floor(n / 100);
  const rem = n % 100;
  const parts: string[] = [];

  if (h > 0 && h < PERSIAN_HUNDREDS.length) {
    parts.push(PERSIAN_HUNDREDS[h]);
  }

  if (rem > 0) {
    if (rem >= 10 && rem < 20) {
      parts.push(PERSIAN_TEENS[rem - 10]);
    } else {
      const t = Math.floor(rem / 10);
      const o = rem % 10;
      if (t > 0 && t < PERSIAN_TENS.length) parts.push(PERSIAN_TENS[t]);
      if (o > 0 && o < PERSIAN_ONES.length) parts.push(PERSIAN_ONES[o]);
    }
  }

  return parts.join(' و ');
}

/**
 * تبدیل عدد به حروف فارسی (مثال: ۱۵,۵۰۰,۰۰۰,۰۰۰ -> پانزده میلیارد و پانصد میلیون تومان)
 */
export function numberToPersianWords(input: number | string | undefined | null, unit = 'تومان'): string {
  if (input === undefined || input === null || input === '') return '';
  const cleanStr = toEnglishDigits(input.toString()).replace(/[^0-9-]/g, '');
  if (!cleanStr || cleanStr === '-') return '';
  const num = parseInt(cleanStr, 10);
  if (isNaN(num)) return '';
  if (num === 0) return unit ? `صفر ${unit}` : 'صفر';

  let temp = Math.abs(num);
  const chunks: number[] = [];
  while (temp > 0) {
    chunks.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const wordsParts: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk > 0) {
      const chunkWords = chunkToPersianWords(chunk);
      const scale = PERSIAN_SCALES[i] ? ` ${PERSIAN_SCALES[i]}` : '';
      wordsParts.push(chunkWords + scale);
    }
  }

  const result = wordsParts.join(' و ') + (unit ? ` ${unit}` : '');
  return num < 0 ? `منفی ${result}` : result;
}

/**
 * فرمت خلاصه و بازاری قیمت‌ها (مثال: ۲.۵ میلیارد تومان یا ۸۵۰ میلیون تومان)
 */
export function formatPriceCompact(amount: number | undefined | null): string {
  if (!amount || amount === 0) return 'توافقی';
  if (amount >= 1_000_000_000) {
    const billions = amount / 1_000_000_000;
    const cleanNum = Number.isInteger(billions) ? billions.toString() : billions.toFixed(1);
    return `${toPersianDigits(cleanNum)} میلیارد تومان`;
  }
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const cleanNum = Number.isInteger(millions) ? millions.toString() : millions.toFixed(0);
    return `${toPersianDigits(cleanNum)} میلیون تومان`;
  }
  return formatToman(amount);
}

/**
 * محاسبه قانونی کمیسیون اتحادیه املاک برای معاملات فروش
 * طبق ضوابط مصوب: ۰.۲۵ درصد از ارزش کل معامله از هر طرف + ۱۰٪ مالیات بر ارزش افزوده
 */
export function calculateSaleCommission(totalAmount: number, ratePercent = 0.25, vatPercent = 10) {
  const effectiveRate = typeof ratePercent === 'number' && !isNaN(ratePercent) && ratePercent >= 0 ? ratePercent : 0.25;
  const ratePerParty = effectiveRate / 100;
  const oneSideCommission = Math.round(totalAmount * ratePerParty);
  const effectiveVat = typeof vatPercent === 'number' && !isNaN(vatPercent) && vatPercent >= 0 ? vatPercent : 10;
  const vatPerParty = Math.round(oneSideCommission * (effectiveVat / 100)); // مالیات
  const oneSideTotalWithVat = oneSideCommission + vatPerParty;

  const totalBothSidesBase = oneSideCommission * 2;
  const totalVat = vatPerParty * 2;
  const totalCommissionWithVat = totalBothSidesBase + totalVat;

  return {
    oneSideBase: oneSideCommission,
    oneSideVat: vatPerParty,
    oneSideTotal: oneSideTotalWithVat,
    totalBase: totalBothSidesBase,
    totalVat,
    grandTotal: totalCommissionWithVat,
  };
}

/**
 * محاسبه قانونی کمیسیون اتحادیه املاک برای قراردادهای رهن و اجاره
 * عرف اتحادیه: تبدیل رهن به اجاره (هر ۱۰۰ میلیون رهن = ۳ میلیون اجاره)، 
 * سپس یک‌چهارم (۲۵٪) مجموع اجاره یک ماه از هر طرف + ۱۰٪ مالیات بر ارزش افزوده
 */
export function calculateRentCommission(deposit: number, monthlyRent: number, vatPercent = 10) {
  // تبدیل ودیعه به اجاره با نرخ عرفی ۳ درصد (صدی ۳ میلیون)
  const convertedDepositToRent = Math.round((deposit / 100_000_000) * 3_000_000);
  const totalEquivalentMonthlyRent = monthlyRent + convertedDepositToRent;

  // سهم هر طرف: یک چهارم اجاره یک ماه
  const oneSideCommission = Math.round(totalEquivalentMonthlyRent * 0.25);
  const effectiveVat = typeof vatPercent === 'number' && !isNaN(vatPercent) && vatPercent >= 0 ? vatPercent : 10;
  const vatPerParty = Math.round(oneSideCommission * (effectiveVat / 100));
  const oneSideTotal = oneSideCommission + vatPerParty;

  const totalBase = oneSideCommission * 2;
  const totalVat = vatPerParty * 2;
  const grandTotal = totalBase + totalVat;

  return {
    equivalentMonthlyRent: totalEquivalentMonthlyRent,
    convertedDepositToRent,
    oneSideBase: oneSideCommission,
    oneSideVat: vatPerParty,
    oneSideTotal,
    totalBase,
    totalVat,
    grandTotal,
  };
}

/**
 * تبدیل رهن و اجاره به یکدیگر بر اساس نرخ دلخواه (پیش‌فرض عرف: ۳ درصد)
 */
export function convertDepositAndRent(
  currentDeposit: number,
  currentRent: number,
  targetDeposit: number,
  interestPercent = 3
) {
  const diffDeposit = targetDeposit - currentDeposit;
  // هر ۱۰۰ میلیون تومان = ۳ میلیون تومان اجاره
  const rentAdjustment = (diffDeposit / 100_000_000) * (interestPercent * 1_000_000);
  const calculatedRent = Math.max(0, Math.round(currentRent - rentAdjustment));

  return {
    newDeposit: targetDeposit,
    newRent: calculatedRent,
    monthlyDifference: Math.abs(currentRent - calculatedRent),
  };
}

/**
 * نام‌های فارسی وضعیت‌ها و برچسب‌های سامانه
 */
export const PROPERTY_TYPE_NAMES: Record<string, string> = {
  APARTMENT: 'آپارتمان مسکونی',
  VILLA: 'ویلایی و باغ',
  COMMERCIAL: 'تجاری و مغازه',
  OFFICE: 'موقعیت اداری',
  LAND: 'زمین و کلنگی',
  WORKSHOP: 'سوله و انبار',
};

export const TRANSACTION_TYPE_NAMES: Record<string, string> = {
  SALE: 'خرید و فروش',
  RENT: 'رهن و اجاره',
  PRE_SALE: 'پیش‌فروش',
  EXCHANGE: 'معاوضه',
};

export const CLIENT_TYPE_NAMES: Record<string, string> = {
  BUYER: 'متقاضی خرید',
  TENANT: 'متقاضی رهن/اجاره',
  SELLER: 'مالک / فروشنده',
  LANDLORD: 'موجر / صاحب‌خانه',
  INVESTOR: 'سرمایه‌گذار',
};

export const LEAD_STATUS_NAMES: Record<string, { label: string; color: string }> = {
  NEW_LEAD: { label: 'سرنخ جدید', color: 'text-sky-600 bg-sky-50 border-sky-200' },
  IN_PROGRESS: { label: 'در حال پیگیری', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  VIEWING_SCHEDULED: { label: 'بازدید هماهنگ شده', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  NEGOTIATION: { label: 'در مرحله مذاکره', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  CONTRACT_SIGNED: { label: 'عقد قرارداد', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  LOST: { label: 'ناموفق / بایگانی', color: 'text-slate-600 bg-slate-100 border-slate-200' },
};

export const VIEWING_STATUS_NAMES: Record<string, { label: string; color: string }> = {
  SCHEDULED: { label: 'در انتظار بازدید', color: 'text-blue-700 bg-blue-50' },
  COMPLETED: { label: 'انجام شد', color: 'text-emerald-700 bg-emerald-50' },
  CANCELLED: { label: 'کنسل شد', color: 'text-rose-700 bg-rose-50' },
  POSTPONED: { label: 'موکول به بعد', color: 'text-amber-700 bg-amber-50' },
};

/**
 * اسامی روزهای هفته به فارسی (شنبه تا جمعه)
 */
export const PERSIAN_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
export const PERSIAN_WEEKDAYS_FULL = [
  'شنبه',
  'یک‌شنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
];

export interface JalaliCalendarDay {
  jy: number;
  jm: number;
  jd: number;
  dateJalali: string; // مثال: ۱۴۰۵/۰۷/۱۸
  dayOfWeek: number; // 0=شنبه, 1=یک‌شنبه, ..., 6=جمعه
  isWeekend: boolean; // جمعه
  isToday: boolean;
  dayNumberPersian: string;
}

/**
 * یافتن تاریخ میلادی متناظر با یک روز شمسی با جستجوی دقیق باینری
 */
export function findGregorianForJalali(targetJy: number, targetJm: number, targetJd: number): Date {
  const gYear = targetJy + 621;
  const cur = new Date(gYear, 2, 21);

  function getJ(d: Date) {
    try {
      const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }).formatToParts(d);
      let jy = 0,
        jm = 0,
        jd = 0;
      for (const p of parts) {
        if (p.type === 'year') jy = parseInt(p.value, 10);
        if (p.type === 'month') jm = parseInt(p.value, 10);
        if (p.type === 'day') jd = parseInt(p.value, 10);
      }
      return { jy, jm, jd };
    } catch {
      return { jy: targetJy, jm: targetJm, jd: targetJd };
    }
  }

  let low = new Date(gYear - 1, 10, 1);
  let high = new Date(gYear + 1, 3, 30);
  while (low.getTime() <= high.getTime()) {
    const mid = new Date(Math.floor((low.getTime() + high.getTime()) / 2));
    mid.setHours(12, 0, 0, 0);
    const j = getJ(mid);
    if (j.jy === targetJy && j.jm === targetJm && j.jd === targetJd) {
      return mid;
    }
    if (
      j.jy < targetJy ||
      (j.jy === targetJy && j.jm < targetJm) ||
      (j.jy === targetJy && j.jm === targetJm && j.jd < targetJd)
    ) {
      low = new Date(mid.getTime() + 86400000);
    } else {
      high = new Date(mid.getTime() - 86400000);
    }
  }
  return cur;
}

/**
 * بررسی تعداد روزهای یک ماه شمسی مشخص
 */
export function getDaysInJalaliMonth(jy: number, jm: number): number {
  if (jm >= 1 && jm <= 6) return 31;
  if (jm >= 7 && jm <= 11) return 30;
  // ماه اسفند: بررسی کبیسه بودن
  const testDate = findGregorianForJalali(jy, 12, 30);
  try {
    const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(testDate);
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (m === '12' && d === '30') return 30;
  } catch {
    // fallback
  }
  return 29;
}

/**
 * ساخت شبکه روزهای یک ماه شمسی جهت نمایش در تقویم
 */
export function getJalaliMonthGrid(jy: number, jm: number): {
  days: JalaliCalendarDay[];
  startEmptyDays: number; // تعداد خانه‌های خالی قبل از شروع ماه (شنبه = 0)
  daysInMonth: number;
} {
  const daysInMonth = getDaysInJalaliMonth(jy, jm);
  const firstDayGregorian = findGregorianForJalali(jy, jm, 1);
  // تبدیل روز هفته میلادی به هفته ایرانی: شنبه = 0 تا جمعه = 6
  const startDayOfWeek = (firstDayGregorian.getDay() + 1) % 7;

  const todayStr = getCurrentJalaliDate();
  const days: JalaliCalendarDay[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = (startDayOfWeek + (d - 1)) % 7;
    const monthStr = jm < 10 ? `0${jm}` : `${jm}`;
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    const dateJalali = `${jy}/${monthStr}/${dayStr}`;

    days.push({
      jy,
      jm,
      jd: d,
      dateJalali,
      dayOfWeek,
      isWeekend: dayOfWeek === 6, // جمعه
      isToday: dateJalali === todayStr,
      dayNumberPersian: toPersianDigits(d),
    });
  }

  return {
    days,
    startEmptyDays: startDayOfWeek,
    daysInMonth,
  };
}

/**
 * افزودن روز به تاریخ شمسی
 */
export function addDaysToJalaliDate(jalaliDateStr: string, daysToAdd: number): string {
  if (!jalaliDateStr || !jalaliDateStr.includes('/')) return getCurrentJalaliDate();
  const parts = jalaliDateStr.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
  if (parts.length !== 3) return jalaliDateStr;
  const [jy, jm, jd] = parts;
  const gDate = findGregorianForJalali(jy, jm, jd);
  gDate.setDate(gDate.getDate() + daysToAdd);
  const [newJy, newJm, newJd] = gregorianToJalali(
    gDate.getFullYear(),
    gDate.getMonth() + 1,
    gDate.getDate()
  );
  const mStr = newJm < 10 ? `0${newJm}` : `${newJm}`;
  const dStr = newJd < 10 ? `0${newJd}` : `${newJd}`;
  return `${newJy}/${mStr}/${dStr}`;
}

/**
 * دریافت اندیس روز هفته ایرانی (۰=شنبه، ۱=یک‌شنبه، ۲=دوشنبه، ۳=سه‌شنبه، ۴=چهارشنبه، ۵=پنج‌شنبه، ۶=جمعه)
 */
export function getJalaliWeekday(jalaliDateStr: string): number {
  if (!jalaliDateStr || !jalaliDateStr.includes('/')) return 0;
  const parts = jalaliDateStr.split('/').map((s) => parseInt(toEnglishDigits(s), 10));
  if (parts.length !== 3) return 0;
  const [jy, jm, jd] = parts;
  const gDate = findGregorianForJalali(jy, jm, jd);
  return (gDate.getDay() + 1) % 7;
}

/**
 * نام روز هفته به همراه تاریخ شمسی خوانا (مثال: شنبه، ۱۸ مهر ۱۴۰۵)
 */
export function formatJalaliWithWeekday(jalaliDateStr: string): string {
  if (!jalaliDateStr || !jalaliDateStr.includes('/')) return jalaliDateStr || '';
  const weekdayIdx = getJalaliWeekday(jalaliDateStr);
  const weekdayName = PERSIAN_WEEKDAYS_FULL[weekdayIdx] || '';
  return `${weekdayName}، ${formatJalaliReadable(jalaliDateStr)}`;
}

/**
 * اطلاعات و رنگ‌بندی دسته‌بندی کارهای روزانه مشاور
 */
export const TASK_CATEGORY_INFO: Record<
  string,
  { label: string; badge: string; text: string; bg: string; border: string }
> = {
  CALL: {
    label: 'تماس تلفنی',
    badge: 'تماس',
    text: 'text-sky-300',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/30',
  },
  VIEWING: {
    label: 'بازدید ملک',
    badge: 'بازدید',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
  },
  FOLLOW_UP: {
    label: 'پیگیری پرونده',
    badge: 'پیگیری',
    text: 'text-amber-300',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
  },
  MEETING: {
    label: 'جلسه و نشست',
    badge: 'جلسه',
    text: 'text-violet-300',
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/30',
  },
  CONTRACT: {
    label: 'عقد قرارداد',
    badge: 'قرارداد',
    text: 'text-teal-300',
    bg: 'bg-teal-500/15',
    border: 'border-teal-500/30',
  },
  INSPECTION: {
    label: 'کارشناسی و عکس',
    badge: 'کارشناسی',
    text: 'text-purple-300',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
  },
  OTHER: {
    label: 'کار عمومی و اداری',
    badge: 'عمومی',
    text: 'text-slate-300',
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/30',
  },
};

/**
 * اطلاعات اولویت‌های کاری
 */
export const TASK_PRIORITY_INFO: Record<
  string,
  { label: string; text: string; bg: string; border: string; glow: string }
> = {
  LOW: {
    label: 'عادی',
    text: 'text-slate-300',
    bg: 'bg-slate-500/20',
    border: 'border-slate-500/30',
    glow: '',
  },
  MEDIUM: {
    label: 'متوسط',
    text: 'text-blue-300',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/30',
    glow: '',
  },
  HIGH: {
    label: 'مهم',
    text: 'text-amber-300',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/35',
    glow: 'shadow-amber-500/10',
  },
  URGENT: {
    label: 'فوری و اضطراری',
    text: 'text-rose-300',
    bg: 'bg-rose-500/25',
    border: 'border-rose-500/40',
    glow: 'shadow-rose-500/20 shadow-md',
  },
};
