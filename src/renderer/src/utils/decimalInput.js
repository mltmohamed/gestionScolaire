/**
 * Garde une valeur decimale editable sans supprimer un separateur qui vient
 * d'etre saisi (par exemple "7,"), tout en bornant les notes completes.
 */
export function sanitizeDecimalInput(value, max = Number.POSITIVE_INFINITY) {
  const cleaned = String(value ?? '').replace(/[^\d,.]/g, '');
  if (cleaned === '') return '';

  const separatorIndex = cleaned.search(/[,.]/);
  if (separatorIndex === -1) {
    const numeric = Number(cleaned);
    if (!Number.isFinite(numeric)) return '';
    return String(Math.min(max, Math.max(0, numeric)));
  }

  const separator = cleaned[separatorIndex];
  const integerPart = cleaned.slice(0, separatorIndex).replace(/\D/g, '') || '0';
  const decimalPart = cleaned.slice(separatorIndex + 1).replace(/\D/g, '');
  const numeric = Number(`${integerPart}.${decimalPart}`);

  if (!Number.isFinite(numeric)) return '';
  if (numeric > max) return String(max);

  return `${integerPart}${separator}${decimalPart}`;
}

export function parseDecimalInput(value) {
  if (value === '' || value === null || value === undefined) return null;
  const numeric = Number(String(value).replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : null;
}
