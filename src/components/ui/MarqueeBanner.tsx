import React from 'react';
import { Sparkles } from 'lucide-react';

const BANNER_WORDS = [
  'Écoute',
  'Franchise',
  'Réflexion',
  'Bien-être',
  'Authenticité',
];

export const MarqueeBanner: React.FC = () => {
  const repeated = [...BANNER_WORDS, ...BANNER_WORDS, ...BANNER_WORDS, ...BANNER_WORDS];

  return (
    <section
      aria-label="Valeurs fondamentales Nia-Mind"
      className="relative overflow-hidden border-y border-nia-gray-light dark:border-nia-border-dark bg-gradient-to-r from-nia-bordeaux-dark via-nia-bordeaux to-nia-orange-deep py-3.5 text-white select-none"
    >
      <div className="animate-nia-marquee flex items-center gap-10 whitespace-nowrap">
        {repeated.map((word, idx) => (
          <div key={`${word}-${idx}`} className="inline-flex items-center gap-4">
            <span className="text-sm sm:text-base font-bold tracking-wider uppercase text-white/95">
              {word}
            </span>
            <Sparkles className="w-4 h-4 text-nia-orange shrink-0" aria-hidden="true" />
          </div>
        ))}
      </div>
    </section>
  );
};
