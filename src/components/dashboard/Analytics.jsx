import React, { useState, useEffect } from 'react';
import { MoreVertical, Mail } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { auth, db } from '../../firebase';
// Reusing the styles we already built for the dashboard to keep things DRY
import styles from './MainContent.module.css'; 

const Analytics = () => {
  const [campaigns, setCampaigns] = useState([]);
  const currentUser = auth.currentUser;

  // Fetch the live data from Firebase just like we did on the main dashboard
  useEffect(() => {
    if (!currentUser) return;

    const campaignsRef = ref(db, `users/${currentUser.uid}/campaigns`);
    const unsubscribe = onValue(campaignsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const campaignList = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setCampaigns(campaignList);
      } else {
        setCampaigns([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className={styles.mainContainer}>
      
      {/* Tab Header */}
      <div className={styles.cardHeader} style={{ marginBottom: '10px' }}>
        <div>
          <h2 className={styles.cardTitle}>Campaign Analytics</h2>
          <p className={styles.emptySubtitle}>Detailed tabular overview of all your campaign data.</p>
        </div>
      </div>

      {/* Full Width Table Card */}
      <div className={styles.tableCard} style={{ width: '100%' }}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>All Campaigns</h3>
          <span className={styles.badge}>Total: {campaigns.length}</span>
        </div>

        {campaigns.length === 0 ? (
          /* Empty State */
          <div className={styles.emptyState}>
            <div className={styles.emptyIconWrapper}>
              <Mail size={32} className={styles.emptyIcon} />
            </div>
            <h3 className={styles.emptyTitle}>No data to display.</h3>
            <p className={styles.emptySubtitle}>Your campaign history will appear here once you start sending.</p>
          </div>
        ) : (
          /* Populated Table */
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Status</th>
                  <th>Send Date</th>
                  <th className={styles.textRight}>Total Sent</th>
                  <th className={styles.textRight}>Unique Opens</th>
                  <th className={styles.textRight}>Click Rate</th>
                  <th className={styles.textRight}>Action</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className={styles.fontBold}>{c.name}</td>
                    <td>
                      <span className={styles.statusActive}>{c.status}</span>
                    </td>
                    <td>{c.date}</td>
                    <td className={styles.textRight}>{c.sent}</td>
                    <td className={styles.textRight}>{c.opens}</td>
                    {/* Added a CTR column since this is the Analytics view */}
                    <td className={styles.textRight}>{c.ctr || '0'}%</td>
                    <td className={styles.textRight}>
                      <button className={styles.actionBtn}>
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;