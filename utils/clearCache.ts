// Utility to manually clear all caches
// Only use this function when absolutely necessary (e.g., major updates)

export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) {
    console.warn('Cache API not supported');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    const deletePromises = cacheNames.map(cacheName => {
      console.log('🗑️ Clearing cache:', cacheName);
      return caches.delete(cacheName);
    });
    
    await Promise.all(deletePromises);
    console.log('✅ All caches cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing caches:', error);
  }
}

export async function clearOldCaches(currentVersion: string): Promise<void> {
  if (!('caches' in window)) {
    console.warn('Cache API not supported');
    return;
  }

  try {
    const cacheNames = await caches.keys();
    const currentCacheName = `yolmov-cache-${currentVersion}`;
    
    const deletePromises = cacheNames
      .filter(cacheName => cacheName.startsWith('yolmov-cache-') && cacheName !== currentCacheName)
      .map(cacheName => {
        console.log('🗑️ Clearing old cache:', cacheName);
        return caches.delete(cacheName);
      });
    
    await Promise.all(deletePromises);
    console.log('✅ Old caches cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing old caches:', error);
  }
}

export async function unregisterAllServiceWorkers(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported');
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const unregisterPromises = registrations.map(registration => {
      console.log('🗑️ Unregistering Service Worker');
      return registration.unregister();
    });
    
    await Promise.all(unregisterPromises);
    console.log('✅ All Service Workers unregistered');
  } catch (error) {
    console.error('❌ Error unregistering Service Workers:', error);
  }
}

// Full reset: Clear everything and reload
export async function fullPWAReset(): Promise<void> {
  console.log('🔄 Starting full PWA reset...');
  
  await clearAllCaches();
  await unregisterAllServiceWorkers();
  
  console.log('✅ PWA reset complete - reloading...');
  window.location.reload();
}
