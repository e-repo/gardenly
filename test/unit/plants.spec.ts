import { describe, expect, it } from 'vitest';
import {
  ageForm,
  categoryIcon,
  cultureCategoryOrder,
  plantAgeYears,
} from '~/modules/plots/plants';

describe('plants module', () => {
  it('provides an icon for every category', () => {
    for (const category of cultureCategoryOrder) {
      expect(categoryIcon(category)).toMatch(/^mdi-/);
    }
  });

  it('keeps the fixed category order', () => {
    expect(cultureCategoryOrder).toEqual([
      'fruit-berry',
      'vegetable-garden',
      'woody-ornamental',
      'flower',
    ]);
  });

  it('computes plant age from the planted year', () => {
    expect(plantAgeYears(2018, 2026)).toBe(8);
    expect(plantAgeYears(2026, 2026)).toBe(0);
    expect(plantAgeYears(2030, 2026)).toBe(0);
  });

  it.each([
    { age: 1, form: 'one' },
    { age: 21, form: 'one' },
    { age: 2, form: 'few' },
    { age: 4, form: 'few' },
    { age: 22, form: 'few' },
    { age: 5, form: 'many' },
    { age: 11, form: 'many' },
    { age: 12, form: 'many' },
    { age: 25, form: 'many' },
    { age: 0, form: 'many' },
  ] as const)('selects the $form plural form for age $age', ({ age, form }) => {
    expect(ageForm(age)).toBe(form);
  });
});
