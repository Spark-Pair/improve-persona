import { useEffect } from 'react';
import { db } from '../db';
import { isTaskDue, getTodayString, formatTime12 } from './engine';

const MORNING_HOUR = 8; // 8:00 AM summary
const REMINDER_MINUTES = 15; // 15 min before task time

const scheduleNotification = (title, body, fireAt) => {
  const now = Date.now();
  const delay = fireAt - now;
  if (delay <= 0) return; // already passed today

  setTimeout(() => {
    if (Notification.permission !== 'granted') return;
    navigator.serviceWorker.ready.then((sw) => {
      sw.showNotification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: [200, 100, 200],
        tag: title, // prevents duplicate stacking
      });
    });
  }, delay);
};

const getMorningFireTime = () => {
  const t = new Date();
  t.setHours(MORNING_HOUR, 0, 0, 0);
  return t.getTime();
};

const getTimeFireTime = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  const t = new Date();
  t.setHours(h, m, 0, 0);
  return t.getTime();
};

export const useNotifications = () => {
  useEffect(() => {
    const init = async () => {
      // 1. Request permission
      if (!('Notification' in window) || !navigator.serviceWorker) return;

      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') return;

      const today = getTodayString();
      const allRoutines = await db.routines.toArray();
      const dueToday = allRoutines.filter((r) => isTaskDue(r));

      if (dueToday.length === 0) return;

      // 2. Morning summary — 8:00 AM
      scheduleNotification(
        '🌅 Daily Protocol',
        `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} scheduled for today`,
        getMorningFireTime()
      );

      // 3. Per-task: exact time + 15-min reminder
      dueToday.forEach((routine) => {
        if (!routine.scheduledTime) return;

        const exactFire = getTimeFireTime(routine.scheduledTime);
        const reminderFire = exactFire - REMINDER_MINUTES * 60 * 1000;

        // 15-min before reminder
        scheduleNotification(
          `⏰ Coming up: ${routine.name}`,
          `Starts in ${REMINDER_MINUTES} minutes`,
          reminderFire
        );

        // Exact time notification
        scheduleNotification(
          `🎯 Time for: ${routine.name}`,
          `Scheduled at ${formatTime12(routine.scheduledTime)}`,
          exactFire
        );
      });
    };

    init();
  }, []); // runs once on app mount
};