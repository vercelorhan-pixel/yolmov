// PWA Service Worker Registration and Install Prompt
// This file should be imported in index.tsx

// Service Worker Registration
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        // Firebase FCM Service Worker kaydı
        // NOT: firebase-messaging-sw.js ayrıca kaydediliyor, sw.js PWA için
        const registration = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none'
        });
        
        console.log('✅ PWA Service Worker registered:', registration.scope);
        
        // Update kontrolü
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🔄 New Service Worker available');
              }
            });
          }
        });
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    });
  }
}

// PWA Install Prompt
let deferredPrompt: any = null;

export function initPWAInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💡 PWA install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button/banner
    showInstallPrompt();
  });

  // Detect if app is installed
  window.addEventListener('appinstalled', () => {
    console.log('✅ YOLMOV PWA has been installed');
    localStorage.setItem('pwa-installed', 'true');
    
    // Remove install banner if visible
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
  });

  // Detect if running as PWA
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('🚀 Running as installed PWA');
    document.documentElement.classList.add('pwa-mode');
  }
}

function showInstallPrompt() {
  // Check if already shown in this session
  const installPromptShown = sessionStorage.getItem('pwa-install-prompt-shown');
  if (installPromptShown) return;
  
  // Check if user dismissed it permanently
  const installDismissed = localStorage.getItem('pwa-install-dismissed');
  if (installDismissed === 'true') return;
  
  // Check if already installed
  const isInstalled = localStorage.getItem('pwa-installed');
  if (isInstalled === 'true') return;
  
  // Create install banner
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to right, #FF7A00, #FF9A2A);
    color: white;
    padding: 1rem;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
    z-index: 9999;
    animation: slideUp 0.3s ease-out;
  `;
  
  banner.innerHTML = `
    <style>
      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
    </style>
    <div style="max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="width: 48px; height: 48px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <img 
            src="https://raw.githubusercontent.com/yosoyorhan/repo2/refs/heads/main/yolmov-logo-cutter.png" 
            alt="YOLMOV" 
            style="width: 32px; height: 32px; object-fit: contain;"
          />
        </div>
        <div>
          <p style="font-weight: 700; margin: 0; font-size: 1rem;">YOLMOV'u Telefonunuza Ekleyin</p>
          <p style="margin: 0; font-size: 0.875rem; opacity: 0.9;">Daha hızlı erişim için uygulamayı yükleyin</p>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
        <button 
          id="pwa-install-button" 
          style="padding: 0.5rem 1.5rem; background: white; color: #FF7A00; border: none; border-radius: 8px; font-weight: 700; font-size: 0.875rem; cursor: pointer; transition: all 0.2s;"
          onmouseover="this.style.background='#FFF5F0'"
          onmouseout="this.style.background='white'"
        >
          Yükle
        </button>
        <button 
          id="pwa-dismiss-button" 
          style="padding: 0.5rem 0.75rem; background: transparent; color: white; border: none; font-size: 1.5rem; cursor: pointer; opacity: 0.8; transition: opacity 0.2s;"
          onmouseover="this.style.opacity='1'"
          onmouseout="this.style.opacity='0.8'"
        >
          ×
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(banner);
  sessionStorage.setItem('pwa-install-prompt-shown', 'true');
  
  // Install button click
  const installBtn = document.getElementById('pwa-install-button');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`User response to install prompt: ${outcome}`);
      
      if (outcome === 'accepted') {
        console.log('✅ User accepted the install prompt');
      } else {
        console.log('❌ User dismissed the install prompt');
      }
      
      deferredPrompt = null;
      banner.remove();
    });
  }
  
  // Dismiss button click
  const dismissBtn = document.getElementById('pwa-dismiss-button');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      banner.remove();
      localStorage.setItem('pwa-install-dismissed', 'true');
    });
  }
  
  // Auto-dismiss after 15 seconds
  setTimeout(() => {
    const existingBanner = document.getElementById('pwa-install-banner');
    if (existingBanner) {
      existingBanner.remove();
    }
  }, 15000);
}
