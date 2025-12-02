# Vale Operatör Uygulaması

Next.js 14 (App Router), MongoDB (Mongoose) ve NextAuth ile hazırlanmış Türkçe vale yönetim paneli.

## Gereksinimler

- Node.js 18+
- MongoDB Atlas bağlantı adresi (`MONGODB_URI`)
- `NEXTAUTH_SECRET`

## Kurulum

```bash
npm install
cp .env.example .env.local  # değişkenleri doldurun
npm run dev
```

Seed (geliştirici demo kullanıcıları ve varsayılan fiyatlandırma):

```bash
MONGODB_URI="..." NEXTAUTH_SECRET="..." npm run seed
```

Demo kullanıcılar:
- admin@example.com / admin123
- valet@example.com / valet123

## Dağıtım (Vercel)

1. Depoyu Vercel'e bağlayın.
2. Çevresel değişkenleri ekleyin: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (opsiyonel).
3. Build komutu: `npm run build` (varsayılan Next ayarları).
4. Deploy edin.

## Klasör Yapısı

- `app/` Next.js App Router sayfa ve API rotaları
- `models/` Mongoose şemaları
- `lib/` bağlantı, auth ve ücret yardımcıları
- `components/` UI parçaları (vale, admin)
- `scripts/` seed komutu
