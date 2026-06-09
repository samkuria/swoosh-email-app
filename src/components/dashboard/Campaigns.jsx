import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Send, Pause, Play, Trash2, Paperclip, FileText, MailCheck } from 'lucide-react';
import { ref, onValue, push, remove, update, get } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db } from '../../firebase';
import styles from './MainContent.module.css';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  
  // New states for PDF upload tracking
  const [pdfName, setPdfName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  const [isSending, setIsSending] = useState(false);
  
  const fileInputRef = useRef(null);
  const currentUser = auth.currentUser;

  // 1. Fetch Campaigns List
  useEffect(() => {
    if (!currentUser) return;
    const campaignsRef = ref(db, `users/${currentUser.uid}/campaigns`);
    const unsubscribe = onValue(campaignsRef, (snapshot) => {
      const data = snapshot.val();
      setCampaigns(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 2. Fetch Recipients List (Needed to match targets for active campaigns)
  useEffect(() => {
    if (!currentUser) return;
    const recipientsRef = ref(db, `users/${currentUser.uid}/recipients`);
    const unsubscribe = onValue(recipientsRef, (snapshot) => {
      const data = snapshot.val();
      setRecipients(data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : []);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const loadCampaign = (c) => {
    setSubject(c.name);
    setBody(c.content || '');
    setPdfUrl(c.pdfUrl || null);
    setPdfName(c.pdfUrl ? 'Attached Document' : ''); // Show generic name for older campaigns
  };

  // Improved PDF Attachment Handler
  const handleAttachPDF = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    
    try {
      const storage = getStorage();
      const fileRef = storageRef(storage, `campaigns/${currentUser.uid}/${Date.now()}_${file.name}`);
      
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      
      setPdfUrl(url);
      setPdfName(file.name);
      
    } catch (error) {
      console.error("Firebase Storage Error:", error);
      alert(`Failed to upload PDF: ${error.message}. (Check your Firebase Storage rules!)`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateCampaign = (e) => {
    e.preventDefault();
    if (!currentUser || !subject) return;
    push(ref(db, `users/${currentUser.uid}/campaigns`), {
      name: subject,
      content: body,
      pdfUrl: pdfUrl,
      status: 'Pending',
      date: new Date().toLocaleDateString(),
      sent: 0,
      total: 0
    });
    // Reset form states after creating
    setSubject(''); 
    setBody(''); 
    setPdfUrl(null);
    setPdfName('');
  };

  const updateStatus = (id, newStatus) => update(ref(db, `users/${currentUser.uid}/campaigns/${id}`), { status: newStatus });
  const handleDelete = (id) => remove(ref(db, `users/${currentUser.uid}/campaigns/${id}`));

  // 3. MASTER SEND ENGINE
  const handleSendEmails = async () => {
    if (!currentUser || isSending) return;

    const activeCampaign = campaigns.find(c => c.status === 'Active');
    if (!activeCampaign) {
      alert("Please toggle at least one campaign to 'Active' before sending!");
      return;
    }

    if (recipients.length === 0) {
      alert("Your recipients list is empty. Add contacts first!");
      return;
    }

    setIsSending(true);

    try {
      const todayStr = new Date().toLocaleDateString().replace(/\//g, '-');
      const statsRef = ref(db, `users/${currentUser.uid}/stats/${todayStr}`);
      
      const statsSnapshot = await get(statsRef);
      let emailsSentToday = statsSnapshot.exists() ? statsSnapshot.val().sentCount : 0;
      const DAILY_LIMIT = 300;

      if (emailsSentToday >= DAILY_LIMIT) {
        alert("Oops, your daily limit of emails has reached, sending more could lead to flagging as spam. Try Sending The Rest Tomorrow.");
        setIsSending(false);
        return;
      }

      const targetRecipients = recipients.filter(r => {
        return !r.sentCampaigns || !r.sentCampaigns[activeCampaign.id];
      });

      if (targetRecipients.length === 0) {
        alert("All current recipients have already received this active campaign!");
        setIsSending(false);
        return;
      }

      const remainingLimit = DAILY_LIMIT - emailsSentToday;
      let recipientsToProcess = targetRecipients;
      let reachedLimitThreshold = false;

      if (targetRecipients.length > remainingLimit) {
        recipientsToProcess = targetRecipients.slice(0, remainingLimit);
        reachedLimitThreshold = true;
      }

      const updates = {};
      let processCount = 0;

      recipientsToProcess.forEach(recipient => {
        const newQueueRef = push(ref(db, `users/${currentUser.uid}/queue`));
        const queueId = newQueueRef.key;

        updates[`users/${currentUser.uid}/queue/${queueId}`] = {
          name: activeCampaign.name,
          content: activeCampaign.content,
          recipientEmail: recipient.email,
          campaignId: activeCampaign.id,
          pdfUrl: activeCampaign.pdfUrl || null
        };

        updates[`users/${currentUser.uid}/recipients/${recipient.id}/sentCampaigns/${activeCampaign.id}`] = 'Sent';
        updates[`users/${currentUser.uid}/recipients/${recipient.id}/status`] = 'Sent';
        
        processCount++;
      });

      updates[`users/${currentUser.uid}/stats/${todayStr}/sentCount`] = emailsSentToday + processCount;
      updates[`users/${currentUser.uid}/campaigns/${activeCampaign.id}/sent`] = (activeCampaign.sent || 0) + processCount;
      updates[`users/${currentUser.uid}/campaigns/${activeCampaign.id}/total`] = recipients.length;

      await update(ref(db), updates);

      if (reachedLimitThreshold) {
        alert("Oops, your daily limit of emails has reached, sending more could lead to flagging as spam. Try Sending The Rest Tomorrow.");
      } else {
        alert(`Successfully queued ${processCount} emails into the processing engine!`);
      }

    } catch (error) {
      console.error("Error running send processing orchestrator:", error);
      alert("Failed to queue messages. Review console logs.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>Campaign Orchestration</h2>
          <p className={styles.emptySubtitle}>Draft, queue, and manage your email marketing efforts.</p>
        </div>
      </div>

      <div className={styles.contentGrid} style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <div className={styles.actionsCard}>
          <h3 className={styles.cardTitle} style={{ marginBottom: '15px' }}>Campaign Composer</h3>
          <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Campaign Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={styles.formInput} required />
            <div style={{ height: '300px', marginBottom: '40px' }}>
              <ReactQuill theme="snow" value={body} onChange={setBody} placeholder="Write your email content here..." style={{ height: '250px' }} />
            </div>
            <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleAttachPDF} style={{ display: 'none' }} />
            
            {/* Updated Buttons Area */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className={styles.btnOutline} 
                onClick={() => fileInputRef.current.click()}
                disabled={isUploading}
                style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                <Paperclip size={18} /> 
                {isUploading ? 'Uploading...' : (pdfName || 'Attach PDF')}
              </button>
              
              <button 
                type="submit" 
                className={styles.btnPrimary} 
                style={{ flex: 1 }}
                disabled={isUploading}
              >
                <Send size={18} /> Queue Campaign
              </button>
            </div>
          </form>

          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '25px 0' }}></div>
          <button 
            type="button" 
            className={styles.btnPrimary} 
            onClick={handleSendEmails} 
            disabled={isSending || isUploading}
            style={{ width: '100%', padding: '14px', backgroundColor: '#10b981', justifyContent: 'center', fontSize: '15px' }}
          >
            <MailCheck size={20} /> {isSending ? 'Queuing Messages...' : 'Send Active Campaign Emails'}
          </button>
        </div>

        <div className={styles.tableCard}>
          <h3 className={styles.cardTitle} style={{ marginBottom: '20px' }}>Active Queue</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Status</th>
                  <th className={styles.textRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} onClick={() => loadCampaign(c)} style={{ cursor: 'pointer' }}>
                    <td className={styles.fontBold}>{c.name} {c.pdfUrl && <FileText size={12} />}</td>
                    <td>
                      <span className={`${styles.badge} ${c.status === 'Active' ? styles.statusActive : ''}`}>{c.status}</span>
                    </td>
                    <td className={styles.textRight} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {c.status === 'Active' ? (
                        <button onClick={(e) => { e.stopPropagation(); updateStatus(c.id, 'Paused'); }} className={styles.actionBtn}><Pause size={16} /></button>
                      ) : (
                        <button onClick={(e) => { e.stopPropagation(); updateStatus(c.id, 'Active'); }} className={styles.actionBtn}><Play size={16} /></button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className={styles.actionBtn}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;