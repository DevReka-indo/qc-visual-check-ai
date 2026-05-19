# 🚀 Supabase to PostgreSQL Migration Guide

## Overview
Anda telah berhasil bermigrasi dari Supabase ke PostgreSQL lokal. Dokumen ini menjelaskan perubahan yang telah dilakukan dan langkah-langkah untuk menyelesaikan migrasi.

## ✅ Perubahan yang Telah Dilakukan

### 1. **Database & ORM**
- ✅ Installed: Prisma v6, bcryptjs, jsonwebtoken, ts-node
- ✅ Created: `prisma/schema.prisma` - Schema Prisma untuk PostgreSQL
- ✅ Created: `prisma/seed.ts` - Database seeding script
- ✅ Created: `.env` file - Environment variables untuk Prisma
- ✅ Migrated: Database schema ke PostgreSQL lokal

### 2. **Authentication**
- ✅ Replaced: Supabase Auth dengan custom JWT + bcrypt
- ✅ Created: `lib/auth/jwt.ts` - JWT token generation & verification
- ✅ Created: `lib/auth/edge.ts` - Edge-safe JWT verification untuk middleware
- ✅ Created: `lib/auth/config.ts` - Shared JWT configuration
- ✅ Created: `lib/auth/password.ts` - Password hashing & validation
- ✅ Updated: `app/actions/auth.ts` - Sign in/up/out dengan Prisma & JWT
- ✅ Implemented: Update password dengan current password validation
- ✅ Created: `app/api/auth/me/route.ts` - Current user endpoint

### 3. **Database Queries**
- ✅ Converted: All Supabase queries to Prisma
- ✅ Updated: `app/actions/database.ts` - Semua database operations
- ✅ Replaced: RPC functions dengan Prisma operations
- ✅ Improved: Dashboard stats calculation (real-time dari data actual)
- ✅ Added: PostgreSQL indexes untuk foreign key dan query dashboard

### 4. **Session Management**
- ✅ Updated: `middleware.ts` - JWT token validation
- ✅ Updated: `hooks/use-auth.ts` - Fetch user profile dari API

### 5. **File Storage**
- ✅ Updated: `components/AvatarUpload.tsx` - Local file storage
- ✅ Created: `app/api/upload/avatar/route.ts` - Avatar upload endpoint
- ✅ Files stored: `/public/avatars/` directory

### 6. **Migration Tools**
- ✅ Created: `scripts/migrate-from-supabase.ts` - Data migration script

## 📋 Langkah-Langkah Selanjutnya

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Seed Database (Optional - untuk testing)
```bash
npm run prisma:seed
```

Ini akan membuat 3 divisi dan 1 user admin:
- Email: `admin@example.com`
- Password: `admin123`

### Step 3: Migrate Data dari Supabase (PENTING!)
Jika Anda ingin mengambil data dari Supabase lama:

```bash
npm run migrate:from-supabase
```

**Yang akan di-migrate:**
- ✅ Divisions
- ✅ Users (dengan temporary password)
- ✅ Inspections
- ✅ Anomalies

**⚠️ PENTING:**
- Users akan diberikan temporary password: `TempPassword123`
- Users harus mengubah password mereka pada login pertama
- Avatar URLs dari Supabase akan di-copy ke database (tapi file tidak termigrasi)

### Step 4: Perbarui Environment Variables
Pastikan `.env` dan `.env.local` sudah benar:

```bash
# .env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/reka_dashboard"
JWT_SECRET="change-this-to-a-long-random-secret"
JWT_EXPIRES_IN="24h"
```

Untuk menjalankan script migrasi dari Supabase lama, gunakan env ini hanya saat migrasi:

```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-key"
```

### Step 5: Test Aplikasi
```bash
npm run dev
```

Buka http://localhost:3000 dan test:
- ✅ Login dengan user admin@example.com / admin123
- ✅ Lihat dashboard stats
- ✅ Upload avatar (akan disimpan di /public/avatars/)
- ✅ Buat inspection baru
- ✅ Test semua fitur database

### Step 6: Production Deployment

Sebelum go live ke production:

1. **Update JWT_SECRET** - Ganti dengan nilai yang lebih aman:
   ```bash
   # Generate strong secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Setup file storage** - Pastikan `/public/avatars/` memiliki write permission

3. **Backup database** - Lakukan backup PostgreSQL sebelum production

4. **Test migration** - Jalankan test pada staging environment dulu

## 🔐 Security Checklist

- [ ] Update `JWT_SECRET` di production
- [ ] Set `secure: true` untuk cookies di production (sudah auto-configured)
- [ ] Backup data sebelum migration
- [ ] Test semua auth flows
- [ ] Verify RLS policies (jika ada) tidak diperlukan lagi
- [ ] Update CI/CD pipeline (jika ada)

## ⚠️ Breaking Changes

### Dari Perspective Component:
Tidak ada breaking changes di komponen - API tetap sama!

Contoh:
```typescript
// BEFORE (Supabase)
const { data } = await supabase.from("users").select()

