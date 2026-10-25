import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badgeText?: string;
  accent?: 'orange' | 'bordeaux';
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badgeText,
  accent = 'orange',
  children,
  footer,
  maxWidthClass = 'max-w-lg',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nia-modal-title"
    >
      <div
        className={`w-full ${maxWidthClass} animate-nia-modal rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark shadow-2xl overflow-hidden`}
      >
        {/* Barre supérieure d'accentuation Orange & Bordeaux */}
        <div
          className={`h-1.5 w-full ${
            accent === 'orange'
              ? 'bg-gradient-to-r from-nia-orange via-nia-orange-deep to-nia-bordeaux'
              : 'bg-gradient-to-r from-nia-bordeaux via-nia-bordeaux-dark to-nia-orange'
          }`}
        />

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              {badgeText && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 ${
                    accent === 'orange'
                      ? 'bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange'
                      : 'bg-nia-bordeaux/15 text-nia-bordeaux dark:text-pink-300'
                  }`}
                >
                  {badgeText}
                </span>
              )}
              <h3
                id="nia-modal-title"
                className="text-xl font-bold text-nia-gray-dark dark:text-nia-text-dark"
              >
                {title}
              </h3>
              {subtitle && (
                <p className="mt-1 text-sm text-nia-gray-mid dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-nia-gray-mid hover:text-nia-gray-dark dark:text-gray-400 dark:hover:text-white hover:bg-nia-gray-light/50 dark:hover:bg-nia-border-dark/50 transition-colors"
              aria-label="Fermer la fenêtre"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 text-sm text-nia-gray-dark dark:text-gray-200 leading-relaxed">
            {children}
          </div>

          {footer && (
            <div className="mt-6 pt-4 border-t border-nia-gray-light dark:border-nia-border-dark flex flex-wrap items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
