import React from 'react';
import { Link } from 'react-router-dom';
import { GlitchText } from './GlitchText';
import { OFFICIAL_SLOGAN } from '../../lib/securityEngine';

interface BrandLogoProps {
  showSlogan?: boolean;
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  variant?: 'default' | 'header-orange';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  showSlogan = false,
  size = 'md',
  to = '/',
  variant = 'default',
}) => {
  const iconDimensions =
    size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';
  const titleSize =
    size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  const isOrangeHeader = variant === 'header-orange';

  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-2.5 sm:gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-2xl"
      aria-label="Nia-Mind — Le vrai sans le masque"
    >
      {/* Logo officiel PNG Nia-Mind (Œil lumineux & cerveau) dans un médaillon harmonisé */}
      <div
        className={`${iconDimensions} relative flex items-center justify-center rounded-2xl p-[2px] ${
          isOrangeHeader
            ? 'bg-gradient-to-tr from-sky-300 via-white to-amber-200 shadow-lg'
            : 'bg-gradient-to-tr from-sky-500 via-nia-bordeaux to-nia-orange shadow-md'
        } transition-transform duration-300 group-hover:scale-105 overflow-hidden shrink-0`}
      >
        <img
          src="/images/nia-mind-logo.png"
          alt="Logo officiel Nia-Mind"
          className="w-full h-full object-cover rounded-[14px] bg-black"
          loading="eager"
        />
      </div>

      <div className="flex flex-col leading-tight">
        <div
          className={`font-black tracking-tight ${titleSize} flex items-center ${
            isOrangeHeader ? 'drop-shadow-sm' : ''
          }`}
        >
          <GlitchText
            text="Nia"
            className={
              isOrangeHeader
                ? 'text-sky-200'
                : 'text-sky-600 dark:text-sky-400'
            }
            occasionalIntervalMs={16000}
          />
          <span
            className={
              isOrangeHeader
                ? 'text-amber-200 mx-0.5'
                : 'text-nia-bordeaux dark:text-amber-300 mx-0.5'
            }
          >
            -
          </span>
          <GlitchText
            text="Mind"
            className={
              isOrangeHeader
                ? 'text-white'
                : 'text-nia-orange dark:text-nia-orange'
            }
            occasionalIntervalMs={16000}
          />
        </div>
        {showSlogan && (
          <span
            className={`text-[10px] sm:text-[11px] font-extrabold tracking-wide ${
              isOrangeHeader
                ? 'text-amber-100/95'
                : 'text-nia-bordeaux dark:text-amber-200/90'
            }`}
          >
            <GlitchText text={`« ${OFFICIAL_SLOGAN} »`} occasionalIntervalMs={14000} />
          </span>
        )}
      </div>
    </Link>
  );
};
