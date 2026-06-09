// src/components/auth/SignUp.jsx
import { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
// FIX 1: Add missing Firebase imports needed for Google Sign Up
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase'; // Assuming setup is intact
import styles from './Auth.module.css'; // CSS Modules import

const SignUp = ({ onSwitchView, onAuthSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Firebase success! Trigger main state function to go to dashboard.
      onAuthSuccess();
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError("You're already signed up. Try logging in.");
      } else {
        setError("Sign up failed. Please check your details.");
      }
    }
  };

  // FIX 2: Add the handleGoogleSignup function that was missing
  const handleGoogleSignup = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      console.log("Signed up with Google!");
      // Successful signup, trigger redirect to dashboard
      onAuthSuccess();
    } catch (err) {
      console.error("Google Auth Error:", err.message);
      setError("Google sign up cancelled or failed.");
    }
  };

  return (
    <div className={styles.authCard}>
      <div className={styles.brandHeader}>
        <div className={styles.brandIcon}>S</div>
        <h2 className={styles.brandTitle}>Create an Account</h2>
        <p className={styles.authSubtitle}>Start automating your campaigns today</p>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <form onSubmit={handleSignUp}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Full Name</label>
          <div className={styles.inputWrapper}>
            <User size={18} className={styles.inputIcon} />
            <input 
              type="text" 
              className={styles.formInput} 
              placeholder="Jane Doe" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Email Address</label>
          <div className={styles.inputWrapper}>
            <Mail size={18} className={styles.inputIcon} />
            <input 
              type="email" 
              className={styles.formInput} 
              placeholder="name@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Password</label>
          <div className={styles.inputWrapper}>
            <Lock size={18} className={styles.inputIcon} />
            <input 
              type="password" 
              className={styles.formInput} 
              placeholder="Create a strong password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button type="submit" className={styles.btnPrimary}>Sign Up</button>
        
        {/* FIX 3: Linked the onClick to the handleGoogleSignup function and updated text */}
        <button type="button" className={styles.btnOutline} onClick={handleGoogleSignup}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                 <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
             Sign up with Google
        </button>
      </form>

      <div className={styles.authFooter}>
        <span className={styles.textMuted}>Already have an account? </span>
        <button className={styles.switchLink} onClick={onSwitchView}>Log In</button>
      </div>
    </div>
  );
}

export default SignUp;