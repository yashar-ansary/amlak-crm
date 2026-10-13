# Stage 1: Build the Vite frontend application
FROM node:20-alpine AS builder

WORKDIR /app

# نصب پکیج‌ها (با پشتیبانی از نبود یا عدم تطابق package-lock.json)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci || npm install; else npm install; fi

# کپی سورس کد و بیلد استاتیک
COPY . .
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# نصب پکیج‌های مورد نیاز اجرا (با پشتیبانی از نبود یا عدم تطابق package-lock.json)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev || npm install --omit=dev; else npm install --omit=dev; fi

# کپی خروجی بیلد، سرور و کانفیگ‌ها
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# ایجاد کاربر غیر روت جهت امنیت بیشتر
USER node

EXPOSE 3000

CMD ["npm", "start"]
