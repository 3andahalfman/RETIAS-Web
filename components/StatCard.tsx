interface Props {
  label:  string
  value:  string | number
  icon:   string
  accent?: boolean
}

export default function StatCard({ label, value, icon, accent }: Props) {
  return (
    <div className="glass p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>{label}</span>
        <span className="text-base">{icon}</span>
      </div>
      <p className="font-bold truncate"
        style={{
          color: accent ? 'var(--orange, #fb923c)' : 'var(--text-1)',
          fontSize: typeof value === 'string' && value.length > 12 ? '14px' : typeof value === 'string' && value.length > 8 ? '18px' : '24px',
        }}>
        {value}
      </p>
    </div>
  )
}
