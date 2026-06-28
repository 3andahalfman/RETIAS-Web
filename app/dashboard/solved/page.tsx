import { redirect } from 'next/navigation'

export default function SolvedBankRedirectPage() {
  redirect('/dashboard/screenshots?tab=solved')
}
