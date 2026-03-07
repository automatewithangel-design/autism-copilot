'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    if (!agreed) { setError('Please agree to the terms to continue.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/onboarding/basic` }
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding/basic` }
    })
  }

  if (success) return (
    <div className="app mesh-bg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '2rem', textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(74,222,128,.12)', border: '1px solid rgba(74,222,128,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <span className="msi fill" style={{ fontSize: 40, color: 'var(--success)' }}>mark_email_read</span>
      </div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: '.75rem' }}>Check your email</h1>
      <p style={{ fontSize: '.875rem', color: 'var(--text-2)', lineHeight: 1.7, maxWidth: 280 }}>We sent a confirmation link to <strong style={{ color: 'var(--primary)' }}>{email}</strong>. Click it to activate your account and set up your child's profile.</p>
    </div>
  )

  return (
    <div className="app mesh-bg" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '.875rem 1rem' }}>
        <Link href="/login" className="btn-back"><span className="msi" style={{ fontSize: 20 }}>arrow_back</span></Link>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>Create Account</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="anim-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem 1.5rem 1rem' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(19,236,182,.12)', border: '1px solid rgba(19,236,182,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(19,236,182,.14)', marginBottom: '1.25rem' }}>
          <span className="msi fill" style={{ fontSize: 36, color: 'var(--primary)' }}>diversity_4</span>
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)', textAlign: 'center' }}>Join Autism Copilot</h1>
        <p style={{ fontSize: '.85rem', color: 'var(--text-2)', textAlign: 'center', marginTop: '.5rem', maxWidth: 260, lineHeight: 1.6 }}>A supportive space for you and your child.</p>
      </div>

      <form onSubmit={handleRegister} className="anim-up d1" style={{ flex: 1, padding: '0 1.25rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>

        <button type="button" onClick={handleGoogle} className="btn btn-full" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-1)', gap: '.75rem', height: '3.25rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: '.72rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <div>
          <label className="field-label">Email Address</label>
          <input className="input" type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <div>
          <label className="field-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input className="input" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: '3rem' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
              <span className="msi" style={{ fontSize: 20 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
        </div>

        {error && <p className="error-msg"><span className="msi" style={{ fontSize: 14 }}>error</span>{error}</p>}

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 3, accentColor: 'var(--primary)', width: 16, height: 16, flexShrink: 0 }} />
          <span style={{ fontSize: '.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
            I agree to the <a href="#" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</a> regarding sensitive health data.
          </span>
        </label>

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
          {loading ? <><div className="spinner" />&nbsp;Creating account…</> : <>Create Account <span className="msi" style={{ fontSize: 18 }}>arrow_forward</span></>}
        </button>

        <p style={{ textAlign: 'center', fontSize: '.825rem', color: 'var(--text-3)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Log In</Link>
        </p>
      </form>
    </div>
  )
}
