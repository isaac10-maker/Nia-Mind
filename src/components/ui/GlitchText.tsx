import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translatePlatformText } from '../../lib/i18nEngine';

interface GlitchTextProps {
  text: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'div';
  className?: string;
  occasionalIntervalMs?: number;
}

export const GlitchText: React.FC<GlitchTextProps> = ({
  text,
  as: Tag = 'span',
  className = '',
  occasionalIntervalMs = 15000,
}) => {
  const { reducedMotion, currentLanguage } = useApp();
  const [isGlitching, setIsGlitching] = useState(false);
  const translatedText = translatePlatformText(text, currentLanguage);

  useEffect(() => {
    if (reducedMotion) {
      setIsGlitching(false);
      return;
    }

    // Apparition très courte à l'arrivée sur la page
    const initialTimer = setTimeout(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 550);
    }, 220);

    // Déclenchement occasionnel, non permanent
    let intervalTimer: ReturnType<typeof setInterval> | null = null;
    if (occasionalIntervalMs > 0) {
      intervalTimer = setInterval(() => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 550);
      }, occasionalIntervalMs);
    }

    return () => {
      clearTimeout(initialTimer);
      if (intervalTimer) clearInterval(intervalTimer);
    };
  }, [reducedMotion, occasionalIntervalMs]);

  return (
    <Tag
      className={`nia-glitch ${isGlitching ? 'is-glitching' : ''} ${className}`}
      data-text={translatedText}
    >
      {translatedText}
    </Tag>
  );
};
