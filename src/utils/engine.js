import { format, getDay } from 'date-fns';

export const isTaskDue = (routine, date = new Date()) => {
  const recurrence = routine.recurrence ?? {
    type: routine.recurrenceType ?? 'daily',
    interval: routine.recurrenceInterval ?? null,
    days: routine.recurrenceDays ?? null,
  };
  const createdAt = routine.createdAt ?? new Date().toISOString();
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const createdDate = new Date(createdAt);
  createdDate.setHours(0, 0, 0, 0);

  if (targetDate < createdDate) return false;

  switch (recurrence.type) {
    case 'daily':
      return true;

    case 'none': {
      // Use explicit scheduledDate if set, else fall back to createdAt date
      const refStr = routine.scheduledDate
        ? routine.scheduledDate
        : format(createdDate, 'yyyy-MM-dd');
      return format(targetDate, 'yyyy-MM-dd') === refStr;
    }

    case 'interval': {
      const diffDays = Math.round((targetDate - createdDate) / (1000 * 60 * 60 * 24));
      const interval = Number(recurrence.interval ?? 1);
      return diffDays % interval === 0;
    }

    case 'weekly': {
      const dayOfWeek = getDay(targetDate);
      const days = Array.isArray(recurrence.days) ? recurrence.days : [];
      return days.includes(dayOfWeek);
    }

    case 'monthly': {
      const day = routine.monthlyDay ?? 1;
      return targetDate.getDate() === day;
    }

    default:
      return false;
  }
};

export const getTodayString = () => format(new Date(), 'yyyy-MM-dd');

export const formatTime12 = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const h = parseInt(hours);
  const m = parseInt(minutes);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
};