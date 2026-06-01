# Mock Test Stat — กลุ่มบ้านคุณย่า ✈

เว็บลงคะแนน Mock Test รายสัปดาห์สำหรับ Student Pilot การบินไทย แทนการกรอก Google Sheet
ทุกคนเข้าผ่าน **Callsign + รหัสผ่าน** (ไม่ต้องใช้ Google/อีเมล), ใครก็สร้าง Mock Test ได้,
กรอกคะแนนแยกราย part (คะแนน / ข้อที่ทำ / ข้อทั้งหมด) แล้วดู **Average / Min / Max / อันดับ**
และจุดอ่อนรายหมวดเพื่อนำไปพัฒนา

## ฟีเจอร์

- **Callsign auth** — สมัคร/เข้าสู่ระบบด้วย Callsign นิรนาม (รหัสผ่าน hash ด้วย bcrypt, session เป็น JWT ใน httpOnly cookie)
- **สร้าง Mock Test** — กำหนดได้หลาย "ชุด" แต่ละชุดมีหลาย part เลือกหัวข้อจาก catalog 6 หมวด + กำหนดจำนวนข้อ พร้อม **Clone** จากสัปดาห์ก่อน
- **กรอกคะแนน** — ตารางกรอกแบบ mobile-first, validate `คะแนน ≤ ข้อที่ทำ ≤ ข้อทั้งหมด`, บันทึกซ้ำได้ (upsert)
- **ผล & อันดับ** — Leaderboard จัดด้วย **Combined Index** = `(1−w)·Score% + w·Accuracy%` (w = โบนัสความแม่น, ตั้งได้ต่อ session), สถิติ avg/min/max รายหัวข้อ, radar เทียบกลุ่ม
- **สถิติของฉัน** — แนวโน้มข้ามสัปดาห์, radar รายหมวด, หัวข้อที่ควรพัฒนา

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Prisma 7 + PostgreSQL (pg adapter) ·
jose + bcryptjs (auth) · Zod (validation) · Recharts (charts)

## เริ่มใช้งานในเครื่อง

```bash
npm install

# 1) สตาร์ท Postgres ในเครื่อง (พิมพ์ DATABASE_URL/SHADOW_DATABASE_URL ออกมา)
npx prisma dev

# 2) เอา URL ที่ได้ใส่ใน .env (ดูตัวอย่างใน .env.example) แล้วตั้ง SESSION_SECRET

# 3) สร้างตาราง + seed หัวข้อ (32 หัวข้อ 6 หมวด)
npm run db:push
npm run db:seed

# 4) (ออปชัน) นำเข้าข้อมูลจริงจาก Mock 31 พ.ค. 2026
npm run db:import-mock

# 5) รัน
npm run dev      # http://localhost:3000
```

> `npm run db:import-mock` จะสร้าง session `310526 Mock I/II` + ผู้ใช้ `user1`–`user10`
> (รหัส `mock2026`, ข้อมูลปกปิดชื่อ) ไว้ลองดู Leaderboard ได้ทันที

## Deploy ขึ้น Vercel + Neon (ฟรี)

1. **สร้าง DB ที่ [Neon](https://neon.tech)** แล้วคัดลอก *pooled* connection string
2. **Push โค้ดขึ้น GitHub** แล้ว Import เข้า [Vercel](https://vercel.com) (ตั้ง Root Directory = `mock-test-stat`)
3. **ตั้ง Environment Variables** ใน Vercel:
   - `DATABASE_URL` = connection string ของ Neon
   - `SESSION_SECRET` = ผลจาก `openssl rand -base64 32`
4. ก่อน deploy ครั้งแรก สร้างตาราง + seed (+ นำเข้าข้อมูล mock) บน Neon — รันในเครื่องโดยชี้ `DATABASE_URL` ไปที่ Neon
   (PowerShell: `$env:DATABASE_URL="<neon-url>"` แล้วรันทีละคำสั่งด้านล่างโดยไม่ต้องใส่ prefix):
   ```bash
   DATABASE_URL="<neon-url>" npm run db:push
   DATABASE_URL="<neon-url>" npm run db:seed
   DATABASE_URL="<neon-url>" npm run db:import-mock
   ```
5. Deploy — `npm run build` จะรัน `prisma generate` ให้อัตโนมัติ (มี `postinstall` ด้วย)

## โครงสร้าง

```
prisma/schema.prisma     โมเดล: User(Callsign) · Topic · MockSession · TestSet · Part · Score
prisma/seed.ts           seed catalog หัวข้อ
src/lib/                 db, session(jose), dal, validation(zod), stats(การคำนวณ), topics(catalog), queries
src/actions/             server actions: auth · sessions · scores
src/proxy.ts             ป้องกัน route ที่ต้องล็อกอิน (Next 16 เรียก middleware ว่า proxy)
src/app/                 (auth)/login·register · / (dashboard) · sessions/new · sessions/[id] · sessions/[id]/results · me
src/components/          UI primitives, session-builder, score-entry-grid, charts/
```

## การปรับสูตรอันดับ

`bonusWeight` (0–1) ตั้งได้ตอนสร้างแต่ละ Mock Test — ค่าเริ่มต้น `0.15` หมายถึง
อันดับคิดจาก Score% 85% + Accuracy% 15% ปรับขึ้นถ้าอยากให้ "ความแม่น" มีน้ำหนักมากขึ้น
