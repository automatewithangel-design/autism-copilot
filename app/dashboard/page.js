'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

const MOODS = [
  { key: 'great',     emoji: '😄', color: '#4ade80' },
  { key: 'good',      emoji: '🙂', color: '#60a5fa' },
  { key: 'okay',      emoji: '😐', color: '#fbbf24' },
  { key: 'hard',      emoji: '😔', color: '#f97316' },
  { key: 'very_hard', emoji: '😢', color: '#f87171' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [latestReport, setLatestReport] = useState(null)
  const [todayJournal, setTodayJournal] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('auth_id', user.id).single()

      if (!profile) { router.push('/onboarding'); return }
      setProfile(profile)

      // Load today's journal entry
      const today = new Date().toISOString().split('T')[0]
      const { data: journal } = await supabase
        .from('journal').select('*')
        .eq('user_id', profile.id)
        .eq('date', today).single()
      if (journal) setTodayJournal(journal)

      // Load recent activities
      const { data: activities } = await supabase
        .from('activities').select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(3)
      setRecentActivities(activities || [])

      // Load latest report for Pro users
      if (profile.is_pro) {
        const { data: report } = await supabase
          .from('reports').select('*')
          .eq('user_id', profile.id)
          .eq('status', 'complete')
          .order('uploaded_at', { ascending: false })
          .limit(1).single()
        if (report) setLatestReport(report)
      }

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

  const todayMood = MOODS.find(m => m.key === todayJournal?.mood)

  if (loading) return (
    <div style={{ background: '#0d1e18', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(19,236,182,.2)', borderTopColor: '#13ecb6', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div className="app mesh-bg">
      {/* Header */}
      <div className="app-header">
        <div style={{ width: 36 }} />
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>
          {profile?.child_name}'s Copilot
        </h2>
        <Link href="/more" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
          <span className="msi" style={{ fontSize: 20, color: 'var(--text-2)' }}>person</span>
        </Link>
      </div>

      <div className="main-scroll">
        <div className="anim-up" style={{ padding: '1.25rem 1rem 0' }}>

          {/* Greeting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.875rem', marginBottom: '1.25rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(19,236,182,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
              {profile?.avatar || '🧒'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '.78rem', color: 'var(--text-3)' }}>{greeting()}</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.2 }}>
                {profile?.child_name}'s family
              </p>
            </div>
            {profile?.is_pro && (
              <div style={{ background: 'rgba(19,236,182,.1)', border: '1px solid rgba(19,236,182,.2)', borderRadius: '9999px', padding: '.25rem .75rem', display: 'flex', alignItems: 'center', gap: '.375rem' }}>
                <span style={{ fontSize: '.7rem' }}>🌟</span>
                <p style={{ fontSize: '.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Pro</p>
              </div>
            )}
          </div>

          {/* Today's mood card */}
          {todayJournal ? (
            <Link href="/journal" style={{ textDecoration: 'none', display: 'block', marginBottom: '1.25rem' }}>
              <div style={{ background: `${todayMood?.color}10`, border: `1px solid ${todayMood?.color}30`, borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '.875rem' }}>
                <span style={{ fontSize: '2rem' }}>{todayMood?.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '.72rem', color: 'var(--text-3)', fontWeight: 600 }}>Today's mood logged ✓</p>
                  {todayJournal.notes && (
                    <p style={{ fontSize: '.8rem', color: 'var(--text-2)', marginTop: '.2rem', lineHeight: 1.5 }} className="truncate">"{todayJournal.notes}"</p>
                  )}
                  {todayJournal.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '.3rem', marginTop: '.375rem', flexWrap: 'wrap' }}>
                      {todayJournal.tags.slice(0, 3).map((t, i) => (
                        <span key={i} style={{ fontSize: '.6rem', color: 'var(--text-3)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '9999px', padding: '.15rem .5rem' }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="msi" style={{ color: 'var(--text-3)', fontSize: 18 }}>chevron_right</span>
              </div>
            </Link>
          ) : (
            <Link href="/journal" style={{ textDecoration: 'none', display: 'block', marginBottom: '1.25rem' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(19,236,182,.08), rgba(96,165,250,.04))', border: '1px solid rgba(19,236,182,.15)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '.875rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(19,236,182,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem' }}>📝</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text-1)' }}>How is {profile?.child_name} today?</p>
                  <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: 2 }}>Tap to log today's mood and notes</p>
                </div>
                <span className="msi fill" style={{ color: 'var(--primary)', fontSize: 22 }}>add_circle</span>
              </div>
            </Link>
          )}

          {/* Pro report recommendations */}
          {profile?.is_pro && latestReport?.ai_summary && (
            <div style={{ background: 'linear-gradient(135deg, rgba(19,236,182,.08), rgba(96,165,250,.04))', border: '1px solid rgba(19,236,182,.2)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <span style={{ fontSize: '1rem' }}>📋</span>
                  <p style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--primary)' }}>From {profile.child_name}'s Report</p>
                </div>
                <Link href="/reports/analysis" style={{ fontSize: '.7rem', color: 'var(--text-3)', textDecoration: 'none' }}>View all →</Link>
              </div>
              {latestReport.ai_summary.recommended_focus?.slice(0, 2).map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: '.625rem', marginBottom: i === 0 ? '.625rem' : 0 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(19,236,182,.12)', color: 'var(--primary)', fontSize: '.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                  <div>
                    <p style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--text-1)' }}>{f.area}</p>
                    <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: 1 }}>{f.home_activity}</p>
                  </div>
                </div>
              ))}
              <Link href="/activities" style={{ textDecoration: 'none', display: 'block', marginTop: '.875rem' }}>
                <div style={{ background: 'var(--primary)', borderRadius: '.625rem', padding: '.625rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem' }}>
                  <span className="msi" style={{ fontSize: 16, color: '#0d1e18' }}>auto_awesome</span>
                  <p style={{ fontSize: '.82rem', fontWeight: 800, color: '#0d1e18' }}>Generate report-based activities</p>
                </div>
              </Link>
            </div>
          )}

          {/* Quick actions grid */}
          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.75rem' }}>Quick actions</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.625rem', marginBottom: '1.25rem' }}>
            {[
              { href: '/activities', icon: 'auto_awesome', emoji: '✨', label: 'Generate Activity', desc: 'AI-powered ideas', color: 'var(--primary)', bg: 'rgba(19,236,182,.1)' },
              { href: '/meltdown', icon: 'emergency', emoji: '🆘', label: 'Meltdown Guide', desc: 'Immediate help', color: 'var(--danger)', bg: 'rgba(248,113,113,.1)' },
              { href: '/journal', icon: 'book', emoji: '📓', label: 'Daily Journal', desc: 'Log today', color: '#60a5fa', bg: 'rgba(96,165,250,.1)' },
              { href: '/insights', icon: 'analytics', emoji: '📊', label: 'Insights', desc: 'View trends', color: 'var(--warning)', bg: 'rgba(251,191,36,.1)' },
            ].map((item, i) => (
              <Link key={i} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.5rem', height: '100%', transition: 'border-color .15s' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '.625rem', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                    {item.emoji}
                  </div>
                  <div>
                    <p style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--text-1)' }}>{item.label}</p>
                    <p style={{ fontSize: '.7rem', color: 'var(--text-3)', marginTop: 2 }}>{item.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pro features row */}
          {profile?.is_pro ? (
            <>
              <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.75rem' }}>Pro features</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.625rem', marginBottom: '1.25rem' }}>
                {[
                  { href: '/expert', emoji: '🤖', label: 'AI Expert Chat', desc: 'Ask anything', color: 'rgba(19,236,182,.1)' },
                  { href: '/reports/upload', emoji: '📋', label: 'Upload Report', desc: 'AI analysis', color: 'rgba(96,165,250,.1)' },
                ].map((item, i) => (
                  <Link key={i} href={item.href} style={{ textDecoration: 'none' }}>
                    <div style={{ background: 'var(--surface)', border: '1px solid rgba(19,236,182,.15)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '.625rem', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                        {item.emoji}
                      </div>
                      <div>
                        <p style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--text-1)' }}>{item.label}</p>
                        <p style={{ fontSize: '.7rem', color: 'var(--text-3)', marginTop: 2 }}>{item.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            /* Free user upgrade nudge */
            <Link href="/subscription" style={{ textDecoration: 'none', display: 'block', marginBottom: '1.25rem' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(19,236,182,.08), rgba(96,165,250,.04))', border: '1px solid rgba(19,236,182,.2)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '.875rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(19,236,182,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem' }}>🌟</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text-1)' }}>Unlock Pro features</p>
                  <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: 2 }}>Report analysis · AI Chat · Personalised activities</p>
                </div>
                <div style={{ background: 'var(--primary)', color: '#0d1e18', borderRadius: '9999px', padding: '.3rem .75rem', fontSize: '.7rem', fontWeight: 800, flexShrink: 0 }}>₱199/mo</div>
              </div>
            </Link>
          )}

          {/* Recent activities */}
          {recentActivities.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)' }}>Recent activities</p>
                <Link href="/activities" style={{ fontSize: '.72rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>See all →</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.5rem' }}>
                {recentActivities.map((act, i) => (
                  <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.875rem 1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '.5rem', background: 'rgba(19,236,182,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>✨</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.title}</p>
                      <p style={{ fontSize: '.7rem', color: 'var(--text-3)', marginTop: 1 }}>{act.sensory_tags?.[0]} · {act.energy_level}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* No activities yet */}
          {recentActivities.length === 0 && (
            <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>✨</p>
              <p style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--text-2)' }}>No activities yet</p>
              <p style={{ fontSize: '.75rem', color: 'var(--text-3)', marginTop: '.375rem', marginBottom: '.875rem' }}>Generate your first AI-powered activity for {profile?.child_name}</p>
              <Link href="/activities" className="btn btn-primary" style={{ padding: '.625rem 1.25rem', height: 'auto', fontSize: '.82rem' }}>
                Generate Activity
              </Link>
            </div>
          )}

        </div>
      </div>

      <BottomNav active="home" />
    </div>
  )
}
