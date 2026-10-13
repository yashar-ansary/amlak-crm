// مسیر فایل: src/utils/voiceParser.ts
// موتور پردازش هوشمند متن و گفتار مشاوران املاک به زبان فارسی برای استخراج مشخصات ملک

import { Property, PropertyType, TransactionType } from '../types/crm';
import { toEnglishDigits } from './jalali';

export interface ParsedVoiceProperty {
  title: string;
  transactionType: TransactionType;
  propertyType: PropertyType;
  district: string;
  address: string;
  area?: number;
  rooms?: number;
  floor?: number;
  totalFloors?: number;
  unitsPerFloor?: number;
  totalUnits?: number;
  builtYear?: number;
  priceTotal?: number;
  pricePerMeter?: number;
  deposit?: number;
  monthlyRent?: number;
  isConvertible: boolean;
  hasParking: boolean;
  hasElevator: boolean;
  hasStorage: boolean;
  hasBalcony: boolean;
  documentType: string;
  ownerName: string;
  ownerPhone: string;
  description: string;
  confidenceScore: number; // درصد اطمینان استخراج
}

// لیست محله‌های معروف جهت تطبیق هوشمند صوتی
const KNOWN_DISTRICTS = [
  'آپادانا',
  'اپادانا',
  'اکباتان',
  'شهرک اکباتان',
  'شهرک آپادانا',
  'سعادت‌آباد',
  'سعادت اباد',
  'شهرک غرب',
  'نیاوران',
  'پونک',
  'یوسف‌آباد',
  'یوسف اباد',
  'فرمانیه',
  'پاسداران',
  'جردن',
  'زعفرانیه',
  'قیطریه',
  'الهیه',
  'ولنجک',
  'صادقیه',
  'مرزداران',
  'گیشا',
  'کوی نصر',
  'تجریش',
  'اقدسیه',
  'محمودیه',
  'کامرانیه',
  'کامورانیه',
  'ونک',
  'میرداماد',
  'ظفر',
  'تهرانپارس',
  'تهرانپارس غربی',
  'تهرانپارس شرقی',
  'نارمک',
  'ستارخان',
  'جنت‌آباد',
  'جنت اباد',
  'سازمان برنامه',
  'شهران',
  'دروس',
  'اختیاریه',
  'سوهانک',
  'ازگل',
  'پیروزی',
  'امیرآباد',
  'امیر اباد',
  'سیدخندان',
  'سهروردی',
  'شریعتی',
  'تهرانسر',
  'چیتگر',
  'دریاچه',
  'دهکده المپیک',
  'باغ فیض',
  'کن',
  'طرشت',
  'فردوس',
  'بلوار فردوس',
  'فردوس شرق',
  'فردوس غرب',
];

/**
 * نرمال‌سازی حروف فارسی و عربی و فواصل مجازی برای تحلیل دقیق گفتار
 */
