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
  const iconDimensions =
    size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';
  const titleSize =
    size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-nia-orange rounded-2xl"
      aria-label="Nia-Mind — Le vrai sans le masque"
    >
      {/* Logo officiel PNG Nia-Mind (Œil lumineux & cerveau) dans un médaillon harmonisé Orange/Bordeaux/Bleu */}
      <div
        className={`${iconDimensions} relative flex items-center justify-center rounded-2xl p-[2px] bg-gradient-to-tr from-sky-500 via-nia-bordeaux to-nia-orange shadow-md transition-transform duration-300 group-hover:scale-105 overflow-hidden`}
      >
        <img
          src="/images/nia-mind-logo.png"
          alt="Logo officiel Nia-Mind"
          className="w-full h-full object-cover rounded-[14px] bg-black"
          loading="eager"
        />
      </div>

      <div className="flex flex-col leading-tight">
        <div className={`font-black tracking-tight ${titleSize} flex items-center`}>
          <GlitchText
            text="Nia"
            className="text-sky-600 dark:text-sky-400"
            occasionalIntervalMs={16000}
          />
          <span className="text-nia-bordeaux dark:text-amber-300 mx-0.5">-</span>
          <GlitchText
            text="Mind"
            className="text-nia-orange dark:text-nia-orange"
            occasionalIntervalMs={16000}
          />
        </div>
        {showSlogan && (
          <span className="text-[11px] font-bold text-nia-bordeaux dark:text-amber-200/90 tracking-wide">
            {OFFICIAL_SLOGAN}
          </span>
        )}
      </div>
    </Link>
  );
};
