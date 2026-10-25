import React from 'react';
import { Link } from 'react-router-dom';
import { GlitchText } from './GlitchText';
import { OFFICIAL_SLOGAN } from '../../lib/securityEngine';

interface BrandLogoProps {
  showSlogan?: boolean;
  size?: 'sm' | 'md' | 'lg';
  to?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  showSlogan = false,
  size = 'md',
  to = '/',
}) => {
  const iconDimensions = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const titleSize =
    size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-nia-orange rounded-xl"
      aria-label="Nia-Mind — Le vrai sans le masque"
    >
      {/* Symbole simple, distinctif et reconnaissable : deux arcs d'écoute et de parole sincère */}
      <div
        className={`${iconDimensions} relative flex items-center justify-center rounded-xl bg-gradient-to-br from-nia-orange via-nia-orange-deep to-nia-bordeaux text-white shadow-nia-soft transition-transform duration-300 group-hover:scale-105`}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          className="w-6 h-6"
          aria-hidden="true"
        >
          {/* Cercle d'écoute ouvert */}
          <path
            d="M18 6C11.3726 6 6 11.3726 6 18C6 21.12 7.19 23.96 9.14 26.09L7.8 29.8L11.82 28.34C13.66 29.4 15.76 30 18 30C24.6274 30 30 24.6274 30 18"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Onde intérieure de sincérité ("sans le masque") */}
          <path
            d="M13 18.5C14.4 16.2 16.2 15 18.2 15C20.2 15 21.8 16.2 23.2 18.5C21.8 20.8 20.2 22 18.2 22C16.2 22 14.4 20.8 13 18.5Z"
            stroke="#FFF9F5"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="27.5" cy="9.5" r="2.5" fill="#FFF9F5" />
        </svg>
      </div>

      <div className="flex flex-col leading-tight">
        <div className={`font-extrabold tracking-tight ${titleSize} flex items-center`}>
          <GlitchText
            text="Nia"
            className="text-nia-orange dark:text-nia-orange"
            occasionalIntervalMs={18000}
          />
          <span className="text-nia-bordeaux dark:text-nia-orange-deep mx-0.5">-</span>
          <GlitchText
            text="Mind"
            className="text-nia-gray-dark dark:text-nia-text-dark"
            occasionalIntervalMs={18000}
          />
        </div>
        {showSlogan && (
          <span className="text-[11px] font-medium text-nia-bordeaux dark:text-amber-200/80 tracking-wide">
            {OFFICIAL_SLOGAN}
          </span>
        )}
      </div>
    </Link>
  );
};
