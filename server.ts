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
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// پشتیبانی از بارهای حجیم‌تر به دلیل داده‌های صوت Base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// راه‌اندازی کلاینت رسمی Gemini جهت تبدیل دقیق گفتار فارسی به متن بدون باگ تکرار کلمات
const geminiApiKey = process.env.GEMINI_API_KEY || '';
let geminiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  try {
    geminiClient = new GoogleGenAI({ apiKey: geminiApiKey });
    console.log('Gemini AI transcription engine initialized successfully.');
  } catch (err: any) {
    console.warn('Could not initialize Gemini client:', err.message);
  }
} else {
  console.log('Notice: GEMINI_API_KEY is not set. Server AI transcription fallback requires GEMINI_API_KEY in .env or docker-compose.yml.');
}

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
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crcTable[n] = c;
    }
    function crc32(buf: Buffer): number {
      let c = 0xffffffff;
      for (let i = 0; i < buf.length; i++) {
        c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
      }
      return (c ^ 0xffffffff) >>> 0;
    }

    const fileEntries: Array<{
      rel: string;
      nameBuffer: Buffer;
      crc: number;
      compressedSize: number;
      uncompressedSize: number;
      offset: number;
      localHeader: Buffer;
      compressedData: Buffer;
    }> = [];

    let offset = 0;

    for (const item of files) {
      const data = fs.readFileSync(item.full);
      const uncompressedSize = data.length;
      const crc = crc32(data);
      const compressedData = zlib.deflateRawSync(data, { level: 6 });
      const compressedSize = compressedData.length;
      const nameBuffer = Buffer.from(item.rel, 'utf8');

      // هدر محلی فایل در فرمت زیپ استاندارد PKZIP (۳۰ بایت + نام فایل)
      const localHeader = Buffer.alloc(30 + nameBuffer.length);
      localHeader.writeUInt32LE(0x04034b50, 0); // امضای هدر فایل محلی
      localHeader.writeUInt16LE(20, 4); // نسخه ۲۰
      localHeader.writeUInt16LE(0x0800, 6); // فلگ پرچم UTF-8 برای نام فایل‌ها
      localHeader.writeUInt16LE(8, 8); // متد فشرده‌سازی Deflate
      localHeader.writeUInt16LE(0, 10);
      localHeader.writeUInt16LE(0, 12);
      localHeader.writeUInt32LE(crc, 14);
      localHeader.writeUInt32LE(compressedSize, 18);
      localHeader.writeUInt32LE(uncompressedSize, 22);
      localHeader.writeUInt16LE(nameBuffer.length, 26);
      localHeader.writeUInt16LE(0, 28);
      nameBuffer.copy(localHeader, 30);

      fileEntries.push({
        rel: item.rel,
        nameBuffer,
        crc,
        compressedSize,
        uncompressedSize,
        offset,
        localHeader,
        compressedData,
      });

      offset += localHeader.length + compressedData.length;
    }

    const cdOffset = offset;
    const cdBuffers: Buffer[] = [];

    for (const entry of fileEntries) {
      const cdHeader = Buffer.alloc(46 + entry.nameBuffer.length);
      cdHeader.writeUInt32LE(0x02014b50, 0); // امضای دیرکتوری مرکزی Central Directory
      cdHeader.writeUInt16LE(20, 4);
      cdHeader.writeUInt16LE(20, 6);
      cdHeader.writeUInt16LE(0x0800, 8); // UTF-8
      cdHeader.writeUInt16LE(8, 10);
      cdHeader.writeUInt16LE(0, 12);
      cdHeader.writeUInt16LE(0, 14);
      cdHeader.writeUInt32LE(entry.crc, 16);
      cdHeader.writeUInt32LE(entry.compressedSize, 20);
      cdHeader.writeUInt32LE(entry.uncompressedSize, 24);
      cdHeader.writeUInt16LE(entry.nameBuffer.length, 28);
      cdHeader.writeUInt16LE(0, 30);
      cdHeader.writeUInt16LE(0, 32);
      cdHeader.writeUInt16LE(0, 34);
      cdHeader.writeUInt16LE(0, 36);
      cdHeader.writeUInt32LE(0, 38);
      cdHeader.writeUInt32LE(entry.offset, 42);
      entry.nameBuffer.copy(cdHeader, 46);
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

// تابع کمکی برای رونویسی استاندارد و بدون تکرار صوت به زبان فارسی با هوش مصنوعی
async function transcribeAudioWithGemini(audioBase64: string, mimeType: string): Promise<string> {
  if (!geminiClient || !audioBase64) return '';

  const cleanMime = mimeType?.split(';')[0] || 'audio/webm';
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.5-transcribe'];

  for (const model of modelsToTry) {
    try {
      const response = await geminiClient.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: cleanMime,
                  data: audioBase64,
                },
              },
              {
                text: `شما سیستم تبدیل صوت به متن مشاورین املاک در ایران هستید.
صوت ارسالی را به زبان فارسی با دقت بسیار بالا، بدون حذف کلمات، بدون تکرار اضافی کلمات و به شکل روان رونویسی (transcribe) کنید.
تنها متن پیاده شده را بازگردانید و از درج هرگونه یادداشت، پیشوند یا توضیحات اضافی خودداری فرمایید. اگر صدایی شنیده نشد، فقط یک متن خالی برگردانید.`,
              },
            ],
          },
        ],
      });

      const text = response.text?.trim() || '';
      if (text && !text.includes('[سکوت]')) {
        return text;
      }
    } catch (err: any) {
      console.warn(`Model ${model} transcription warning:`, err.message);
    }
  }

  return '';
}

