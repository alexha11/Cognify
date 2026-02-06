'use client';

import { ReactNode, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { AuthPromptModal } from './auth-prompt-modal';
import { Lock } from 'lucide-react';

interface FeatureGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  description?: string;
  variant?: 'blur' | 'hide' | 'prompt';
}

export function FeatureGate({ 
  children, 
  fallback,
  title,
  description,
  variant = 'prompt' 
}: FeatureGateProps) {
  const { user, isLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  if (isLoading) return null;

  // If user is authenticated, show the feature
  if (user) {
    return <>{children}</>;
  }

  // Handle variants for guests
  if (variant === 'hide') {
    return fallback ? <>{fallback}</> : null;
  }

  if (variant === 'blur') {
    return (
      <div className="relative">
        <div className="filter blur-sm pointer-events-none select-none opacity-50">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-6 bg-white/10 dark:bg-black/10 backdrop-blur-[2px]">
          <div className="text-center space-y-4 max-w-sm p-8 rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30">
              <Lock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">{title || 'Premium Feature'}</h3>
              <p className="text-sm text-gray-500">{description || 'Sign in to unlock full access.'}</p>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Sign Up to Unlock
            </button>
          </div>
        </div>
        <AuthPromptModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)} 
          title={title}
          description={description}
        />
      </div>
    );
  }

  // Default: show the modal trigger when children (likely a button) is clicked or just handle the modal
  return (
    <>
      <div onClick={() => setShowModal(true)} className="contents cursor-pointer">
        <div className="pointer-events-none opacity-80grayscale">
          {children}
        </div>
      </div>
      <AuthPromptModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={title}
        description={description}
      />
    </>
  );
}
