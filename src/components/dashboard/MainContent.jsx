// src/components/dashboard/MainContent.jsx
import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, FileUp, MoreVertical, Mail, AlertTriangle } from 'lucide-react';
import styles from './MainContent.module.css';

import { ref, onValue, push } from 'firebase/database';
import { auth, db } from '../../firebase';

const MainContent = ({ onNavigate }) => {
  const [campaigns, setCampaigns] = useState([]);
  const fileInputRef = useRef(null);
  const currentUser = auth.currentUser;

  // Define your daily limit here
  const DAILY_LIMIT = 300;

  useEffect(() => {
    if (!currentUser) return;
    const campaignsRef = ref(db, `users/${currentUser.uid}/campaigns`);
    const unsubscribe = onValue(campaignsRef, (snapshot) => {
      const data = snapshot.val();
      setCampaigns(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const rows = event.target.result.split('\n');
      let count = 0;
      for (let i = 1; i < rows.length; i++) {
        const [name, email] = rows[i].split(',').map(item => item.trim().replace('\r', ''));
        if (email) {
          push(ref(db, `users/${currentUser.uid}/recipients`), {
            name: name || 'Unknown',
            email: email,
            dateAdded: new Date().toLocaleDateString(),
            status: 'Subscribed'
          });
          count++;
        }
      }
      alert(`Successfully imported ${count} recipients!`);
    };
    reader.readAsText(file);
  };

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sent || 0), 0);
  
  // Logic: Remaining Today = Limit - Total Sent
  const remainingToday = Math.max(0, DAILY_LIMIT - totalSent);

  return (
    <div className={styles.mainContainer}>
      
      {/* --- METRICS --- */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <h3 className={styles.metricLabel}>Total Campaigns</h3>
          <p className={`${styles.metricValue} ${styles.textBlue}`}>{totalCampaigns}</p>
        </div>
        <div className={styles.metricCard}>
          <h3 className={styles.metricLabel}>Active Campaigns</h3>
          <p className={`${styles.metricValue} ${styles.textGreen}`}>{activeCampaigns}</p>
        </div>
        <div className={styles.metricCard}>
          <h3 className={styles.metricLabel}>Total Sent</h3>
          <p className={`${styles.metricValue} ${styles.textPurple}`}>{totalSent}</p>
        </div>
        <div className={styles.metricCard}>
          <h3 className={styles.metricLabel}>Remaining Today</h3>
          <p className={`${styles.metricValue} ${remainingToday < 50 ? styles.textRed : styles.textIndigo}`}>
            {remainingToday}
          </p>
        </div>
      </div>

      {/* --- WARNING BANNER if low --- */}
      {remainingToday < 50 && (
        <div style={{ backgroundColor: '#FEF2F2', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#B91C1C' }}>
          <AlertTriangle size={20} />
          <p style={{ fontSize: '14px', fontWeight: '600' }}>Warning: You are approaching your daily sending limit. Avoid sending large batches to prevent spam flags.</p>
        </div>
      )}

      {/* --- TABLE & ACTIONS --- */}
      <div className={styles.contentGrid}>
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Campaigns Overview</h2>
            <span className={styles.badge}>Total: {totalCampaigns}</span>
          </div>

          {campaigns.length === 0 ? (
            <div className={styles.emptyState}>
              <Mail size={32} className={styles.emptyIcon} />
              <h3 className={styles.emptyTitle}>No campaigns created yet.</h3>
              <button className={styles.btnPrimary} onClick={() => onNavigate('Campaigns')}>
                <PlusCircle size={18} /> Create Your First Campaign
              </button>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Campaign Name</th><th>Status</th><th>Total Sent</th></tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id}>
                      <td className={styles.fontBold}>{c.name}</td>
                      <td><span className={styles.statusActive}>{c.status}</span></td>
                      <td className={styles.textRight}>{c.sent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.actionsCard}>
          <h2 className={styles.cardTitle}>Quick Actions</h2>
          <div className={styles.actionButtons}>
            <button className={styles.btnOutline} onClick={() => onNavigate('Campaigns')}>
              <PlusCircle size={18} /> New Campaign
            </button>
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCSVImport} style={{ display: 'none' }} />
            <button className={styles.btnOutline} onClick={() => fileInputRef.current.click()}>
              <FileUp size={18} /> Import List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContent;