// src/components/auth/AuthContainer.jsx
import { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';
import styles from './Auth.module.css'; // Importing CSS Modules

const AuthContainer = ({ onAuthComplete }) => {
  // Simple state to handle which form is displayed
  const [currentView, setCurrentView] = useState('login');

  const toggleView = () => {
    setCurrentView(currentView === 'login' ? 'signup' : 'login');
  };

  return (
    <div className={styles.authWrapper}>
      {currentView === 'login' ? (
        <Login onSwitchView={toggleView} onAuthSuccess={onAuthComplete} />
      ) : (
        <SignUp onSwitchView={toggleView} onAuthSuccess={onAuthComplete} />
      )}
    </div>
  );
};

export default AuthContainer;