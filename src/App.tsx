import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { ThemeToggle } from './components/ThemeToggle';
import { LandingPage } from './pages/LandingPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ManageProject } from './pages/ManageProject';
import { ResultsView } from './pages/ResultsView';
import { ParticipantView } from './pages/ParticipantView';
import { supabase } from './lib/supabase';
import { Modal } from './components/Modal';
import { Input } from './components/Input';
import { Button } from './components/Button';

type Page = 'landing' | 'admin' | 'manage' | 'results' | 'participant';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [currentProjectId, setCurrentProjectId] = useState<string>('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isJustLoggedOut, setIsJustLoggedOut] = useState(false);

  const navigate = (page: Page, projectId?: string) => {
    setCurrentPage(page);
    if (projectId) {
      setCurrentProjectId(projectId);
    }
  };

  const handleParticipantComplete = () => {
    navigate('landing');
  };

  useEffect(() => {
    // Check for shared project link
    const params = new URLSearchParams(window.location.search);
    const sharedProjectId = params.get('project');
    if (sharedProjectId) {
      setCurrentProjectId(sharedProjectId);
      setCurrentPage('participant');
      // Optional: Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordReset(true);
      } else if (event === 'SIGNED_OUT') {
        setIsJustLoggedOut(true);
        setCurrentPage('landing');
        setTimeout(() => setIsJustLoggedOut(false), 2000);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordSuccess(true);
      setTimeout(() => {
        setShowPasswordReset(false);
        setNewPassword('');
        setConfirmPassword('');
        setPasswordSuccess(false);
        setPasswordError('');
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppProvider>
      <div className="relative min-h-screen">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>

        {currentPage === 'landing' && <LandingPage onNavigate={navigate} justLoggedOut={isJustLoggedOut} />}
        {currentPage === 'admin' && <AdminDashboard onNavigate={navigate} />}
        {currentPage === 'manage' && currentProjectId && (
          <ManageProject projectId={currentProjectId} onNavigate={(page) => navigate(page as Page)} />
        )}
        {currentPage === 'results' && currentProjectId && (
          <ResultsView projectId={currentProjectId} onNavigate={(page) => navigate(page as Page)} />
        )}
        {currentPage === 'participant' && currentProjectId && (
          <ParticipantView projectId={currentProjectId} onComplete={handleParticipantComplete} onNavigate={(page) => navigate(page as Page)} />
        )}

        <Modal
          isOpen={showPasswordReset}
          onClose={() => {
            setShowPasswordReset(false);
            setNewPassword('');
            setConfirmPassword('');
            setPasswordError('');
            setPasswordSuccess(false);
          }}
          title="Set New Password"
        >
          {passwordSuccess ? (
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-success-50)', color: 'var(--color-success-600)' }}>
              <p className="font-medium mb-2">Password updated successfully!</p>
              <p className="text-sm">You can now sign in with your new password.</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Enter your new password below.
              </p>
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
              {passwordError && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-error-50)', color: 'var(--color-error-600)' }}>
                  {passwordError}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}
        </Modal>
      </div>
    </AppProvider>
  );
}

export default App;
