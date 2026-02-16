// import { useEffect, useState } from 'react'
// import { db } from './db'

// export default function App() {
//   const [routines, setRoutines] = useState([])

//   useEffect(() => {
//     const seed = async () => {
//       const count = await db.routines.count()

//       if (count === 0) {
//         await db.routines.add({
//           title: 'Morning Workout',
//           time: '07:00',
//           recurrence: 'daily',
//           createdAt: new Date()
//         })
//       }

//       const data = await db.routines.toArray()
//       setRoutines(data)
//     }

//     seed()
//   }, [])

//   return (
//     <div style={{ padding: 20 }}>
//       <h1>Improve Persona</h1>

//       {routines.map(r => (
//         <div key={r.id}>
//           <p>{r.title} - {r.time}</p>
//         </div>
//       ))}
//     </div>
//   )
// }

import { Routes, Route } from 'react-router-dom';

// Page Imports
import Home from './pages/Home';
import { Navbar } from './components/Navbar';
// Placeholder components for other routes
const Routine = () => <div className="p-10 text-white">Routine Builder</div>;
const CalendarPage = () => <div className="p-10 text-white">History</div>;
const Stats = () => <div className="p-10 text-white">Statistics</div>;
const SettingsPage = () => <div className="p-10 text-white">Settings</div>;

export default function App() {
  return (
    <div className="bg-[#1F2937] min-h-screen">
      {/* Page Content */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/routine" element={<Routine />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>

      {/* Bottom Navigation */}
      <Navbar />
    </div>
  );
}