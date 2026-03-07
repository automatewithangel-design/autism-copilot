'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
  }

  return (
    <div className="app mesh-bg" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '.875rem 1rem' }}>
        <div style={{ width: 36 }} />
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>Login</h2>
        <div style={{ width: 36 }} />
      </div>

      {/* Hero */}
      <div className="anim-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 1.5rem 1.25rem' }}>
        <div style={{ width: 80, height: 80, borderRadius: 22, background: 'rgba(19,236,182,.12)', border: '1px solid rgba(19,236,182,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(19,236,182,.15)', marginBottom: '1.25rem' }}>
          <span className="msi fill" style={{ fontSize: 40, color: 'var(--primary)' }}>diversity_4</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-1)', textAlign: 'center' }}>Welcome back</h1>
        <p style={{ fontSize: '.875rem', color: 'var(--text-2)', textAlign: 'center', marginTop: '.5rem', maxWidth: 260, lineHeight: 1.6 }}>Your child's support companion is ready.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="anim-up d2" style={{ flex: 1, padding: '0 1.25rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

        {/* Google */}
        <button type="button" onClick={handleGoogle} className="btn btn-full" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-1)', gap: '.75rem', height: '3.25rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: '.72rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Email */}
        <div>
          <label className="field-label">Email Address</label>
          <input className={`input${error ? ' error' : ''}`} type="email" placeholder="parent@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        {/* Password */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem', padding: '0 .2rem' }}>
            <label className="field-label" style={{ marginBottom: 0 }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: '.75rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
          </div>
          <div style={{ position: 'relative' }}>
            <input className={`input${error ? ' error' : ''}`} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required style={{ paddingRight: '3rem' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '.875rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
              <span className="msi" style={{ fontSize: 20 }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
          {error && <p className="error-msg"><span className="msi" style={{ fontSize: 14 }}>error</span>{error}</p>}
        </div>

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '.25rem' }}>
          {loading ? <><div className="spinner" />&nbsp;Logging in…</> : <>Login to Copilot <span className="msi" style={{ fontSize: 18 }}>arrow_forward</span></>}
        </button>

        <p style={{ textAlign: 'center', fontSize: '.825rem', color: 'var(--text-3)', marginTop: 'auto', paddingTop: '.5rem' }}>
          New here?{' '}
          <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Create an account</Link>
        </p>
      </form>
    </div>
  )
}
