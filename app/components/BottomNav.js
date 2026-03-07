import Link from 'next/link'

export default function BottomNav({ active }) {
  const items = [
    { key: 'home',       href: '/dashboard', icon: 'home',           label: 'Home' },
    { key: 'activities', href: '/activities', icon: 'auto_awesome',  label: 'Activities' },
    { key: 'meltdown',   href: '/meltdown',   icon: 'emergency_home', label: 'Guide',   danger: true },
    { key: 'expert',     href: '/expert',     icon: 'smart_toy',     label: 'Expert' },
    { key: 'more',       href: '/more',       icon: 'menu',          label: 'More' },
  ]

  return (
    <nav className="bottom-nav">
      {items.map(item => (
        <Link
          key={item.key}
          href={item.href}
          className={`nav-item${active === item.key ? ' active' : ''}${item.danger ? ' danger' : ''}`}
        >
          <span className={`msi${active === item.key ? ' fill' : ''}`} style={{ fontSize: 22 }}>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}
