import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, Puzzle, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { tUi, type LanguageCodeInput, type UiTranslations } from '../../lib/i18nEngine';
import {
  REFLECT_MS,
  activeProgress,
  canReveal,
  dailyLot,
  formatCountdown,
  isLocked,
  loadProgress,
  lotIdFor,
  offsetFromDateHeader,
  saveProgress,
  unlockMoment,
  type LeisureBank,
  type LeisureProgress,
  type PublicItem,
} from '../../lib/leisureDay';

type AnswerBook = Record<string, Record<string, string>>;
type Phase = 'loading' | 'ready' | 'error';

const TOPICS: Record<string, keyof UiTranslations> = {
  geo: 'leisureTopicGeo',
  science: 'leisureTopicScience',
  art: 'leisureTopicArt',
  books: 'leisureTopicBooks',
  cinema: 'leisureTopicCinema',
  city: 'leisureTopicCity',
  mountain: 'leisureTopicMountain',
  language: 'leisureTopicLanguage',
  riddle: 'leisureTopicRiddle',
};

function languageOf(value: string): string {
  return value === 'en' || value === 'es' || value === 'de' || value === 'zh' ? value : 'fr';
}

function TimerRing({ elapsed }: { elapsed: number }) {
  const left = Math.max(0, REFLECT_MS - elapsed);
  const seconds = Math.ceil(left / 1000);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, elapsed / REFLECT_MS));
  const urgent = left > 0 && seconds <= 5;
  return (
    <div className="relative h-20 w-20 shrink-0" aria-hidden="true">
      <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-[#0F9F6E]/20" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={urgent ? '#7F1D3F' : '#0F9F6E'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-xl font-black ${urgent ? 'text-[#7F1D3F]' : 'text-[#047857] dark:text-emerald-300'}`}>
        {left <= 0 ? '✓' : seconds}
      </span>
    </div>
  );
}