export function normalizePersianText(str: string): string {
  return toEnglishDigits(str)
    .replace(/\u200c/g, ' ')
    .replace(/[يى]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[\u064B-\u065F]/g, '') // حذف اعراب
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * تبدیل پیش‌پردازش عبارات گفتاری رایج املاک و اعداد مرکب فارسی به ارقام
 */
function preprocessRealEstateSpeech(text: string): string {
  let res = normalizePersianText(text);

  const compoundReplacements: [RegExp, string][] = [
    [/یکصد\s*و\s*هشتاد/gi, '180'],
    [/یکصد\s*و\s*پنجاه/gi, '150'],
    [/یکصد\s*و\s*چهل/gi, '140'],
    [/یکصد\s*و\s*سی/gi, '130'],
    [/یکصد\s*و\s*بیست/gi, '120'],
    [/یکصد\s*و\s*ده/gi, '110'],
    [/یکصد/gi, '100'],
    [/صد\s*و\s*هشتاد/gi, '180'],
    [/صد\s*و\s*پنجاه/gi, '150'],
    [/صد\s*و\s*چهل/gi, '140'],
    [/صد\s*و\s*سی/gi, '130'],
    [/صد\s*و\s*بیست/gi, '120'],
    [/صد\s*و\s*ده/gi, '110'],
    [/دویست\s*و\s*پنجاه/gi, '250'],
    [/دویست/gi, '200'],
    [/سیصد/gi, '300'],
    [/چهارصد/gi, '400'],
    [/پانصد/gi, '500'],
    [/نود\s*و\s*پنج/gi, '95'],
    [/هشتاد\s*و\s*پنج/gi, '85'],
    [/هفتاد\s*و\s*پنج/gi, '75'],
    [/شصت\s*و\s*پنج/gi, '65'],
    [/پنجاه\s*و\s*پنج/gi, '55'],
    [/چهل\s*و\s*پنج/gi, '45'],
    [/سی\s*و\s*پنج/gi, '35'],
    [/بیست\s*و\s*پنج/gi, '25'],
    [/سی\s*و\s*دو/gi, '32'],
    [/هفتاد\s*متری/gi, '70 متری'],
    [/هشتاد\s*متری/gi, '80 متری'],
    [/نود\s*متری/gi, '90 متری'],
    [/صد\s*متری/gi, '100 متری'],
    [/تک\s*خواب/gi, '1 خواب'],
    [/یه\s*خواب/gi, '1 خواب'],
    [/یک\s*خواب/gi, '1 خواب'],
    [/دو\s*خواب/gi, '2 خواب'],
    [/سه\s*خواب/gi, '3 خواب'],
    [/چهار\s*خواب/gi, '4 خواب'],
    [/پنج\s*خواب/gi, '5 خواب'],
    [/طبقه\s*اول/gi, 'طبقه 1'],
    [/طبقه\s*دوم/gi, 'طبقه 2'],
    [/طبقه\s*سوم/gi, 'طبقه 3'],
    [/طبقه\s*چهارم/gi, 'طبقه 4'],
    [/طبقه\s*پنجم/gi, 'طبقه 5'],
    [/طبقه\s*ششم/gi, 'طبقه 6'],
    [/طبقه\s*همکف/gi, 'طبقه 0'],
    [/یک\s*و\s*نیم\s*میلیارد/gi, '1.5 میلیارد'],
    [/دو\s*و\s*نیم\s*میلیارد/gi, '2.5 میلیارد'],
    [/سه\s*و\s*نیم\s*میلیارد/gi, '3.5 میلیارد'],
    [/چهار\s*و\s*نیم\s*میلیارد/gi, '4.5 میلیارد'],
    [/پنج\s*و\s*نیم\s*میلیارد/gi, '5.5 میلیارد'],
    [/ده\s*و\s*نیم\s*میلیارد/gi, '10.5 میلیارد'],
    [/یک\s*میلیارد/gi, '1 میلیارد'],
    [/دو\s*میلیارد/gi, '2 میلیارد'],
    [/سه\s*میلیارد/gi, '3 میلیارد'],
    [/چهار\s*میلیارد/gi, '4 میلیارد'],
    [/پنج\s*میلیارد/gi, '5 میلیارد'],
    [/شش\s*میلیارد/gi, '6 میلیارد'],
    [/هفت\s*میلیارد/gi, '7 میلیارد'],
    [/هشت\s*میلیارد/gi, '8 میلیارد'],
    [/نه\s*میلیارد/gi, '9 میلیارد'],
    [/ده\s*میلیارد/gi, '10 میلیارد'],
    [/چهارصد\s*میلیون/gi, '400 میلیون'],
    [/سیصد\s*میلیون/gi, '300 میلیون'],
    [/دویست\s*میلیون/gi, '200 میلیون'],
    [/پانصد\s*میلیون/gi, '500 میلیون'],
    [/ششصد\s*میلیون/gi, '600 میلیون'],
    [/هفتصد\s*میلیون/gi, '700 میلیون'],
    [/هشتصد\s*میلیون/gi, '800 میلیون'],
    [/نهصد\s*میلیون/gi, '900 میلیون'],
    [/یکصد\s*میلیون/gi, '100 میلیون'],
    [/صد\s*میلیون/gi, '100 میلیون'],
    [/متری\s*نود\s*میلیون/gi, 'متری 90 میلیون'],
    [/متری\s*صد\s*میلیون/gi, 'متری 100 میلیون'],
    [/متری\s*صد\s*و\s*بیست\s*میلیون/gi, 'متری 120 میلیون'],
    [/متری\s*صد\s*و\s*ده\s*میلیون/gi, 'متری 110 میلیون'],
    [/متری\s*صد\s*و\s*پنجاه\s*میلیون/gi, 'متری 150 میلیون'],
  ];

  for (const [pattern, replacement] of compoundReplacements) {
    res = res.replace(pattern, replacement);
  }

  return res;
}

/**
 * تبدیل کلمات عددی فارسی به عدد (یکصد، دویست، سه، چهار،...)
 */
function parsePersianWordsToNumber(text: string): number | null {
  const cleanText = normalizePersianText(text);

  const directNum = parseFloat(cleanText.replace(/,/g, ''));
  if (!isNaN(directNum) && directNum > 0) {
    return directNum;
  }

  const wordMap: Record<string, number> = {
    یک: 1,
    یه: 1,
    تک: 1,
    دو: 2,
    سه: 3,
    چهار: 4,
    پنج: 5,
    شش: 6,
    شیش: 6,
    هفت: 7,
    هشت: 8,
    نه: 9,
    ده: 10,
    یازده: 11,
    دوازده: 12,
    سیزده: 13,
    چهارده: 14,
    پانزده: 15,
    شانزده: 16,
    هفده: 17,
    هجده: 18,
    نوزده: 19,
    بیست: 20,
    سی: 30,
    چهل: 40,
    پنجاه: 50,
    شصت: 60,
    هفتاد: 70,
    هشتاد: 80,
    نود: 90,
    صد: 100,
    یکصد: 100,
    دویست: 200,
    سیصد: 300,
    چهارصد: 400,
    پانصد: 500,
    ششصد: 600,
    هفتصد: 700,
    هشتصد: 800,
    نهصد: 900,
    هزار: 1000,
  };

  if (wordMap[cleanText]) {
    return wordMap[cleanText];
  }

  // بررسی اعداد ترکیبی مثل "بیست و پنج" یا "صد و سی"
  if (cleanText.includes(' و ')) {
    const parts = cleanText.split(/\s*و\s*/);
    let sum = 0;
    let found = false;
    for (const part of parts) {
      if (wordMap[part] !== undefined) {
        sum += wordMap[part];
        found = true;
      } else {
        const numPart = parseFloat(part);
        if (!isNaN(numPart)) {
          sum += numPart;
          found = true;
        }
      }
    }
    if (found && sum > 0) return sum;
  }

  return null;
}

/**
 * استخراج مبالغ مالی بر حسب تومان (میلیارد، میلیون)
 */
function extractAmounts(text: string): { billions: number[]; millions: number[] } {
  const norm = toEnglishDigits(text);
  const billions: number[] = [];
  const millions: number[] = [];

  // بررسی الگوهای میلیارد تومان (مثلاً "۱۸.۵ میلیارد" یا "۱۸ میلیارد" یا "شانزده میلیارد")
  const billionRegex = /([\d\.]+|یک|دو|سه|چهار|پنج|شش|شیش|هفت|هشت|نه|ده|یازده|دوازده|سیزده|چهارده|پانزده|شانزده|هفده|هجده|نوزده|بیست|سی|چهل|پنجاه|شصت|هفتاد|هشتاد|نود|صد)\s*(?:و\s*([\d\.]+|نیم|پانصد|دویست|سیصد))?\s*میلیارد/gi;
  let bMatch;
  while ((bMatch = billionRegex.exec(norm)) !== null) {
    let base = parsePersianWordsToNumber(bMatch[1]) || parseFloat(bMatch[1]);
    if (!isNaN(base)) {
      if (bMatch[2]) {
        if (bMatch[2] === 'نیم') base += 0.5;
        else {
          const frac = parsePersianWordsToNumber(bMatch[2]) || parseFloat(bMatch[2]);
          if (!isNaN(frac)) {
            base += frac < 10 ? frac / 10 : frac / 1000;
          }
        }
      }
      billions.push(Math.round(base * 1_000_000_000));
    }
  }

  // بررسی الگوهای میلیون تومان (مثلاً "۵۰۰ میلیون" یا "۲۵ میلیون")
  const millionRegex = /([\d\.]+|یکصد|دویست|سیصد|چهارصد|پانصد|ششصد|هفتصد|هشتصد|نهصد|ده|بیست|سی|چهل|پنجاه|شصت|هفتاد|هشتاد|نود)\s*میلیون/gi;
  let mMatch;
  while ((mMatch = millionRegex.exec(norm)) !== null) {
    const val = parsePersianWordsToNumber(mMatch[1]) || parseFloat(mMatch[1]);
    if (!isNaN(val)) {
      millions.push(Math.round(val * 1_000_000));
    }
  }

  return { billions, millions };
}

/**
 * الگوریتم اصلی پردازش متن گفتار فارسی مشاور و استخراج مشخصات ملک
 */
export function parseVoicePropertyDescription(voiceText: string): ParsedVoiceProperty {
  const normText = preprocessRealEstateSpeech(voiceText);
  let confidence = 55;

  // ۱. نوع معامله
  let transactionType: TransactionType = 'SALE';
  if (
    normText.includes('اجاره') ||
    normText.includes('رهن') ||
    normText.includes('کرایه') ||
    normText.includes('ودیعه')
  ) {
    transactionType = 'RENT';
    confidence += 10;
  } else if (normText.includes('پیش فروش') || normText.includes('پیش‌فروش')) {
    transactionType = 'PRE_SALE';
  } else if (normText.includes('معاوضه') || normText.includes('تهاتر')) {
    transactionType = 'EXCHANGE';
  } else {
    transactionType = 'SALE';
  }

  // ۲. نوع ملک
  let propertyType: PropertyType = 'APARTMENT';
  if (normText.includes('ویلا') || normText.includes('باغ')) {
    propertyType = 'VILLA';
    confidence += 10;
  } else if (normText.includes('مغازه') || normText.includes('تجاری')) {
    propertyType = 'COMMERCIAL';
  } else if (normText.includes('اداری') || normText.includes('دفتر کار') || normText.includes('موقعیت اداری')) {
    propertyType = 'OFFICE';
  } else if (normText.includes('زمین') || normText.includes('کلنگی')) {
    propertyType = 'LAND';
  } else if (
    (normText.includes('سوله') || normText.includes('کارگاه') || normText.includes('انبار صنعتی') || normText.includes('انبار کالا')) &&
    !normText.includes('انباری')
  ) {
    propertyType = 'WORKSHOP';
  } else {
    propertyType = 'APARTMENT';
  }

  // ۳. استخراج متراژ
  let area: number | undefined = undefined;
  const explicitAreaMatch = normText.match(/(?:متراژ|مساحت|زیربنا)\s*[:\s]\s*(\d+)/i);
  if (explicitAreaMatch) {
    area = parseInt(explicitAreaMatch[1], 10);
    confidence += 15;
  } else {
    const areaMatches = [
      /(\d+)\s*(?:متر|متری|متره|مترمربع|متر مربع)/i,
      /(?:متراژ|مساحت|زیربنا)\s*(?:حدود|حدودا|تقریبا)?\s*(\d+)/i,
      /(یکصد|صد|دویست|سیصد|چهارصد|پانصد|شصت|هفتاد|هشتاد|نود)\s*(?:متر|متری|متره)/i,
    ];
    for (const regex of areaMatches) {
      const match = normText.match(regex);
      if (match) {
        const val = parsePersianWordsToNumber(match[1]) || parseInt(match[1], 10);
        if (val && val >= 15 && val < 10000) {
          area = val;
          confidence += 15;
          break;
        }
      }
    }
  }

  // در صورت عدم بیان متراژ، پیش‌فرض مناسب کاربری اختصاص می‌یابد
  if (!area) {
    if (propertyType === 'VILLA') area = 350;
    else if (propertyType === 'COMMERCIAL') area = 50;
    else if (propertyType === 'OFFICE') area = 85;
    else if (propertyType === 'LAND') area = 300;
    else area = 120;
  }

  // ۴. استخراج تعداد اتاق خواب
  let rooms = 2; // پیش‌فرض منطقی
  const explicitRoomsMatch = normText.match(/(?:تعداد\s*خواب|خواب|اتاق)\s*[:\s]\s*(\d+)/i);
  if (explicitRoomsMatch) {
    rooms = parseInt(explicitRoomsMatch[1], 10);
    confidence += 10;
  } else {
    const roomMatch = normText.match(/(\d+|یک|دو|سه|چهار|پنج|یه|تک)\s*(?:خوابه|خواب|اتاق)/i);
    if (roomMatch) {
      const num = parsePersianWordsToNumber(roomMatch[1]) || parseInt(roomMatch[1], 10);
      if (num && num >= 0 && num <= 10) {
        rooms = num;
        confidence += 10;
      }
    }
  }

  // ۵. استخراج طبقه
  let floor: number = 2;
  const explicitFloorMatch = normText.match(/(?:طبقه)\s*[:\s]\s*(\d+|همکف|اول|دوم|سوم|چهارم|پنجم|ششم|هفتم|هشتم|نهم|دهم|آخر)/i);
  if (explicitFloorMatch) {
    const fStr = explicitFloorMatch[1];
    if (fStr === 'همکف') floor = 0;
    else if (fStr === 'اول') floor = 1;
    else if (fStr === 'دوم') floor = 2;
    else if (fStr === 'سوم') floor = 3;
    else if (fStr === 'چهارم') floor = 4;
    else if (fStr === 'پنجم') floor = 5;
    else if (fStr === 'ششم') floor = 6;
    else if (fStr === 'هفتم') floor = 7;
    else if (fStr === 'هشتم') floor = 8;
    else if (fStr === 'آخر') floor = 5;
    else floor = parseInt(fStr, 10) || 2;
  } else {
    const floorMatch = normText.match(/طبقه\s*(\d+|اول|دوم|سوم|چهارم|پنجم|ششم|هفتم|هشتم|نهم|دهم|همکف|آخر)/i);
    if (floorMatch) {
      const fStr = floorMatch[1];
      if (fStr === 'همکف') floor = 0;
      else if (fStr === 'اول') floor = 1;
      else if (fStr === 'دوم') floor = 2;
      else if (fStr === 'سوم') floor = 3;
      else if (fStr === 'چهارم') floor = 4;
      else if (fStr === 'پنجم') floor = 5;
      else if (fStr === 'ششم') floor = 6;
      else if (fStr === 'هفتم') floor = 7;
      else if (fStr === 'هشتم') floor = 8;
      else if (fStr === 'آخر') floor = 5;
      else {
        floor = parseInt(fStr, 10) || 2;
      }
    }
  }

  // استخراج تعداد طبقات و واحدها
  let totalFloors: number = 5;
  let unitsPerFloor: number = 2;
  let totalUnits: number = 10;

  // صریح: "تعداد واحد: ۱۰" یا "تعداد واحدها: ۱۲" یا "کل واحدها: ۱۰"
  const explicitUnitsMatch = normText.match(/(?:تعداد\s*واحد(?:ها)?|کل\s*واحد(?:ها)?|واحدها)\s*[:\s]\s*(\d+)/i);
  if (explicitUnitsMatch) {
    totalUnits = parseInt(explicitUnitsMatch[1], 10);
  }

  // الگوهای "۵ طبقه ۱۰ واحد" یا "۵ طبقه ۲ واحدی"
  const comboUnitsMatch = normText.match(/(\d+)\s*طبقه\s*(?:و\s*)?(\d+)\s*واحد/i);
  if (comboUnitsMatch) {
    totalFloors = parseInt(comboUnitsMatch[1], 10);
    const u = parseInt(comboUnitsMatch[2], 10);
    if (u <= 8) {
      unitsPerFloor = u;
      totalUnits = totalFloors * unitsPerFloor;
    } else {
      totalUnits = u;
      unitsPerFloor = Math.max(1, Math.round(totalUnits / totalFloors));
    }
  }

  if (normText.includes('تک واحدی') || normText.includes('تک واحد')) {
    unitsPerFloor = 1;
    totalUnits = totalFloors * 1;
  } else if (normText.includes('دو واحدی')) {
    unitsPerFloor = 2;
  } else if (normText.includes('سه واحدی')) {
    unitsPerFloor = 3;
  } else if (normText.includes('چهار واحدی')) {
    unitsPerFloor = 4;
  }

  const explicitUnitsPerFloorMatch = normText.match(/(\d+)\s*واحد\s*در\s*(?:هر\s*)?طبقه/i);
  if (explicitUnitsPerFloorMatch) {
    unitsPerFloor = parseInt(explicitUnitsPerFloorMatch[1], 10);
    totalUnits = totalFloors * unitsPerFloor;
  }

  const explicitFloorsMatch = normText.match(/(?:کل\s*طبقات|تعداد\s*طبقات)\s*[:\s]\s*(\d+)/i);
  if (explicitFloorsMatch) {
    totalFloors = parseInt(explicitFloorsMatch[1], 10);
  }

  // ۶. استخراج سال ساخت
  let builtYear: number = 1402;
  const explicitYearMatch = normText.match(/(?:سال\s*ساخت|سن\s*بنا|ساخت)\s*[:\s]?\s*(\d{4}|\d{2})/i);
  if (explicitYearMatch) {
    let y = parseInt(explicitYearMatch[1], 10);
    if (y < 100) y = y > 20 ? 1300 + y : 1400 + y;
    builtYear = y;
    confidence += 10;
  } else {
    const yearMatch = normText.match(/(?:سال ساخت|ساخت)\s*(\d{4}|\d{2})/i) || normText.match(/(13\d{2}|14\d{2})/);
    if (yearMatch) {
      let y = parseInt(yearMatch[1], 10);
      if (y < 100) y += 1400;
      builtYear = y;
      confidence += 10;
    } else if (normText.includes('نوساز') || normText.includes('کلید نخورده')) {
      builtYear = 1403;
      confidence += 10;
    }
  }

  // ۷. استخراج محله و آدرس
  let district = '';

  // الف) بررسی لیست محله‌های معروف (به ترتیب طول جهت اولویت محله‌های چندکلمه‌ای مانند شهرک غرب، سعادت‌آباد، شهرک اکباتان)
  const sortedKnownDistricts = [...KNOWN_DISTRICTS].sort((a, b) => b.length - a.length);
  for (const dist of sortedKnownDistricts) {
    if (normText.includes(dist) || normalizePersianText(normText).includes(normalizePersianText(dist))) {
      if (dist === 'اپادانا' || dist === 'آپادانا' || dist.includes('آپادانا')) {
        district = 'آپادانا';
      } else {
        district = dist.replace('سعادت اباد', 'سعادت‌آباد').replace('یوسف اباد', 'یوسف‌آباد');
      }
      confidence += 20;
      break;
    }
  }

  // ب) بررسی صریح عبارت گفتاری «محله [نام]»، «محدوده [نام]»، «منطقه [نام]»، «واقع در [نام]»
  if (!district) {
    const explicitDistrictMatch = normText.match(/(?:محله|محدوده|منطقه|شهرک|واقع\s*در)\s*[:\s]?\s*([آ-یa-zA-Z\s]{2,30})/i);
    if (explicitDistrictMatch) {
      let rawDist = explicitDistrictMatch[1].trim();
      rawDist = rawDist
        .replace(/(?:مالک|صاحبخانه|صاحب|قیمت|متری|متراژ|مساحت|زیربنا|سال\s*ساخت|سن\s*بنا|ساخت|تعداد\s*واحد|کل\s*واحد|واحد|تعداد\s*طبقات|کل\s*طبقات|طبقه|خواب|اتاق|رهن|ودیعه|اجاره|کرایه|سند|تلفن|شماره|همراه|موبایل|تماس|آدرس|ادرس|خیابان|کوچه|پلاک|با|دارای|امکانات|نوساز).*/i, '')
        .trim();
      
      if (rawDist.includes('اپادانا') || rawDist.includes('آپادانا')) {
        district = 'آپادانا';
        confidence += 20;
      } else if (rawDist.includes('سعادت اباد') || rawDist.includes('سعادت‌آباد')) {
        district = 'سعادت‌آباد';
        confidence += 15;
      } else if (rawDist.includes('شهرک غرب')) {
        district = 'شهرک غرب';
        confidence += 20;
      } else if (rawDist.includes('اکباتان')) {
        district = 'اکباتان';
        confidence += 15;
      } else if (rawDist.includes('یوسف اباد') || rawDist.includes('یوسف‌آباد')) {
        district = 'یوسف‌آباد';
        confidence += 15;
      } else if (rawDist.length >= 3) {
        district = rawDist;
        confidence += 15;
      }
    }
  }

  // اگر هیچ محله‌ای ذکر نشده باشد
  if (!district) {
    district = 'تهران';
  }

  let address = district;
  const explicitAddressMatch = normText.match(/(?:آدرس|ادرس)\s*[:\s]?\s*([^\s،,.]+)/i);
  if (explicitAddressMatch) {
    address = `${district}، ${explicitAddressMatch[1]}`;
  } else {
    const streetMatch = normText.match(/(?:خیابان|خیابون|خ|بلوار|میدان|میدون|کوچه|نرسیده\s*به|تقاطع)\s+([^\s،,.]+)/i);
    if (streetMatch) {
      address = `${district}، ${streetMatch[0]}`;
    }
  }

  // ۸. استخراج مبالغ مالی
  let priceTotal: number | undefined = undefined;
  let pricePerMeter: number | undefined = undefined;
  let deposit: number | undefined = undefined;
  let monthlyRent: number | undefined = undefined;

  const isFullRent =
    normText.includes('رهن کامل') ||
    normText.includes('رهن یکجا') ||
    /رهن\s*کامل/.test(normText);

  if (transactionType === 'SALE' || transactionType === 'PRE_SALE') {
    // ۱. استخراج قیمت متری
    const pmMatch = normText.match(/(?:متری|قیمت\s*متری)\s*(\d+(?:\.\d+)?)\s*(میلیون|تومن|تومان)?(?!\s*(?:خواب|اتاق|واحد|طبقه))/i);
    if (pmMatch) {
      const val = parseFloat(pmMatch[1]);
      const unit = pmMatch[2];
      if (unit === 'میلیون' || unit === 'تومن' || unit === 'تومان' || val >= 10) {
        pricePerMeter = Math.round(val < 1000 ? val * 1_000_000 : val);
      }
    }

    // ۲. استخراج قیمت کل (با میلیارد و میلیون مرکب، مانند «۵ میلیارد و ۲۰۰ میلیون»)
    const compoundBillionMatch = normText.match(/(?:قیمت|قیمت\s*کل)?\s*[:\s]?\s*(\d+(?:\.\d+)?)\s*میلیارد(?:\s*(?:و|,)\s*(\d+(?:\.\d+)?)\s*میلیون)?/i);
    if (compoundBillionMatch) {
      const b = parseFloat(compoundBillionMatch[1]);
      const m = compoundBillionMatch[2] ? parseFloat(compoundBillionMatch[2]) : 0;
      priceTotal = Math.round(b * 1_000_000_000 + m * 1_000_000);
      confidence += 20;
    } else {
      const explicitPriceMatch = normText.match(/(?:قیمت|قیمت\s*کل)\s*[:\s]?\s*(\d+(?:\.\d+)?)\s*(میلیارد|میلیون|تومن|تومان)?/i);
      if (explicitPriceMatch) {
        const val = parseFloat(explicitPriceMatch[1]);
        const unit = explicitPriceMatch[2];
        if (unit === 'میلیارد' || val <= 500) {
          priceTotal = Math.round(val * 1_000_000_000);
        } else {
          priceTotal = Math.round(val * 1_000_000);
        }
        confidence += 15;
      }
    }

    if (!priceTotal && pricePerMeter && area) {
      priceTotal = pricePerMeter * area;
    } else if (priceTotal && area && !pricePerMeter) {
      pricePerMeter = Math.round(priceTotal / area);
    }
  } else {
    // برای رهن و اجاره
    if (isFullRent) {
      monthlyRent = 0;
    }

    // الف) ودیعه / رهن صریح با ذکر واحد (جلوگیری از اشتباه با عدد طبقه مانند «طبقه ۲ رهن ۵۰۰»)
    const explicitDeposit1 = normText.match(/(?:ودیعه|رهن)\s*(?:کامل)?\s*[:\s]?\s*(\d+(?:\.\d+)?)\s*(میلیارد|میلیون|تومن|تومان)?(?:\s*(?:و|,)\s*(\d+(?:\.\d+)?)\s*(میلیون))?/i);
    const explicitDeposit2 = normText.match(/(\d+(?:\.\d+)?)\s*(میلیارد|میلیون|تومن|تومان)\s*(?:ودیعه|رهن)/i);

    if (explicitDeposit1) {
      const val = parseFloat(explicitDeposit1[1]);
      const unit = explicitDeposit1[2];
      const subVal = explicitDeposit1[3] ? parseFloat(explicitDeposit1[3]) : 0;
      if (unit === 'میلیارد') {
        deposit = Math.round(val * 1_000_000_000 + subVal * 1_000_000);
      } else if (unit === 'میلیون' || unit === 'تومن' || unit === 'تومان' || val >= 100) {
        deposit = Math.round(val * 1_000_000);
      } else if (val < 100 && val > 0) {
        deposit = Math.round(val * 1_000_000_000);
      }
      confidence += 15;
    } else if (explicitDeposit2) {
      const val = parseFloat(explicitDeposit2[1]);
      const unit = explicitDeposit2[2];
      if (unit === 'میلیارد') deposit = Math.round(val * 1_000_000_000);
      else deposit = Math.round(val * 1_000_000);
      confidence += 15;
    }

    // ب) اصطلاح بازار «۵۰۰ با ۲۰» یا «ودیعه ۵۰۰ با ۲۰ اجاره»
    const comboMatch = normText.match(/(?:ودیعه|رهن)?\s*(\d+)\s*(?:تومن|میلیون)?\s*(?:با|و)\s*(\d+)\s*(?:تومن|میلیون)?\s*(?:اجاره|کرایه)?/i);
    if (comboMatch && (!deposit || monthlyRent === undefined)) {
      const d = parseInt(comboMatch[1], 10);
      const r = parseInt(comboMatch[2], 10);
      if (d >= 50 && r <= 200) {
        if (!deposit) deposit = d * 1_000_000;
        if (monthlyRent === undefined && !isFullRent) monthlyRent = r * 1_000_000;
      }
    }

    // ج) اجاره ماهانه صریح (اجاره ۲۰ میلیون، ماهی ۱۵ تومن، ماهانه ۲۵)
    if (monthlyRent === undefined && !isFullRent) {
      const explicitRent =
        normText.match(/(?:اجاره|کرایه|ماهی|ماهانه)\s*[:\s]?\s*(\d+(?:\.\d+)?)\s*(میلیون|تومن|تومان)?/i) ||
        normText.match(/(\d+(?:\.\d+)?)\s*(میلیون|تومن|تومان)\s*(?:اجاره|کرایه|ماهانه)/i);
      if (explicitRent) {
        const val = parseFloat(explicitRent[1]);
        monthlyRent = Math.round(val * 1_000_000);
        confidence += 15;
      }
    }
  }

  // ۹. امکانات رفاهی
  const hasParking = !normText.includes('بدون پارکینگ') && !normText.includes('پارکینگ ندارد');
  const hasElevator = !normText.includes('بدون آسانسور') && !normText.includes('آسانسور ندارد');
  const hasStorage = !normText.includes('بدون انباری');
  const hasBalcony = normText.includes('بالکن') || normText.includes('تراس');

  // ۱۰. قابلیت تبدیل
  const isConvertible =
    !normText.includes('غیر قابل تبدیل') &&
    !normText.includes('تبدیل نمیشود') &&
    !normText.includes('تبدیل ندارد') &&
    !normText.includes('غیرقابل تبدیل');

  // ۱۱. مشخصات مالک و تلفن به صورت تفکیک‌شده و بدون تداخل با سایر فیلدها
  let ownerName = '';
  const ownerPattern = /(?:مالک|صاحب‌خانه|صاحبخانه|صاحب\s*ملک|به\s*نام)\s*[:\s]?\s*([آ-یa-zA-Z\s]{2,35})/i;
  const explicitOwnerMatch = normText.match(ownerPattern);
  if (explicitOwnerMatch) {
    let rawOwner = explicitOwnerMatch[1]
      .replace(/(?:محله|محدوده|شهرک|منطقه|واقع|قیمت|متری|متراژ|مساحت|زیربنا|سال\s*ساخت|سن\s*بنا|ساخت|تعداد\s*واحد|کل\s*واحد|واحد\s*در\s*طبقه|تعداد\s*طبقات|کل\s*طبقات|طبقه|خواب|اتاق|رهن|ودیعه|اجاره|کرایه|سند|تلفن|شماره|همراه|موبایل|تماس|آدرس|ادرس|خیابان|کوچه|پلاک|با|دارای|امکانات|نوساز).*/i, '')
      .trim();
    rawOwner = rawOwner.replace(/^(?:است|هست|محترم|بوده|می‌باشد|میباشد)\s+/, '').trim();
    if (rawOwner.length >= 2) {
      ownerName = rawOwner;
      confidence += 15;
    }
  } else {
    const honorificMatch = normText.match(/(?:آقای|خانم|دکتر|مهندس|حاج\s*آقا)\s+([آ-یa-zA-Z\s]{2,25})/i);
    if (honorificMatch) {
      let rawHonor = honorificMatch[0]
        .replace(/(?:محله|محدوده|شهرک|منطقه|واقع|قیمت|متری|متراژ|مساحت|زیربنا|سال\s*ساخت|سن\s*بنا|ساخت|تعداد\s*واحد|کل\s*واحد|واحد\s*در\s*طبقه|تعداد\s*طبقات|کل\s*طبقات|طبقه|خواب|اتاق|رهن|ودیعه|اجاره|کرایه|سند|تلفن|شماره|همراه|موبایل|تماس|آدرس|ادرس|خیابان|کوچه|پلاک|با|دارای|امکانات|نوساز).*/i, '')
        .trim();
      if (rawHonor.length >= 3) {
        ownerName = rawHonor;
        confidence += 10;
      }
    }
  }

  let ownerPhone = '';
  const phoneClean = normText.replace(/[-]/g, '');
  const phoneMatch = phoneClean.match(/09\d{9}/) || phoneClean.match(/09\d{2}\s*\d{3}\s*\d{4}/);
  if (phoneMatch) {
    ownerPhone = phoneMatch[0].replace(/\s+/g, '');
    confidence += 10;
  }

  // نوع سند
  let documentType = 'سند تک‌برگ شخصی';
  if (normText.includes('اوقاف') || normText.includes('اوقافی')) {
    documentType = 'سند اوقافی';
  } else if (normText.includes('قولنامه') || normText.includes('قولنامه‌ای')) {
    documentType = 'قولنامه‌ای با کد رهگیری';
  }

  // ساخت عنوان جذاب بر اساس اطلاعات استخراج‌شده
  const typeLabel = propertyType === 'VILLA' ? 'ویلای' : propertyType === 'COMMERCIAL' ? 'مغازه تجاری' : propertyType === 'OFFICE' ? 'واحد اداری' : 'آپارتمان';
  const areaLabel = area ? `${area} متری` : '';
  const roomsLabel = rooms ? `${rooms} خوابه` : '';
  const title = `${typeLabel} ${areaLabel} ${roomsLabel} در ${district}`.replace(/\s+/g, ' ').trim();

  return {
    title,
    transactionType,
    propertyType,
    district,
    address,
    area,
    rooms,
    floor,
    totalFloors,
    unitsPerFloor,
    totalUnits,
    builtYear,
    priceTotal,
    pricePerMeter,
    deposit,
    monthlyRent,
    isConvertible,
    hasParking,
    hasElevator,
    hasStorage,
    hasBalcony,
    documentType,
    ownerName,
    ownerPhone,
    description: voiceText.trim(),
    confidenceScore: Math.min(confidence, 98),
  };
}

/**
 * ارسال متن به سرور محلی داکر جهت پیاده‌سازی و استخراج ساخت‌یافته (۱۰۰٪ محلی و آفلاین)
 * با فال‌بک خودکار به موتور پردازش کلاینت در صورت بروز هرگونه مشکل یا قطعی شبکه
 */
export async function parseVoicePropertyWithAI(params: {
  audioBase64?: string;
  mimeType?: string;
  text?: string;
}): Promise<{ transcript: string; parsedProperty: ParsedVoiceProperty }> {
  try {
    const res = await fetch('/api/parse-voice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.parsedProperty) {
        return {
          transcript: data.transcript || params.text || '',
          parsedProperty: data.parsedProperty,
        };
      }
    }
  } catch (err) {
    console.warn('Backend AI parse request notice (falling back to client parser):', err);
  }

  // فال‌بک فوری و امن به موتور کلاینت
  const fallbackText = params.text || '';
  const parsed = parseVoicePropertyDescription(fallbackText);
  return {
    transcript: fallbackText,
    parsedProperty: parsed,
  };
}

