// ============================================================
// Service Worker — Hancar PWA v2
// รองรับ: Offline Cache + Firebase Push Notification
// ============================================================
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey           : "AIzaSyCRHN0Jgi_OT40YAB_nt7oG49WrUdVduu8",
  authDomain       : "huncar-82206.firebaseapp.com",
  projectId        : "huncar-82206",
  storageBucket    : "huncar-82206.firebasestorage.app",
  messagingSenderId: "711966399729",
  appId            : "1:711966399729:web:59ca49b307bc27973e9d50",
});

const messaging = firebase.messaging();
const CACHE_NAME = 'hanka-car-v3';
const CACHE_URLS = ['/hanka-car/', '/hanka-car/index.html', '/hanka-car/manifest.json'];

// ── Install ──
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(CACHE_URLS)));
  self.skipWaiting();
});

// ── Activate ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ──
self.addEventListener('fetch', e => {
  if (e.request.url.includes('script.google.com') ||
      e.request.url.includes('firebase') ||
      e.request.url.includes('googleapis')) return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

// ── Background Push (เมื่อแอปปิดอยู่) ──
messaging.onBackgroundMessage(payload => {
  const n          = payload.notification || payload.data || {};
  const notifTitle = n.title || '🚑 Hancar';
  const notifBody  = n.body  || 'มีการอัปเดตสถานะรถ';

  // ✅ ส่งข้อความไปบันทึกประวัติใน App
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
    clients.forEach(c => c.postMessage({
      type : 'NOTIFY_HISTORY',
      title: notifTitle,
      body : notifBody,
    }));
  });

  return self.registration.showNotification(notifTitle, {
    body    : notifBody,
    icon    : '/hanka-car/icon-192.png',
    badge   : '/hanka-car/icon-192.png',
    vibrate : [200, 100, 200],
    tag     : 'hanka-status',
    renotify: true,
    data    : { url: '/hanka-car/' },
    actions : [
      { action: 'open',    title: '🔍 ดูสถานะ' },
      { action: 'dismiss', title: '✕ ปิด'      },
    ],
  });
});

// ── Notification Click ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data?.url || '/';
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
