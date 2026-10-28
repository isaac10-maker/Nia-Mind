import React from 'react';
import { useApp } from '../../context/AppContext';

interface FloatingPhrase {
  text: string;
  top: string;
  left: string;
  delay: string;
  duration: string;
  tone: 'orange' | 'bordeaux' | 'mixed';
  blurClass: string;
  sizeClass: string;
}

const FLOATING_PHRASES: FloatingPhrase[] = [
  {
    text: '« Tu n’es pas seul(e) à être seul(e) »',
    top: '11%',
    left: '4%',
    delay: '0s',
    duration: '14s',
    tone: 'orange',
    blurClass: 'blur-[0.6px]',
    sizeClass: 'text-xs sm:text-sm',
  },
  {
    text: 'Écouter • Comprendre • Avancer ✺',
    top: '18%',
    left: '74%',
    delay: '-3s',
    duration: '17s',
    tone: 'bordeaux',
    blurClass: 'blur-[0.8px]',
    sizeClass: 'text-xs sm:text-sm',
  },
  {
    text: 'Ici, personne ne te juge',
    top: '36%',
    left: '81%',
    delay: '-6s',
    duration: '15s',
    tone: 'mixed',
    blurClass: 'blur-[1px]',
    sizeClass: 'text-[11px] sm:text-xs',
  },
  {
    text: 'Dépose ce qui te pèse en silence',
    top: '48%',
    left: '3%',
    delay: '-2s',
    duration: '19s',
    tone: 'bordeaux',
    blurClass: 'blur-[0.7px]',
    sizeClass: 'text-xs',
  },
  {
    text: 'Chaque histoire mérite d’être entendue',
    top: '68%',
    left: '72%',
    delay: '-8s',
    duration: '16s',
    tone: 'orange',
    blurClass: 'blur-[0.8px]',
    sizeClass: 'text-xs sm:text-sm',
  },
  {
    text: 'Respire à ton propre rythme',
    top: '79%',
    left: '8%',
    delay: '-5s',
    duration: '18s',
    tone: 'mixed',
    blurClass: 'blur-[1px]',
    sizeClass: 'text-[11px] sm:text-xs',
  },
  {
    text: 'Parler vrai • Sans rôle à jouer',
    top: '27%',
    left: '14%',
    delay: '-9s',
    duration: '20s',
    tone: 'orange',
    blurClass: 'blur-[1.2px]',
    sizeClass: 'text-[11px]',
  },
  {
    text: 'Tes pensées t’appartiennent',
    top: '86%',
    left: '56%',
    delay: '-4s',
    duration: '15s',
    tone: 'bordeaux',
    blurClass: 'blur-[0.9px]',
    sizeClass: 'text-xs',
  },
];

export const AmbientBackground: React.FC = () => {
  const { reducedMotion } = useApp();

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 mix-blend-multiply dark:opacity-[0.82] dark:mix-blend-normal"
        style={{ backgroundImage: "url('/images/hero-reflection.png')" }}
      />

      {/* Symbiose de halos flottants Orange & Bordeaux (non opaques, translucides) */}
      <div
        className={`absolute -top-24 -left-24 w-[32rem] h-[32rem] rounded-full bg-gradient-to-br from-nia-orange/45 via-nia-orange/20 to-transparent blur-3xl ${
          reducedMotion ? '' : 'animate-nia-blob-drift'
        }`}
      />
      <div
        className={`absolute top-[22%] -right-28 w-[34rem] h-[34rem] rounded-full bg-gradient-to-bl from-nia-bordeaux/40 via-nia-bordeaux/18 to-transparent blur-3xl ${
          reducedMotion ? '' : 'animate-nia-blob-drift-reverse'
        }`}
      />
      <div
        className={`absolute -bottom-28 left-[20%] w-[32rem] h-[28rem] rounded-full bg-gradient-to-tr from-nia-orange/30 via-nia-bordeaux/25 to-transparent blur-3xl ${
          reducedMotion ? '' : 'animate-nia-blob-drift'
        }`}
      />

      {/* Anneaux géométriques flottants inspirés de MAMAORA adaptés en Orange & Bordeaux */}
      <div
        className={`hidden md:block absolute top-[14%] right-[8%] w-48 h-48 rounded-[38%_62%_63%_37%/41%_44%_56%_59%] border-2 border-nia-orange/20 dark:border-nia-orange/25 ${
          reducedMotion ? '' : 'animate-nia-morph'
        }`}
      />
      <div
        className={`hidden md:block absolute bottom-[12%] left-[5%] w-36 h-36 rounded-[62%_38%_37%_63%/56%_59%_41%_44%] border-2 border-nia-bordeaux/20 dark:border-nia-bordeaux/35 ${
          reducedMotion ? '' : 'animate-nia-morph-slow'
        }`}
      />

      {/* Trame glitch subtile en arrière-plan */}
      <div className="absolute inset-0 nia-ambient-grid opacity-25 dark:opacity-15" />
      <div className="nia-space-stars absolute inset-0" />

      {/* Tags flottants floutés et légèrement glitchés avec mots-liens de la niche Nia-Mind */}
      {FLOATING_PHRASES.map((item, idx) => {
        const badgeStyles =
          item.tone === 'orange'
            ? 'bg-nia-orange/12 dark:bg-nia-orange/15 border-nia-orange/30 text-nia-orange-deep dark:text-orange-300 nia-float-shadow'
            : item.tone === 'bordeaux'
            ? 'bg-nia-bordeaux/12 dark:bg-nia-bordeaux/25 border-nia-bordeaux/30 text-nia-bordeaux dark:text-rose-200 shadow-[-2px_0_0_rgba(249,115,22,0.25),2px_0_0_rgba(127,29,63,0.25)]'
            : 'bg-gradient-to-r from-nia-orange/12 to-nia-bordeaux/15 dark:from-nia-orange/20 dark:to-nia-bordeaux/30 border-nia-orange/25 text-nia-gray-dark dark:text-amber-200';

        return (
          <div
            key={idx}
            style={{
              top: item.top,
              left: item.left,
              animationDelay: item.delay,
              animationDuration: item.duration,
            }}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border backdrop-blur-md font-bold tracking-wide opacity-75 dark:opacity-70 ${
              item.blurClass
            } ${item.sizeClass} ${badgeStyles} ${
              reducedMotion ? '' : 'animate-nia-float-tag'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-nia-orange shrink-0" />
            <span>{item.text}</span>
          </div>
        );
      })}
    </div>
  );
};
