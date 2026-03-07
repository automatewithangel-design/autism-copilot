'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

export default function MorePage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data } = await supabase.from('profiles').select('*').eq('auth_id', user.id).single()
      if (data) setProfile(data)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const menuItems = [
    { icon: 'book', label: 'Daily Journal', desc: 'Log activities and moods', href: '/journal', color: 'var(--primary)' },
    { icon: 'analytics', label: 'Insights & Trends', desc: 'Weekly progress overview', href: '/insights', color: 'var(--warning)' },
    { icon: 'upload_file', label: 'Upload Assessment', desc: 'AI-powered report analysis', href: '/reports/upload', color: 'var(--info)' },
    { icon: 'description', label: 'Report Analysis', desc: 'View your AI summaries', href: '/reports/analysis', color: 'var(--success)' },
    { icon: 'manage_accounts', label: 'Edit Profile', desc: 'Update child info & goals', href: '/profile/edit', color: 'var(--text-2)' },
    { icon: 'workspace_premium', label: 'Subscription', desc: 'Manage your plan', href: '/subscription', color: 'var(--warning)' },
  ]

  return (
    <div className="app mesh-bg">
      <div className="app-header">
        <div style={{ width: 36 }} />
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>More</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="main-scroll">
        {/* Profile card */}
        <div className="anim-up" style={{ padding: '1.25rem 1rem .5rem' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(19,236,182,.1),rgba(96,165,250,.06))', border: '1px solid rgba(19,236,182,.15)', borderRadius: 'var(--radius)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(19,236,182,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>🧒</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.2rem' }}>Caring for</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>{profile?.child_name || '—'}</p>
              <p style={{ fontSize: '.78rem', color: 'var(--text-2)', marginTop: '.15rem' }}>Age {profile?.age} · {user?.email}</p>
            </div>
            <Link href="/profile/edit" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(19,236,182,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--primary)' }}>
              <span className="msi" style={{ fontSize: 18 }}>edit</span>
            </Link>
          </div>
        </div>

        {/* Menu items */}
        <div className="anim-up d1" style={{ padding: '.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
          {menuItems.map((item, i) => (
            <Link key={i} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.875rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.875rem 1rem', transition: 'border-color .2s' }}>
                <div style={{ width: 44, height: 44, borderRadius: '.625rem', background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="msi" style={{ color: item.color, fontSize: 22 }}>{item.icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text-1)' }}>{item.label}</p>
                  <p style={{ fontSize: '.75rem', color: 'var(--text-3)', marginTop: 2 }}>{item.desc}</p>
                </div>
                <span className="msi" style={{ color: 'var(--text-3)', fontSize: 18 }}>chevron_right</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Logout */}
        <div className="anim-up d2" style={{ padding: '.25rem 1rem 1.5rem' }}>
          <button onClick={handleLogout} className="btn btn-danger btn-full" style={{ height: '3rem' }}>
            <span className="msi" style={{ fontSize: 20 }}>logout</span>
            Sign Out
          </button>
          <p style={{ textAlign: 'center', fontSize: '.72rem', color: 'var(--text-3)', marginTop: '.875rem' }}>Autism Copilot v1.0 · Made with ❤️ for families</p>
        </div>
      </div>

      <BottomNav active="more" />
    </div>
  )
}
