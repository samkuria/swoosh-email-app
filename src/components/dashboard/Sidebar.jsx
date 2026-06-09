import React from 'react';
import { Home, BarChart3, Users, MessageSquare, Settings, Power } from 'lucide-react';
import classNames from 'classnames'; 
import styles from './Sidebar.module.css';

// 1. Accept the new currentView and onNavigate props
const Sidebar = ({ onLogout, currentView, onNavigate }) => {
  
  const navItems = [
    { name: 'Dashboard', icon: Home },
    { name: 'Analytics', icon: BarChart3 }, 
    { name: 'Recipients', icon: Users }, 
    { name: 'Campaigns', icon: MessageSquare }, 
    { name: 'Settings', icon: Settings }, 
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandContainer}>
        <div className={styles.brandIcon}>S</div>
        <h1 className={styles.brandTitle}>SWOOSH</h1>
      </div>

      <nav className={styles.navLinks}>
        {navItems.map((item) => {
          const IconComponent = item.icon;
          // 2. Check the prop to see if this item is active
          const isActive = currentView === item.name;
          
          return (
            <button 
              key={item.name} 
              className={classNames(styles.navItem, {
                [styles.navItemActive]: isActive
              })}
              // 3. Trigger the layout's state update when clicked
              onClick={() => onNavigate(item.name)}
            >
              <IconComponent 
                size={20} 
                className={styles.navIcon} 
                strokeWidth={isActive ? 2 : 1.5} 
              />
              <span className={styles.navText}>{item.name}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.bottomActions}>
        <button 
          className={`${styles.navItem} ${styles.logoutButton}`} 
          onClick={onLogout}
        >
          <Power size={18} className={styles.logoutIcon} />
          <span className={styles.navText}>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;