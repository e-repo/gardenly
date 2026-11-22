import type { CultureCategory } from '~/domain/garden';

const categoryIcons: Record<CultureCategory, string> = {
  'fruit-berry': 'mdi-food-apple-outline',
  'vegetable-garden': 'mdi-carrot',
  'woody-ornamental': 'mdi-pine-tree',
  flower: 'mdi-flower-outline',
};

export const cultureCategoryOrder: readonly CultureCategory[] = [
  'fruit-berry',
  'vegetable-garden',
  'woody-ornamental',
  'flower',
];

export function categoryIcon(category: CultureCategory): string {
  return categoryIcons[category];
}

export function plantAgeYears(
  plantedYear: number,
  currentYear = new Date().getFullYear(),
): number {
  return Math.max(0, currentYear - plantedYear);
}

export type AgeForm = 'one' | 'few' | 'many';

export function ageForm(age: number): AgeForm {
  const mod100 = age % 100;
  const mod10 = age % 10;

  if (mod10 === 1 && mod100 !== 11) {
    return 'one';
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'few';
  }

  return 'many';
}
