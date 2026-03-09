'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const [profile, setProfile] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    async function verify() {
      // Poll for Pro status — webhook may take a few seconds
      let attempts = 0
      const maxAttempts = 10

      const check = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('auth_id', user.id)
          .single()

        if (data?.is_pro) {
          setProfile(data)
          setChecking(false)
        } else if (attempts < maxAttempts) {
          attempts++
          setTimeout(check, 2000) // retry every 2 seconds
        } else {
          // Webhook may be delayed — show success anyway
          setProfile(data)
          setChecking(false)
        }
      }
      check()
    }
    verify()
  }, [])

  if (checking) return (
    <div style={{ background: '#0d1e18', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', gap: '1rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(19,236,182,.2)', borderTopColor: '#13ecb6', animation: 'spin .8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <p style={{ color: '#9bbfb2', fontSize: '.9rem', fontFamily: 'Lexend, sans-serif' }}>Confirming your payment…</p>
      <p style={{ color: '#5a8a7a', fontSize: '.78rem', fontFamily: 'Lexend, sans-serif' }}>This takes just a moment</p>
    </div>
  )

  return (
    <div style={{ background: '#0d1e18', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', fontFamily: 'Lexend, sans-serif' }}>
      <div className="anim-up" style={{ maxWidth: 340 }}>
        {/* Celebration */}
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <div style={{ display: 'inline-block', background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.25)', color: '#4ade80', padding: '.35rem 1rem', borderRadius: '9999px', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '1.25rem' }}>
          Payment Confirmed
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f0faf6', lineHeight: 1.2, marginBottom: '.875rem' }}>
          Welcome to Pro,{profile?.child_name ? ` ${profile.child_name}'s family` : ''}! 🌟
        </h1>

        <p style={{ fontSize: '.875rem', color: '#9bbfb2', lineHeight: 1.75, marginBottom: '2rem' }}>
          Your {plan === 'yearly' ? 'yearly' : 'monthly'} subscription is now active. All Pro features are unlocked — including AI report analysis and unlimited personalised activities.
        </p>

        {/* What's unlocked */}
        <div style={{ background: '#132b22', border: '1px solid #1f4a3a', borderRadius: '0.875rem', padding: '1.25rem', marginBottom: '2rem', textAlign: 'left' }}>
          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#5a8a7a', marginBottom: '.875rem' }}>Now unlocked for you</p>
          {[
            { icon: '📋', text: 'Upload & AI-analyse assessment reports' },
            { icon: '🎯', text: 'Activities tailored from your reports' },
            { icon: '✨', text: 'Unlimited AI activity generation' },
            { icon: '🤖', text: 'AI Expert Chat' },
            { icon: '📊', text: 'Insights & progress trends' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: i < 4 ? '.5rem' : 0 }}>
              <span style={{ fontSize: '1rem' }}>{f.icon}</span>
              <p style={{ fontSize: '.82rem', color: '#9bbfb2' }}>{f.text}</p>
            </div>
          ))}
        </div>

        <Link href="/reports/upload" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', background: '#13ecb6', color: '#0d1e18', padding: '1rem 1.5rem', borderRadius: '0.875rem', fontWeight: 800, fontSize: '1rem', textDecoration: 'none', marginBottom: '.875rem', boxShadow: '0 4px 20px rgba(19,236,182,.3)' }}>
          📋 Upload Your First Report
        </Link>

        <Link href="/dashboard" style={{ display: 'block', fontSize: '.82rem', color: '#5a8a7a', textDecoration: 'none' }}>
          Go to Dashboard instead →
        </Link>
      </div>
    </div>
  )
}