export const LeisurePage: React.FC = () => {
  const { currentLanguage } = useApp();
  const lang = languageOf(currentLanguage);
  const [phase, setPhase] = useState<Phase>('loading');
  const [bank, setBank] = useState<LeisureBank | null>(null);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [progress, setProgress] = useState<LeisureProgress | null>(() => {
    const local = Date.now();
    return activeProgress(loadProgress(local), local);
  });
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [answers, setAnswers] = useState<AnswerBook | null>(null);
  const [sessionAnswer, setSessionAnswer] = useState<string | null>(null);
  const startedAt = useRef(0);
  const answersRequest = useRef<Promise<AnswerBook> | null>(null);

  const trustedNow = now + offset;
  const lot = useMemo(() => (bank ? dailyLot(bank, trustedNow, lang) : []), [bank, trustedNow, lang]);
  const currentLotId = lotIdFor(trustedNow);
  const locked = isLocked(progress, trustedNow);
  const item = lot[step];
  const revealed = Boolean(item && progress?.revealed.includes(item.id));
  const answer = revealed ? (answers?.[item.id]?.[lang] ?? sessionAnswer) : null;

  useEffect(() => {
    let alive = true;
    const syncClock = () => {
      fetch('/leisure/clock.txt', { method: 'HEAD', cache: 'no-store' })
        .then((response) => {
          if (!alive) return;
          const local = Date.now();
          setOffset(offsetFromDateHeader(response.headers.get('date'), local));
          setNow(local);
        })
        .catch(() => undefined);
    };
    syncClock();
    window.addEventListener('online', syncClock);
    return () => {
      alive = false;
      window.removeEventListener('online', syncClock);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch('/leisure/prompts.json', { cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) throw new Error('prompts');
        return response.json() as Promise<LeisureBank>;
      })
      .then((data) => {
        if (!alive) return;
        setBank(data);
        setPhase('ready');
      })
      .catch(() => {
        if (alive) setPhase('error');
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const local = Date.now();
    setProgress(activeProgress(loadProgress(local + offset), local + offset));
    setNow(local);
  }, [offset]);

  useEffect(() => {
    if (!lot.length) return;
    const stored = activeProgress(loadProgress(trustedNow), trustedNow);
    const index = stored ? lot.findIndex((entry) => !stored.revealed.includes(entry.id)) : 0;
    setStep(index < 0 ? 0 : index);
    setSessionAnswer(null);
  }, [currentLotId, lot.length]);

  useEffect(() => {
    if (!locked) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [locked]);

  useEffect(() => {
    startedAt.current = performance.now();
    setElapsed(0);
    setSessionAnswer(null);
  }, [item?.id]);

  useEffect(() => {
    if (!item || locked || !revealed) return undefined;
    let alive = true;
    void loadAnswers().then((book) => {
      if (!alive) return;
      setAnswers(book);
      setSessionAnswer(book[item.id]?.[lang] ?? null);
    }).catch(() => {
      if (alive) setPhase('error');
    });
    return () => {
      alive = false;
    };
  }, [item?.id, locked, revealed, lang]);

  useEffect(() => {
    if (!item || locked || revealed) return undefined;
    const timer = window.setInterval(() => {
      const next = performance.now() - startedAt.current;
      setElapsed(next);
      if (!canReveal(next)) return;
      window.clearInterval(timer);
      void openAnswer(item).catch(() => setPhase('error'));
    }, 200);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, locked, revealed]);

  function loadAnswers(): Promise<AnswerBook> {
    if (!answersRequest.current) {
      answersRequest.current = fetch('/leisure/answers.json', { cache: 'force-cache' })
        .then((response) => {
          if (!response.ok) throw new Error('answers');
          return response.json() as Promise<{ items: AnswerBook }>;
        })
        .then((payload) => payload.items)
        .catch((error: unknown) => {
          answersRequest.current = null;
          throw error;
        });
    }
    return answersRequest.current;
  }

  async function openAnswer(current: PublicItem) {
    if (!canReveal(performance.now() - startedAt.current) && !progress?.revealed.includes(current.id)) return;
    const book = await loadAnswers();
    const text = book[current.id]?.[lang] ?? null;
    setAnswers(book);
    setSessionAnswer(text);
    const local = Date.now();
    const trusted = local + offset;
    setNow(local);
    setProgress((previous) => {
      const base = previous && previous.lotId === currentLotId
        ? previous
        : {
            v: 1 as const,
            lotId: currentLotId,
            revealed: [],
            guesses: {},
            completedAt: null,
            unlockAt: null,
            score: null,
            total: null,
          };
      const revealedIds = base.revealed.includes(current.id) ? base.revealed : [...base.revealed, current.id];
      const finished = lot.every((entry) => revealedIds.includes(entry.id));
      const score = finished && lot.some((entry) => entry.kind === 'quiz')
        ? countScore(lot, base.guesses, book, lang)
        : base.score;
      const next: LeisureProgress = {
        ...base,
        revealed: revealedIds,
        completedAt: finished ? trusted : null,
        unlockAt: finished ? unlockMoment(trusted) : null,
        score,
        total: finished ? lot.length : base.total,
      };
      saveProgress(next);
      return next;
    });
  }

  function choose(index: number) {
    if (!item || revealed || answer) return;
    setProgress((previous) => {
      const base = previous && previous.lotId === currentLotId
        ? previous
        : {
            v: 1 as const,
            lotId: currentLotId,
            revealed: [],
            guesses: {},
            completedAt: null,
            unlockAt: null,
            score: null,
            total: null,
          };
      const next = { ...base, guesses: { ...base.guesses, [item.id]: index } };
      saveProgress(next);
      return next;
    });
  }

  function continueLot() {
    if (!revealed || !answer) return;
    if (step < lot.length - 1) {
      setStep((value) => value + 1);
      return;
    }
    const local = Date.now();
    const trusted = local + offset;
    const next: LeisureProgress = {
      v: 1,
      lotId: currentLotId,
      revealed: lot.map((entry) => entry.id),
      guesses: progress?.guesses ?? {},
      completedAt: trusted,
      unlockAt: unlockMoment(trusted),
      score: progress?.score ?? null,
      total: lot.length,
    };
    saveProgress(next);
    setProgress(next);
    setNow(local);
  }

  if (phase === 'loading') {
    return (
      <Shell lang={currentLanguage}>
        <p className="text-sm font-bold text-[#047857]">{tUi(currentLanguage, 'leisureLoading')}</p>
      </Shell>
    );
  }

  if (phase === 'error' || !bank || lot.length === 0) {
    return (
      <Shell lang={currentLanguage}>
        <p className="text-sm font-bold text-[#7F1D3F]">{tUi(currentLanguage, 'leisureUnavailable')}</p>
      </Shell>
    );
  }

  if (locked && progress?.unlockAt) {
    return (
      <Shell lang={currentLanguage} kind={progress.lotId.startsWith('riddle') ? 'riddle' : 'quiz'}>
        <WaitCard
          lang={currentLanguage}
          remaining={progress.unlockAt - trustedNow}
          score={progress.score}
          total={progress.total}
          farewell={sessionAnswer}
        />
      </Shell>
    );
  }

  if (!item) {
    return (
      <Shell lang={currentLanguage}>
        <WaitCard lang={currentLanguage} remaining={0} score={progress?.score ?? null} total={progress?.total ?? lot.length} />
      </Shell>
    );
  }

  const guess = progress?.guesses[item.id];
  const correctIndex = answer && item.kind === 'quiz' ? item.choices.indexOf(answer) : -1;

  return (
    <Shell lang={currentLanguage} kind={item.kind}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-wider text-[#7F1D3F] dark:text-amber-200">
          {step + 1} {tUi(currentLanguage, 'leisureOf')} {lot.length}
        </p>
        <span className="rounded-full bg-[#fff7ed] px-3 py-1 text-[11px] font-extrabold text-[#047857] dark:bg-black/30 dark:text-emerald-200">
          {tUi(currentLanguage, TOPICS[item.topic] || 'leisureTopicRiddle')}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#0F9F6E]/15">
        <div className="h-full rounded-full bg-[#0F9F6E] transition-all" style={{ width: `${((step + (answer ? 1 : 0.08)) / lot.length) * 100}%` }} />
      </div>
      <div className="mt-5 flex items-start gap-4">
        <TimerRing elapsed={revealed ? REFLECT_MS : elapsed} />
        <h2 className="pt-2 text-xl font-black leading-snug text-[#1F2937] dark:text-white sm:text-2xl">{item.prompt}</h2>
      </div>
      {item.kind === 'quiz' ? (
        <div className="mt-5 grid gap-2">
          {item.choices.map((choice, index) => {
            const selected = guess === index;
            const show = Boolean(answer);
            const correct = show && index === correctIndex;
            const missed = show && selected && !correct;
            return (
              <button
                key={`${item.id}-${index}`}
                type="button"
                disabled={show}
                onClick={() => choose(index)}
                className={`rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0F9F6E] ${
                  correct
                    ? 'border-[#0F9F6E] bg-[#0F9F6E] text-white'
                    : missed
                      ? 'border-[#7F1D3F] bg-[#fff7ed] text-[#7F1D3F]'
                      : selected
                        ? 'border-[#0F9F6E] bg-white text-[#047857] dark:bg-black/20 dark:text-emerald-200'
                        : 'border-[#0F9F6E]/25 bg-white text-[#1F2937] hover:border-[#0F9F6E] dark:bg-black/20 dark:text-white'
                }`}
              >
                {choice}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="mt-4" aria-live="polite">
        {answer ? (
          <div className="rounded-2xl bg-[#047857] px-4 py-3 text-white">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-white/75">{tUi(currentLanguage, 'leisureAnswer')}</p>
            <p className="text-lg font-black">{answer}</p>
            {item.kind === 'quiz' && guess != null ? (
              <p className="mt-1 text-xs font-bold text-white/85">
                {guess === correctIndex ? tUi(currentLanguage, 'leisureCorrect') : tUi(currentLanguage, 'leisureOther')}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[#7F1D3F]/35 bg-[#fff7ed] px-4 py-3 text-sm font-bold text-[#7F1D3F] dark:bg-black/20 dark:text-amber-100">
            {tUi(currentLanguage, 'leisureReflect')}
          </div>
        )}
      </div>
      <button
        type="button"
        disabled={!answer}
        onClick={continueLot}
        className="mt-4 w-full rounded-full bg-[#0F9F6E] px-4 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:bg-[#1F2937]/10 disabled:text-[#1F2937]/35 dark:disabled:bg-white/10 dark:disabled:text-white/35"
      >
        {step === lot.length - 1 ? tUi(currentLanguage, 'leisureFinish') : tUi(currentLanguage, 'leisureNext')}
      </button>
    </Shell>
  );
};

function countScore(items: PublicItem[], guesses: Record<string, number>, book: AnswerBook, lang: string): number {
  return items.filter((entry) => {
    if (entry.kind !== 'quiz') return false;
    const picked = guesses[entry.id];
    if (picked == null) return false;
    return entry.choices[picked] === book[entry.id]?.[lang];
  }).length;
}

function Shell({
  lang,
  kind,
  children,
}: {
  lang: LanguageCodeInput;
  kind?: 'quiz' | 'riddle';
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <section className="rounded-[2rem] border-2 border-[#0F9F6E]/30 bg-white p-5 shadow-sm dark:bg-nia-surface-dark sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F9F6E] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
            <Puzzle className="h-3.5 w-3.5" />
            {tUi(lang, 'leisureKicker')}
          </span>
          <span className="rounded-full bg-[#7F1D3F] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">
            {tUi(lang, 'leisureValid')}
          </span>
          {kind ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#fff7ed] px-3 py-1 text-[11px] font-extrabold text-[#7F1D3F] dark:bg-black/30 dark:text-amber-100">
              <Sparkles className="h-3.5 w-3.5" />
              {tUi(lang, kind === 'quiz' ? 'leisureQuiz' : 'leisureRiddle')}
            </span>
          ) : null}
        </div>
        <h1 className="mt-4 text-2xl font-black text-[#1F2937] dark:text-white sm:text-4xl">{tUi(lang, 'leisureTitle')}</h1>
        <p className="mt-2 text-sm font-medium text-[#1F2937]/80 dark:text-white/75">{tUi(lang, 'leisureLead')}</p>
        <p className="mt-2 text-xs font-bold text-[#047857] dark:text-emerald-300">{tUi(lang, 'leisureUtc')}</p>
        <div className="mt-5">{children}</div>
        <p className="mt-6 text-[11px] font-semibold text-[#1F2937]/55 dark:text-white/45">{tUi(lang, 'leisureSource')}</p>
      </section>
    </div>
  );
}

function WaitCard({
  lang,
  remaining,
  score,
  total,
  farewell = null,
}: {
  lang: LanguageCodeInput;
  remaining: number;
  score: number | null;
  total: number | null;
  farewell?: string | null;
}) {
  return (
    <div className="rounded-[1.5rem] border-2 border-[#7F1D3F]/25 bg-[#fff7ed] p-5 text-center dark:bg-black/25">
      <Clock3 className="mx-auto h-8 w-8 text-[#7F1D3F] dark:text-amber-200" />
      <h2 className="mt-3 text-2xl font-black text-[#1F2937] dark:text-white">{tUi(lang, 'leisureWaitTitle')}</h2>
      {farewell ? (
        <p className="mt-3 text-sm font-extrabold text-[#047857] dark:text-emerald-200">
          {tUi(lang, 'leisureAnswer')} : {farewell}
        </p>
      ) : null}
      <p className="mt-2 text-4xl font-black tabular-nums tracking-wider text-[#047857] dark:text-emerald-300" aria-live="polite">
        {formatCountdown(remaining)}
      </p>
      <p className="mt-3 text-sm font-medium text-[#1F2937]/80 dark:text-white/75">{tUi(lang, 'leisureWaitBody')}</p>
      {score != null && total != null ? (
        <p className="mt-3 text-sm font-extrabold text-[#7F1D3F] dark:text-amber-100">
          {score}/{total}. {tUi(lang, 'leisureScoreNote')}
        </p>
      ) : (
        <p className="mt-3 text-sm font-extrabold text-[#7F1D3F] dark:text-amber-100">{tUi(lang, 'leisureScoreNote')}</p>
      )}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link to="/conseils" className="rounded-full bg-[#0F9F6E] px-4 py-2 text-xs font-extrabold text-white">
          {tUi(lang, 'navTips')}
        </Link>
        <Link to="/histoires" className="rounded-full border-2 border-[#7F1D3F] px-4 py-2 text-xs font-extrabold text-[#7F1D3F] dark:border-amber-200 dark:text-amber-100">
          {tUi(lang, 'navStories')}
        </Link>
      </div>
    </div>
  );
}
