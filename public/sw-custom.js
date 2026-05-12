// public/sw-custom.js

import { precacheAndRoute } from 'workbox-precaching';
precacheAndRoute(self.__WB_MANIFEST);

const SCHEDULED_NOTIFICATIONS_KEY = 'scheduled-notifications';

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SCHEDULE_NOTIFICATIONS') {
    const notifications = event.data.payload; // [{ title, body, fireAt }]
    scheduleAll(notifications);
  }

  if (event.data?.type === 'CLEAR_NOTIFICATIONS') {
    clearAllTimers();
  }
});

// In-memory timers (SW stays alive as long as possible)
const timers = [];

const clearAllTimers = () => {
  timers.forEach(clearTimeout);
  timers.length = 0;
};

const scheduleAll = (notifications) => {
  clearAllTimers();

  notifications.forEach(({ title, body, fireAt }) => {
    const delay = fireAt - Date.now();
    if (delay <= 0) return;

    const t = setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        vibrate: [200, 100, 200],
        tag: title,
        renotify: true,
      });
    }, delay);

    timers.push(t);
  });
};