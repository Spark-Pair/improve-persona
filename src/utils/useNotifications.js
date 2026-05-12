import { useEffect } from 'react';
import { db } from '../db';
import { isTaskDue, formatTime12 } from './engine';

const MORNING_HOUR = 8;
const REMINDER_MINUTES = 15;

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

const sendToSW = async (notifications) => {
  const sw = await navigator.serviceWorker.ready;
  sw.active?.postMessage({
    type: 'SCHEDULE_NOTIFICATIONS',
    payload: notifications,
  });
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

      const notifications = [];

      // Morning summary
      notifications.push({
        title: '🌅 Daily Protocol',
        body: `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} scheduled for today`,
        fireAt: getMorningFireTime(),
      });

      // Per-task
      dueToday.forEach((routine) => {
        if (!routine.scheduledTime) return;

        const exactFire = getTimeFireTime(routine.scheduledTime);
        const reminderFire = exactFire - REMINDER_MINUTES * 60 * 1000;

        notifications.push({
          title: `⏰ Coming up: ${routine.name}`,
          body: `Starts in ${REMINDER_MINUTES} minutes`,
          fireAt: reminderFire,
        });

        notifications.push({
          title: `🎯 Time for: ${routine.name}`,
          body: `Scheduled at ${formatTime12(routine.scheduledTime)}`,
          fireAt: exactFire,
        });
      });

      // SW ko bhejo — wo schedule karega
      await sendToSW(notifications);
    };

    init();
  }, []);
};