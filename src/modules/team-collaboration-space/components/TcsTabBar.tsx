type TcsTabBarProps<T extends string> = {
  tabs: Array<{ id: T; label: string }>
  active: T
  onChange: (tab: T) => void
  ariaLabel: string
}

export function TcsTabBar<T extends string>({ tabs, active, onChange, ariaLabel }: TcsTabBarProps<T>) {
  return (
    <div className="agents-tabs tcs-detail-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          className={active === tab.id ? 'agents-tab is-active' : 'agents-tab'}
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
