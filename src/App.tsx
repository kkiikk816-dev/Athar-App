/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Prayers from './pages/Prayers';
import Library from './pages/Library';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <div className="font-sans text-gray-900 bg-gray-50 min-h-screen" dir="rtl">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/prayers" element={<Prayers />} />
              <Route path="/library" element={<Library />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
            <BottomNav />
          </div>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}
