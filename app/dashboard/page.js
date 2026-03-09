'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recentActivities, setRecentActivities] = useState([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', user.id)
        .single()

      if (!profile) {
        // No profile yet — need to create one
        router.push('/onboarding')
        return
      }
      setProfile(profile)

      // Load recent activities
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(3)
      setRecentActivities(activities || [])
      setLoading(false)
    }
    load()
  }, [])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) return (
    <div style={{ background: '#0d1e18', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(19,236,182,.2)', borderTopColor: '#13ecb6', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div className="app mesh-bg">
      {/* Header */}
      <div className="app-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(19,236,182,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🧒</div>
          <div>
            <p style={{ fontSize: '.65rem', color: 'var(--text-3)', fontWeight: 600 }}>{greeting()}</p>
            <p style={{ fontSize: '.9rem', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{profile?.child_name}'s Copilot</p>
          </div>
        </div>
        <Link href="/more" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--text-2)' }}>
          <span className="msi" style={{ fontSize: 20 }}>person</span>
        </Link>
      </div>

      <div className="main-scroll">
        {/* Hero card */}
        <div className="anim-up" style={{ padding: '1.25rem 1rem 0' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(19,236,182,.12) 0%, rgba(96,165,250,.06) 100%)', border: '1px solid rgba(19,236,182,.2)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(19,236,182,.06)' }} />
            <p style={{ fontSize: '.75rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.5rem' }}>Today's Focus</p>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.3, marginBottom: '.75rem' }}>
              How is {profile?.child_name} feeling today?
            </h2>
            <Link href="/activities" className="btn btn-primary" style={{ display: 'inline-flex', padding: '.625rem 1.25rem', fontSize: '.85rem', height: 'auto' }}>
              <span className="msi" style={{ fontSize: 16 }}>auto_awesome</span>
              Generate Activity
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="anim-up d1" style={{ padding: '0 1rem 1.25rem' }}>
          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.75rem' }}>Quick Actions</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.625rem' }}>
            {[
              { icon: 'emergency_home', label: 'Meltdown\nGuide', href: '/meltdown', color: 'var(--danger)', bg: 'rgba(248,113,113,.1)', border: 'rgba(248,113,113,.2)' },
              { icon: 'book', label: 'Daily\nJournal', href: '/journal', color: 'var(--primary)', bg: 'rgba(19,236,182,.1)', border: 'rgba(19,236,182,.2)' },
              { icon: 'upload_file', label: 'Upload\nReport', href: '/reports/upload', color: 'var(--info)', bg: 'rgba(96,165,250,.1)', border: 'rgba(96,165,250,.2)' },
            ].map((item, i) => (
              <Link key={i} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: item.bg, border: `1px solid ${item.border}`, borderRadius: 'var(--radius)', padding: '.875rem .5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.375rem', textAlign: 'center' }}>
                  <span className="msi" style={{ fontSize: 26, color: item.color }}>{item.icon}</span>
                  <p style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--text-2)', lineHeight: 1.3, whiteSpace: 'pre-line' }}>{item.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Child info */}
        <div className="anim-up d2" style={{ padding: '0 1rem 1.25rem' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.875rem' }}>
              <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)' }}>{profile?.child_name}'s Profile</p>
              <Link href="/more" style={{ fontSize: '.75rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Edit</Link>
            </div>
            <div style={{ display: 'flex', gap: '.875rem', alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(19,236,182,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🧒</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-1)' }}>{profile?.child_name}</p>
                <p style={{ fontSize: '.78rem', color: 'var(--text-3)', marginTop: '.15rem' }}>Age {profile?.age}</p>
                {profile?.sensory_profile?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.375rem', marginTop: '.5rem' }}>
                    {profile.sensory_profile.map((s, i) => <span key={i} className="chip chip-muted" style={{ fontSize: '.6rem' }}>{s}</span>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent activities */}
        <div className="anim-up d3" style={{ padding: '0 1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
            <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)' }}>Recent Activities</p>
            <Link href="/activities" style={{ fontSize: '.75rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>See All</Link>
          </div>

          {recentActivities.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center' }}>
              <span className="msi" style={{ fontSize: 36, color: 'var(--border)', display: 'block', marginBottom: '.75rem' }}>auto_awesome</span>
              <p style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text-2)' }}>No activities yet</p>
              <p style={{ fontSize: '.78rem', color: 'var(--text-3)', marginTop: '.25rem' }}>Generate your first activity for {profile?.child_name}!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
              {recentActivities.map((act, i) => (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.875rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '.625rem', background: 'rgba(19,236,182,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="msi" style={{ color: 'var(--primary)', fontSize: 20 }}>auto_awesome</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--text-1)' }}>{act.title}</p>
                    <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: '.15rem' }}>{act.energy_level} energy · {act.duration_min} mins</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Expert CTA */}
        <div className="anim-up d4" style={{ padding: '0 1rem 1.5rem' }}>
          <Link href="/expert" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'linear-gradient(135deg, rgba(96,165,250,.08), rgba(19,236,182,.06))', border: '1px solid rgba(96,165,250,.2)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '.875rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(96,165,250,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="msi fill" style={{ color: 'var(--info)', fontSize: 22 }}>smart_toy</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text-1)' }}>Ask the AI Expert</p>
                <p style={{ fontSize: '.75rem', color: 'var(--text-3)', marginTop: 2 }}>Get personalised advice for {profile?.child_name}</p>
              </div>
              <span className="msi" style={{ color: 'var(--text-3)', fontSize: 20 }}>chevron_right</span>
            </div>
          </Link>
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  )
}
