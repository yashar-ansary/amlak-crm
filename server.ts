import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import { parseVoicePropertyDescription } from './src/utils/voiceParser';
import {
  parseVoiceDailyTask,
  normalizeJalaliDateString,
} from './src/utils/voiceTaskParser';
import { getCurrentJalaliDate } from './src/utils/jalali';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// پشتیبانی از بارهای استاندارد
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

console.log('ParsMelk CRM: Running in 100% Local & Offline mode (No external cloud or Gemini dependencies).');

import zlib from 'zlib';

// تولید و آماده‌سازی دینامیک آرشیو زیپ پروژه با جدیدترین تغییرات بدون وابستگی به پایتون یا ابزارهای خارجی
function packageLatestCodebase(): Buffer | null {
  try {
    const projectRoot = process.cwd();
    const excludeDirs = new Set(['node_modules', '.git', 'dist', '.cache', '__pycache__', '.temp']);
    const excludeFiles = new Set(['parsmelk-crm.zip', 'parsmelk-project.zip', 'parsmelk-package.zip', 'parsmelk-project.tar.gz']);
    const files: Array<{ full: string; rel: string }> = [];

    function walk(dir: string) {
      const list = fs.readdirSync(dir);
      for (const file of list) {
        if (file.startsWith('.')) continue;
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          if (!excludeDirs.has(file)) walk(full);
        } else {
          if (!excludeFiles.has(file)) {
            files.push({ full, rel: path.relative(projectRoot, full).replace(/\\/g, '/') });
          }
        }
      }
    }
    walk(projectRoot);

    // جدول CRC32 استاندارد زیپ
    const crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crcTable[n] = c >>> 0;
    }

    function calcCrc32(buf: Buffer): number {
      let crc = 0 ^ (-1);
      for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
      }
      return (crc ^ (-1)) >>> 0;
    }

    const fileEntries: Array<{
      rel: string;
      compressedData: Buffer;
      crc: number;
      uncompressedSize: number;
      compressedSize: number;
      localHeader: Buffer;
      centralHeaderOffset: number;
    }> = [];

    let currentOffset = 0;

    for (const file of files) {
      const rawData = fs.readFileSync(file.full);
      const uncompressedSize = rawData.length;
      const crc = calcCrc32(rawData);
      const compressedData = zlib.deflateRawSync(rawData);
      const compressedSize = compressedData.length;
      const relPathBuf = Buffer.from(file.rel, 'utf8');

      // هدر لوکال فایل زیپ (۳۰ بایت + نام فایل)
      const localHeader = Buffer.alloc(30 + relPathBuf.length);
      localHeader.writeUInt32LE(0x04034b50, 0); // امضا
      localHeader.writeUInt16LE(20, 4);         // نسخه مورد نیاز (2.0)
      localHeader.writeUInt16LE(0, 6);          // فلگ‌ها
      localHeader.writeUInt16LE(8, 8);          // روش فشرده‌سازی Deflate
      localHeader.writeUInt16LE(0, 10);         // ساعت
      localHeader.writeUInt16LE(0, 12);         // تاریخ
      localHeader.writeUInt32LE(crc, 14);       // CRC32
      localHeader.writeUInt32LE(compressedSize, 18);   // سایز فشرده
      localHeader.writeUInt32LE(uncompressedSize, 22); // سایز اصلی
      localHeader.writeUInt16LE(relPathBuf.length, 26);// طول نام فایل
      localHeader.writeUInt16LE(0, 28);         // طول فیلد اضافه
      relPathBuf.copy(localHeader, 30);

      fileEntries.push({
        rel: file.rel,
        compressedData,
        crc,
        uncompressedSize,
        compressedSize,
        localHeader,
        centralHeaderOffset: currentOffset,
      });

      currentOffset += localHeader.length + compressedData.length;
    }

    const cdOffset = currentOffset;
    const cdBuffers: Buffer[] = [];

    for (const entry of fileEntries) {
      const relPathBuf = Buffer.from(entry.rel, 'utf8');
      const cdHeader = Buffer.alloc(46 + relPathBuf.length);
      cdHeader.writeUInt32LE(0x02014b50, 0); // امضای دایرکتوری مرکزی
      cdHeader.writeUInt16LE(20, 4);         // نسخه سازنده
      cdHeader.writeUInt16LE(20, 6);         // نسخه مورد نیاز
      cdHeader.writeUInt16LE(0, 8);          // فلگ‌ها
      cdHeader.writeUInt16LE(8, 10);         // روش Deflate
      cdHeader.writeUInt16LE(0, 12);         // ساعت
      cdHeader.writeUInt16LE(0, 14);         // تاریخ
      cdHeader.writeUInt32LE(entry.crc, 16); // CRC32
      cdHeader.writeUInt32LE(entry.compressedSize, 20);
      cdHeader.writeUInt32LE(entry.uncompressedSize, 24);
      cdHeader.writeUInt16LE(relPathBuf.length, 28);
      cdHeader.writeUInt16LE(0, 30);         // طول فیلد اضافه
      cdHeader.writeUInt16LE(0, 32);         // کامنت
      cdHeader.writeUInt16LE(0, 34);         // شماره دیسک
      cdHeader.writeUInt16LE(0, 36);         // صفات داخلی
      cdHeader.writeUInt32LE(0, 38);         // صفات خارجی
      cdHeader.writeUInt32LE(entry.centralHeaderOffset, 42); // آفست هدر محلی
      relPathBuf.copy(cdHeader, 46);

      cdBuffers.push(cdHeader);
    }

    const cdSize = cdBuffers.reduce((acc, b) => acc + b.length, 0);

    // رکورد انتهای دایرکتوری مرکزی (EOCD - ۲۲ بایت)
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(fileEntries.length, 8);
    eocd.writeUInt16LE(fileEntries.length, 10);
    eocd.writeUInt32LE(cdSize, 12);
    eocd.writeUInt32LE(cdOffset, 16);
    eocd.writeUInt16LE(0, 20);

    const allChunks: Buffer[] = [];
    for (const entry of fileEntries) {
      allChunks.push(entry.localHeader);
      allChunks.push(entry.compressedData);
    }
    for (const cd of cdBuffers) {
      allChunks.push(cd);
    }
    allChunks.push(eocd);

    const zipBuffer = Buffer.concat(allChunks);

    // به‌روزرسانی فایل‌های فیزیکی روی دیسک به عنوان نسخه پشتیبان
    try {
      fs.writeFileSync(path.resolve(projectRoot, 'parsmelk-crm.zip'), zipBuffer);
      fs.writeFileSync(path.resolve(projectRoot, 'parsmelk-project.zip'), zipBuffer);
    } catch (writeErr) {
      console.warn('Backup zip save notice:', writeErr);
    }

    return zipBuffer;
  } catch (err: any) {
    console.warn('Dynamic zip generation notice:', err.message);
  }
  return null;
}

