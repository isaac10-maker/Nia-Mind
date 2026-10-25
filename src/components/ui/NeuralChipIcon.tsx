import React from 'react';

interface NeuralChipIconProps {
  className?: string;
  variant?: 'blue' | 'green' | 'dual';
}

/**
 * Icône d'Agent IA Nia-Mind : Cerveau interconnecté à une puce d'intelligence
 * avec impulsions lumineuses clignotantes en bleu électrique (#0EA5E9) et vert émeraude (#10B981).
 */
export const NeuralChipIcon: React.FC<NeuralChipIconProps> = ({
  className = 'w-5 h-5',
  variant = 'dual',
}) => {
  const primaryGlow =
    variant === 'green' ? '#10B981' : variant === 'blue' ? '#0EA5E9' : '#0EA5E9';
  const secondaryGlow =
    variant === 'green' ? '#34D399' : variant === 'blue' ? '#38BDF8' : '#10B981';

  return (
    <span className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Halo clignotant bleu/vert autour de la puce */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full animate-ping opacity-35"
        style={{
          background: `radial-gradient(circle, ${primaryGlow} 0%, ${secondaryGlow} 70%, transparent 100%)`,
          animationDuration: '2.4s',
        }}
      />
      <svg
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full drop-shadow-sm"
        aria-hidden="true"
      >
        {/* Broches de la puce d'intelligence */}
        <path
          d="M10 2V5M14 2V5M18 2V5M10 23V26M14 23V26M18 23V26M2 10H5M2 14H5M2 18H5M23 10H26M23 14H26M23 18H26"
          stroke={primaryGlow}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Contour de la puce */}
        <rect
          x="5"
          y="5"
          width="18"
          height="18"
          rx="4.5"
          fill="#0F172A"
          stroke={secondaryGlow}
          strokeWidth="1.8"
        />
        {/* Sillons du cerveau interconnecté au cœur de la puce */}
        <path
          d="M14 8.2C11.5 8.2 9.6 9.8 9.6 12C9.6 13.1 10.1 14 10.9 14.6C10.1 15.2 9.8 16.1 10.1 17.1C10.5 18.4 12 19.3 14 19.3C16 19.3 17.5 18.4 17.9 17.1C18.2 16.1 17.9 15.2 17.1 14.6C17.9 14 18.4 13.1 18.4 12C18.4 9.8 16.5 8.2 14 8.2Z"
          stroke={primaryGlow}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Connexions synaptiques internes */}
        <path
          d="M14 8.5V19M11.2 12.2H16.8M11.5 15.6H16.5"
          stroke={secondaryGlow}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        {/* Nœuds synaptiques clignotants bleu & vert */}
        <circle cx="14" cy="12.2" r="1.6" fill="#0EA5E9" className="animate-pulse" />
        <circle cx="14" cy="15.6" r="1.5" fill="#10B981" className="animate-pulse" />
      </svg>
    </span>
  );
};
