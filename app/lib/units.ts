// The database and calorie-calc.ts (Mifflin-St Jeor) both work in metric
// (kg, cm) — that's the universal formula standard and what's stored in
// Supabase. These helpers convert at the UI boundary only, so users
// enter/see lbs and feet+inches, matching US conventions.

export function lbsToKg(lbs: number): number {
  return lbs / 2.20462;
}

export function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function formatWeightLbs(kg: number | null | undefined): string {
  if (kg === null || kg === undefined) return "—";
  return `${Math.round(kgToLbs(kg) * 10) / 10} lb`;
}

export function formatHeightFtIn(cm: number | null | undefined): string {
  if (cm === null || cm === undefined) return "—";
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}'${inches}"`;
}
