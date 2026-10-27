import { describe, expect, it } from 'vitest';
import { filterOfflineNote } from '../src/lib/offlineGuard';

describe('filtre hors ligne', () => {
  it('accepte une note simple', () => {
    expect(
      filterOfflineNote({
        kind: 'journal_note',
        title: 'Pause',
        text: 'Aujourd’hui je dépose le masque.',
        tag: 'loisir',
      })?.text
    ).toContain('masque');
  });

  it('refuse un script ou un champ inattendu', () => {
    expect(
      filterOfflineNote({
        kind: 'journal_note',
        title: 'Piège',
        text: '<script>alert(1)</script>',
        tag: 'loisir',
      })
    ).toBeNull();
    expect(
      filterOfflineNote({
        kind: 'journal_note',
        title: 'Note',
        text: 'texte simple',
        tag: 'loisir',
        payload: 'javascript:alert(1)',
      })
    ).toBeNull();
  });
});