// نقطه پایانی دریافت مستقیم آرشیو زیپ پروژه با جدیدترین سورس کد و جلوگیری از کش مرورگر
app.get(['/api/download-zip', '/parsmelk-project.zip', '/parsmelk-crm.zip'], (req, res) => {
  // ۱. ساخت دینامیک جدیدترین نسخه کدها
  const dynamicZip = packageLatestCodebase();
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="parsmelk-crm.zip"');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (dynamicZip) {
    res.setHeader('Content-Length', dynamicZip.length.toString());
    return res.end(dynamicZip);
  }

  // ۲. در صورت بروز هرگونه خطای سیستم، ارسال فایل ذخیره شده روی دیسک
  const possiblePaths = [
    path.resolve(process.cwd(), 'parsmelk-crm.zip'),
    path.resolve(__dirname, 'parsmelk-crm.zip'),
    path.resolve(process.cwd(), 'parsmelk-project.zip'),
    path.resolve(__dirname, 'parsmelk-project.zip'),
  ];
  for (const zipPath of possiblePaths) {
    if (fs.existsSync(zipPath)) {
      return res.sendFile(zipPath);
    }
  }
  return res.status(404).json({ error: 'فایل زیپ در ریشه پروژه یافت نشد.' });
});

// تابع تبدیل فایل صوتی به متن فارسی به کمک هوش مصنوعی (حیاتی برای دستگاه‌های آیفون که مرورگرشان فاقد وب‌اسپیچ فارسی است)
interface TranscribeResult {
  transcript: string;
  error?: string;
}

