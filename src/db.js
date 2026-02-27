import Dexie from 'dexie'

export const db = new Dexie('ImprovePersonaDB')

db.version(1).stores({
  routines: '++id, title, time, recurrence, createdAt',
  completions: '++id, routineId, date, completed, [routineId+date]'
})
