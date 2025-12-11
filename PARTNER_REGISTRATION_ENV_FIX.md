# Partner Registration 500 Error - Environment Variable Fix

## 🔴 Sorun

Partner kayıt işlemi sırasında `/api/create-partner-user` endpoint'i **500 Internal Server Error** döndürüyor.

### Hata Mesajları
```
POST /api/create-partner-user 500
❌ Partner API error: { error: "Server configuration error" }
```

## 🔍 Kök Neden Analizi

### 1. Kod Analizi

[api/create-partner-user.ts](api/create-partner-user.ts#L59-L80) dosyasında şu kontroller var:

```typescript
const url = process.env.SUPABASE_URL || 
            process.env.VITE_SUPABASE_URL || 
            'https://uwslxmciglqxpvfbgjzm.supabase.co';

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  return res.status(500).json({ 
    error: 'Server configuration error',
    details: 'SUPABASE_SERVICE_ROLE_KEY not configured'
  });
}
```

### 2. Environment Variables Durumu

| Variable | Frontend (VITE) | Backend (Vercel API) | Durum |
|----------|-----------------|----------------------|-------|
| `VITE_SUPABASE_URL` | ✅ Mevcut | ❌ Erişilemez | Frontend only |
| `VITE_SUPABASE_ANON_KEY` | ✅ Mevcut | ❌ Erişilemez | Frontend only |
| `SUPABASE_URL` | ❌ Yok | ❌ Yok | **Eklenecek** |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ Yok | ❌ Yok | **KRİTİK - Eklenecek** |

**VITE_ prefix ile başlayan değişkenler sadece frontend (Vite) tarafından kullanılır.**
**Backend serverless functions (Vercel API routes) bunlara erişemez!**

### 3. Neden Service Role Key Gerekli?

Partner kayıt işlemi email confirmation'ı atlamak için **Supabase Admin API** kullanıyor:

```typescript
// Admin API - email_confirm: true ile mail GÖNDERİLMEZ
const createUserResp = await fetch(`${url}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`  // ← Service Role Key gerekli
  },
  body: JSON.stringify({
    email: email.toLowerCase(),
    password,
    email_confirm: true  // ✅ Email doğrulamayı ATLA
  })
});
```

**Admin API sadece service_role key ile kullanılabilir.**

---

## ✅ Çözüm Adımları

### ADIM 1: Supabase Service Role Key'i Al

1. Supabase Dashboard'a git: https://supabase.com/dashboard
2. Projenize girin: `uwslxmciglqxpvfbgjzm`
3. Sol menüden **Settings** → **API** sekmesine git
4. **Project API keys** bölümünde:
   - ✅ `anon public` key: Frontend için (zaten kullanılıyor)
   - ⚠️ **`service_role` key**: Backend API için (**bu gerekli!**)

5. `service_role` key'i kopyalayın (bu key **GİZLİ tutulmalı** - client-side'da KESİNLİKLE kullanmayın!)

### ADIM 2: Vercel'e Environment Variables Ekle

#### Option A: Vercel Dashboard (Önerilen)

1. Vercel Dashboard'a git: https://vercel.com
2. Projenizi seçin: **yolmov**
3. **Settings** → **Environment Variables** sekmesine git
4. Aşağıdaki değişkenleri ekleyin:

| Key | Value | Environments |
|-----|-------|--------------|
| `SUPABASE_URL` | `https://uwslxmciglqxpvfbgjzm.supabase.co` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5c...` (Adım 1'de kopyaladığınız key) | Production, Preview, Development |

**⚠️ ÖNEMLİ:**
- ✅ Her iki değişkeni de **Production + Preview + Development** için ekleyin
- ✅ `SUPABASE_SERVICE_ROLE_KEY` değeri **GİZLİ tutulmalı** - GitHub'a pushlamamalı
- ❌ Bu key'i **ASLA** frontend kodunda kullanmayın

5. Değişkenleri ekledikten sonra **Save** butonuna tıklayın

#### Option B: Vercel CLI

```bash
# Vercel CLI ile login
vercel login

