import { useEffect, useState } from 'react'
import { db } from './db'

export default function App() {
  const [routines, setRoutines] = useState([])

  useEffect(() => {
    const seed = async () => {
      const count = await db.routines.count()

      if (count === 0) {
        await db.routines.add({
          title: 'Morning Workout',
          time: '07:00',
          recurrence: 'daily',
          createdAt: new Date()
        })
      }

      const data = await db.routines.toArray()
      setRoutines(data)
    }

    seed()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>Improve Persona</h1>

      {routines.map(r => (
        <div key={r.id}>
          <p>{r.title} - {r.time}</p>
        </div>
      ))}
    </div>
  )
}
