import { describe, expect, it } from 'vitest';
import {
  displayConversationTitle,
  formatConversationRelativeDate,
  isGenericConversationTitle,
} from './conversationTitles';

describe('isGenericConversationTitle', () => {
  it.each([['Untitled conversation'], ['untitled'], ['UNTITLED CONVERSATION'], ['  '], ['']])(
    'treats %s as generic',
    (title) => {
      expect(isGenericConversationTitle(title)).toBe(true);
    },
  );

  it.each([['Pricing discussion'], ['Untitled conversation draft']])(
    'treats %s as a real title',
    (title) => {
      expect(isGenericConversationTitle(title)).toBe(false);
    },
  );
});

describe('displayConversationTitle', () => {
  it('passes real titles through untouched', () => {
    expect(displayConversationTitle('Pricing discussion', new Date().toISOString())).toBe(
      'Pricing discussion',
    );
  });

  it('disambiguates generic titles with the relative time', () => {
    const updatedAt = new Date().toISOString();
    const shown = displayConversationTitle('Untitled conversation', updatedAt);
    expect(shown.startsWith('Untitled conversation · ')).toBe(true);
    expect(shown).toContain(formatConversationRelativeDate(updatedAt));
  });

  it('falls back to the bare label when no timestamp exists', () => {
    expect(displayConversationTitle('Untitled conversation', null)).toBe('Untitled conversation');
    expect(displayConversationTitle('', null)).toBe('Untitled conversation');
  });

  it('always includes the clock time so same-day threads differ', () => {
    const shown = displayConversationTitle('Untitled', new Date().toISOString());
    expect(shown).toMatch(/· .*\d/);
  });
});
