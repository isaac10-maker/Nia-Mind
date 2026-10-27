import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  LOCK_MS,
  REFLECT_MS,
  canOpenAnswer,
  canReveal,
  dailyLot,
  formatCountdown,
  sanitizeProgress,
  unlockMoment,
  type LeisureBank,
} from '../src/lib/leisureDay';

const prompts = JSON.parse(readFileSync('public/leisure/prompts.json', 'utf8')) as LeisureBank;
const answers = JSON.parse(readFileSync('public/leisure/answers.json', 'utf8')) as {
  items: Record<string, Record<string, string>>;
};

describe('daily leisure bank', () => {
  it('collects at least 2000 culture items and keeps answers out of riddles', () => {
    const items = [...prompts.quiz, ...prompts.riddle];
    expect(items.length).toBeGreaterThanOrEqual(2000);
    expect(prompts.quiz.length).toBeGreaterThan(500);
    expect(prompts.riddle.length).toBeGreaterThan(500);
    for (const item of [...prompts.quiz, ...prompts.riddle]) {
      expect(item).not.toHaveProperty('answer');
      for (const lang of ['fr', 'en', 'es', 'de', 'zh'] as const) {
        const answer = answers.items[item.id][lang];
        expect(item.choices[lang]).toHaveLength(3);
        expect(item.choices[lang]).toContain(answer);
        const leaked = lang === 'zh' || answer.length >= 3
          ? item.prompt[lang].toLowerCase().includes(answer.toLowerCase())
          : false;
        expect(leaked).toBe(false);
      }
    }
  });

  it('keeps quiz and riddles available the same day, then changes both after 24 hours', () => {
    const noon = Date.UTC(2026, 9, 27, 12);
    const later = noon + 60_000;
    const nextDay = noon + LOCK_MS;
    const quiz = dailyLot(prompts, noon, 'fr', 'quiz').map((item) => item.id);
    const riddle = dailyLot(prompts, noon, 'fr', 'riddle').map((item) => item.id);
    expect(dailyLot(prompts, later, 'zh', 'quiz').map((item) => item.id)).toEqual(quiz);
    expect(dailyLot(prompts, later, 'en', 'riddle').map((item) => item.id)).toEqual(riddle);
    expect(quiz).not.toEqual(riddle);
    expect(dailyLot(prompts, nextDay, 'fr', 'quiz').map((item) => item.id)).not.toEqual(quiz);
    expect(quiz).toHaveLength(5);
    expect(riddle).toHaveLength(5);
    const quizTopics = new Set(dailyLot(prompts, noon, 'fr', 'quiz').map((item) => item.topic));
    expect([...quizTopics].some((topic) => topic === 'manga' || topic === 'fiction')).toBe(true);
    expect([...quizTopics].some((topic) => topic === 'science' || topic === 'nature')).toBe(true);
    expect(quizTopics.has('events')).toBe(true);
    expect(dailyLot(prompts, noon, 'fr', 'riddle').every((item) => item.topic === 'riddle' && item.choices.length === 3)).toBe(true);
  });

  it('does not repeat a quiz item across the next quiz days', () => {
    const start = Date.UTC(2026, 0, 1);
    const seen = new Set<string>();
    for (let day = 0; day < 20; day += 1) {
      const ms = start + day * LOCK_MS;
      for (const item of dailyLot(prompts, ms, 'en', 'quiz')) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
        expect(item.choices).toHaveLength(3);
      }
    }
    expect(seen.size).toBeGreaterThan(40);
  });
});

describe('leisure gates', () => {
  it('hides the answer until a choice or 15 seconds', () => {
    expect(canReveal(REFLECT_MS - 1)).toBe(false);
    expect(canReveal(REFLECT_MS)).toBe(true);
    expect(canReveal(Number.NaN)).toBe(false);
    expect(canOpenAnswer(0, true, false)).toBe(true);
    expect(canOpenAnswer(0, false, false)).toBe(false);
    expect(canOpenAnswer(0, false, true)).toBe(true);
  });

  it('starts a 24 hour countdown only for a real completion', () => {
    const done = Date.UTC(2026, 9, 27, 8, 30);
    expect(unlockMoment(done) - done).toBe(LOCK_MS);
    expect(formatCountdown(LOCK_MS)).toBe('24:00:00');
    const clean = sanitizeProgress(
      {
        v: 1,
        lotId: 'quiz:2026-10-27',
        revealed: ['capital-Q142'],
        guesses: { 'capital-Q142': 1, '<script>': 0 },
        completedAt: done,
        unlockAt: unlockMoment(done),
        score: 3,
        total: 5,
      },
      done + 1000,
    );
    expect(clean?.unlockAt).toBe(unlockMoment(done));
    expect(clean?.guesses).toEqual({ 'capital-Q142': 1 });
    expect(sanitizeProgress({ v: 1, lotId: 'quiz:2026-10-27', revealed: ['<script>'], guesses: {} }, done)).toBeNull();
    expect(
      sanitizeProgress(
        {
          v: 1,
          lotId: 'quiz:2026-10-27',
          revealed: [],
          guesses: {},
          completedAt: done,
          unlockAt: done + 60_000,
        },
        done + 1000,
      )?.unlockAt,
    ).toBeNull();
  });
});