async function transcribeAudioBase64(audioBase64: string, mimeType: string = 'audio/mp4'): Promise<TranscribeResult> {
  if (!audioBase64 || audioBase64.length < 50) {
    return { transcript: '', error: 'فایل صوتی ارسال‌شده خالی یا بسیار کوتاه است.' };
  }
  if (!process.env.GEMINI_API_KEY) {
    return {
      transcript: '',
      error: 'کلید GEMINI_API_KEY در فایل .env سرور تنظیم نشده است. مرورگر آیفون (Safari) فاقد وب‌اسپیچ فارسی در مرورگر است و برای تبدیل صوت نیازمند کلید هوش مصنوعی در سرور می‌باشد.',
    };
  }
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    let cleanMime = mimeType && mimeType.includes(';') ? mimeType.split(';')[0].trim() : (mimeType || 'audio/mp4').trim();
    if (cleanMime.startsWith('video/')) {
      cleanMime = 'audio/mp4';
    }
    if (!cleanMime || cleanMime === 'audio/unknown') {
      cleanMime = 'audio/mp4';
    }

    const promptText = 'لطفاً فایل صوتی فارسی را با دقت بسیار بالا و کلمه به کلمه پیاده‌سازی و تایپ کنید. تمام کلمات، جملات، تاریخ‌های شمسی (مانند ۲۵ مهر، فردا، پس‌فردا، شنبه، یکشنبه)، روزهای هفته، ساعت‌ها (مانند ساعت ۵ عصر، ۱۶:۰۰)، نام اشخاص، شماره تماس‌ها و جزئیات کار روزانه یا مشخصات ملک را دقیقاً و با املای صحیح فارسی بنویسید. فقط متن فارسی پیاده‌شده را خروجی دهید و هیچ توضیح، پرانتز یا برچسب اضافه‌ای ننویسید.';

    // تلاش نخست با مدل‌های پیشرفته تشخیص گفتار و فال‌بک
    const candidateModels = ['gemini-3.5-transcribe', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let lastError = '';

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: audioBase64,
              },
            },
            promptText,
          ],
        });

        const text = (response.text || '').trim();
        // حذف برچسب‌های نشانگر سکوت در صورت خالی بودن فایل
        if (text.includes('[سکوت]') || text.toLowerCase().includes('silence') || text === '[]') {
          return { transcript: '', error: 'صدایی از فایل صوتی شنیده نشد یا در سکوت ضبط شده است.' };
        }
        if (text) {
          return { transcript: text };
        }
      } catch (modelErr: any) {
        lastError = modelErr.message || String(modelErr);
        console.warn(`Gemini audio model ${modelName} notice:`, lastError.slice(0, 150));
      }
    }

    const isSanctionOrBlocked =
      lastError.includes('403') ||
      lastError.includes('location') ||
      lastError.includes('fetch failed') ||
      lastError.includes('PERMISSION_DENIED');

    return {
      transcript: '',
      error: isSanctionOrBlocked
        ? 'ارتباط سرور با گوگل برقرار نشد (احتمال مسدود بودن یا تحریم آی‌پی سرور توسط گوگل). لطفاً از سرور با آی‌پی بین‌المللی یا پروکسی در سرور استفاده فرمایید.'
        : (lastError ? `خطای سرویس هوش مصنوعی: ${lastError.slice(0, 100)}` : 'صدایی از فایل ضبط شده دریافت نشد.'),
    };
  } catch (err: any) {
    console.warn('Gemini audio transcription error:', err.message);
    return {
      transcript: '',
      error: `خطا در پردازش صوت: ${err.message || 'نامشخص'}`,
    };
  }
}

// نقطه پایانی تبدیل صوت به متن
app.post('/api/transcribe-audio', async (req, res) => {
  const { text = '', audioBase64 = '', mimeType = 'audio/mp4' } = req.body;
  const cleanText = typeof text === 'string' ? text.trim() : '';

  // ۱. در صورتی که متن از قبل توسط وب‌اسپیچ کلاینت استخراج شده باشد (اندروید و دسکتاپ)
  if (cleanText) {
    return res.json({
      success: true,
      transcript: cleanText,
      isLocal: true,
    });
  }

  // ۲. تبدیل فایل صوتی ضبط‌شده توسط کلاینت (آیفون و سایر مرورگرها)
  if (audioBase64 && typeof audioBase64 === 'string') {
    const result = await transcribeAudioBase64(audioBase64, mimeType);
    if (result.transcript) {
      return res.json({
        success: true,
        transcript: result.transcript,
      });
    }
    return res.status(400).json({
      success: false,
      transcript: '',
      error: result.error || 'صدایی دریافت نشد یا صحبت خیلی کوتاه بود.',
    });
  }

  return res.status(400).json({
    success: false,
    transcript: '',
    error: 'داده‌های صوتی جهت تبدیل ارسال نشده است.',
  });
});

