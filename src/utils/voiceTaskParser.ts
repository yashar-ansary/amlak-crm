// مسیر فایل: src/utils/voiceTaskParser.ts
// پارسر فوق‌هوشمند و دقیق زبان فارسی برای پردازش گفتار مشاوران املاک، استخراج دقیق تاریخ‌های شمسی، زمان‌بندی و اولویت‌ها

import { TaskCategory, TaskPriority } from '../types/crm';
import {
  getCurrentJalaliDate,
  addDaysToJalaliDate,
  getJalaliWeekday,
  getDaysInJalaliMonth,
  toEnglishDigits,
  toPersianDigits,
} from './jalali';

export interface ParsedVoiceTask {
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  dateJalali: string;
  time?: string;
  clientName?: string;
  propertyCode?: string;
  matchedDatePhrase?: string;
  confidenceScore: number;
}

// نگاشت ماه‌های تقویم شمسی
const PERSIAN_MONTH_MAP: Record<string, number> = {
  فروردین: 1,
  اردیبهشت: 2,
  خرداد: 3,
  تیر: 4,
  مرداد: 5,
  امرداد: 5,
  شهریور: 6,
  مهر: 7,
  آبان: 8,
  آذر: 9,
  دی: 10,
  بهمن: 11,
  اسفند: 12,
};

const PERSIAN_MONTH_NAMES_REGEX =
  'فروردین|اردیبهشت|خرداد|تیر|مرداد|امرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند';

// نگاشت کلمات اعداد ترتیبی و روزهای ماه به ارقام (۱ تا ۳۱)
const PERSIAN_DAY_WORD_MAP: Record<string, number> = {
  اول: 1,
  یکم: 1,
  نخست: 1,
  یک: 1,
  دوم: 2,
  دو: 2,
  سوم: 3,
  سه: 3,
  چهارم: 4,
  چهار: 4,
  پنجم: 5,
  پنج: 5,
  ششم: 6,
  شش: 6,
  هفتم: 7,
  هفت: 7,
  هشتم: 8,
  هشت: 8,
  نهم: 9,
  نه: 9,
  دهم: 10,
  ده: 10,
  یازدهم: 11,
  یازده: 11,
  دوازدهم: 12,
  دوازده: 12,
  سیزدهم: 13,
  سیزده: 13,
  چهاردهم: 14,
  چهارده: 14,
  پانزدهم: 15,
  پانزده: 15,
  شانزدهم: 16,
  شانزده: 16,
  هفدهم: 17,
  هفده: 17,
  هجدهم: 18,
  هجده: 18,
  نوزدهم: 19,
  نوزده: 19,
  بیستم: 20,
  بیست: 20,
  'بیست و یکم': 21,
  'بیست و یک': 21,
  'بیست و دوم': 22,
  'بیست و دو': 22,
  'بیست و سوم': 23,
  'بیست و سه': 23,
  'بیست و چهارم': 24,
  'بیست و چهار': 24,
  'بیست و پنجم': 25,
  'بیست و پنج': 25,
  'بیست و ششم': 26,
  'بیست و شش': 26,
  'بیست و هفتم': 27,
  'بیست و هفت': 27,
  'بیست و هشتم': 28,
  'بیست و هشت': 28,
  'بیست و نهم': 29,
  'بیست و نه': 29,
  'سی ام': 30,
  سی‌ام: 30,
  سی: 30,
  'سی و یکم': 31,
  'سی و یک': 31,
};

// فقط کلمات ترتیبی روزها (مانند بیست و پنجم، اول، دهم) برای جلوگیری از تداخل اعداد معمولی مانند «دو تا خانه»
const PERSIAN_ORDINAL_DAY_MAP: Record<string, number> = {
  اول: 1,
  یکم: 1,
  نخست: 1,
  دوم: 2,
  سوم: 3,
  چهارم: 4,
  پنجم: 5,
  ششم: 6,
  هفتم: 7,
  هشتم: 8,
  نهم: 9,
  دهم: 10,
  یازدهم: 11,
  دوازدهم: 12,
  سیزدهم: 13,
  چهاردهم: 14,
  پانزدهم: 15,
  شانزدهم: 16,
  هفدهم: 17,
  هجدهم: 18,
  نوزدهم: 19,
  بیستم: 20,
  'بیست و یکم': 21,
  'بیست و دوم': 22,
  'بیست و سوم': 23,
  'بیست و چهارم': 24,
  'بیست و پنجم': 25,
  'بیست و ششم': 26,
  'بیست و هفتم': 27,
  'بیست و هشتم': 28,
  'بیست و نهم': 29,
  'سی ام': 30,
  سی‌ام: 30,
  'سی و یکم': 31,
};

// مرتب‌سازی بر اساس طول کلمه به نزولی جهت تطبیق امن‌تر عبارات منظم
const DAY_WORDS_SORTED = Object.keys(PERSIAN_DAY_WORD_MAP).sort((a, b) => b.length - a.length);
const DAY_WORDS_REGEX = DAY_WORDS_SORTED.join('|');

const ORDINAL_WORDS_SORTED = Object.keys(PERSIAN_ORDINAL_DAY_MAP).sort((a, b) => b.length - a.length);
const ORDINAL_WORDS_REGEX = ORDINAL_WORDS_SORTED.join('|');

