/** Single source of truth for pricing card bullets — keep in sync with landing FEATURES in app/page.tsx */

export const PLAN_FEATURES = {
  free: [
    '10-minute Real Interview sessions',
    'Real-time transcription',
    'Context-aware answers',
    'Mock Interview mode',
    'Stealth mode overlay',
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
    'Auto-Typer',
    'Paraphrase & Humanize answers',
    'Claude Opus 4.5 model',
    'Early access to new features',
    'Dedicated support channel',
  ],
} as const
