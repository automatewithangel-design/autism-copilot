'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

export default function PricingPage() {
  const router = useRouter()
  const [plan, setPlan] = useState('yearly')
  const [profile, setProfile] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

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

  async function handleUpgrade() {
    if (!user) { router.push('/login'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userId: profile?.id,
          userEmail: user.email,
          childName: profile?.child_name
        })
      })
      const data = await res.json()
      if (data.invoice_url) {
        window.location.href = data.invoice_url
      } else {
        alert('Could not create payment. Please try again.')
      }
    } catch (e) {
      console.error(e)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const proFeatures = [
    { icon: '📋', text: 'Upload & AI-analyse assessment reports' },
    { icon: '🎯', text: 'Activities tailored from your child\'s report' },
    { icon: '✨', text: 'Unlimited AI activity generation' },
    { icon: '🆘', text: 'AI-powered meltdown guidance' },
    { icon: '🤖', text: 'AI Expert Chat — ask anything, anytime' },
    { icon: '📊', text: 'Insights & weekly progress trends' },
    { icon: '🔒', text: 'Secure report storage & history' },
  ]

  const freeFeatures = [
    { icon: '✅', text: '3 activity ideas per day' },
    { icon: '✅', text: 'Basic meltdown checklist' },
    { icon: '✅', text: 'Daily journal' },
    { icon: '❌', text: 'Report upload & AI analysis', locked: true },
    { icon: '❌', text: 'Report-based activities', locked: true },
    { icon: '❌', text: 'AI Expert Chat', locked: true },
  ]

  return (
    <div className="app mesh-bg">
      <div className="app-header">
        <Link href="/more" className="btn-back">
          <span className="msi" style={{ fontSize: 20 }}>arrow_back</span>
        </Link>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>Upgrade to Pro</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="main-scroll">

        {/* Hero */}
        <div className="anim-up" style={{ padding: '1.5rem 1.25rem 0', textAlign: 'center' }}>
          {profile?.is_pro ? (
            <div style={{ background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 'var(--radius)', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '.5rem' }}>🌟</span>
              <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)' }}>You're on Pro!</p>
              <p style={{ fontSize: '.82rem', color: 'var(--text-2)', marginTop: '.375rem' }}>All features are unlocked for {profile.child_name}.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(19,236,182,.1)', border: '1px solid rgba(19,236,182,.2)', color: 'var(--primary)', padding: '.35rem 1rem', borderRadius: '9999px', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '1rem' }}>
                🌟 Autism Copilot Pro
              </div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.25, marginBottom: '.75rem' }}>
                Give {profile?.child_name || 'your child'} the full experience
              </h1>
              <p style={{ fontSize: '.875rem', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 300, margin: '0 auto' }}>
                Unlock AI report analysis, unlimited activities, and personalised guidance built around your child's actual assessment.
              </p>
            </>
          )}
        </div>

        {!profile?.is_pro && (
          <>
            {/* Plan toggle */}
            <div className="anim-up d1" style={{ padding: '1.5rem 1.25rem 0' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-full)', padding: '.25rem', display: 'flex', marginBottom: '1.25rem' }}>
                {['monthly', 'yearly'].map(p => (
                  <button key={p} onClick={() => setPlan(p)} style={{
                    flex: 1, padding: '.625rem', borderRadius: '9999px',
                    fontFamily: 'Lexend, sans-serif', fontSize: '.85rem', fontWeight: 700,
                    cursor: 'pointer', border: 'none', transition: 'all .2s',
                    background: plan === p ? 'var(--primary)' : 'transparent',
                    color: plan === p ? '#0d1e18' : 'var(--text-3)',
                  }}>
                    {p === 'monthly' ? 'Monthly' : 'Yearly 🔥 Save 67%'}
                  </button>
                ))}
              </div>

              {/* Price card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(19,236,182,.12), rgba(96,165,250,.06))', border: '2px solid rgba(19,236,182,.25)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', textAlign: 'center', marginBottom: '1.25rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(19,236,182,.06)' }} />

                {plan === 'yearly' && (
                  <div style={{ display: 'inline-block', background: 'var(--danger)', color: '#fff', fontSize: '.65rem', fontWeight: 800, padding: '.25rem .75rem', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.875rem' }}>
                    Best Value — 67% Off
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '.25rem' }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)', marginTop: '.5rem' }}>₱</span>
                  <span style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
                    {plan === 'monthly' ? '199' : '799'}
                  </span>
                  <span style={{ fontSize: '.85rem', color: 'var(--text-3)', alignSelf: 'flex-end', marginBottom: '.5rem' }}>
                    /{plan === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>

                {plan === 'yearly' && (
                  <p style={{ fontSize: '.8rem', color: 'var(--primary)', marginTop: '.375rem', fontWeight: 600 }}>
                    That's only ₱66.58/month · Save ₱1,589 vs monthly
                  </p>
                )}
                {plan === 'monthly' && (
                  <p style={{ fontSize: '.78rem', color: 'var(--text-3)', marginTop: '.375rem' }}>
                    Cancel anytime · No hidden fees
                  </p>
                )}

                <div style={{ margin: '1.25rem 0 .25rem', height: 1, background: 'rgba(19,236,182,.15)' }} />
                <p style={{ fontSize: '.78rem', color: 'var(--text-3)' }}>
                  Accepts GCash · Maya · Credit/Debit Cards · Bank Transfer
                </p>
              </div>

              {/* Pro features */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.125rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.875rem' }}>Everything in Pro</p>
                {proFeatures.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: i < proFeatures.length - 1 ? '.625rem' : 0 }}>
                    <span style={{ fontSize: '1.1rem' }}>{f.icon}</span>
                    <p style={{ fontSize: '.85rem', color: 'var(--text-2)', fontWeight: 500 }}>{f.text}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button onClick={handleUpgrade} disabled={loading} className="btn btn-primary btn-full btn-lg" style={{ marginBottom: '.875rem' }}>
                {loading
                  ? <><div className="spinner" style={{ width: 18, height: 18 }} />&nbsp;Preparing checkout…</>
                  : <>{plan === 'yearly' ? '🔥 Get Yearly — Save 67%' : '✨ Upgrade to Pro Monthly'}</>
                }
              </button>

              <p style={{ fontSize: '.72rem', color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.6 }}>
                Secure payment via Xendit · You'll be redirected to complete payment · Your data is always safe
              </p>
            </div>

            {/* Free vs Pro comparison */}
            <div className="anim-up d2" style={{ padding: '1.25rem 1.25rem 1.5rem' }}>
              <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.75rem' }}>Free vs Pro</p>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                {freeFeatures.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem 1rem', borderBottom: i < freeFeatures.length - 1 ? '1px solid var(--border)' : 'none', opacity: f.locked ? .5 : 1 }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{f.icon}</span>
                    <p style={{ fontSize: '.82rem', color: f.locked ? 'var(--text-3)' : 'var(--text-2)', textDecoration: f.locked ? 'line-through' : 'none' }}>{f.text}</p>
                    {f.locked && <span className="chip chip-warn" style={{ marginLeft: 'auto', fontSize: '.58rem' }}>Pro</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav active="more" />
    </div>
  )
}
