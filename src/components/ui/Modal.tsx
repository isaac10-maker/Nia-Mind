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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nia-modal-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full ${maxWidthClass} max-h-[90vh] flex flex-col animate-nia-modal rounded-3xl nia-solid-surface border-2 border-[#0F9F6E]/35 shadow-2xl overflow-hidden my-auto`}
      >
        {/* Barre supérieure d'accentuation Orange & Bordeaux */}
        <div
          className={`h-2 w-full shrink-0 ${
            accent === 'orange'
              ? 'bg-gradient-to-r from-nia-orange via-nia-orange-deep to-nia-bordeaux'
              : 'bg-gradient-to-r from-nia-bordeaux via-nia-bordeaux-dark to-nia-orange'
          }`}
        />

        {/* En-tête fixe avec bouton croix (X) toujours visible */}
        <div className="px-6 pt-5 pb-3 flex items-start justify-between gap-4 border-b border-nia-orange/15 dark:border-white/10 shrink-0">
          <div className="pr-2">
            {badgeText && (
              <span
                className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-extrabold mb-1.5 ${
                  accent === 'orange'
                    ? 'bg-nia-orange/20 text-nia-orange-deep dark:text-nia-orange'
                    : 'bg-nia-bordeaux/20 text-nia-bordeaux dark:text-pink-300'
                }`}
              >
                {badgeText}
              </span>
            )}
            <h3
              id="nia-modal-title"
              className="text-lg sm:text-xl font-extrabold text-nia-gray-dark dark:text-nia-text-dark leading-snug"
            >
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-xs sm:text-sm text-nia-gray-mid dark:text-gray-300">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Fermer (Échap)"
            aria-label="Fermer la fenêtre"
            className="w-9 h-9 rounded-full inline-flex items-center justify-center bg-nia-bordeaux/15 hover:bg-nia-bordeaux text-nia-bordeaux dark:text-rose-200 hover:text-white border border-nia-bordeaux/30 transition-all shrink-0 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps défilable proprement sur tous les écrans */}
        <div className="px-6 py-4 overflow-y-auto text-sm text-nia-gray-dark dark:text-gray-200 leading-relaxed space-y-4">
          {children}
        </div>

        {/* Pied de modale fixe */}
        {footer && (
          <div className="px-6 py-4 bg-white/50 dark:bg-black/25 border-t border-nia-orange/15 dark:border-nia-border-dark flex flex-wrap items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
