import React, { useState, useEffect } from 'react';
import { 
  User, Lock, CreditCard, Palette, Globe, 
  Database, Trash2, Mail, FileText, Info, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { updateProfile, updatePassword, deleteUser } from 'firebase/auth';
import { auth } from '../../firebase';
import styles from './Settings.module.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const currentUser = auth.currentUser;

  // Account State
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // App Preferences State (Now reads from browser memory on load)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('swoosh-theme') || 'light';
  });
  const [language, setLanguage] = useState('en');

  // Load User Profile
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
    }
  }, [currentUser]);

  // Apply Dark/Light Theme AND save it to browser memory
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('swoosh-theme', theme);
  }, [theme]);

  // --- 1. ACCOUNT & PROFILE LOGIC ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await updateProfile(currentUser, { displayName: displayName });
      alert("Profile name updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile.");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentUser || !newPassword) return;
    try {
      await updatePassword(currentUser, newPassword);
      setNewPassword('');
      alert("Password updated successfully!");
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        alert("Security Requirement: Please log out and log back in before changing your password.");
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  };

  // --- 2. PREFERENCES LOGIC ---
  const handleThemeChange = (e) => {
    setTheme(e.target.value);
  };

  // --- 3. PRIVACY & DATA LOGIC ---
  const handleClearCache = () => {
    if (window.confirm("Are you sure you want to clear local cache? You will need to reload the page.")) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "CRITICAL WARNING: This will permanently delete your Swoosh account, all recipient lists, and campaign histories. This action CANNOT be undone. Proceed?"
    );
    if (!confirmDelete || !currentUser) return;

    try {
      await deleteUser(currentUser);
      alert("Account successfully deleted. We are sorry to see you go.");
    } catch (error) {
      if (error.code === 'auth/requires-recent-login') {
        alert("Security Requirement: To permanently delete your account, please log out and log back in right now to verify your identity, then try again.");
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  };

  // --- RENDER HELPERS ---
  const renderAccountTab = () => (
    <div className={styles.contentArea}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}><User size={20} /> Profile Management</h3>
        <form onSubmit={handleUpdateProfile}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Display Name</label>
            <input 
              type="text" 
              className={styles.input} 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g., Jane Doe"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Account Email (Cannot be changed)</label>
            <input type="email" className={styles.input} value={currentUser?.email || ''} disabled style={{ backgroundColor: 'var(--bg-main)', cursor: 'not-allowed' }} />
          </div>
          <button type="submit" className={styles.btnPrimary}>Save Profile Changes</button>
        </form>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}><Lock size={20} /> Security & Login</h3>
        <form onSubmit={handleUpdatePassword}>
          <div className={styles.formGroup}>
            <label className={styles.label}>New Password</label>
            <input 
              type="password" 
              className={styles.input} 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter a strong new password"
              minLength="6"
              required
            />
          </div>
          <button type="submit" className={styles.btnPrimary}>Update Password</button>
        </form>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}><CreditCard size={20} /> Billing & Subscription</h3>
        <div className={styles.emptyState}>
          Billing and invoice management will be available in the next major update. You are currently on the Free Developer Tier.
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className={styles.contentArea}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}><Palette size={20} /> Personalization</h3>
        <div className={styles.formGroup}>
          <label className={styles.label}>Interface Theme</label>
          <select className={styles.selectInput} value={theme} onChange={handleThemeChange}>
            <option value="light">Light Mode (Default)</option>
            <option value="dark">Dark Mode</option>
          </select>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}><Globe size={20} /> Language Options</h3>
        <div className={styles.formGroup}>
          <label className={styles.label}>Current Display Language</label>
          <select className={styles.selectInput} value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English (UK/US)</option>
            <option value="sw">Swahili (Kenya) - Coming Soon</option>
            <option value="fr">French - Coming Soon</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className={styles.contentArea}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}><Database size={20} /> Local Data Management</h3>
        <p className={styles.subtitle} style={{ marginBottom: '15px' }}>
          Swoosh stores temporary data in your browser to load faster. Clearing this won't delete your contacts or campaigns.
        </p>
        <button onClick={handleClearCache} className={styles.btnOutline}>Clear Local Cache & Storage</button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle} style={{ color: '#ef4444' }}><ShieldAlert size={20} /> Danger Zone</h3>
        <p className={styles.subtitle} style={{ marginBottom: '15px' }}>
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button onClick={handleDeleteAccount} className={styles.btnDanger}><Trash2 size={18}/> Permanently Delete Account</button>
      </div>
    </div>
  );

  const renderHelpTab = () => (
    <div className={styles.contentArea}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}><Mail size={20} /> Support Center</h3>
        <p className={styles.subtitle} style={{ marginBottom: '15px' }}>
          Facing an issue with your email queues or need help managing your lists? Reach out to our engineering team directly.
        </p>
        <a 
          href="mailto:kuria5614@gmail.com?subject=Swoosh%20Support%20Request" 
          className={styles.btnPrimary} 
          style={{ textDecoration: 'none' }}
        >
          Contact Support
        </a>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}><FileText size={20} /> Legal & Compliance</h3>
        
        <label className={styles.label}>Privacy Policy (Kenya DPA Compliant)</label>
        <div className={styles.legalBox}>
          <strong>Swoosh Privacy Policy</strong><br/>
          <em>Effective Date: June 2026</em>
          <h4>1. Introduction</h4>
          This Privacy Policy explains how Swoosh ("we," "us," or "our") collects, uses, and safeguards your personal data. We are committed to complying with universal privacy standards and the Kenya Data Protection Act, 2019 (KDPA).
          <h4>2. Data Collection & Processing</h4>
          We process personal data (such as emails and names) strictly for the provision of our email orchestration services. As a user, you act as the Data Controller for your recipients' data, and Swoosh acts as the Data Processor.
          <h4>3. Lawful Basis for Processing</h4>
          Under Section 30 of the KDPA, we process data based on your consent upon registration, and for the fulfillment of our service contract.
          <h4>4. Your Rights</h4>
          You have the right to access, rectify, or request the erasure of your personal data at any time via the "Privacy & Data" tab in these settings.
        </div>

        <label className={styles.label}>Terms of Service</label>
        <div className={styles.legalBox}>
          <strong>Swoosh Terms of Service</strong><br/>
          <h4>1. Usage Limitations</h4>
          Swoosh provides bulk email orchestration. Users must not utilize the platform to send unsolicited spam, malicious software, or content violating local or international laws.
          <h4>2. Third-Party Integrations</h4>
          Swoosh utilizes third-party infrastructure (e.g., Brevo, Firebase) to process queues. Service availability is subject to the uptime of these providers.
          <h4>3. Termination</h4>
          We reserve the right to suspend accounts found violating anti-spam policies or exceeding rate limits abusively.
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}><Info size={20} /> About</h3>
        <div style={{ background: 'var(--bg-main)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: '600' }}>App Version</span>
            <span style={{ color: 'var(--text-muted)' }}>Build 1.0.4 (V2 Orchestrator)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <span style={{ fontWeight: '600' }}>Developer Credits</span>
            <span style={{ color: 'var(--text-muted)' }}>Samuel Wanyenji Kuria</span>
          </div>
          <div style={{ height: '1px', background: 'var(--border-color)', margin: '15px 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>© 2026 Swoosh Campaigns. All rights reserved.</span>
            <button onClick={() => alert("Swoosh is up to date!")} className={styles.btnOutline} style={{ padding: '6px 12px', fontSize: '12px' }}>
              <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '4px' }}/> Check for Updates
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.mainContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>System Settings</h2>
        <p className={styles.subtitle}>Manage your account, preferences, and data security.</p>
      </div>

      <div className={styles.settingsLayout}>
        <div className={styles.sidebar}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'account' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('account')}
          >
            <User size={18} /> Account & Profile
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'preferences' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Palette size={18} /> App Preferences
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'privacy' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <ShieldAlert size={18} /> Privacy & Data
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'help' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('help')}
          >
            <Info size={18} /> Help & About
          </button>
        </div>

        {activeTab === 'account' && renderAccountTab()}
        {activeTab === 'preferences' && renderPreferencesTab()}
        {activeTab === 'privacy' && renderPrivacyTab()}
        {activeTab === 'help' && renderHelpTab()}
      </div>
    </div>
  );
};

export default Settings;