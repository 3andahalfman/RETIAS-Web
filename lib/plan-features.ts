/** Single source of truth for pricing card bullets — keep in sync with landing FEATURES in app/page.tsx */

/** Shown above the tier cards so headline features are visible on every plan. */
export const ALL_PLAN_INCLUDES = [
  'Auto-Typer',
  'Stealth mode overlay',
  'Context-aware answers',
  'Real-time transcription',
] as const

export const PLAN_FEATURES = {
  free: [
    '10-minute Real Interview sessions',
    'Real-time transcription',
    'Context-aware answers',
    'Mock Interview mode',
    'Stealth mode overlay',
    'Auto-Typer',
    'CV-aware answers (3 CVs)',
    'Session history & web dashboard',
  ],
  premium: [
    'Everything in Free',
    'Unlimited Real & Mock sessions',
    'Screenshot capture & Analyse All',
    'Online Assessment & Onboarding',
    'Manual prompt bar',
    'Choose your AI model (Sonnet)',
    'Priority email support',
  ],
  premiumPlus: [
    'Everything in Premium',
    'Solved Assessment library',
    'Paraphrase & Humanize answers',
    'Claude Opus 4.5 model',
    'Early access to new features',
    'Dedicated support channel',
  ],
} as const
