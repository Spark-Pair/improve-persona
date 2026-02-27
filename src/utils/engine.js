import { format, addDays, getDay, parseISO, isSameDay } from 'date-fns';

/**
 * Recurrence Object Structure:
 * {
 *   type: 'daily' | 'interval' | 'weekly',
 *   interval: number (for 'interval' type),
 *   days: number[] (0-6 for 'weekly' type)
 * }
 */

export const isTaskDue = (routine, date = new Date()) => {
    const { recurrence, createdAt } = routine;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const createdDate = new Date(createdAt);
    createdDate.setHours(0, 0, 0, 0);

    if (targetDate < createdDate) return false;

    switch (recurrence.type) {
        case 'daily':
            return true;

        case 'interval':
            const diffTime = Math.abs(targetDate - createdDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays % recurrence.interval === 0;

        case 'weekly':
            const dayOfWeek = getDay(targetDate);
            return recurrence.days.includes(dayOfWeek);

        default:
            return false;
    }
};

export const getTodayString = () => format(new Date(), 'yyyy-MM-dd');