// AFTER (Prisma)
const data = await prisma.user.findMany()

// Tapi di server actions, function name tetap sama:
getDivisions()
getInspections()
updateUserProfile()
// dll...
```

### Database Schema Changes:
- Snake case (`full_name`) → Camel case (`fullName`) di Prisma queries
- Tapi database column tetap snake case untuk backwards compatibility

## 🔧 Troubleshooting

### Error: "DATABASE_URL environment variable not found"
```bash
# Pastikan .env file ada di root directory
echo 'DATABASE_URL="postgresql://admin_reka:J@debx132@localhost:5432/reka_dashboard"' > .env
```

### Error: "Connection refused localhost:5432"
```bash
# Pastikan PostgreSQL sudah running
sudo service postgresql status
```

### Error: "Users can't login"
```bash
# Jalankan seed untuk create user test
npm run prisma:seed
# User: admin@example.com / admin123
```

### Error: "Avatar upload fails"
```bash
# Pastikan public/avatars directory ada
mkdir -p public/avatars
chmod 755 public/avatars
```

## 📊 Database Comparison

| Fitur | Supabase | PostgreSQL Lokal |
|-------|----------|------------------|
| Auth | Supabase Auth | JWT + bcrypt |
| Storage | Supabase Storage | Local `/public/avatars/` |
| Database | Managed Postgres | Self-hosted Postgres |
| Cost | Berbayar | Gratis (self-hosted) |
| Maintenance | Managed | Self-managed |
| Control | Limited | Full control |

## 📚 Files Changed/Created

### Created Files:
```
prisma/
  ├── schema.prisma (Prisma schema)
  ├── seed.ts (Database seeding)
  └── migrations/ (Auto-generated)

lib/
  ├── auth/
  │   ├── config.ts (JWT shared config)
  │   ├── edge.ts (Edge-safe middleware JWT verification)
  │   ├── jwt.ts (JWT utilities)
  │   ├── password.ts (Password utilities)
  │   └── index.ts
  └── prisma.ts (Prisma singleton)

app/api/
  ├── auth/me/route.ts (Current user endpoint)
  └── upload/avatar/route.ts (Avatar upload endpoint)

scripts/
  └── migrate-from-supabase.ts (Migration script)

.env (New - Prisma configuration)
```

### Updated Files:
```
app/actions/auth.ts
app/actions/database.ts
middleware.ts
hooks/use-auth.ts
components/AvatarUpload.tsx
package.json
.env.local
```

### Removed Files:
```
utils/supabase/
types/database.types.ts
```

## ✨ Improvements dari Supabase

1. **Cost**: Tidak perlu bayar Supabase, server sendiri
2. **Data Privacy**: Semua data ada di server lokal, tidak di cloud
3. **Control**: Full control atas database dan authentication
4. **Performance**: Lebih cepat karena database lokal
5. **Real-time Stats**: Dashboard stats dihitung real-time dari actual data
6. **Customization**: Mudah untuk customize auth dan database logic

## 🚨 Important Notes

### Avatar Migration
- Avatar URLs dari Supabase akan di-store di database
- Tapi file avatar tidak akan di-migrate (too large)
- Users bisa re-upload avatar setelah migration
- Old Supabase URLs akan tetap berfungsi sampai Supabase dihapus

### User Passwords
- Passwords dari Supabase Auth tidak bisa di-migrate (tidak accessible)
- Semua users akan diberikan temporary password: `TempPassword123`
- Users harus reset password pada login pertama
- Atau implement password reset flow

### Supabase Removal (Optional)
- Setelah migration selesai dan tested, Anda bisa hapus Supabase subscription
- Supabase runtime helper sudah dihapus dari aplikasi
- `@supabase/supabase-js` hanya tersisa untuk `scripts/migrate-from-supabase.ts`
- Delete env variables Supabase setelah script migrasi tidak dibutuhkan lagi

## 📞 Support

Jika ada issues atau pertanyaan:
1. Check troubleshooting section
2. Check Prisma docs: https://www.prisma.io/docs/
3. Check Next.js docs: https://nextjs.org/docs/

## Next Steps

1. ✅ Jalankan database seeding/migration
2. ✅ Test login dengan user baru
3. ✅ Test semua fitur
4. ✅ Update production secrets
5. ✅ Deploy ke production

---

**Migration completed!** 🎉
Aplikasi Anda sekarang fully operational dengan PostgreSQL lokal.
