import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import AppLayout from './layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="classes" element={<Classes />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
