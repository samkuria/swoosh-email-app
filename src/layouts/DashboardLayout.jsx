import React, { useState, useEffect } from 'react';
import Sidebar from '../components/dashboard/Sidebar';
import MainContent from '../components/dashboard/MainContent';
import Analytics from '../components/dashboard/Analytics';
import Recipients from '../components/dashboard/Recipients';
import Campaigns from '../components/dashboard/Campaigns'; 
import Settings from '../components/dashboard/Settings';

import styles from './DashboardLayout.module.css';

const DashboardLayout = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState('Dashboard');

  // NEW: Instantly check memory for Dark Mode when the app boots up
  useEffect(() => {
    const savedTheme = localStorage.getItem('swoosh-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'Dashboard':
        return <MainContent onNavigate={setCurrentView} />;
      case 'Analytics':
        return <Analytics />;
      case 'Recipients':
        return <Recipients />;
      case 'Campaigns':
        return <Campaigns />;
      case 'Settings': 
        return <Settings />;
      default:
        return <MainContent onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className={styles.appContainer}>
      <Sidebar 
        onLogout={onLogout} 
        currentView={currentView} 
        onNavigate={setCurrentView} 
      />
      
      <div className={styles.contentWrapper}>
        {renderView()}
      </div>
    </div>
  );
};

export default DashboardLayout;