/**
 * نمونه‌های صوتی پرکاربرد و از پیش آماده برای تست سریع توسط کاربر
 */
export const VOICE_PRESET_SCENARIOS = [
  {
    label: 'فروش آپارتمان لوکس نیاوران',
    category: 'فروش مسکونی',
    text: 'یک واحد آپارتمان ۱۸۰ متری سه خوابه نوساز در نیاوران خیابان بوستان طبقه پنجم، دارای دو پارکینگ سندی، آسانسور، انباری و تراس با ویوی عالی، قیمت کل ۳۲ میلیارد تومان، سند تک برگ شخصی، مالک آقای مهندس رادمنش با شماره تماس ۰۹۱۲۸۸۸۹۹۰۰، واحد تخلیه و کلید دست خودمونه.',
  },
  {
    label: 'رهن و اجاره سعادت‌آباد',
    category: 'رهن و اجاره',
    text: 'یک واحد آپارتمان ۱۱۰ متری دو خوابه در سعادت‌آباد میدان کاج خیابان بهزاد، طبقه سوم، دارای پارکینگ و آسانسور و انباری، ودیعه یک میلیارد تومان با بیست و پنج میلیون اجاره ماهانه، سال ساخت ۱۳۹۹، مالک خانم شمس ۰۹۱۲۳۴۵۶۷۸۹، بسیار تمیز و نورگیر عالی.',
  },
  {
    label: 'ویلای تریپلکس استخردار شهرک غرب',
    category: 'ویلایی',
    text: 'ویلای ۵۰۰ متری دوبلکس در شهرک غرب فاز یک ایران‌زمین، پنج خوابه، استخر سونا جکوزی فعال، دارای حیاط مشجر و چهار جای پارک، سند شش دانگ عرصه و اعیان، قیمت کل ۷۵ میلیارد تومان، مالک حاج آقا مظفری ۰۹۱۲۱۱۱۴۴۵۵.',
  },
  {
    label: 'رهن کامل پونک',
    category: 'رهن کامل',
    text: 'آپارتمان ۸۵ متری دو خوابه خوش نقشه در پونک بلوار عدل طبقه دوم، سال ساخت ۱۴۰۱، پارکینگ آسانسور بالکن داره، رهن کامل یک میلیارد و چهارصد میلیون تومان، مالک آقای صادقی ۰۹۱۲۵۵۵۶۶۷۷.',
  },
];