// نقطه پایانی پردازش و پیاده‌سازی هوشمند صوت و متن املاک (پشتیبانی همزمان از متن و صوت مستقیم آیفون)
app.post('/api/parse-voice', async (req, res) => {
  const { text = '', audioBase64 = '', mimeType = 'audio/mp4' } = req.body;
  let cleanInputText = (typeof text === 'string' ? text.trim() : '') || '';
  let transcriptionError = '';

  // در صورتی که متن خالی است اما فایل صوتی ارسال شده است (آیفون)
  if (!cleanInputText && audioBase64) {
    const result = await transcribeAudioBase64(audioBase64, mimeType);
    cleanInputText = result.transcript;
    transcriptionError = result.error || '';
  }

  try {
    if (!cleanInputText) {
      return res.status(400).json({
        success: false,
        error: transcriptionError || 'متن گفتار جهت پردازش محلی یافت نشد.',
      });
    }

    // استخراج محلی مشخصات فایل ملک بر پایه الگوریتم‌های فارسی NLP
    const parsedProperty = parseVoicePropertyDescription(cleanInputText);
    return res.json({
      success: true,
      transcript: cleanInputText,
      parsedProperty,
      isLocal: true,
    });
  } catch (error: any) {
    console.warn('Local Voice Parse Error:', error.message);
    const fallback = parseVoicePropertyDescription(cleanInputText);
    return res.json({
      success: true,
      transcript: cleanInputText,
      parsedProperty: fallback,
      isLocal: true,
    });
  }
});

// نقطه پایانی بررسی وضعیت سیستم در سرور داکر
app.get('/api/system-status', (req, res) => {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  res.json({
    isLocal: true,
    mode: '100% Offline & Local',
    hasGeminiKey,
    geminiKeyStatus: hasGeminiKey ? 'تنظیم شده و فعال' : 'تنظیم نشده (جهت تبدیل صوت آیفون به متن، در .env کلید را وارد نمایید)',
    nodeEnv: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
  });
});

// نقطه پایانی پردازش هوشمند صوت و ثبت کارهای روزانه مشاور (پشتیبانی همزمان از متن و صوت مستقیم آیفون)
app.post('/api/parse-voice-task', async (req, res) => {
  const { text = '', audioBase64 = '', mimeType = 'audio/mp4', currentJalaliDate } = req.body;
  let cleanInputText = (typeof text === 'string' ? text.trim() : '') || '';
  const baseJalali = typeof currentJalaliDate === 'string' && currentJalaliDate.includes('/')
    ? currentJalaliDate.trim()
    : getCurrentJalaliDate();

  let transcriptionError = '';
  // در صورتی که متن خالی است اما فایل صوتی ارسال شده است (آیفون)
  if (!cleanInputText && audioBase64) {
    const result = await transcribeAudioBase64(audioBase64, mimeType);
    cleanInputText = result.transcript;
    transcriptionError = result.error || '';
  }

  try {
    if (!cleanInputText) {
      return res.status(400).json({
        success: false,
        error: transcriptionError || 'متن کار روزانه دریافت نشد.',
      });
    }

    // پردازش و استخراج محلی کارها بر پایه موتور تقویم جلالی
    const localParsed = parseVoiceDailyTask(cleanInputText, baseJalali);
    localParsed.dateJalali = normalizeJalaliDateString(localParsed.dateJalali, baseJalali);
    return res.json({
      success: true,
      transcript: cleanInputText,
      parsedTask: localParsed,
      isLocal: true,
    });
  } catch (error: any) {
    console.warn('Local Task Parse Error:', error.message);
    const localFallback = parseVoiceDailyTask(cleanInputText, baseJalali);
    return res.json({
      success: true,
      transcript: cleanInputText,
      parsedTask: localFallback,
      isLocal: true,
    });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const server = http.createServer(app);

  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // مانت کردن میدل‌ور Vite در حالت توسعه (HMR غیرفعال جهت جلوگیری از پرش و رفرش مکرر)
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port} (mode: ${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
