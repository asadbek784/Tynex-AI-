# TYNEX AI - Premium AI Chat Platform

TYNEX AI — bu v0.dev hamda Next.js yordamida yaratilgan, premium darajadagi universal AI suhbat platformasi (ChatGPT darajasida). Loyiha to'liq, production-ready backend, ma'lumotlar bazasi va mukammal funksionalliklar bilan jihozlangan.

## 🚀 Imkoniyatlar va Funksiyalar

1. **Autentifikatsiya (Premium Dark modal):**
   - Email va parol yordamida ro'yxatdan o'tish (Sign Up) va Kirish (Sign In).
   - Parollar `bcryptjs` yordamida shifrlanadi, sessionlar xavfsiz `httpOnly` cookie va JWT bilan boshqariladi.
   - Admin huquqi **faqat maxfiy TOTP kod** orqali beriladi (Google Authenticator/Authy'da har 30 soniyada yangilanadigan 6 xonali kod) — "birinchi ro'yxatdan o'tgan" avtomatik admin bo'lmaydi, bu tasodifiy/begona ro'yxatdan o'tishlar admin huquqini olib qo'yishining oldini oladi. Sozlash uchun pastdagi "Admin kirish (TOTP)" bo'limiga qarang.
   - Kirish qilmagan foydalanuvchilar uchun asosiy chat oynasi orqa fonda xira (blur) bo'lib turadi.

2. **Ma'lumotlar bazasi (Prisma v7 + PostgreSQL/Supabase):**
   - User, Chat, Message, AiProvider, AiModel, UsageLog, RateHit, Settings jadvallari orqali to'liq ma'lumotlar strukturalangan.
   - `@prisma/adapter-pg` drayveri orqali istalgan Postgres bazasiga (Supabase, Neon, Railway) ulanadi.

3. **Universal AI Gateway (Loyiha Markazi):**
   - Admin panel orqali ISTALGAN OpenAI-compatible API-ni ulash imkoni (masalan: OpenRouter, Groq, DeepSeek, 9Router va h.k.).
   - Har bir provayder uchun bir nechta model qo'shish, displayName, priority (ustuvorlik) va active holatini boshqarish.
   - Model xatolik bersa (timeout, rate limit yoki provayder o'chsa), tizim **avtomatik ravishda** navbatdagi priority-dagi modelga o'tadi (Automatic Fallback).
   - Javoblar real vaqt rejimida **Server-Sent Events (SSE)** orqali oqim (Streaming) ko'rinishida yetkaziladi.
   - Har bir so'rovdan keyin sarflangan tokenlar va latency (kechikish vaqti) tizim logiga (`UsageLog`) yozib boriladi.

4. **Premium Chat Funksionalligi:**
   - Yangi chat yaratish, chatlar tarixi ro'yxati, nomini o'zgartirish (rename), o'chirish (delete) hamda qidiruv (real-time filter).
   - Markdown formatini qo'llab-quvvatlash (`react-markdown` + `remark-gfm`).
   - Kod bloklari uchun sintaksis ranglari (Syntax Highlighting) va qulay **"Copy code"** tugmasi.
   - Streaming paytida chiroyli **"Thinking..."** animatsiyasi va **"Stop Generate"** (generatsiyani to'xtatish) tugmasi (`AbortController` orqali).
   - AI xabarlari ostida: Copy, Regenerate va Retry; Foydalanuvchi xabarlarida esa: Edit (tahrirlash) tugmalari.

5. **Rate Limiting (Sozlanuvchi cheklovlar):**
   - Har bir foydalanuvchi uchun 3 soatda 25 ta xabar (standart qiymat). Ushbu qiymat hardcode qilinmagan, balki admin panel orqali `Settings` jadvalidan real vaqtda o'qiladi.
   - Limit tugaganda frontendda foydalanuvchiga countdown timer (orqaga hisoblash vaqti) ko'rsatiladi.

6. **Boshqaruv Admin Paneli (`/admin`):**
   - **Statistika:** Umumiy foydalanuvchilar, chatlar, xabarlar soni, tokenlar sarfi, har bir model bo'yicha hisobotlar hamda so'rovlar grafigi.
   - **Foydalanuvchilar:** Ro'yxat, qidiruv, ban/unban qilish, foydalanuvchi rolini o'zgartirish (user/admin).
   - **AI Providers & Models:** CRUD interfeysi orqali istalgan OpenAI mos keluvchi provayder va modellarni qo'shish, tahrirlash, o'chirish va faollashtirish.
   - **Tizim Sozlamalari:** Rate limit qiymatini o'zgartirish va barcha foydalanuvchilarga ko'rinadigan yuqori e'lon banner xabarini kiritish.
   - **Xatolar Jurnali:** Muvaffaqiyatsiz bo'lgan barcha sun'iy intellekt so'rovlarining to'liq xatolik sabablari ro'yxati.

7. **Fayl/Rasm yuklash va Ovozli kiritish:**
   - Rasmlarni mahalliy `/public/uploads` papkasiga yuklash (kelajakda cloud storage-ga oson ulanadigan qilib qatlam ajratilgan).
   - Yuklangan rasm to'g'ridan-to'g'ri vision qo'llab-quvvatlaydigan modellarga yuboriladi.
   - Ovozli matn kiritish: brauzer-native **Web Speech API** orqali tashqi pullik API-larsiz, oson ovoz orqali yozish imkoniyati (O'zbek tilida).

---

## 🛠️ Mahalliy Ishga Tushirish Yo'riqnomasi

### 1. Talablar
Mahalliy kompyuteringizda **Node.js (v18 yoki undan yuqori)** hamda **pnpm** (yoki npm/yarn) o'rnatilgan bo'lishi lozim.

### 2. O'rnatish va Sozlash

Loyihani klonlab oling va papkaga kiring:
```bash
git clone <repository_url>
cd Tynex_AI
```

Kutubxonalarni o'rnating:
```bash
pnpm install
```

### 3. Environment Variable-larni Sozlash
Loyiha ildizida `.env` faylini yarating (`.env.example`dan nusxa olib) va quyidagi o'zgaruvchilarni kiriting:

```env
# Supabase (yoki boshqa Postgres) ulanish manzili
DATABASE_URL="postgresql://postgres:PAROLINGIZ@db.xxxx.supabase.co:5432/postgres"

# JWT cookie sessiyalari uchun uzun, tasodifiy maxfiy kalit
# Generatsiya qilish: openssl rand -base64 48
AUTH_SECRET="uzun-tasodifiy-maxfiy-kalit"

# Admin ro'yxatdan o'tish uchun TOTP maxfiy kaliti (pastga qarang)
ADMIN_TOTP_SECRET="32-belgili-base32-kalit"
```

**Muhim:** `AUTH_SECRET` va `ADMIN_TOTP_SECRET` bo'lmasa yoki juda qisqa bo'lsa, ilova ataylab ishlamay qoladi (xavfsizlik uchun standart/ochiq kalit qoldirilmagan).

### 4. Ma'lumotlar Bazasini Ishga Tushirish (Prisma)
Jadvallarni Postgres bazangizda yaratish hamda Prisma Client-ni generatsiya qilish uchun:

```bash
npx prisma db push
npx prisma generate
```

### 5. Admin kirish (TOTP) — bir martalik sozlash

Ilovada "birinchi ro'yxatdan o'tgan admin bo'ladi" mantig'i **ataylab yo'q** — buning o'rniga faqat maxfiy TOTP kod bilganlar admin bo'la oladi:

1. `ADMIN_TOTP_SECRET` qiymatini (32 belgili, masalan `TOKX5MXZHWG56GTLVFVJGFY5D6P46UC4`) hech kimga bermang, faqat o'zingiz biling
2. Google Authenticator yoki Authy ilovasini oching → "+" → **"Kalitni qo'lda kiritish" / "Enter a setup key"**
3. Nom: `TYNEX AI Admin`, Kalit: yuqoridagi `ADMIN_TOTP_SECRET` qiymati, Turi: **Time-based (TOTP)**
4. Ilova endi har 30 soniyada yangi 6 xonali kod ko'rsatadi
5. Saytda ro'yxatdan o'tishda "Admin kodingiz bormi?" havolasini bosib, o'sha **hozirgi** 6 xonali kodni kiriting — shu foydalanuvchi admin bo'ladi
6. Oddiy foydalanuvchilar bu maydonni ko'rmaydi/bilmaydi, kod kiritmasdan oddiy ro'yxatdan o'tadi

### 5. Loyihani Ishga Tushirish

**Development rejimi:**
```bash
pnpm run dev
```
Loyiha [http://localhost:3000](http://localhost:3000) manzilida ishga tushadi.

**Production Build tayyorlash:**
```bash
pnpm run build
pnpm run start
```

---

## ☁️ Vercel / Railway platformalariga Deploy qilish

### Vercel-ga Deploy qilish (tavsiya etiladi)
1. Loyihani GitHub'ga yuklang (yoki mavjud repo'ni yangilang).
2. [vercel.com](https://vercel.com) → "Add New" → "Project" → GitHub repo'ingizni tanlang → "Import".
3. **Environment Variables** bo'limida uchta o'zgaruvchini qo'shing: `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_TOTP_SECRET`.
4. **Deploy** tugmasini bosing.

### Railway-ga Deploy qilish (muqobil)
1. Railway'da yangi loyiha yarating, GitHub repositoriyangizni ulang.
2. **Variables** bo'limida yuqoridagi uchta o'zgaruvchini qo'shing.
3. Deploy avtomatik boshlanadi.

---

## 📝 Muallif va Rahmatlar
Loyiha eng zamonaviy Next.js App Router, Tailwind CSS va Prisma 7 texnologiyalaridan foydalanib ishlab chiqildi. To'liq production-ready backend tizim platformaning xavfsiz va samarali ishlashini kafolatlaydi!