// نقطه پایانی تبدیل مستقیم صوت به متن فارسی (استفاده در فیلدهای متنی، توضیحات ملک و کارهای روزانه)
app.post('/api/transcribe-audio', async (req, res) => {
  const { audioBase64, mimeType = 'audio/webm' } = req.body;
  if (!audioBase64) {
    return res.status(400).json({ success: false, error: 'فایل صوتی ارسال نشده است.' });
  }

  try {
    const transcript = await transcribeAudioWithGemini(audioBase64, mimeType);
    return res.json({
      success: true,
      transcript,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'خطا در تبدیل صوت به متن' });
  }
});

// نقطه پایانی پردازش و پیاده‌سازی هوشمند صوت و متن املاک
app.post('/api/parse-voice', async (req, res) => {
  const { audioBase64, mimeType = 'audio/webm', text } = req.body;
  let cleanInputText = (typeof text === 'string' ? text.trim() : '') || '';

  try {
    if (!audioBase64 && !cleanInputText) {
      return res.status(400).json({
        success: false,
        error: 'لطفاً داده صوتی یا متن گفتار را ارسال کنید.',
      });
    }

    // اگر صوت ارسال شده بود و متنی نبود، ابتدا با هوش مصنوعی رونویسی می‌شود
    if (audioBase64 && cleanInputText.length < 5) {
      const transcribed = await transcribeAudioWithGemini(audioBase64, mimeType);
      if (transcribed) {
        cleanInputText = transcribed;
      }
    }

    // پردازش و استخراج مشخصات ملک بر پایه متن پیاده‌شده
    const parsedProperty = parseVoicePropertyDescription(cleanInputText);

    return res.json({
      success: true,
      transcript: cleanInputText,
      parsedProperty,
      hasGemini: Boolean(geminiClient),
    });
  } catch (error: any) {
    console.warn('Voice Parse Error:', error.message);
    const fallback = parseVoicePropertyDescription(cleanInputText);
    return res.json({
      success: true,
      transcript: cleanInputText,
      parsedProperty: fallback,
      hasGemini: Boolean(geminiClient),
    });
  }
});

// نقطه پایانی بررسی وضعیت سیستم و کلید هوش مصنوعی در سرور داکر
app.get('/api/system-status', (req, res) => {
  res.json({
    hasGeminiKey: Boolean(geminiClient),
    nodeEnv: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
  });
});

// نقطه پایانی پردازش هوشمند صوت و ثبت کارهای روزانه مشاور
app.post('/api/parse-voice-task', async (req, res) => {
  const { audioBase64, mimeType = 'audio/webm', text, currentJalaliDate } = req.body;
  let cleanInputText = (typeof text === 'string' ? text.trim() : '') || '';
  const baseJalali = typeof currentJalaliDate === 'string' && currentJalaliDate.includes('/')
    ? currentJalaliDate.trim()
    : '1405/07/18';

  try {
    if (!audioBase64 && !cleanInputText) {
      return res.status(400).json({
        success: false,
        error: 'لطفاً داده صوتی یا متن گفتار را ارسال کنید.',
      });
    }

    // رونویسی صوت در صورت ارسال داده باینری صوت
    if (audioBase64 && cleanInputText.length < 5) {
      const transcribed = await transcribeAudioWithGemini(audioBase64, mimeType);
      if (transcribed) {
        cleanInputText = transcribed;
      }
    }

    // پردازش و استخراج کارها
    const localParsed = parseVoiceDailyTask(cleanInputText, baseJalali);
    if (!localParsed.title && audioBase64) {
      localParsed.title = `یادداشت صوتی مشاور (${baseJalali})`;
      localParsed.description = 'صوت ضبط شده ضمیمه گردید.';
    }
    localParsed.dateJalali = normalizeJalaliDateString(localParsed.dateJalali, baseJalali);
    return res.json({
      success: true,
      transcript: cleanInputText,
      parsedTask: localParsed,
      hasGemini: Boolean(geminiClient),
    });

  } catch (error: any) {
    console.warn('Local Task Parse Error:', error.message);
    const localFallback = parseVoiceDailyTask(cleanInputText, baseJalali);
    return res.json({
      success: true,
      transcript: cleanInputText,
      parsedTask: localFallback,
      hasGemini: Boolean(geminiClient),
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
