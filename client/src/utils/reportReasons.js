export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'violence', label: 'Violent or dangerous content' },
  { value: 'nudity', label: 'Nudity or sexual content' },
  { value: 'misinformation', label: 'Misinformation' },
  { value: 'copyright', label: 'Copyright infringement' },
  { value: 'child_safety', label: 'Child safety' },
  { value: 'other', label: 'Something else' },
];

export const REPORT_REASON_LABELS = Object.fromEntries(REPORT_REASONS.map(({ value, label }) => [value, label]));