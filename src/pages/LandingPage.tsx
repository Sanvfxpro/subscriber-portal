import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { AuthModal } from '../components/AuthModal';
import { BarChart3 } from 'lucide-react';

import { supabase } from '../lib/supabase';
import loginBg from '../assets/login-bg.jpg';

export const LandingPage: React.FC<{
  onNavigate: (page: string, projectId?: string) => void;
  justLoggedOut?: boolean;
}> = ({
  onNavigate,
  justLoggedOut = false,
}) => {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [enableSignup, setEnableSignup] = useState(true);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleOpenLogin = () => {
      setAuthMode('login');
      setIsAuthModalOpen(true);
    };

    const handleOpenSignup = () => {
      setAuthMode('signup');
      setIsAuthModalOpen(true);
    };

    const handleAuthSuccess = (userId: string, email: string) => {
      setIsAuthModalOpen(false);
      onNavigate('admin');
    };

    useEffect(() => {
      const checkAuthStatus = async () => {
        // synchronously capture URL params before async auth check
        const urlParams = new URLSearchParams(window.location.search);
        const projectIdRaw = urlParams.get('project');

        const { data: { user } } = await supabase.auth.getUser();
        const isAuthenticated = !!user;
        setIsLoggedIn(isAuthenticated);

        // Use captured param
        if (projectIdRaw) {
          onNavigate('participant', projectIdRaw);
        }
      };

      const fetchSignupSetting = async () => {
        try {
          const { data, error } = await supabase
            .from('app_settings')
            .select('setting_value')
            .eq('setting_key', 'enable_signup')
            .maybeSingle();

          if (error) {
            console.error('Error fetching signup setting:', error);
            setSettingsLoaded(true);
            return;
          }

          if (data) {
            setEnableSignup(data.setting_value === true);
          }
          setSettingsLoaded(true);
        } catch (error) {
          console.error('Error fetching signup setting:', error);
          setSettingsLoaded(true);
        }
      };

      checkAuthStatus();
      fetchSignupSetting();

      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        const isAuthenticated = !!session;
        setIsLoggedIn(isAuthenticated);

        // Check for project param to prioritize participant flow
        const urlParams = new URLSearchParams(window.location.search);
        const projectIdRaw = urlParams.get('project');
        const skipRedirect = urlParams.get('skip_redirect') === 'true';

        if (event === 'SIGNED_IN' && isAuthenticated && !projectIdRaw && !skipRedirect) {
          onNavigate('admin');
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }, [onNavigate]);

    return (
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundColor: 'var(--color-bg-secondary)' // Fallback
        }}
      >
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
              Card Sorting Studies
            </h1>
            <p className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>
              Organize information architecture through collaborative card sorting
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card className="p-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full mb-6 mx-auto" style={{ backgroundColor: 'var(--color-primary-50)' }}>
                <BarChart3 size={32} style={{ color: 'var(--color-primary-600)' }} />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: 'var(--color-text-primary)' }}>
                Administrator Access
              </h2>
              <p className="mb-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                Create and manage card sorting projects
              </p>
              <div className="space-y-3">
                <Button onClick={isLoggedIn ? () => onNavigate('admin') : handleOpenLogin} className="w-full">
                  {isLoggedIn ? 'Go to Dashboard' : 'Admin Login'}
                </Button>
                {settingsLoaded && enableSignup && !isLoggedIn && (
                  <Button onClick={handleOpenSignup} variant="secondary" className="w-full">
                    Sign Up
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
          initialMode={authMode}
          enableSignup={enableSignup}
        />
      </div>
    );
  };
