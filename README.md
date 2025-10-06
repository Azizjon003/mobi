# Telegram PDF Bot

TypeScript va Telegraf.js yordamida yaratilgan PDF hujjatlarni boshqarish uchun Telegram bot.

## Xususiyatlar

- ✅ PDF fayllarni yuklash va kanalda saqlash
- ✅ Ism-familiya va shartnoma raqami bilan bog'lash
- ✅ Inline qidiruv funksiyasi (ism yoki shartnoma raqami bo'yicha)
- ✅ Rol-asoslangan ruxsat tizimi (Super Admin, Sotuvchi, Undiruvchi)
- ✅ Foydalanuvchilarni qo'shish, o'chirish va rollarni boshqarish
- ✅ Kanaldan avtomatik PDF olish
- ✅ Operatsiyalar tugagandan keyin asosiy menyuga qaytish
- ✅ Scene-asoslangan navigatsiya tizimi

## O'rnatish

1. Kerakli paketlarni o'rnating:
```bash
npm install
```

2. `.env` fayl yarating va sozlang:
```bash
cp .env.example .env
```

3. `.env` fayliga o'z ma'lumotlaringizni kiriting:
```
BOT_TOKEN=your_bot_token_from_botfather
SUPER_ADMIN_ID=123456789
CHANNEL_ID=-1001234567890
```

### Bot Token olish

1. Telegram'da [@BotFather](https://t.me/botfather) ga o'ting
2. `/newbot` buyrug'ini yuboring
3. Bot uchun nom va username tanlang
4. BotFather sizga token beradi
5. **MUHIM**: BotFather'da `/setinline` buyrug'i bilan inline rejimni yoqing

### Super Admin ID olish

1. [@userinfobot](https://t.me/userinfobot) ga o'ting
2. Bot sizga ID'ingizni ko'rsatadi
3. Bu ID asosiy admin hisoblanadi va boshqa adminlarni boshqaradi

### Kanal sozlash

1. Yangi kanal yarating (private yoki public)
2. Botni kanalga admin qiling (post yuborish huquqi bilan)
3. Kanal ID'sini olish uchun:
   - Kanalga biror xabar yuboring
   - [@userinfobot](https://t.me/userinfobot) ni kanalga qo'shing
   - Bot sizga kanal ID'sini ko'rsatadi (masalan: -1001234567890)

## Ishga tushirish

### Development rejimida
```bash
npm run dev
```

### Production rejimida
```bash
npm run build
npm start
```

## Foydalanuvchi Rollari

Bot 4 xil rol bilan ishlaydi:

### 👑 Super Admin
- Barcha huquqlarga ega
- PDF yuklash
- Qidiruv va ko'rish
- Foydalanuvchilarni qo'shish, o'chirish va rollarni boshqarish
- `.env` faylida `SUPER_ADMIN_ID` orqali belgilanadi

### 👤 Sotuvchi (Seller)
- Faqat PDF yuklash huquqi
- Shartnoma hujjatlarini kanalga yuklash mumkin
- Qidiruv huquqi yo'q

### 🔍 Undiruvchi (Collector)
- Faqat qidiruv va ko'rish huquqi
- Hujjatlarni qidirish va yuklab olish mumkin
- PDF yuklash huquqi yo'q

### 📋 Sotuvchi va Undiruvchi (Seller + Collector)
- PDF yuklash va qidiruv huquqi
- Shartnoma yuklash va qidirish
- Foydalanuvchilarni boshqarish huquqi yo'q

## Foydalanish

### Mavjud buyruqlar

**Super Admin uchun:**
- `/start` - Botni ishga tushirish va asosiy menyu
- `/upload` - PDF yuklash jarayonini boshlash
- `/search` - Qidiruv
- `/users` - Foydalanuvchilar boshqaruvi
- `/cancel` - Joriy amalni bekor qilish

**Sotuvchi uchun:**
- `/start` - Botni ishga tushirish
- `/upload` - PDF yuklash
- `/cancel` - Joriy amalni bekor qilish

**Undiruvchi uchun:**
- `/start` - Botni ishga tushirish
- `/search` - Qidiruv (yoki inline qidiruv tugmasi)
- `/cancel` - Joriy amalni bekor qilish

**Sotuvchi va Undiruvchi uchun:**
- `/start` - Botni ishga tushirish
- `/upload` - PDF yuklash
- `/search` - Qidiruv (yoki inline qidiruv tugmasi)
- `/cancel` - Joriy amalni bekor qilish

### Asosiy menyu (Inline tugmalar)

`/start` buyrug'idan keyin rolingizga mos tugmalar ko'rsatiladi:

**Super Admin:**
- 📤 **PDF Yuklash** - Yangi PDF yuklash uchun
- 🔍 **Qidiruv** - Inline qidiruv uchun
- 👥 **Foydalanuvchilar** - Foydalanuvchilarni boshqarish

**Sotuvchi:**
- 📤 **PDF Yuklash** - Yangi PDF yuklash uchun

**Undiruvchi:**
- 🔍 **Qidiruv** - Inline qidiruv uchun

**Sotuvchi va Undiruvchi:**
- 📤 **PDF Yuklash** - Yangi PDF yuklash uchun
- 🔍 **Qidiruv** - Inline qidiruv uchun

### PDF yuklash jarayoni

1. "📤 PDF Yuklash" tugmasini bosing yoki `/upload` buyrug'ini yuboring
2. PDF faylni yuboring
3. Ism-familiyani kiriting
4. Shartnoma raqamini kiriting
5. PDF avtomatik kanalga yuklanadi ✅
6. Operatsiya tugagandan keyin asosiy menyu qaytariladi

### Inline qidiruv

1. "🔍 Qidiruv" tugmasini bosing
2. Inline qidiruv oynasi ochiladi
3. Qidiruv so'zini kiriting (ism yoki shartnoma raqami)
4. Natijalardan kerakli PDF'ni tanlang
5. PDF to'g'ridan-to'g'ri chatga yuboriladi

**Eslatma**: Barcha operatsiyalar tugagandan keyin bot avtomatik ravishda asosiy menyuni ko'rsatadi.

### Foydalanuvchilar boshqaruvi (Super Admin)

Super Admin foydalanuvchilarni qo'shish, o'chirish va rollarni boshqarish huquqiga ega.

**Foydalanuvchi qo'shish:**
1. "👥 Foydalanuvchilar" tugmasini bosing yoki `/users` buyrug'ini yuboring
2. "➕ Foydalanuvchi qo'shish" tugmasini bosing
3. Quyidagilardan birini yuboring:
   - 🔢 **User ID**: `123456789`
   - 📨 **Forward**: Foydalanuvchidan biror xabarni forward qiling
4. Rolni tanlang:
   - 👤 **Sotuvchi** - PDF yuklash huquqi
   - 🔍 **Undiruvchi** - Qidiruv va ko'rish huquqi
   - 👑 **Super Admin** - Barcha huquqlar

**Foydalanuvchi o'chirish:**
1. "👥 Foydalanuvchilar" tugmasini bosing
2. "➖ Foydalanuvchi o'chirish" tugmasini bosing
3. Foydalanuvchi ID'sini yuboring

**Rolni o'zgartirish:**
1. "👥 Foydalanuvchilar" tugmasini bosing
2. "✏️ Rolni o'zgartirish" tugmasini bosing
3. Foydalanuvchi ID'sini yuboring
4. Yangi rolni tanlang

**User ID olish usullari:**
- 🤖 [@userinfobot](https://t.me/userinfobot) ga o'ting
- 📨 Foydalanuvchidan biror xabarni forward qiling
- 💬 Foydalanuvchiga @userinfobot orqali ID'sini olishni ayting

## Rol-asoslangan Ruxsat Tizimi

### Ruxsatlar ro'yxati:

| Funksiya | Super Admin | Sotuvchi | Undiruvchi | Sotuvchi+Undiruvchi |
|----------|-------------|----------|------------|---------------------|
| PDF yuklash | ✅ | ✅ | ❌ | ✅ |
| Qidiruv va ko'rish | ✅ | ❌ | ✅ | ✅ |
| Foydalanuvchilarni qo'shish | ✅ | ❌ | ❌ | ❌ |
| Foydalanuvchilarni o'chirish | ✅ | ❌ | ❌ | ❌ |
| Rollarni o'zgartirish | ✅ | ❌ | ❌ | ❌ |
| Barcha huquqlar | ✅ | ❌ | ❌ | ❌ |

## Struktura

```
mobi/
├── src/
│   ├── index.ts                      # Asosiy bot fayli
│   ├── database.ts                   # Ma'lumotlar bazasi (JSON)
│   ├── types.ts                      # TypeScript turlari
│   └── scenes/
│       ├── start.scene.ts            # Asosiy menyu scene
│       ├── upload.scene.ts           # PDF yuklash scene
│       ├── addadmin.scene.ts         # Admin qo'shish scene (eski)
│       └── usermanagement.scene.ts   # Foydalanuvchilar boshqaruvi scene
├── data/
│   ├── documents.json                # PDF hujjatlar ma'lumotlari
│   └── users.json                    # Foydalanuvchilar va rollar
├── package.json
├── tsconfig.json
└── .env
```

## Xususiyatlar tafsiloti

### Kanal integratsiyasi

Bot yuklangan barcha PDF fayllarni ko'rsatilgan kanalga avtomatik yuklaydi:
- Fayllar kanalda xavfsiz saqlanadi
- Qidiruv natijalarida kanaldan to'g'ridan-to'g'ri file_id orqali PDF yuboriladi
- Serverda fayllar saqlanmaydi (faqat metadata)

### Inline qidiruv

Inline rejimda ishlash imkoniyati:
- Har qanday chatda bot orqali qidiruv
- Real-time natijalar
- To'g'ridan-to'g'ri PDF yuborish
- 50 tagacha natija ko'rsatish
- Faqat Undiruvchilar va Super Adminlar uchun mavjud

### Rol-asoslangan Ruxsat Tizimi

Har bir foydalanuvchi roliga mos huquqlar beriladi:
- Scene-asoslangan navigatsiya
- Avtomatik ruxsat tekshiruvi
- Rol asosida tugmalarni ko'rsatish
- Ma'lumotlar JSON faylda saqlanadi

## Texnologiyalar

- TypeScript
- Telegraf.js (Telegram Bot API)
- Node.js
- JSON ma'lumotlar bazasi