# Environment variables ekle
vercel env add SUPABASE_URL
# Value gir: https://uwslxmciglqxpvfbgjzm.supabase.co
# Select environments: Production, Preview, Development

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Value gir: [Supabase'den kopyaladığınız service_role key]
# Select environments: Production, Preview, Development
```

### ADIM 3: Redeploy

Environment variables eklendikten sonra Vercel otomatik redeploy yapmaz. Manuel redeploy gerekli:

#### Option A: Git Push ile Redeploy
```bash
# Herhangi bir değişiklik push'layın
git commit --allow-empty -m "Trigger redeploy for env vars"
git push origin main
```

#### Option B: Vercel Dashboard'dan Redeploy
1. Vercel Dashboard > Deployments
2. En son deployment'ın yanındaki **"..."** menüsüne tıklayın
3. **"Redeploy"** seçeneğini seçin
4. **"Redeploy"** butonuna tıklayın

---

## 🧪 Test Etme

### 1. Deployment Tamamlandıktan Sonra

Production URL'den partner kayıt sayfasına gidin:
```
https://yolmov.com/partner-register
```

### 2. Test Kayıt Yapın

Yeni bir email ile partner kaydı yapın:
- Email: `test.partner+RANDOM@gmail.com`
- Şifre: En az 6 karakter
- Diğer gerekli bilgileri doldurun

### 3. Beklenen Sonuç

✅ **Başarılı:**
- ✅ Kayıt başarıyla tamamlanır
- ✅ "Partner kaydı başarıyla oluşturuldu. Admin onayı bekleniyor." mesajı görünür
- ✅ Email doğrulama maili **GÖNDERİLMEZ** (email_confirm: true)
- ✅ Partner dashboard'a yönlendirilir
- ✅ "Admin onayı bekliyor" mesajı görünür

❌ **Hala Hata Alırsanız:**
1. Browser Console'u açın (F12)
2. Network tab'ında `/api/create-partner-user` request'ini inceleyin
3. Response body'deki error mesajını kontrol edin

### 4. Backend Logs Kontrolü

Vercel Dashboard > Deployments > [Son Deployment] > **Functions** tabında:

```
🔐 Creating partner user with Admin API: test.partner@gmail.com
✅ Auth user created: [user-id]
✅ Partner created successfully: [user-id]
```

Bu logları görmelisiniz. Eğer görüyorsanız environment variables doğru çalışıyor demektir.

---

## 🔐 Güvenlik Notları

### Service Role Key Koruma

⚠️ **ASLA yapılmaması gerekenler:**
- ❌ `service_role` key'i Git'e commit etmeyin
- ❌ Frontend kodunda kullanmayın
- ❌ Client-side'da expose etmeyin
- ❌ Public repository'de paylaşmayın

✅ **Doğru kullanım:**
- ✅ Sadece backend API routes'larda kullanın (Vercel Functions)
- ✅ Environment variables ile yönetin
- ✅ `.gitignore`'da `.env*` dosyaları ignore edilsin
- ✅ Vercel Dashboard'dan yönetin

### .gitignore Kontrolü

`.gitignore` dosyasında şunlar olmalı:
```
.env
.env.local
.env.production
.env.development
```

---

## 📋 Checklist

Tamamlandı mı? | Görev
--------------|------
⬜ | Supabase'den `service_role` key alındı
⬜ | Vercel Dashboard'a `SUPABASE_URL` eklendi
⬜ | Vercel Dashboard'a `SUPABASE_SERVICE_ROLE_KEY` eklendi
⬜ | Her iki env var da Production + Preview + Development için seçildi
⬜ | Vercel redeploy tetiklendi
⬜ | Deployment başarıyla tamamlandı
⬜ | Partner kayıt test edildi
⬜ | Email confirmation maili **GÖNDERİLMEDİ** (başarı!)
⬜ | Backend logs kontrol edildi

---

## 🆘 Hala Sorun mu Var?

### Hata: "Server configuration error"

**Olası Nedenler:**
1. Environment variables Vercel'e eklenmedi
2. Redeploy yapılmadı
3. Environment seçimi yanlış (Production seçilmedi)

**Çözüm:**
```bash
# Vercel CLI ile kontrol
vercel env ls

# Çıktıda şunları görmelisiniz:
# SUPABASE_URL (Production, Preview, Development)
# SUPABASE_SERVICE_ROLE_KEY (Production, Preview, Development)
```

### Hata: "Auth user creation failed"

**Olası Nedenler:**
1. Service role key yanlış veya expired
2. Supabase API değişti
3. Network problemi

**Çözüm:**
- Supabase Dashboard > Settings > API'da key'i doğrulayın
- Key'i yeniden kopyalayıp Vercel'e güncelleyin

### Hala Email Confirmation Maili Geliyor

**Olası Nedenler:**
1. Frontend eski kodu kullanıyor (cache)
2. Fallback yöntem tetiklendi

**Çözüm:**
```bash
# Frontend cache'i temizleyin
# Browser'da: Ctrl+Shift+R (Hard refresh)

# API logs'unda şunu arayin:
# "📡 Calling partner creation API..."
# "✅ Partner created via API"

# Eğer görünmüyorsa fallback çalışıyor demektir
```

---

## 📞 Destek

Sorun devam ederse:
1. Vercel Deployment Logs'unu paylaşın
2. Browser Console hata mesajlarını paylaşın
3. Network tab'daki API response'ları paylaşın

---

**Son Güncelleme:** 2025-12-11
**Durum:** Environment variables eksik - Vercel Dashboard'dan eklenecek
