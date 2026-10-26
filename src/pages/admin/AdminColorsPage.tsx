import React, { useEffect, useRef, useState } from 'react';
import { Palette, RotateCcw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  DEFAULT_PALETTE,
  DEFAULT_THEME_PRESET,
  PALETTE_SECTIONS,
  applySitePalette,
  patchPalette,
  type PaletteSection,
} from '../../lib/sitePalette';
import type { SitePalette } from '../../lib/types';

export const AdminColorsPage: React.FC = () => {
  const { siteSettings, updateSiteSettings } = useApp();
  const [sectionId, setSectionId] = useState(PALETTE_SECTIONS[0].id);
  const [draft, setDraft] = useState<SitePalette>(siteSettings.palette || DEFAULT_PALETTE);
  const [savedPulse, setSavedPulse] = useState(false);
  const timer = useRef<number | null>(null);
  const pulseTimer = useRef<number | null>(null);
  const pending = useRef<SitePalette | null>(null);
  const updateRef = useRef(updateSiteSettings);
  updateRef.current = updateSiteSettings;

  useEffect(() => {
    if (!pending.current) setDraft(siteSettings.palette || DEFAULT_PALETTE);
  }, [siteSettings.palette]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
      if (pending.current) {
        updateRef.current(
          {
            palette: pending.current,
            themePreset: 'Palette Personnalisée SuperAdmin',
          },
          { quiet: true }
        );
      }
    },
    []
  );

  const commit = (next: SitePalette, preset = 'Palette Personnalisée SuperAdmin') => {
    setDraft(next);
    applySitePalette(next);
    pending.current = next;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      pending.current = null;
      const result = updateRef.current({ palette: next, themePreset: preset }, { quiet: true });
      if (result.ok) {
        setSavedPulse(true);
        if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
        pulseTimer.current = window.setTimeout(() => setSavedPulse(false), 1200);
      }
    }, 280);
  };

  const section =
    PALETTE_SECTIONS.find((item) => item.id === sectionId) || PALETTE_SECTIONS[0];

  const resetSection = (target: PaletteSection) => {
    const next = { ...draft };
    target.fields.forEach((field) => {
      next[field.key] = DEFAULT_PALETTE[field.key];
    });
    commit(next, target.id === 'marque' ? DEFAULT_THEME_PRESET : 'Palette Personnalisée SuperAdmin');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-nia-orange">
            <Palette className="w-4 h-4" />
            Atelier chromatique
          </span>
          <h1 className="text-2xl font-extrabold text-nia-gray-dark dark:text-white mt-1">
            Couleurs du site
          </h1>
          <p className="text-sm text-nia-gray-mid dark:text-gray-300 mt-1 max-w-2xl">
            Le vert mène, le bordeaux accompagne. Chaque onglet ne change que la zone qu’il nomme :
            marque, en-tête, arrière-plans, textes, espaces et états.
          </p>
        </div>
        <span
          className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
            savedPulse
              ? 'border-nia-orange/40 text-nia-orange bg-nia-orange/10'
              : 'border-nia-gray-light text-nia-gray-mid'
          }`}
        >
          {savedPulse ? 'Appliqué sur tout le site' : siteSettings.themePreset}
        </span>
      </div>

      <div
        className="rounded-2xl overflow-hidden border border-white/20 shadow-nia-soft"
        aria-hidden="true"
      >
        <div
          className="px-4 py-3 text-white text-sm font-extrabold"
          style={{
            backgroundImage: `linear-gradient(to right, ${draft.headerFrom}, ${draft.headerVia}, ${draft.headerTo})`,
          }}
        >
          En-tête
        </div>
        <div
          className="px-4 py-2 text-white text-xs font-bold"
          style={{
            backgroundImage: `linear-gradient(to right, ${draft.announceFrom}, ${draft.announceVia}, ${draft.announceTo})`,
          }}
        >
          Conseils & Motivation du Jour
        </div>
        <div
          className="p-4 flex flex-wrap items-center gap-3"
          style={{ backgroundColor: draft.bgLight, color: draft.textPrimary }}
        >
          <span
            className="px-3 py-1.5 rounded-xl text-white text-xs font-extrabold"
            style={{ backgroundColor: draft.primary }}
          >
            Bouton
          </span>
          <span
            className="px-3 py-1.5 rounded-xl text-white text-xs font-extrabold"
            style={{ backgroundColor: draft.secondary }}
          >
            Bordeaux
          </span>
          <span
            className="px-3 py-1.5 rounded-xl text-xs font-bold border"
            style={{
              backgroundColor: draft.cardLight,
              color: draft.textSecondary,
              borderColor: draft.borderLight,
            }}
          >
            Carte
          </span>
          <span className="text-xs font-bold" style={{ color: draft.success }}>
            Succès
          </span>
          <span className="text-xs font-bold" style={{ color: draft.danger }}>
            Alerte
          </span>
          <span className="text-xs font-bold" style={{ color: draft.info }}>
            Information
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-4">
        <div className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1">
          {PALETTE_SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSectionId(item.id)}
              className={`shrink-0 text-left px-3 py-2 rounded-xl text-xs font-extrabold border transition-colors ${
                item.id === section.id
                  ? 'bg-nia-orange text-white border-nia-orange'
                  : 'bg-white dark:bg-nia-surface-dark text-nia-gray-dark dark:text-white border-nia-orange/20'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <section className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-orange/25 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-nia-gray-dark dark:text-white">
                {section.label}
              </h2>
              <p className="text-xs text-nia-gray-mid dark:text-gray-300 mt-1">{section.detail}</p>
            </div>
            <button
              type="button"
              onClick={() => resetSection(section)}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border border-nia-bordeaux/30 text-nia-bordeaux"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Réinitialiser cet onglet
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {section.fields.map((field) => (
              <label
                key={field.key}
                className="p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-orange/15 space-y-2"
              >
                <span className="block text-xs font-extrabold text-nia-gray-dark dark:text-white">
                  {field.label}
                </span>
                <span className="block text-[11px] leading-snug text-nia-gray-mid dark:text-gray-300">
                  {field.hint}
                </span>
                <span className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={field.label}
                    value={
                      /^#[0-9A-F]{6}$/i.test(draft[field.key])
                        ? draft[field.key]
                        : DEFAULT_PALETTE[field.key]
                    }
                    onChange={(event) => commit(patchPalette(draft, field.key, event.target.value))}
                    className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={draft[field.key]}
                    spellCheck={false}
                    onChange={(event) => {
                      const value = event.target.value.toUpperCase();
                      setDraft((current) => ({ ...current, [field.key]: value }));
                      if (/^#[0-9A-F]{6}$/.test(value)) {
                        commit(patchPalette(draft, field.key, value));
                      }
                    }}
                    className="flex-1 min-w-0 font-mono text-xs px-2 py-2 rounded-lg border border-nia-gray-light bg-white dark:bg-nia-surface-dark"
                  />
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => commit({ ...DEFAULT_PALETTE }, DEFAULT_THEME_PRESET)}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold px-4 py-2.5 rounded-xl bg-nia-bordeaux text-white"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Réinitialiser tout le thème
        </button>
      </div>
    </div>
  );
};
