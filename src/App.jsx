// src/App.jsx
import { useState } from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import AuthContainer from './components/auth/AuthContainer';
import './index.css';

function App() {
  // 1. Core Authentication State
  // Set to `true` manually to build the dashboard UI.
  // Set to `false` for the real auth flow.
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 2. State management functions
  const handleLoginCompletion = () => {
    setIsAuthenticated(true); // Straight to dashboard!
  };

  const handleLogout = () => {
    setIsAuthenticated(false); // straight to login forms
  };

  // 3. Conditional Render Loop
  if (isAuthenticated) {
    // Show the Phase 2 Dashboard UI (image_10.png)
    return <DashboardLayout onLogout={handleLogout} />;
  } else {
    // Show the Phase 1 Auth UI (image_5.png)
    return <AuthContainer onAuthComplete={handleLoginCompletion} />;
  }
}

export default App;