// لیست مرتب شده روزهای هفته جهت اولویت تطبیق روزهای طولانی‌تر مثل چهارشنبه بر شنبه
interface WeekdayDefinition {
  name: string;
  idx: number;
}

const ORDERED_WEEKDAYS: WeekdayDefinition[] = [
  { name: 'چهارشنبه', idx: 4 },
  { name: 'چهار شنبه', idx: 4 },
  { name: 'پنج‌شنبه', idx: 5 },
  { name: 'پنجشنبه', idx: 5 },
  { name: 'پنج شنبه', idx: 5 },
  { name: 'سه‌شنبه', idx: 3 },
  { name: 'سه شنبه', idx: 3 },
  { name: 'یکشنبه', idx: 1 },
  { name: 'یک شنبه', idx: 1 },
  { name: 'یک‌شنبه', idx: 1 },
  { name: 'دوشنبه', idx: 2 },
  { name: 'دو شنبه', idx: 2 },
  { name: 'جمعه', idx: 6 },
  { name: 'شنبه', idx: 0 },
];

/**
 * تبدیل استاندارد هر تاریخ شمسی خام به فرمت صریح و معتبر YYYY/MM/DD با ارقام انگلیسی
 */
export function normalizeJalaliDateString(rawDate: string, defaultDate: string): string {
  if (!rawDate || typeof rawDate !== 'string') return defaultDate;
  const english = toEnglishDigits(rawDate).trim().replace(/[-.]/g, '/');
  const match = english.match(/(1[34]\d{2})\/(\d{1,2})\/(\d{1,2})/);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, '0');
    const d = match[3].padStart(2, '0');
    return `${y}/${m}/${d}`;
  }
  return defaultDate;
}

/**
 * پاکسازی و یکنواخت‌سازی رشته گفتاری فارسی
 */
