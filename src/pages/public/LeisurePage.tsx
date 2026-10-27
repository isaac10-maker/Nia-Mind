import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Puzzle, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { leisurePack } from '../../lib/leisureContent';
import { queueOfflineNote } from '../../lib/offlineQueue';
import type { SupportedLanguage } from '../../lib/i18nEngine';

function languageOf(value: string): SupportedLanguage {
  if (value === 'en' || value === 'es' || value === 'de' || value === 'zh') return value;
  return 'fr';
}

export const LeisurePage: React.FC = () => {
  const { currentLanguage, currentUser, saveJournalEntry } = useApp();
  const pack = useMemo(() => leisurePack(languageOf(currentLanguage)), [currentLanguage]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const finished = step >= pack.questions.length;
  const winner = finished
    ? answers.sort((a, b) => answers.filter((item) => item === b).length - answers.filter((item) => item === a).length)[0] || 'a'
    : '';
  const portrait = pack.portraits[winner] || pack.portraits.a;

  const keepNote = () => {
    const title = portrait.title;
    const text = `${portrait.text} ${pack.disclaimer}`;
    if (!navigator.onLine || !currentUser) {
      const queued = queueOfflineNote({ kind: 'leisure_note', title, text, tag: 'loisir' });
      setNotice(queued.ok ? pack.kept : queued.reason);
      return;
    }
    saveJournalEntry({ title, content: text, category: 'Loisir', isDraft: true });
    setNotice(pack.kept);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <section className="rounded-3xl border-2 border-[#0F9F6E]/30 bg-white p-5 sm:p-7 shadow-sm space-y-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#7F1D3F]">
          <Puzzle className="w-3.5 h-3.5" />
          {pack.eyebrow}
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-[#1F2937]">{pack.title}</h1>
        <p className="text-sm sm:text-base font-medium text-[#1F2937]/80">{pack.lead}</p>
        <p className="text-xs font-bold text-[#047857]">{pack.disclaimer}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-black text-[#1F2937]">{pack.riddleTitle}</h2>
        {pack.riddles.map((riddle) => (
          <article key={riddle.id} className="rounded-2xl border border-[#0F9F6E]/25 bg-white p-4">
            <p className="font-bold text-[#1F2937]">{riddle.prompt}</p>
            <button
              type="button"
              onClick={() => setOpenId(openId === riddle.id ? null : riddle.id)}
              className="mt-3 px-3 py-1.5 rounded-full bg-[#0F9F6E] text-white text-xs font-extrabold"
            >
              {openId === riddle.id ? pack.hide : pack.reveal}
            </button>
            {openId === riddle.id && <p className="mt-2 text-sm font-extrabold text-[#7F1D3F]">{riddle.answer}</p>}
          </article>
        ))}
      </section>

      <section className="rounded-3xl border-2 border-[#7F1D3F]/25 bg-[#fff7ed] p-5 space-y-4">
        <h2 className="text-lg font-black text-[#1F2937] inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#0F9F6E]" />
          {finished ? pack.resultTitle : pack.quizTitle}
        </h2>
        {!finished ? (
          <>
            <p className="font-bold text-[#1F2937]">{pack.questions[step].prompt}</p>
            <div className="grid gap-2">
              {pack.questions[step].choices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => {
                    setAnswers((prev) => [...prev, choice.id]);
                    setStep((value) => value + 1);
                  }}
                  className="text-left px-4 py-3 rounded-2xl bg-white border border-[#0F9F6E]/30 font-bold text-sm text-[#1F2937] hover:border-[#0F9F6E]"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h3 className="text-xl font-black text-[#047857]">{portrait.title}</h3>
            <p className="text-sm font-medium text-[#1F2937]">{portrait.text}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep(0);
                  setAnswers([]);
                  setNotice(null);
                }}
                className="px-4 py-2 rounded-full border-2 border-[#7F1D3F] text-[#7F1D3F] text-xs font-extrabold"
              >
                {pack.again}
              </button>
              <button
                type="button"
                onClick={keepNote}
                className="px-4 py-2 rounded-full bg-[#0F9F6E] text-white text-xs font-extrabold"
              >
                {pack.keep}
              </button>
              <Link to="/conseils" className="px-4 py-2 rounded-full bg-white border border-[#0F9F6E]/40 text-xs font-extrabold text-[#047857]">
                Conseils
              </Link>
            </div>
            {notice && <p className="text-xs font-bold text-[#047857]">{notice}</p>}
          </>
        )}
      </section>
    </div>
  );
};
