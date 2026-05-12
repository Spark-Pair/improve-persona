import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { FeedbackProvider } from './context/FeedbackContext';
import { useNotifications } from './utils/useNotifications'; // 👈

import Home from './pages/Home';
import Routine from './pages/Routine';
import CalendarPage from './pages/Calendar';
import Stats from './pages/Stats';
import SettingsPage from './pages/Settings';

const AppContent = () => {
  useNotifications(); // 👈 schedules on every app open
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/routine" element={<Routine />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
};

export default function App() {
  return (
    <FeedbackProvider>
      <AppContent />
    </FeedbackProvider>
  );
}