function normalizePersianText(text: string): string {
  if (!text) return '';
  return toEnglishDigits(text)
    .replace(/\u200c/g, ' ')
    .replace(/[ـ_]/g, ' ')
    .replace(/[\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * استخراج زمان از گفتار فارسی
 */
function extractTimeFromPersian(text: string): { time?: string; matchedPhrase?: string } {
  const norm = normalizePersianText(text);

  // ۱. الگوهای مستقیم مانند 17:30 یا 9:00
  const directColon = norm.match(/(?:ساعت\s*)?(\d{1,2}):(\d{2})/);
  if (directColon) {
    let h = parseInt(directColon[1], 10);
    const m = parseInt(directColon[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      if ((norm.includes('عصر') || norm.includes('بعدازظهر') || norm.includes('شب')) && h < 12) {
        h += 12;
      }
      return {
        time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        matchedPhrase: directColon[0],
      };
    }
  }

  // ۲. الگوی «ساعت X و نیم» یا «ساعت X و ۳۰ دقیقه»
  const halfPattern = norm.match(/ساعت\s*(\d{1,2})\s*و\s*(نیم|30(?:\s*دقیقه)?)/);
  if (halfPattern) {
    let h = parseInt(halfPattern[1], 10);
    if ((norm.includes('عصر') || norm.includes('بعدازظهر') || norm.includes('شب')) && h < 12) {
      h += 12;
    } else if (h >= 1 && h <= 6 && !norm.includes('صبح')) {
      h += 12;
    }
    return {
      time: `${h.toString().padStart(2, '0')}:30`,
      matchedPhrase: halfPattern[0],
    };
  }

  // ۳. الگوی «ساعت X و ربع» یا «ساعت X و ۱۵ دقیقه»
  const quarterPattern = norm.match(/ساعت\s*(\d{1,2})\s*و\s*(ربع|15(?:\s*دقیقه)?)/);
  if (quarterPattern) {
    let h = parseInt(quarterPattern[1], 10);
    if ((norm.includes('عصر') || norm.includes('بعدازظهر') || norm.includes('شب')) && h < 12) {
      h += 12;
    } else if (h >= 1 && h <= 6 && !norm.includes('صبح')) {
      h += 12;
    }
    return {
      time: `${h.toString().padStart(2, '0')}:15`,
      matchedPhrase: quarterPattern[0],
    };
  }

  // ۴. الگوی «ساعت X» عددی
  const hourPattern = norm.match(/ساعت\s*(\d{1,2})(?!\s*[\/\-])/);
  if (hourPattern) {
    let h = parseInt(hourPattern[1], 10);
    if (h >= 1 && h <= 24) {
      if ((norm.includes('عصر') || norm.includes('بعدازظهر') || norm.includes('شب')) && h < 12) {
        h += 12;
      } else if (norm.includes('صبح') && h === 12) {
        h = 0;
      } else if (h >= 1 && h <= 6 && !norm.includes('صبح')) {
        h += 12;
      }
      return {
        time: `${(h % 24).toString().padStart(2, '0')}:00`,
        matchedPhrase: hourPattern[0],
      };
    }
  }

  // ۵. کلمات ساعتی گفتاری مانند «ساعت پنج عصر»، «ساعت ده صبح»
  const wordHourMatch = norm.match(
    /ساعت\s*(یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده|یازده|دوازده)(?:\s*(عصر|صبح|شب|بعدازظهر))?/
  );
  if (wordHourMatch) {
    const wordHours: Record<string, number> = {
      یک: 1,
      دو: 2,
      سه: 3,
      چهار: 4,
      پنج: 5,
      شش: 6,
      هفت: 7,
      هشت: 8,
      نه: 9,
      ده: 10,
      یازده: 11,
      دوازده: 12,
    };
    let h = wordHours[wordHourMatch[1]] || 16;
    const period = wordHourMatch[2] || (norm.includes('عصر') ? 'عصر' : norm.includes('شب') ? 'شب' : '');
    if ((period === 'عصر' || period === 'شب' || period === 'بعدازظهر') && h < 12) {
      h += 12;
    } else if (h >= 1 && h <= 6 && period !== 'صبح') {
      h += 12;
    }
    return {
      time: `${h.toString().padStart(2, '0')}:00`,
      matchedPhrase: wordHourMatch[0],
    };
  }

  // ۶. اصطلاحات زمانی کلی
  if (norm.includes('ظهر')) return { time: '12:30', matchedPhrase: 'ظهر' };
  if (norm.includes('غروب')) return { time: '18:30', matchedPhrase: 'غروب' };
  if (norm.includes('عصر') || norm.includes('بعدازظهر')) return { time: '17:00', matchedPhrase: 'عصر' };
  if (norm.includes('صبح')) return { time: '10:00', matchedPhrase: 'صبح' };
  if (norm.includes('شب')) return { time: '20:00', matchedPhrase: 'شب' };

  return { time: '16:00' };
}

/**
 * استخراج دقیق و جامع تاریخ شمسی از متن یا صوت مشاور
 */
export function extractDateFromPersian(
  text: string,
  baseDateJalali?: string
): { dateJalali: string; matchedPhrase?: string } {
  const norm = normalizePersianText(text);
  const effectiveBaseDate = baseDateJalali || getCurrentJalaliDate();
  const [baseJy, baseJm, baseJd] = effectiveBaseDate
    .split('/')
    .map((s) => parseInt(toEnglishDigits(s), 10));

  // ۱. الگوی کامل تاریخ شمسی سال/ماه/روز (مثال: ۱۴۰۵/۰۷/۲۵ یا 1404-08-10 یا ۱۴۰۵/۷/۲۵)
  const fullDatePattern = norm.match(/(1[34]\d{2})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (fullDatePattern) {
    const y = parseInt(fullDatePattern[1], 10);
    const m = parseInt(fullDatePattern[2], 10);
    const d = parseInt(fullDatePattern[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return {
        dateJalali: `${y}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`,
        matchedPhrase: fullDatePattern[0],
      };
    }
  }

  // ۲. الگوی معکوس روز/ماه/سال (مثال: 25/07/1405)
  const revDatePattern = norm.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](1[34]\d{2})/);
  if (revDatePattern) {
    const d = parseInt(revDatePattern[1], 10);
    const m = parseInt(revDatePattern[2], 10);
    const y = parseInt(revDatePattern[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return {
        dateJalali: `${y}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`,
        matchedPhrase: revDatePattern[0],
      };
    }
  }

  // ۳. الگوی روز/ماه مستقیم (مثال: ۲۵/۰۷ یا تاریخ ۲۵/۸)
  const monthDayPattern = norm.match(/(?:تاریخ\s*)?(\d{1,2})[\/\-](\d{1,2})(?!\d)/);
  if (monthDayPattern) {
    const p1 = parseInt(monthDayPattern[1], 10);
    const p2 = parseInt(monthDayPattern[2], 10);
    let d = p1;
    let m = p2;
    if (p1 <= 12 && p2 > 12) {
      m = p1;
      d = p2;
    }
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return {
        dateJalali: `${baseJy}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`,
        matchedPhrase: monthDayPattern[0],
      };
    }
  }

  // ۴. عدد روز + نام ماه شمسی (مثال: ۲۵ مهر، ۲۵ام مهر، ۲۵ مهرماه، در تاریخ ۲۵ مهر ۱۴۰۵، برای ۲۵ مهر)
  const numDayMonthRegex = new RegExp(
    '(?:در\\s*تاریخ|توی\\s*تاریخ|تو\\s*تاریخ|برای\\s*تاریخ|واسه\\s*تاریخ|تاریخ|برای|واسه|روز)?\\s*(\\d{1,2})\\s*(?:ام|ـم|م|مین)?\\s*(?:از\\s*)?(' +
      PERSIAN_MONTH_NAMES_REGEX +
      ')(?:\\s*ماه)?(?:\\s*(?:سال\\s*)?(1[34]\\d{2}))?'
  );
  const numDayMonthMatch = norm.match(numDayMonthRegex);
  if (numDayMonthMatch) {
    const d = parseInt(numDayMonthMatch[1], 10);
    const monthName = numDayMonthMatch[2];
    const targetYear = numDayMonthMatch[3] ? parseInt(numDayMonthMatch[3], 10) : baseJy;
    const m = PERSIAN_MONTH_MAP[monthName];
    if (m && d >= 1 && d <= 31) {
      return {
        dateJalali: `${targetYear}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`,
        matchedPhrase: numDayMonthMatch[0].trim(),
      };
    }
  }

  // ۵. معکوس: نام ماه + عدد روز (مثال: ماه مهر روز ۲۵، مهرماه ۲۵ام، مهر ۲۵)
  const monthThenNumDayRegex = new RegExp(
    '(' +
      PERSIAN_MONTH_NAMES_REGEX +
      ')(?:\\s*ماه)?\\s*(?:روز|تاریخ)?\\s*(\\d{1,2})\\s*(?:ام|ـم|م|مین)?(?:\\s*(?:سال\\s*)?(1[34]\\d{2}))?'
  );
  const monthThenNumMatch = norm.match(monthThenNumDayRegex);
  if (monthThenNumMatch) {
    const monthName = monthThenNumMatch[1];
    const d = parseInt(monthThenNumMatch[2], 10);
    const targetYear = monthThenNumMatch[3] ? parseInt(monthThenNumMatch[3], 10) : baseJy;
    const m = PERSIAN_MONTH_MAP[monthName];
    if (m && d >= 1 && d <= 31) {
      return {
        dateJalali: `${targetYear}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`,
        matchedPhrase: monthThenNumMatch[0].trim(),
      };
    }
  }

  // ۶. کلمه روز به حروف + نام ماه شمسی (مثال: بیست و پنجم مهر، پانزدهم آبان، دهم آذر، اول اردیبهشت)
  const wordDayMonthRegex = new RegExp(
    '(?:در\\s*تاریخ|توی\\s*تاریخ|تو\\s*تاریخ|برای\\s*تاریخ|واسه\\s*تاریخ|تاریخ|برای|واسه|روز)?\\s*(' +
      DAY_WORDS_REGEX +
      ')\\s*(?:از\\s*)?(' +
      PERSIAN_MONTH_NAMES_REGEX +
      ')(?:\\s*ماه)?(?:\\s*(?:سال\\s*)?(1[34]\\d{2}))?'
  );
  const wordDayMonthMatch = norm.match(wordDayMonthRegex);
  if (wordDayMonthMatch) {
    const dayWord = wordDayMonthMatch[1].trim();
    const monthName = wordDayMonthMatch[2];
    const targetYear = wordDayMonthMatch[3] ? parseInt(wordDayMonthMatch[3], 10) : baseJy;
    const d = PERSIAN_DAY_WORD_MAP[dayWord];
    const m = PERSIAN_MONTH_MAP[monthName];
    if (d && m) {
      return {
        dateJalali: `${targetYear}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`,
        matchedPhrase: wordDayMonthMatch[0].trim(),
      };
    }
  }

  // ۷. معکوس کلمه روز: نام ماه + کلمه روز به حروف (مثال: ماه مهر بیست و پنجم)
  const monthThenWordDayRegex = new RegExp(
    '(' +
      PERSIAN_MONTH_NAMES_REGEX +
      ')(?:\\s*ماه)?\\s*(?:روز|تاریخ)?\\s*(' +
      DAY_WORDS_REGEX +
      ')(?:\\s*(?:سال\\s*)?(1[34]\\d{2}))?'
  );
  const monthThenWordMatch = norm.match(monthThenWordDayRegex);
  if (monthThenWordMatch) {
    const monthName = monthThenWordMatch[1];
    const dayWord = monthThenWordMatch[2].trim();
    const targetYear = monthThenWordMatch[3] ? parseInt(monthThenWordMatch[3], 10) : baseJy;
    const d = PERSIAN_DAY_WORD_MAP[dayWord];
    const m = PERSIAN_MONTH_MAP[monthName];
    if (d && m) {
      return {
        dateJalali: `${targetYear}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`,
        matchedPhrase: monthThenWordMatch[0].trim(),
      };
    }
  }

  // تابع کمکی برای تعیین ماه هدف در عباراتی که فقط روز گفته شده و نام ماه ذکر نشده
  const resolveTargetMonthAndYear = (dayNumber: number, matchedContext: string) => {
    const hasNextMonth =
      matchedContext.includes('ماه بعد') ||
      matchedContext.includes('ماه آینده') ||
      matchedContext.includes('ماه اینده');
    const hasThisMonth =
      matchedContext.includes('این ماه') ||
      matchedContext.includes('همین ماه') ||
      matchedContext.includes('ماه جاری');

    if (hasNextMonth) {
      const nextM = baseJm === 12 ? 1 : baseJm + 1;
      const nextY = baseJm === 12 ? baseJy + 1 : baseJy;
      return { jy: nextY, jm: nextM, jd: dayNumber };
    }
    if (hasThisMonth) {
      return { jy: baseJy, jm: baseJm, jd: dayNumber };
    }
    // اگر روز از روز جاری کوچکتر باشد (مثلاً امروز ۱۸ است و کاربر می‌گوید «در تاریخ ۵»)، مربوط به ماه بعد است
    if (dayNumber < baseJd) {
      const nextM = baseJm === 12 ? 1 : baseJm + 1;
      const nextY = baseJm === 12 ? baseJy + 1 : baseJy;
      return { jy: nextY, jm: nextM, jd: dayNumber };
    }
    return { jy: baseJy, jm: baseJm, jd: dayNumber };
  };

  // ۸. ذکر روز با پیشوندهای صریح تاریخ (مانند «در تاریخ ۲۵»، «توی تاریخ ۲۵»، «برای تاریخ ۲۵»، «تاریخ ۲۵»، «روز بیست و پنجم»)
  const explicitDayPrefixedRegex = new RegExp(
    '(?:در\\s*تاریخ|توی\\s*تاریخ|تو\\s*تاریخ|برای\\s*تاریخ|واسه\\s*تاریخ|تاریخ|برای|واسه|روز)\\s*(\\d{1,2}|' +
      DAY_WORDS_REGEX +
      ')(?!\\s*شنبه)\\s*(?:ام|ـم|م|مین)?(?:\\s*(این\\s*ماه|همین\\s*ماه|ماه\\s*جاری|ماه\\s*بعد|ماه\\s*آینده|ماه\\s*اینده))?'
  );
  const explicitDayPrefixedMatch = norm.match(explicitDayPrefixedRegex);
  if (explicitDayPrefixedMatch) {
    const rawVal = explicitDayPrefixedMatch[1].trim();
    const d = !isNaN(Number(rawVal))
      ? parseInt(rawVal, 10)
      : PERSIAN_DAY_WORD_MAP[rawVal];
    if (d && d >= 1 && d <= 31) {
      const resolved = resolveTargetMonthAndYear(d, norm);
      return {
        dateJalali: `${resolved.jy}/${resolved.jm.toString().padStart(2, '0')}/${resolved.jd.toString().padStart(2, '0')}`,
        matchedPhrase: explicitDayPrefixedMatch[0].trim(),
      };
    }
  }

  // ۹. ذکر روز همراه با پسوند «ام/مین» (مانند «۲۵ام»، «۲۵ ام»، «۱۰ام»، «بیست و پنجمین»)
  const ordinalDaySuffixedRegex = /(\d{1,2})\s*(?:ام|ـم|م|مین)(?!\s*[\/\-0-9])/;
  const ordinalDaySuffixedMatch = norm.match(ordinalDaySuffixedRegex);
  if (ordinalDaySuffixedMatch) {
    const d = parseInt(ordinalDaySuffixedMatch[1], 10);
    if (d >= 1 && d <= 31) {
      const resolved = resolveTargetMonthAndYear(d, norm);
      return {
        dateJalali: `${resolved.jy}/${resolved.jm.toString().padStart(2, '0')}/${resolved.jd.toString().padStart(2, '0')}`,
        matchedPhrase: ordinalDaySuffixedMatch[0].trim(),
      };
    }
  }

  // ۱۰. کلمات ترتیبی روزها بدون پیشوند (مانند «بیست و پنجم»، «پانزدهم»، «دهم»، «اول»)
  const standaloneOrdinalRegex = new RegExp(
    '(?:^|\\s)(' + ORDINAL_WORDS_REGEX + ')(?:\\s|$)'
  );
  const standaloneOrdinalMatch = norm.match(standaloneOrdinalRegex);
  if (standaloneOrdinalMatch) {
    const word = standaloneOrdinalMatch[1].trim();
    const d = PERSIAN_ORDINAL_DAY_MAP[word];
    if (d && d >= 1 && d <= 31) {
      const resolved = resolveTargetMonthAndYear(d, norm);
      return {
        dateJalali: `${resolved.jy}/${resolved.jm.toString().padStart(2, '0')}/${resolved.jd.toString().padStart(2, '0')}`,
        matchedPhrase: word,
      };
    }
  }

  // ۱۱. عبارات مرز ماه: «اول ماه بعد / اول ماه آینده» یا «آخر این ماه»
  if (
    norm.includes('اول ماه بعد') ||
    norm.includes('اول ماه اینده') ||
    norm.includes('اول ماه آینده') ||
    norm.includes('یکم ماه بعد') ||
    norm.includes('یکم ماه آینده')
  ) {
    const nextJm = baseJm === 12 ? 1 : baseJm + 1;
    const nextJy = baseJm === 12 ? baseJy + 1 : baseJy;
    return {
      dateJalali: `${nextJy}/${nextJm.toString().padStart(2, '0')}/01`,
      matchedPhrase: 'اول ماه بعد',
    };
  }
  if (norm.includes('اخر این ماه') || norm.includes('آخر این ماه') || norm.includes('پایان این ماه')) {
    const daysInCurMonth = getDaysInJalaliMonth(baseJy, baseJm);
    return {
      dateJalali: `${baseJy}/${baseJm.toString().padStart(2, '0')}/${daysInCurMonth.toString().padStart(2, '0')}`,
      matchedPhrase: 'آخر این ماه',
    };
  }

  // ۱۲. عبارات نسبی روز: پس‌فردا، فردا، امروز
  if (norm.includes('پس فردا') || norm.includes('پس‌فردا')) {
    return {
      dateJalali: addDaysToJalaliDate(effectiveBaseDate, 2),
      matchedPhrase: 'پس فردا',
    };
  }
  if (norm.includes('فردا')) {
    return {
      dateJalali: addDaysToJalaliDate(effectiveBaseDate, 1),
      matchedPhrase: 'فردا',
    };
  }
  if (norm.includes('امروز')) {
    return {
      dateJalali: effectiveBaseDate,
      matchedPhrase: 'امروز',
    };
  }

  // ۱۳. «X روز دیگر» یا «X روز بعد» یا «X روز دیگه» (مثال: «۳ روز دیگه»، «پنج روز بعد»، «۱۰ روز دیگر»)
  const daysLaterMatch = norm.match(
    /(\d{1,2}|یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده)\s*روز\s*(دیگر|بعد|دیگه)/
  );
  if (daysLaterMatch) {
    const numWords: Record<string, number> = {
      یک: 1,
      دو: 2,
      سه: 3,
      چهار: 4,
      پنج: 5,
      شش: 6,
      هفت: 7,
      هشت: 8,
      نه: 9,
      ده: 10,
    };
    const daysToAdd = !isNaN(Number(daysLaterMatch[1]))
      ? parseInt(daysLaterMatch[1], 10)
      : numWords[daysLaterMatch[1]] || 1;
    return {
      dateJalali: addDaysToJalaliDate(effectiveBaseDate, daysToAdd),
      matchedPhrase: daysLaterMatch[0],
    };
  }

  // ۱۴. «دو هفته بعد / دیگر / دیگه»
  if (
    norm.includes('دو هفته بعد') ||
    norm.includes('دو هفته دیگر') ||
    norm.includes('دو هفته دیگه')
  ) {
    return {
      dateJalali: addDaysToJalaliDate(effectiveBaseDate, 14),
      matchedPhrase: 'دو هفته بعد',
    };
  }

  // ۱۵. روزهای هفته با ترتیب اولویت طولانی‌تر به کوتاه‌تر (چهارشنبه، پنج‌شنبه، سه‌شنبه، یکشنبه، دوشنبه، جمعه، شنبه)
  for (const w of ORDERED_WEEKDAYS) {
    const regex = new RegExp(
      '(?:روز\\s*)?' + w.name + '(?:\\s*(این\\s*هفته|هفته\\s*بعد|هفته\\s*دیگه|اینده|آینده|بعد))?'
    );
    const match = norm.match(regex);
    if (match) {
      const currentWeekdayIdx = getJalaliWeekday(effectiveBaseDate);
      let diff = w.idx - currentWeekdayIdx;

      const isExplicitlyNext =
        norm.includes('هفته بعد') ||
        norm.includes('هفته اینده') ||
        norm.includes('هفته آینده') ||
        norm.includes('هفته دیگه') ||
        Boolean(match[1]);

      if (diff < 0) {
        // این روز در هفته جاری سپری شده است، پس مربوط به هفته بعد است
        diff += 7;
      } else if (diff === 0 && isExplicitlyNext) {
        diff = 7;
      }

      // اگر صریحاً گفته «هفته بعد» و روز هنوز در همین هفته پیش روست
      if (isExplicitlyNext && diff > 0 && diff < 7) {
        diff += 7;
      }

      return {
        dateJalali: addDaysToJalaliDate(effectiveBaseDate, diff),
        matchedPhrase: match[0],
      };
    }
  }

  // ۱۶. «یک هفته دیگر / یک هفته بعد / هفته بعد / هفته آینده»
  if (
    norm.includes('یک هفته دیگر') ||
    norm.includes('یک هفته دیگه') ||
    norm.includes('یک هفته بعد') ||
    norm.includes('هفته اینده') ||
    norm.includes('هفته آینده') ||
    norm.includes('هفته بعد') ||
    norm.includes('هفته دیگه')
  ) {
    return {
      dateJalali: addDaysToJalaliDate(effectiveBaseDate, 7),
      matchedPhrase: 'هفته بعد',
    };
  }

  // ۱۷. آخر هفته (پنج‌شنبه جاری یا بعدی)
  if (norm.includes('آخر هفته') || norm.includes('اخر هفته') || norm.includes('پایان هفته')) {
    const currentWeekdayIdx = getJalaliWeekday(effectiveBaseDate);
    let diff = 5 - currentWeekdayIdx; // ۵ = پنج‌شنبه
    if (diff <= 0) diff += 7;
    return {
      dateJalali: addDaysToJalaliDate(effectiveBaseDate, diff),
      matchedPhrase: 'آخر هفته',
    };
  }

  return { dateJalali: effectiveBaseDate };
}

/**
 * تشخیص هوشمند دسته‌بندی کار بر اساس کلمات کلیدی بازار مسکن
 */
function extractCategory(text: string): TaskCategory {
  const norm = text.toLowerCase();
  if (
    norm.includes('تماس') ||
    norm.includes('زنگ') ||
    norm.includes('تلفن') ||
    norm.includes('پیام') ||
    norm.includes('واتساپ') ||
    norm.includes('صحبت با')
  ) {
    return 'CALL';
  }
  if (
    norm.includes('بازدید') ||
    norm.includes('دیدن واحد') ||
    norm.includes('دیدن ملک') ||
    norm.includes('دیدن اپارتمان') ||
    norm.includes('دیدن آپارتمان') ||
    norm.includes('بردن مشتری') ||
    norm.includes('سروقت واحد')
  ) {
    return 'VIEWING';
  }
  if (
    norm.includes('قرارداد') ||
    norm.includes('مبایعه') ||
    norm.includes('اجاره‌نامه') ||
    norm.includes('قولنامه') ||
    norm.includes('امضا') ||
    norm.includes('پیش‌نویس') ||
    norm.includes('کمیسیون')
  ) {
    return 'CONTRACT';
  }
  if (
    norm.includes('جلسه') ||
    norm.includes('نشست') ||
    norm.includes('مذاکره') ||
    norm.includes('اتاق مدیریت') ||
    norm.includes('دیدار حضوری')
  ) {
    return 'MEETING';
  }
  if (
    norm.includes('کارشناسی') ||
    norm.includes('عکسبرداری') ||
    norm.includes('فیلمبرداری') ||
    norm.includes('قیمت‌گذاری') ||
    norm.includes('تخمین') ||
    norm.includes('ارزیابی')
  ) {
    return 'INSPECTION';
  }
  if (
    norm.includes('پیگیری') ||
    norm.includes('استعلام') ||
    norm.includes('شهرداری') ||
    norm.includes('دارایی') ||
    norm.includes('ثبت') ||
    norm.includes('سند') ||
    norm.includes('وام')
  ) {
    return 'FOLLOW_UP';
  }

  return 'OTHER';
}

/**
 * تشخیص اولویت کار
 */
function extractPriority(text: string): TaskPriority {
  const norm = text.toLowerCase();
  if (
    norm.includes('فوری') ||
    norm.includes('اضطراری') ||
    norm.includes('حیاتی') ||
    norm.includes('خیلی مهم') ||
    norm.includes('عجله') ||
    norm.includes('سریعا') ||
    norm.includes('سریعاً')
  ) {
    return 'URGENT';
  }
  if (
    norm.includes('مهم') ||
    norm.includes('ضروری') ||
    norm.includes('حتما') ||
    norm.includes('حتماً') ||
    norm.includes('فراموش نشه') ||
    norm.includes('یادت نره')
  ) {
    return 'HIGH';
  }
  if (norm.includes('عادی') || norm.includes('هروقت شد') || norm.includes('فرصت شد')) {
    return 'LOW';
  }
  return 'MEDIUM';
}

/**
 * تشخیص نام شخص یا مخاطب (آقای ...، خانم ...، مهندس ...)
 */
function extractClientName(text: string): string | undefined {
  const match = text.match(
    /(آقای|خانم|مهندس|دکتر|حاجی|حاج|جناب)\s+([آ-یa-zA-Z]{2,20})(?:\s+([آ-یa-zA-Z]{2,20}))?/
  );
  if (match) {
    const title = match[1];
    const firstWord = match[2];
    const secondWord = match[3];
    const stopWords = [
      'در',
      'برای',
      'جهت',
      'ساعت',
      'که',
      'با',
      'رو',
      'را',
      'و',
      'از',
      'تا',
      'هست',
      'بود',
      'واحد',
      'ملک',
      'پونک',
      'سعادت',
    ];
    if (stopWords.includes(firstWord)) return undefined;
    if (secondWord && !stopWords.includes(secondWord)) {
      return `${title} ${firstWord} ${secondWord}`;
    }
    return `${title} ${firstWord}`;
  }
  return undefined;
}

/**
 * تشخیص کد ملک (مانند P-101 یا کد ۱۲۴)
 */
function extractPropertyCode(text: string): string | undefined {
  const english = toEnglishDigits(text);
  const matchP = english.match(/P-\d+/i);
  if (matchP) return matchP[0].toUpperCase();
  const matchCode = english.match(/کد\s*(\d{2,6})/);
  if (matchCode) return `P-${matchCode[1]}`;
  return undefined;
}

/**
 * پاکسازی عنوان نهایی از کلمات زائد دستوری و اضافات
 */
function cleanTaskTitle(
  rawText: string,
  matchedDatePhrase?: string,
  matchedTimePhrase?: string
): string {
  let title = rawText.trim();

  // ۱. حذف عبارات دستوری ثبت صوتی
  title = title
    .replace(/(لطفاً|لطفا|ثبت کن|یادداشت کن|بنویس|ثبت بشه|انجام بشه|تنظیم کن|قرار بده|قرار بذار|یادت نره|فراموش نشه|کاره خاصی ثبت بشه|کار خاصی ثبت بشه|کاره خاصی|کار خاصی)/gi, ' ')
    .trim();

  // ۲. حذف عبارات تاریخ
  if (matchedDatePhrase) {
    const persianMatched = toPersianDigits(matchedDatePhrase);
    const englishMatched = toEnglishDigits(matchedDatePhrase);
    title = title
      .replace(new RegExp(matchedDatePhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ')
      .replace(new RegExp(persianMatched.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ')
      .replace(new RegExp(englishMatched.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
  }

  title = title
    .replace(
      /(?:در\s*تاریخ|توی\s*تاریخ|تو\s*تاریخ|برای\s*تاریخ|واسه\s*تاریخ|تاریخ|برای|واسه|روز)?\s*[۰-۹0-9]{1,2}\s*(?:ام|ـم|م|مین)?\s*(فروردین|اردیبهشت|خرداد|تیر|مرداد|امرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند)(?:\s*ماه)?/gi,
      ' '
    )
    .replace(
      /(?:در\s*تاریخ|توی\s*تاریخ|تو\s*تاریخ|برای\s*تاریخ|واسه\s*تاریخ|تاریخ|برای|واسه|روز)?\s*(بیست و پنجم|بیست و چهارم|بیست و سوم|بیست و دوم|بیست و یکم|سی و یکم|سی‌ام|سی ام|بیستم|نوزدهم|هجدهم|هفدهم|شانزدهم|پانزدهم|چهاردهم|سیزدهم|دوازدهم|یازدهم|دهم|نهم|هشتم|هفتم|ششم|پنجم|چهارم|سوم|دوم|اول|یکم)\s*(فروردین|اردیبهشت|خرداد|تیر|مرداد|امرداد|شهریور|مهر|آبان|آذر|دی|بهمن|اسفند)(?:\s*ماه)?/gi,
      ' '
    )
    .replace(/(?:در\s*تاریخ|توی\s*تاریخ|تو\s*تاریخ|تاریخ\s*)?[0-9۰-۹]{2,4}[\/\-][0-9۰-۹]{1,2}(?:[\/\-][0-9۰-۹]{1,2})?/gi, ' ')
    .replace(
      /(?:در\s*تاریخ|توی\s*تاریخ|تو\s*تاریخ|برای\s*تاریخ|واسه\s*تاریخ|تاریخ|برای|واسه)\s*[۰-۹0-9]{1,2}\s*(?:ام|ـم|م|مین)?/gi,
      ' '
    )
    .replace(
      /(?:روز\s*)?(چهارشنبه|پنجشنبه|پنج‌شنبه|سه‌شنبه|سه شنبه|دوشنبه|یکشنبه|یک‌شنبه|جمعه|شنبه)(?:\s*(این\s*هفته|هفته\s*بعد|هفته\s*دیگه|اینده|آینده|بعد))?/gi,
      ' '
    )
    .replace(/(پس\s*فردا|پس‌فردا|فردا|امروز|آخر\s*هفته|اخر\s*هفته)/gi, ' ');

  // ۳. حذف عبارات زمان و ساعت
  if (matchedTimePhrase) {
    const persianTime = toPersianDigits(matchedTimePhrase);
    const englishTime = toEnglishDigits(matchedTimePhrase);
    title = title
      .replace(new RegExp(matchedTimePhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ')
      .replace(new RegExp(persianTime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ')
      .replace(new RegExp(englishTime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
  }

  title = title
    .replace(
      /(?:ساعت\s*)?[0-9۰-۹]{1,2}(?::[0-9۰-۹]{2})?(?:\s*(?:و\s*(?:نیم|ربع|[0-9۰-۹]{1,2}\s*دقیقه)))?(?:\s*(?:عصر|صبح|شب|بعدازظهر))?/gi,
      ' '
    )
    .replace(/ساعت\s*(یک|دو|سه|چهار|پنج|شش|هفت|هشت|نه|ده|یازده|دوازده)(?:\s*(?:عصر|صبح|شب|بعدازظهر))?/gi, ' ');

  // ۴. حذف پیشوندها و پسوندهای به جا مانده مانند «توی»، «برای»، «کاره»، «کار»، «رو»، «را»
  for (let pass = 0; pass < 3; pass++) {
    title = title
      .replace(/^(?:توی|تو|در|برای|واسه|جهت|یک|یه|کاره|کار|تسک)\s+/gi, '')
      .replace(/\s+(?:رو|را|رویی|ش)$/gi, '')
      .replace(/\s+(?:ثبت کن|ثبتش کن|یادداشت کن|بنویس|بذار|قرار بده|تنظیم کن)$/gi, '')
      .trim();
  }

  // ۵. حذف علائم نگارشی و فاصله‌های مضاعف
  title = title
    .replace(/^[،,\-–:\s]+/, '')
    .replace(/[،,\-–:\s]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (title.length < 3 || title === 'خاصی' || title === 'کاره' || title === 'کار' || title === 'کاره خاصی') {
    title = 'کار و پیگیری روزانه مشاور';
  }

  if (title.length > 90) {
    title = title.slice(0, 90) + '...';
  }

  return title;
}

/**
 * پردازشگر اصلی صوت و متن روزانه مشاور املاک
 */
export function parseVoiceDailyTask(
  rawSpeech: string,
  targetCalendarDate?: string
): ParsedVoiceTask {
  const text = (rawSpeech || '').trim();
  const baseDate = targetCalendarDate || getCurrentJalaliDate();

  if (!text) {
    return {
      title: 'کار روزانه جدید',
      category: 'CALL',
      priority: 'MEDIUM',
      dateJalali: baseDate,
      time: '16:00',
      confidenceScore: 50,
    };
  }

  const category = extractCategory(text);
  const priority = extractPriority(text);
  const timeResult = extractTimeFromPersian(text);
  const dateResult = extractDateFromPersian(text, baseDate);
  const clientName = extractClientName(text);
  const propertyCode = extractPropertyCode(text);

  const title = cleanTaskTitle(text, dateResult.matchedPhrase, timeResult.matchedPhrase);

  let score = 75;
  if (dateResult.matchedPhrase) score += 10;
  if (clientName) score += 5;
  if (timeResult.time) score += 5;
  if (category !== 'OTHER') score += 5;

  return {
    title,
    description: text !== title ? text : undefined,
    category,
    priority,
    dateJalali: normalizeJalaliDateString(dateResult.dateJalali, baseDate),
    time: timeResult.time || '16:00',
    clientName,
    propertyCode,
    matchedDatePhrase: dateResult.matchedPhrase,
    confidenceScore: Math.min(score, 99),
  };
}
