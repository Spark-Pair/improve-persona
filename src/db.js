import Dexie from 'dexie'

export const db = new Dexie('ImprovePersonaDB')

db.version(1).stores({
  routines: '++id, title, time, recurrence, createdAt',
  completions: '++id, routineId, date, completed, [routineId+date]',
  settings: 'id',
})

db.version(2)
  .stores({
    routines: '++id, name, recurrenceType, taskType, createdAt',
    completions: '++id, routineId, date, completed, [routineId+date]',
    settings: 'id',
  })
  .upgrade(async (tx) => {
    const routinesTable = tx.table('routines')
    const completionsTable = tx.table('completions')

    await routinesTable.toCollection().modify((routine) => {
      routine.name = routine.name ?? routine.title ?? ''
      routine.recurrenceType =
        routine.recurrenceType ?? routine.recurrence?.type ?? 'daily'
      routine.recurrenceDays =
        routine.recurrenceDays ?? routine.recurrence?.days ?? null
      routine.recurrenceInterval =
        routine.recurrenceInterval ?? routine.recurrence?.interval ?? null

      routine.taskType = routine.taskType ?? 'checkbox'
      routine.counterTarget =
        routine.taskType === 'counter'
          ? Number(routine.counterTarget ?? 1)
          : routine.counterTarget ?? null

      const createdAt = routine.createdAt ?? new Date().toISOString()
      routine.createdAt =
        createdAt instanceof Date ? createdAt.toISOString() : String(createdAt)

      delete routine.title
      delete routine.time
      delete routine.recurrence
    })

    await completionsTable.toCollection().modify((completion) => {
      if (completion.counterValue === undefined) completion.counterValue = null
      if (completion.photoBlob === undefined) completion.photoBlob = null
    })
  })

db.version(3)
  .stores({
    routines: '++id, name, recurrenceType, taskType, createdAt',
    completions: '++id, routineId, date, completed, [routineId+date]',
    settings: 'id',
  })
  .upgrade(async (tx) => {
    const completionsTable = tx.table('completions')

    await completionsTable.toCollection().modify((completion) => {
      if (completion.counterValue === undefined) completion.counterValue = null
      if (completion.photoBlob === undefined) completion.photoBlob = null
      if (completion.photoPath === undefined) completion.photoPath = null
    })
  })
