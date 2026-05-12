import { useEffect } from 'react';
import { db } from '../db';
import { isTaskDue, getTodayString, formatTime12 } from './engine';

const MORNING_HOUR = 8;
const REMINDER_MINUTES = 15;

const sendNotification = (title, body) => {
  navigator.serviceWorker.ready.then((sw) => {
    sw.showNotification(title, {
      body,
      vibrate: [200, 100, 200],
      tag: title,
    });
  });
};

const scheduleNotification = (title, body, fireAt) => {
  const delay = fireAt - Date.now();
  if (delay <= 0) return;
  setTimeout(() => {
    if (Notification.permission !== 'granted') return;
    sendNotification(title, body);
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
      if (!('Notification' in window) || !navigator.serviceWorker) return;

      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') return;

      const allRoutines = await db.routines.toArray();
      const dueToday = allRoutines.filter((r) => isTaskDue(r));

      if (dueToday.length === 0) return;

      // ── Immediate test — agar ye nahi aaya to SW issue hai ──
      sendNotification(
        '✅ Improve Persona',
        `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} loaded`
      );

      // ── Morning summary ──
      scheduleNotification(
        '🌅 Daily Protocol',
        `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} scheduled for today`,
        getMorningFireTime()
      );

      // ── Per-task: reminder + exact time ──
      dueToday.forEach((routine) => {
        if (!routine.scheduledTime) return;

        const exactFire = getTimeFireTime(routine.scheduledTime);
        const reminderFire = exactFire - REMINDER_MINUTES * 60 * 1000;

        scheduleNotification(
          `⏰ Coming up: ${routine.name}`,
          `Starts in ${REMINDER_MINUTES} minutes`,
          reminderFire
        );

        scheduleNotification(
          `🎯 Time for: ${routine.name}`,
          `Scheduled at ${formatTime12(routine.scheduledTime)}`,
          exactFire
        );
      });
    };

    init();
  }, []);
};