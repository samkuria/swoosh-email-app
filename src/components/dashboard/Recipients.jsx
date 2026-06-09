import React, { useState, useEffect, useRef } from 'react';
import { Users, Trash2, PlusCircle, FileUp } from 'lucide-react';
import { ref, onValue, push, remove } from 'firebase/database';
import { auth, db } from '../../firebase';
import styles from './MainContent.module.css';

const Recipients = () => {
  const [recipients, setRecipients] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  
  // Create a reference to the hidden file input
  const fileInputRef = useRef(null);
  const currentUser = auth.currentUser;

  // 1. FETCH LIVE RECIPIENT DATA (With Error Handling)
  useEffect(() => {
    if (!currentUser) {
      console.warn("No current user found yet.");
      return;
    }

    const recipientsRef = ref(db, `users/${currentUser.uid}/recipients`);
    
    // Added the error callback function at the end of onValue
    const unsubscribe = onValue(recipientsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setRecipients(list);
      } else {
        setRecipients([]);
      }
    }, (error) => {
      console.error("Firebase Read Error:", error);
      alert(`Read Error: ${error.message}`); // Pops up if rules block you
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 2. ADD A SINGLE NEW RECIPIENT (With Error Handling)
  const handleAddRecipient = (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Error: You must be logged in to add recipients.");
      return;
    }
    if (!newEmail) return;

    const newRecipient = {
      name: newName || 'Unknown',
      email: newEmail,
      dateAdded: new Date().toLocaleDateString(),
      status: 'Subscribed'
    };

    const recipientsRef = ref(db, `users/${currentUser.uid}/recipients`);
    
    // Added .then() and .catch() to trace exactly what Firebase does
    push(recipientsRef, newRecipient)
      .then(() => {
        console.log("Recipient added successfully!");
        setNewEmail('');
        setNewName('');
      })
      .catch((error) => {
        console.error("Firebase Write Error:", error);
        alert(`Write Error: ${error.message}`); // Pops up if rules block you
      });
  };

  // 3. PARSE AND UPLOAD CSV SPREADSHEET (With Error Handling)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rows = text.split('\n');

      let addedCount = 0;
      let errorCount = 0;

      // Start at index 1 to skip the header row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(',').map(item => item.trim().replace('\r', ''));
        
        if (row.length >= 2 && row[1]) {
          const name = row[0];
          const email = row[1];

          const newRecipient = {
            name: name || 'Unknown',
            email: email,
            dateAdded: new Date().toLocaleDateString(),
            status: 'Subscribed'
          };
          
          const recipientsRef = ref(db, `users/${currentUser.uid}/recipients`);
          
          // Added a lightweight catch block to prevent the loop from crashing
          push(recipientsRef, newRecipient).catch(err => {
            console.error("Import item failed:", err);
            errorCount++;
          });
          
          addedCount++;
        }
      }

      if (errorCount > 0) {
        alert(`Imported ${addedCount} contacts, but ${errorCount} failed due to permissions.`);
      } else {
        alert(`Successfully imported ${addedCount} contacts!`);
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  // 4. DELETE A RECIPIENT
  const handleDelete = (id) => {
    if (!currentUser) return;
    const itemRef = ref(db, `users/${currentUser.uid}/recipients/${id}`);
    
    // Added catch here as well for safety
    remove(itemRef).catch(err => {
      console.error("Firebase Delete Error:", err);
      alert(`Delete Error: ${err.message}`);
    });
  };

  return (
    <div className={styles.mainContainer}>
      
      <div className={styles.cardHeader} style={{ marginBottom: '10px' }}>
        <div>
          <h2 className={styles.cardTitle}>Audience & Recipients</h2>
          <p className={styles.emptySubtitle}>Manage your email lists and contacts.</p>
        </div>
      </div>

      <div className={styles.contentGrid} style={{ gridTemplateColumns: '1fr 3fr' }}>
        
        {/* Left Side: Add & Import Contacts */}
        <div className={styles.actionsCard} style={{ alignSelf: 'start' }}>
          
          <h3 className={styles.cardTitle} style={{ marginBottom: '20px' }}>Add Single Contact</h3>
          <form onSubmit={handleAddRecipient} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '5px', color: 'var(--text-main)' }}>Full Name</label>
              <input 
                type="text" 
                placeholder="Jane Doe" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '5px', color: 'var(--text-main)' }}>Email Address *</label>
              <input 
                type="email" 
                placeholder="jane@example.com" 
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              />
            </div>
            <button type="submit" className={styles.btnPrimary} style={{ marginTop: '10px', justifyContent: 'center' }}>
              <PlusCircle size={18} />
              Add to List
            </button>
          </form>

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '25px 0' }}></div>

          <h3 className={styles.cardTitle} style={{ marginBottom: '15px' }}>Bulk Import</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '15px' }}>
            Upload a .csv file with two columns: <b>Name</b> and <b>Email</b>.
          </p>
          
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: 'none' }} 
          />
          
          <button 
            type="button" 
            className={styles.btnOutline} 
            onClick={() => fileInputRef.current.click()} 
            style={{ width: '100%' }}
          >
            <FileUp size={18} />
            Import CSV File
          </button>

        </div>

        {/* Right Side: The Data Table */}
        <div className={styles.tableCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Active Recipients</h3>
            <span className={styles.badge}>Total: {recipients.length}</span>
          </div>

          {recipients.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIconWrapper}>
                <Users size={32} className={styles.emptyIcon} />
              </div>
              <h3 className={styles.emptyTitle}>Your list is empty.</h3>
              <p className={styles.emptySubtitle}>Use the form on the left to add or import recipients.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Date Added</th>
                    <th>Status</th>
                    <th className={styles.textRight}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r) => (
                    <tr key={r.id}>
                      <td className={styles.fontBold}>{r.name}</td>
                      <td>{r.email}</td>
                      <td>{r.dateAdded}</td>
                      <td>
                        <span className={r.status === 'Sent' ? styles.statusActive : styles.badge}>
                          {r.status || 'Pending'}
                        </span>
                      </td>
                      <td className={styles.textRight}>
                        <button 
                          className={styles.actionBtn} 
                          onClick={() => handleDelete(r.id)}
                          title="Remove Recipient"
                        >
                          <Trash2 size={16} color="var(--status-error)" />
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
    </div>
  );
};

export default Recipients;