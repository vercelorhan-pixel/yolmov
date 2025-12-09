# 🔧 Call Recordings Düzeltme Rehberi

## 🚨 Tespit Edilen Sorunlar

### 1. Kayıt Uyarısı Sesi Çalmıyor
**Hata:** `POST /storage/v1/object/sign/call-recordings/ElevenLabs_Text_to_Speech_audio%20(1).mp3 400`

**Sebep:**
- Dosya adında boşluk var (`ElevenLabs_Text_to_Speech_audio (1).mp3`)
- Supabase Storage RLS politikası yok
- Bucket oluşturulmamış

**Çözüm:**
1. Ses dosyasını `notice-audio.mp3` olarak yeniden upload edin
2. Migration 026'yı Supabase'de çalıştırın

### 2. Kayıt Upload Edilemiyor
**Hata:** `StorageApiError: new row violates row-level security policy`

**Sebep:**
- Storage RLS politikaları eksik
- Anonim kullanıcılar upload yetkisi yok

**Çözüm:**
- Migration 026'da tüm RLS politikaları düzeltildi
- Artık anonim kullanıcılar da kayıt oluşturabilir

### 3. Call Notification 500 Error
**Hata:** `POST /api/send-call-notification 500`

**Sebep:**
- Vercel Edge Function hatası (ayrı bir sorun)

**Çözüm:**
- Bu API endpoint'ini kontrol etmek gerekiyor

---

## 📋 Yapılması Gerekenler

### 1. Supabase Migration Çalıştır

**Adımlar:**
1. Supabase Dashboard → SQL Editor
2. `migrations/026_fix_call_recordings_storage.sql` dosyasını aç
3. Tüm içeriği kopyala ve çalıştır

**Migration İçeriği:**
- ✅ `call-recordings` bucket oluşturma
- ✅ Storage RLS politikaları (herkes okuyabilir, upload edebilir)
- ✅ `call_recordings` tablo RLS politikaları

### 2. Ses Dosyasını Yeniden Upload Et

**Yol:**
Supabase Dashboard → Storage → `call-recordings` bucket

**Dosya Adı:** `notice-audio.mp3` (BOŞLUKSUZ!)

**Kaynak Dosya:** Eski `ElevenLabs_Text_to_Speech_audio (1).mp3` dosyasını indir ve yeniden yükle

**Public URL Test:**
```
https://uwslxmciglqxpvfbgjzm.supabase.co/storage/v1/object/public/call-recordings/notice-audio.mp3
```

### 3. Test Et

**Test Senaryosu:**
1. Anonim kullanıcı olarak partner'a arama başlat
2. **BEKLENTİ:** Mikrofon izni sonrası 9 saniyelik uyarı sesi çalmalı
3. Partner aramayı cevaplar
4. **BEKLENTİ:** Konsol'da "🎙️ Recording started" mesajı
5. 10+ saniye konuş
6. Aramayı sonlandır
7. **BEKLENTİ:** Konsol'da "🎙️ Upload successful" mesajı
8. Supabase Storage'da `2025/12/call_xxx.webm` dosyası olmalı
9. Admin panel → Call Logs'da kayıt dinlenebilmeli

---

## 📝 Kod Değişiklikleri

### CallContext.tsx (Satır 427-447)
```typescript
// ❌ ÖNCE
.createSignedUrl('ElevenLabs_Text_to_Speech_audio (1).mp3', 60);

// ✅ SONRA
.createSignedUrl('notice-audio.mp3', 60);
```

### Migration 026 Eklendi
- Storage bucket + RLS policies
- Table RLS policies fix
- Public notice audio access

---

## 🎯 Beklenen Sonuçlar

### Başarılı Konsol Çıktısı:
```
📞 [CallContext] Starting call to: xxx
🔊 [CallContext] Playing call recording notice...
🔊 [CallContext] Notice audio playing...
🔊 [CallContext] Notice audio finished
🎙️ [Recording] Starting dual-stream recording...
🎙️ [Recording] Started successfully, recording ID: xxx
🎙️ [Recording] Chunk received: 2045 bytes
... (daha fazla chunk)
🎙️ [Recording] Processing and uploading...
🎙️ [Recording] Uploading to: 2025/12/call_xxx.webm
🎙️ [Recording] Upload successful!
```

### Başarısız Olursa:
- `400 Bad Request` → RLS politikaları eksik (migration çalıştır)
- `404 Not Found` → Ses dosyası yok (upload et)
- `403 Forbidden` → Bucket private (migration bucket'ı public yapmalı)

---

## 🆘 Sorun Devam Ederse

1. **Browser Console'u temizle** (Ctrl+L veya Cmd+K)
2. **Hard refresh** (Ctrl+Shift+R veya Cmd+Shift+R)
3. **Service Worker'ı temizle** (DevTools → Application → Service Workers → Unregister)
4. **Supabase Storage'ı kontrol et** (dosya gerçekten var mı?)
5. **RLS politikalarını kontrol et** (Supabase Dashboard → Database → Policies)

---

## 📞 İletişim

Sorun devam ederse lütfen console.log çıktısını paylaşın:
- `🔊 [CallContext]` logları → Ses dosyası sorunu
- `🎙️ [Recording]` logları → Kayıt upload sorunu
- `📞 [CallContext]` logları → Genel call flow sorunu
