import React, { useMemo, useState } from 'react';
import {
  Activity,
  BookMarked,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Lock,
  Moon,
  Plus,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/ui/Modal';
import { InlineSlidingGuideBanner } from '../../components/ui/SlidingInstructionBubbles';
import { JournalEntry } from '../../lib/types';

const MOOD_OPTIONS: Array<{ score: 1 | 2 | 3 | 4 | 5; label: string; desc: string }> = [
  { score: 1, label: 'Très éprouvé(e)', desc: 'Journée lourde, besoin de calme et de soutien.' },
  { score: 2, label: 'Fatigue émotionnelle', desc: 'Tension ou lassitude présente.' },
  { score: 3, label: 'En recherche d’équilibre', desc: 'État stable avec quelques fluctuations.' },
  { score: 4, label: 'Apaisé(e) et lucide', desc: 'Bonne clarté intérieure et recul.' },
  { score: 5, label: 'Serein(e) et ancré(e)', desc: 'Énergie fluide et sentiment d’alignement.' },
];

const JOURNAL_PROMPTS = [
  'Ce qui occupe mon esprit aujourd\'hui…',
  'Ce que je n\'ai pas osé dire à voix haute cette semaine…',
  'Une limite saine que j\'aimerais poser avec calme…',
  'Ce qui m\'apaise sincèrement quand tout va trop vite…',
];

// ============================================================================
// 1. MON BIEN-ÊTRE (/espace/bien-etre) — 4 sous-onglets officiels
//    (Aucun effet glitch sur les questionnaires ni sur les résultats de bien-être)
// ============================================================================
export const WellnessPage: React.FC = () => {
  const {
    userMoodEntries,
    addMoodEntry,
    userStressSleepEntries,
    addStressSleepEntry,
    questionnairesCatalog,
    userQuestionnaireResponses,
    submitQuestionnaireResponse,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'humeur' | 'stress-sommeil' | 'questionnaires' | 'progression'
  >('humeur');

  // État formulaire Mon humeur
  const [selectedMoodScore, setSelectedMoodScore] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [moodNote, setMoodNote] = useState('');
  const [moodTagsInput, setMoodTagsInput] = useState('Respiration, Clarté');

  // État formulaire Stress et sommeil
  const [stressLevel, setStressLevel] = useState<number>(4);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [sleepNote, setSleepNote] = useState('');
  const [sleepDate, setSleepDate] = useState<string>('2026-10-23');

  // État parcours Questionnaires
  const [selectedQCode, setSelectedQCode] = useState<string>(questionnairesCatalog[0].code);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [qAnswers, setQAnswers] = useState<number[]>([3, 3, 3, 3, 3]);
  const [completedResultId, setCompletedResultId] = useState<string | null>(null);

  // État filtre de période Progression (7j, 30j, personnalisée)
  const [periodFilter, setPeriodFilter] = useState<'7d' | '30d' | 'custom'>('7d');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-10-23');

  const activeQuestionnaire =
    questionnairesCatalog.find((q) => q.code === selectedQCode) || questionnairesCatalog[0];

  const handleSaveMood = (e: React.FormEvent) => {
    e.preventDefault();
    const chosen = MOOD_OPTIONS.find((m) => m.score === selectedMoodScore) || MOOD_OPTIONS[3];
    const tags = moodTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    addMoodEntry({
      moodScore: selectedMoodScore,
      moodLabel: chosen.label,
      note: moodNote,
      tags,
    });
    setMoodNote('');
  };

  const handleSaveStressSleep = (e: React.FormEvent) => {
    e.preventDefault();
    addStressSleepEntry({
      stressLevel,
      sleepHours,
      sleepQuality,
      note: sleepNote,
      recordedDate: sleepDate,
    });
    setSleepNote('');
  };

  const handleCompleteQuestionnaire = () => {
    const rawScore = qAnswers.reduce((acc, v) => acc + v, 0);
    const normalizedScore = rawScore * 4; // 0..25 -> 0..100 (standard OMS-5)
    let band =
      'Indice subjectif favorable (repère personnel indicatif, ne constitue pas un diagnostic médical).';
    if (normalizedScore < 50) {
      band =
        'Vitalité subjective ressentie comme basse ces deux dernières semaines. Prenez soin de vous et n’hésitez pas à solliciter une écoute humaine ou un professionnel de santé (ce résultat est un repère personnel et non un diagnostic clinique).';
    } else if (normalizedScore < 68) {
      band =
        'Équilibre subjectif modéré. Observez vos temps de récupération et de sommeil (repère personnel non diagnostique).';
    }

    const saved = submitQuestionnaireResponse({
      questionnaireCode: activeQuestionnaire.code,
      questionnaireTitle: activeQuestionnaire.title,
      questionnaireVersion: activeQuestionnaire.version,
      rawScore,
      normalizedScore,
      interpretationBand: band,
      answers: [...qAnswers],
    });
    setCompletedResultId(saved.id);
  };

  // Filtrage temporel pour l'onglet Progression
  const filteredProgressionData = useMemo(() => {
    const today = new Date('2026-10-23T23:59:59.000Z');
    let minDate = new Date('2026-10-16T00:00:00.000Z');
    let maxDate = today;

    if (periodFilter === '30d') {
      minDate = new Date('2026-09-23T00:00:00.000Z');
    } else if (periodFilter === 'custom') {
      minDate = new Date(`${customStartDate}T00:00:00.000Z`);
      maxDate = new Date(`${customEndDate}T23:59:59.000Z`);
    }

    const moods = userMoodEntries.filter((m) => {
      const d = new Date(m.recordedAt);
      return d >= minDate && d <= maxDate;
    });

    const stressSleeps = userStressSleepEntries.filter((s) => {
      const d = new Date(s.recordedDate);
      return d >= minDate && d <= maxDate;
    });

    return { moods: [...moods].reverse(), stressSleeps: [...stressSleeps].reverse() };
  }, [userMoodEntries, userStressSleepEntries, periodFilter, customStartDate, customEndDate]);

  return (
    <div className="space-y-6">
      <InlineSlidingGuideBanner
        slides={[
          {
            badge: 'Instructions Bien-être • Défilement automatique (1/4)',
            title: 'Onglet 1 : Mon humeur du jour',
            detail:
              'Choisissez votre ressenti (de 1 à 5), ajoutez une note facultative et cliquez sur « Enregistrer mon humeur ».',
          },
          {
            badge: 'Instructions Bien-être • Défilement automatique (2/4)',
            title: 'Onglet 2 : Stress et Sommeil',
            detail:
              'Indiquez votre niveau de stress (1 à 10) et vos heures de sommeil pour suivre l’impact du repos sur votre énergie.',
          },
          {
            badge: 'Instructions Bien-être • Défilement automatique (3/4)',
            title: 'Onglet 3 : Questionnaire OMS-5 Vérifié',
            detail:
              'Répondez aux 5 questions officielles sur les deux dernières semaines pour obtenir votre indice d’équilibre sur 100.',
          },
          {
            badge: 'Instructions Bien-être • Défilement automatique (4/4)',
            title: 'Onglet 4 : Courbes de Progression Orange & Bordeaux',
            detail:
              'Visualisez vos courbes d’évolution sur 7 jours, 30 jours ou une période personnalisée.',
          },
        ]}
      />

      {/* En-tête Bien-être & Avertissement non-diagnostique */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-nia-orange">
            <Activity className="w-4 h-4" />
            Bien-être & Suivi Personnel Privé
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-nia-gray-dark dark:text-white mt-1">
            Observer ton évolution à ton rythme
          </h1>
        </div>
        <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark text-xs text-nia-gray-mid dark:text-gray-300 flex items-center gap-2">
          <Lock className="w-4 h-4 text-nia-bordeaux dark:text-amber-300 shrink-0" />
          <span>Données strictement privées • Ne constitue pas un diagnostic médical</span>
        </div>
      </div>

      {/* Navigation des 4 sous-onglets obligatoires */}
      <div className="flex flex-wrap gap-2 border-b border-nia-gray-light dark:border-nia-border-dark pb-3">
        {[
          { id: 'humeur', label: 'Mon humeur', icon: Sparkles },
          { id: 'stress-sommeil', label: 'Stress et sommeil', icon: Moon },
          { id: 'questionnaires', label: 'Questionnaires', icon: ClipboardCheck },
          { id: 'progression', label: 'Progression', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                active
                  ? 'bg-nia-orange text-white shadow-sm'
                  : 'bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark text-nia-gray-dark dark:text-gray-200 hover:border-nia-orange'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SOUS-ONGLET 1 : MON HUMEUR */}
      {activeSubTab === 'humeur' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveMood}
            className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-5"
          >
            <h2 className="text-lg font-bold text-nia-gray-dark dark:text-white">
              Comment te sens-tu aujourd’hui ?
            </h2>
            <div className="space-y-2.5">
              {MOOD_OPTIONS.map((opt) => (
                <button
                  key={opt.score}
                  type="button"
                  onClick={() => setSelectedMoodScore(opt.score)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                    selectedMoodScore === opt.score
                      ? 'border-nia-orange bg-nia-orange/10'
                      : 'border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange/50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-nia-gray-dark dark:text-white">
                      {opt.score}/5 — {opt.label}
                    </p>
                    <p className="text-xs text-nia-gray-mid dark:text-gray-400">{opt.desc}</p>
                  </div>
                  <span className="w-7 h-7 rounded-lg bg-nia-orange text-white font-bold text-xs flex items-center justify-center">
                    {opt.score}
                  </span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                Note facultative
              </label>
              <textarea
                rows={3}
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                placeholder="Qu’est-ce qui influence ton ressenti aujourd’hui ? (Facultatif)"
                className="w-full p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5">
                Repères / Contextes (séparés par une virgule)
              </label>
              <input
                type="text"
                value={moodTagsInput}
                onChange={(e) => setMoodTagsInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white font-bold text-sm"
            >
              Enregistrer mon humeur
            </button>
          </form>

          <div className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4">
            <h2 className="text-lg font-bold text-nia-gray-dark dark:text-white">
              Historique de mon humeur ({userMoodEntries.length})
            </h2>
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {userMoodEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-nia-gray-dark dark:text-white">
                      {entry.moodLabel} ({entry.moodScore}/5)
                    </span>
                    <span className="text-xs text-nia-gray-mid dark:text-gray-400">
                      {entry.recordedAt}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="text-xs text-nia-gray-mid dark:text-gray-300">{entry.note}</p>
                  )}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange text-[11px] font-semibold"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SOUS-ONGLET 2 : STRESS ET SOMMEIL */}
      {activeSubTab === 'stress-sommeil' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSaveStressSleep}
            className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4"
          >
            <h2 className="text-lg font-bold text-nia-gray-dark dark:text-white">
              Enregistrer mes données déclaratives
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                Date du relevé
              </label>
              <input
                type="date"
                value={sleepDate}
                onChange={(e) => setSleepDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Niveau de stress ressenti (1 = très calme, 10 = très intense)</span>
                <span className="text-nia-orange">{stressLevel}/10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={stressLevel}
                onChange={(e) => setStressLevel(Number(e.target.value))}
                className="w-full accent-nia-orange"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Heures de sommeil</span>
                <span className="text-nia-bordeaux dark:text-amber-300">{sleepHours} h</span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                step={0.5}
                value={sleepHours}
                onChange={(e) => setSleepHours(Number(e.target.value))}
                className="w-full accent-nia-orange"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                Qualité perçue du sommeil (1 à 5)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {([1, 2, 3, 4, 5] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSleepQuality(q)}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      sleepQuality === q
                        ? 'bg-nia-orange text-white border-nia-orange'
                        : 'border-nia-gray-light dark:border-nia-border-dark'
                    }`}
                  >
                    {q}/5
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                Observation facultative
              </label>
              <input
                type="text"
                value={sleepNote}
                onChange={(e) => setSleepNote(e.target.value)}
                placeholder="Ex. : Réveil reposé, lecture avant de dormir…"
                className="w-full px-3.5 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white font-bold text-sm"
            >
              Enregistrer ce relevé
            </button>
          </form>

          {/* Visualisation graphique Stress & Sommeil */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-5">
            <h2 className="text-lg font-bold text-nia-gray-dark dark:text-white">
              Visualisation graphique — Stress & Sommeil
            </h2>
            <div className="space-y-4">
              {userStressSleepEntries.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{item.recordedDate}</span>
                    <span className="text-nia-gray-mid dark:text-gray-400">
                      Qualité sommeil : {item.sleepQuality}/5
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Stress</span>
                        <span className="font-bold text-nia-bordeaux dark:text-amber-300">
                          {item.stressLevel}/10
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-nia-gray-light dark:bg-nia-border-dark overflow-hidden">
                        <div
                          className="h-full bg-nia-bordeaux rounded-full"
                          style={{ width: `${item.stressLevel * 10}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Sommeil</span>
                        <span className="font-bold text-nia-orange">{item.sleepHours}h</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-nia-gray-light dark:bg-nia-border-dark overflow-hidden">
                        <div
                          className="h-full bg-nia-orange rounded-full"
                          style={{ width: `${Math.min(100, (item.sleepHours / 10) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {item.note && (
                    <p className="text-xs text-nia-gray-mid dark:text-gray-400">{item.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SOUS-ONGLET 3 : QUESTIONNAIRES VÉRIFIÉS (OMS-5 & Bilan Réflexif) */}
      {activeSubTab === 'questionnaires' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-6">
            <div className="flex flex-wrap gap-2">
              {questionnairesCatalog.map((q) => (
                <button
                  key={q.code}
                  type="button"
                  onClick={() => {
                    setSelectedQCode(q.code);
                    setCurrentStepIdx(0);
                    setCompletedResultId(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border ${
                    selectedQCode === q.code
                      ? 'bg-nia-bordeaux text-white border-nia-bordeaux'
                      : 'border-nia-gray-light dark:border-nia-border-dark'
                  }`}
                >
                  {q.title}
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark space-y-1.5">
              <p className="text-xs font-bold text-nia-bordeaux dark:text-amber-300">
                {activeQuestionnaire.version}
              </p>
              <p className="text-xs text-nia-gray-mid dark:text-gray-300">
                <strong>Source :</strong> {activeQuestionnaire.sourceAttribution}
              </p>
              <p className="text-xs text-nia-gray-mid dark:text-gray-400">
                {activeQuestionnaire.licenseNote}
              </p>
            </div>

            {/* Barre de progression accessible */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>
                  Question {currentStepIdx + 1} sur {activeQuestionnaire.questions.length}
                </span>
                <span>
                  Progression :{' '}
                  {Math.round(((currentStepIdx + 1) / activeQuestionnaire.questions.length) * 100)}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-nia-gray-light dark:bg-nia-border-dark overflow-hidden">
                <div
                  className="h-full bg-nia-orange transition-all duration-300"
                  style={{
                    width: `${
                      ((currentStepIdx + 1) / activeQuestionnaire.questions.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Question courante */}
            <div className="space-y-4">
              <h2 className="text-base sm:text-lg font-bold text-nia-gray-dark dark:text-white">
                {activeQuestionnaire.questions[currentStepIdx]}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeQuestionnaire.scaleLabels.map((scale) => {
                  const chosen = qAnswers[currentStepIdx] === scale.value;
                  return (
                    <button
                      key={scale.value}
                      type="button"
                      onClick={() => {
                        const next = [...qAnswers];
                        next[currentStepIdx] = scale.value;
                        setQAnswers(next);
                      }}
                      className={`p-3 rounded-xl text-left text-xs font-bold border transition-colors ${
                        chosen
                          ? 'bg-nia-orange text-white border-nia-orange'
                          : 'bg-nia-bg-light dark:bg-nia-bg-dark border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange'
                      }`}
                    >
                      {scale.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation entre les questions */}
            <div className="flex items-center justify-between pt-4 border-t border-nia-gray-light dark:border-nia-border-dark">
              <button
                type="button"
                disabled={currentStepIdx === 0}
                onClick={() => setCurrentStepIdx((i) => Math.max(0, i - 1))}
                className="px-4 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-xs font-bold disabled:opacity-40"
              >
                Question précédente
              </button>

              {currentStepIdx < activeQuestionnaire.questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentStepIdx((i) =>
                      Math.min(activeQuestionnaire.questions.length - 1, i + 1)
                    )
                  }
                  className="px-5 py-2.5 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-xs font-bold"
                >
                  Question suivante →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteQuestionnaire}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-nia-bordeaux hover:bg-nia-bordeaux-dark text-white text-xs font-bold"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Calculer et enregistrer mon bilan privé
                </button>
              )}
            </div>
          </div>

          {/* Historique des résultats de questionnaires */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4">
            <h2 className="text-lg font-bold text-nia-gray-dark dark:text-white">
              Mes bilans enregistrés ({userQuestionnaireResponses.length})
            </h2>
            <p className="text-xs text-nia-gray-mid dark:text-gray-400">
              Ces résultats sont strictement privés et servent de repère personnel. Ils ne constituent jamais un diagnostic médical.
            </p>
            <div className="space-y-3">
              {userQuestionnaireResponses.map((resp) => (
                <div
                  key={resp.id}
                  className={`p-4 rounded-xl border space-y-2 ${
                    resp.id === completedResultId
                      ? 'bg-nia-orange/10 border-nia-orange'
                      : 'bg-nia-bg-light dark:bg-nia-bg-dark border-nia-gray-light dark:border-nia-border-dark'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-nia-bordeaux dark:text-amber-300">
                      {resp.questionnaireTitle}
                    </span>
                    <span className="text-xs text-nia-gray-mid">
                      {new Date(resp.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-extrabold text-nia-orange">
                      {resp.normalizedScore}/100
                    </span>
                    <span className="text-xs text-nia-gray-mid dark:text-gray-400">
                      (Score brut : {resp.rawScore}/25)
                    </span>
                  </div>
                  <p className="text-xs text-nia-gray-dark dark:text-gray-200 leading-relaxed">
                    {resp.interpretationBand}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SOUS-ONGLET 4 : PROGRESSION (7 jours, 30 jours, période personnalisée) */}
      {activeSubTab === 'progression' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-nia-gray-dark dark:text-white">
                Courbes d’évolution personnelle
              </h2>
              <p className="text-xs text-nia-gray-mid dark:text-gray-400">
                Filtrez vos données privées sur 7 jours, 30 jours ou une période personnalisée.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: '7d', label: '7 jours' },
                { id: '30d', label: '30 jours' },
                { id: 'custom', label: 'Période personnalisée' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodFilter(p.id as typeof periodFilter)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold ${
                    periodFilter === p.id
                      ? 'bg-nia-orange text-white'
                      : 'bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {periodFilter === 'custom' && (
            <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-nia-orange" />
                <span className="font-bold">Du :</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold">Au :</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark"
                />
              </div>
            </div>
          )}

          {/* Graphique SVG clair de l'humeur et du sommeil */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark space-y-3">
              <h3 className="text-sm font-bold text-nia-gray-dark dark:text-white">
                Évolution de l’humeur ({filteredProgressionData.moods.length} point(s))
              </h3>
              <svg viewBox="0 0 360 150" className="w-full h-40">
                <line x1="20" y1="130" x2="340" y2="130" stroke="#9CA3AF" strokeWidth="1" />
                {filteredProgressionData.moods.map((m, idx, arr) => {
                  const x =
                    arr.length === 1
                      ? 180
                      : 30 + (idx / Math.max(1, arr.length - 1)) * 300;
                  const y = 130 - (m.moodScore / 5) * 100;
                  return (
                    <g key={m.id}>
                      <circle cx={x} cy={y} r="6" fill="#F97316" />
                      <text x={x} y={145} textAnchor="middle" fontSize="9" fill="#6B7280">
                        {m.recordedAt.slice(5)}
                      </text>
                      <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fill="#F97316" fontWeight="bold">
                        {m.moodScore}/5
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="p-5 rounded-2xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark space-y-3">
              <h3 className="text-sm font-bold text-nia-gray-dark dark:text-white">
                Équilibre Sommeil (h) & Stress (/10)
              </h3>
              <svg viewBox="0 0 360 150" className="w-full h-40">
                <line x1="20" y1="130" x2="340" y2="130" stroke="#9CA3AF" strokeWidth="1" />
                {filteredProgressionData.stressSleeps.map((s, idx, arr) => {
                  const x =
                    arr.length === 1
                      ? 180
                      : 40 + (idx / Math.max(1, arr.length - 1)) * 280;
                  const sleepH = (s.sleepHours / 10) * 95;
                  const stressH = (s.stressLevel / 10) * 95;
                  return (
                    <g key={s.id}>
                      <rect
                        x={x - 12}
                        y={130 - sleepH}
                        width="10"
                        height={sleepH}
                        rx="3"
                        fill="#F97316"
                      />
                      <rect
                        x={x + 2}
                        y={130 - stressH}
                        width="10"
                        height={stressH}
                        rx="3"
                        fill="#7F1D3F"
                      />
                      <text x={x} y={145} textAnchor="middle" fontSize="9" fill="#6B7280">
                        {s.recordedDate.slice(5)}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <div className="flex items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-nia-orange" /> Sommeil (heures)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-nia-bordeaux" /> Niveau de stress (/10)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. JOURNAL PERSONNEL (/espace/journal) — Strictement privé
// ============================================================================
export const JournalPage: React.FC = () => {
  const { userJournalEntries, saveJournalEntry, deleteJournalEntry } = useApp();

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Réflexion libre');
  const [promptUsed, setPromptUsed] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDraft, setFilterDraft] = useState<'ALL' | 'SAVED' | 'DRAFT'>('ALL');
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

  const handleApplyPrompt = (prompt: string) => {
    setPromptUsed(prompt);
    if (!content.trim()) {
      setContent(`${prompt} `);
    } else {
      setContent((prev) => `${prev}\n\n${prompt} `);
    }
  };

  const handleSave = (asDraft: boolean) => {
    if (!content.trim()) return;
    saveJournalEntry({
      id: editingId,
      title,
      content,
      category,
      promptUsed,
      isDraft: asDraft,
    });
    setEditingId(undefined);
    setTitle('');
    setContent('');
    setPromptUsed(undefined);
  };

  const handleStartEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setCategory(entry.category);
    setPromptUsed(entry.promptUsed);
  };

  const filteredEntries = userJournalEntries.filter((e) => {
    const matchesStatus =
      filterDraft === 'ALL' ||
      (filterDraft === 'DRAFT' && e.isDraft) ||
      (filterDraft === 'SAVED' && !e.isDraft);
    const matchesSearch =
      !searchQuery.trim() ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <InlineSlidingGuideBanner
        slides={[
          {
            badge: 'Instructions Journal • Défilement automatique (1/2)',
            title: 'Comment utiliser votre journal intime ?',
            detail:
              'Cliquez sur l’une des amorces (« Ce qui occupe mon esprit aujourd’hui… ») ou écrivez librement votre texte, puis choisissez « Brouillon » ou « Enregistrer ».',
          },
          {
            badge: 'Instructions Journal • Défilement automatique (2/2)',
            title: 'Confidentialité totale',
            detail:
              'Votre journal démarre vierge de toute fausse note : seules vos propres réflexions y figurent et personne d’autre ne peut les consulter.',
          },
        ]}
      />

      <div className="p-4 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-bordeaux/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-300">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-nia-gray-dark dark:text-white">
              Mon journal personnel — Espace 100% intime
            </h1>
            <p className="text-xs text-nia-gray-mid dark:text-gray-300">
              Aucune entrée de votre journal n’est jamais publiée automatiquement, ni transformée en témoignage public, ni lisible par l’administration.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Éditeur de journal */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-nia-gray-dark dark:text-white flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-nia-orange" />
              {editingId ? 'Modifier mon entrée privée' : 'Nouvelle entrée de journal'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(undefined);
                  setTitle('');
                  setContent('');
                }}
                className="text-xs font-bold text-nia-orange"
              >
                + Nouvelle entrée vierge
              </button>
            )}
          </div>

          {/* Amorces d'écriture */}
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-nia-gray-mid dark:text-gray-400">
              Amorces d’écriture (cliquez pour insérer) :
            </p>
            <div className="flex flex-wrap gap-2">
              {JOURNAL_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleApplyPrompt(prompt)}
                  className="px-3 py-1.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange text-xs font-medium text-nia-bordeaux dark:text-amber-200 transition-colors"
                >
                  « {prompt} »
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                Titre (facultatif)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex. : Ce que je retiens de cette journée…"
                className="w-full px-3.5 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                Catégorie (facultative)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
              >
                <option value="Réflexion libre">Réflexion libre</option>
                <option value="Franchise envers soi">Franchise envers soi</option>
                <option value="Apaisement">Apaisement</option>
                <option value="Relations & Limites">Relations & Limites</option>
                <option value="Gratitude & Progrès">Gratitude & Progrès</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Texte libre
            </label>
            <textarea
              rows={7}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ce qui occupe mon esprit aujourd'hui…"
              className="w-full p-4 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm leading-relaxed focus:outline-none focus:border-nia-orange"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={!content.trim()}
              onClick={() => handleSave(true)}
              className="px-4 py-2.5 rounded-xl border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange text-xs font-bold disabled:opacity-40"
            >
              Enregistrer en brouillon
            </button>
            <button
              type="button"
              disabled={!content.trim()}
              onClick={() => handleSave(false)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-xs font-bold disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              {editingId ? 'Mettre à jour l’entrée' : 'Enregistrer dans mon journal'}
            </button>
          </div>
        </div>

        {/* Historique & Recherche du journal */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4">
          <h2 className="text-base font-bold text-nia-gray-dark dark:text-white">
            Historique de mon journal ({filteredEntries.length})
          </h2>

          <div className="relative">
            <Search className="w-4 h-4 text-nia-gray-mid absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un mot ou une catégorie…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
            />
          </div>

          <div className="flex gap-2">
            {[
              { id: 'ALL', label: 'Toutes' },
              { id: 'SAVED', label: 'Enregistrées' },
              { id: 'DRAFT', label: 'Brouillons' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterDraft(f.id as typeof filterDraft)}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${
                  filterDraft === f.id
                    ? 'bg-nia-orange text-white'
                    : 'bg-nia-bg-light dark:bg-nia-bg-dark text-nia-gray-mid'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-3 max-h-[430px] overflow-y-auto pr-1">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-nia-orange">
                        {entry.category}
                      </span>
                      {entry.isDraft && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                          Brouillon
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-nia-gray-dark dark:text-white mt-0.5">
                      {entry.title || 'Entrée sans titre'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(entry)}
                      className="p-1.5 rounded-lg text-nia-gray-mid hover:text-nia-orange"
                      aria-label="Modifier cette entrée"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryToDelete(entry)}
                      className="p-1.5 rounded-lg text-nia-gray-mid hover:text-rose-600"
                      aria-label="Supprimer cette entrée"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-nia-gray-mid dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {entry.content}
                </p>

                <p className="text-[10px] text-nia-gray-mid">
                  Modifié le {new Date(entry.updatedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modale de confirmation de suppression d'entrée de journal */}
      <Modal
        isOpen={Boolean(entryToDelete)}
        onClose={() => setEntryToDelete(null)}
        badgeText="Journal personnel"
        title="Supprimer cette entrée de journal ?"
        subtitle="Cette suppression est immédiate et irréversible."
        accent="bordeaux"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEntryToDelete(null)}
              className="px-4 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                if (entryToDelete) {
                  deleteJournalEntry(entryToDelete.id);
                  setEntryToDelete(null);
                }
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold"
            >
              Supprimer définitivement
            </button>
          </>
        }
      >
        <p>
          Voulez-vous vraiment supprimer l’entrée{' '}
          <strong>« {entryToDelete?.title || 'Sans titre'} »</strong> de votre journal personnel ?
        </p>
      </Modal>
    </div>
  );
};
