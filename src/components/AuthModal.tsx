import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userId: string, email: string) => void;
  initialMode?: 'login' | 'signup';
  enableSignup?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, initialMode = 'login', enableSignup = true }) => {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          await supabase.from('user_profiles').insert({
            id: data.user.id,
            role: 'user',
          });

          onSuccess(data.user.id, email);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          onSuccess(data.user.id, email);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setIsSignUp(initialMode === 'signup');
    setError('');
    setShowForgotPassword(false);
    setResetEmail('');
    setResetSent(false);
    onClose();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);

      if (error) throw error;

      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={showForgotPassword ? 'Reset Password' : (isSignUp ? 'Create Account' : 'Sign In')}>
      {showForgotPassword ? (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          {resetSent ? (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-success-50)', color: 'var(--color-success-600)' }}>
              <p className="font-medium mb-2">Check your email!</p>
              <p className="text-sm">We've sent a password reset link to {resetEmail}. Click the link in the email to set a new password.</p>
            </div>
          ) : (
            <>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <Input
                label="Email Address"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
              />
              {error && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-error-50)', color: 'var(--color-error-600)' }}>
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </>
          )}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetEmail('');
                setResetSent(false);
                setError('');
              }}
              className="text-sm transition-colors"
              style={{ color: 'var(--color-primary-600)' }}
            >
              Back to Sign In
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your.email@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />


        {error && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-error-50)', color: 'var(--color-error-600)' }}>
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
        </Button>

        {!isSignUp && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm transition-colors"
              style={{ color: 'var(--color-primary-600)' }}
            >
              Forgot your password?
            </button>
          </div>
        )}

        {enableSignup && (
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm transition-colors"
              style={{ color: 'var(--color-primary-600)' }}
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        )}
      </form>
      )}
    </Modal>
  );
};
