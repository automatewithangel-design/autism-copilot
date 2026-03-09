'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const SENSORY_OPTIONS = ['Tactile', 'Visual', 'Auditory', 'Proprioceptive', 'Vestibular']
const GOAL_OPTIONS = ['Improve communication', 'Build social skills', 'Sensory regulation', 'Daily living skills', 'Emotional regulation', 'Physical activity']
const AVATARS = ['🧒', '👦', '👧', '🧑', '⭐', '🌟']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [childName, setChildName] = useState('')
  const [age, setAge] = useState('')
  const [avatar, setAvatar] = useState('🧒')
  const [sensory, setSensory] = useState([])
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleSensory(s) {
    setSensory(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }
  function toggleGoal(g) {
    setGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])
  }

  async function handleFinish() {
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('profiles').insert({
      auth_id: user.id,
      child_name: childName.trim(),
      age: parseInt(age),
      avatar,
      sensory_profile: sensory,
      primary_goals: goals,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="app mesh-bg" style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>

      {/* Progress */}
      <div style={{ padding: '1rem 1.25rem .5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
          <span style={{ fontSize: '.72rem', color: 'var(--text-3)', fontWeight: 600 }}>Step {step} of 3</span>
          <span style={{ fontSize: '.72rem', color: 'var(--primary)', fontWeight: 700 }}>{Math.round((step / 3) * 100)}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      {/* Step 1 — Basic info */}
      {step === 1 && (
        <div className="anim-up" style={{ flex: 1, padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)' }}>Tell us about your child</h1>
            <p style={{ fontSize: '.85rem', color: 'var(--text-2)', marginTop: '.375rem', lineHeight: 1.6 }}>We'll use this to personalise every activity and recommendation.</p>
          </div>

          {/* Avatar picker */}
          <div>
            <label className="field-label">Choose an avatar</label>
            <div style={{ display: 'flex', gap: '.625rem', flexWrap: 'wrap' }}>
              {AVATARS.map(a => (
                <button key={a} onClick={() => setAvatar(a)} style={{ width: 52, height: 52, borderRadius: '.75rem', fontSize: '1.5rem', cursor: 'pointer', background: avatar === a ? 'rgba(19,236,182,.15)' : 'var(--surface)', border: avatar === a ? '2px solid var(--primary)' : '1.5px solid var(--border)', transition: 'all .15s' }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="field-label">Child's first name</label>
            <input className="input" placeholder="e.g. Leo" value={childName} onChange={e => setChildName(e.target.value)} />
          </div>

          <div>
            <label className="field-label">Age</label>
            <select className="select-input" value={age} onChange={e => setAge(e.target.value)}>
              <option value="">Select age</option>
              {Array.from({ length: 18 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n} years old</option>
              ))}
            </select>
          </div>

          <button onClick={() => { if (childName && age) setStep(2) }} className="btn btn-primary btn-full btn-lg" disabled={!childName || !age} style={{ marginTop: 'auto' }}>
            Continue <span className="msi" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>
        </div>
      )}

      {/* Step 2 — Sensory preferences */}
      {step === 2 && (
        <div className="anim-up" style={{ flex: 1, padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)' }}>{childName}'s sensory preferences</h1>
            <p style={{ fontSize: '.85rem', color: 'var(--text-2)', marginTop: '.375rem', lineHeight: 1.6 }}>Select all that apply. This helps us suggest the right activities.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
            {SENSORY_OPTIONS.map(s => (
              <button key={s} onClick={() => toggleSensory(s)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'Lexend, sans-serif', fontSize: '.9rem', fontWeight: 600, background: sensory.includes(s) ? 'rgba(19,236,182,.1)' : 'var(--surface)', border: sensory.includes(s) ? '1.5px solid var(--primary)' : '1.5px solid var(--border)', color: sensory.includes(s) ? 'var(--primary)' : 'var(--text-2)', transition: 'all .15s' }}>
                {s}
                {sensory.includes(s) && <span className="msi fill" style={{ fontSize: 20, color: 'var(--primary)' }}>check_circle</span>}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '.75rem', marginTop: 'auto' }}>
            <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ flex: 1, height: '3.25rem' }}>Back</button>
            <button onClick={() => setStep(3)} className="btn btn-primary" style={{ flex: 2, height: '3.25rem' }} disabled={sensory.length === 0}>
              Continue <span className="msi" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Goals */}
      {step === 3 && (
        <div className="anim-up" style={{ flex: 1, padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)' }}>What are your goals?</h1>
            <p style={{ fontSize: '.85rem', color: 'var(--text-2)', marginTop: '.375rem', lineHeight: 1.6 }}>Choose the areas you'd most like to support for {childName}.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
            {GOAL_OPTIONS.map(g => (
              <button key={g} onClick={() => toggleGoal(g)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'Lexend, sans-serif', fontSize: '.9rem', fontWeight: 600, background: goals.includes(g) ? 'rgba(19,236,182,.1)' : 'var(--surface)', border: goals.includes(g) ? '1.5px solid var(--primary)' : '1.5px solid var(--border)', color: goals.includes(g) ? 'var(--primary)' : 'var(--text-2)', transition: 'all .15s' }}>
                {g}
                {goals.includes(g) && <span className="msi fill" style={{ fontSize: 20, color: 'var(--primary)' }}>check_circle</span>}
              </button>
            ))}
          </div>

          {error && <p className="error-msg"><span className="msi" style={{ fontSize: 14 }}>error</span>{error}</p>}

          <div style={{ display: 'flex', gap: '.75rem', marginTop: 'auto' }}>
            <button onClick={() => setStep(2)} className="btn btn-ghost" style={{ flex: 1, height: '3.25rem' }}>Back</button>
            <button onClick={handleFinish} className="btn btn-primary" style={{ flex: 2, height: '3.25rem' }} disabled={goals.length === 0 || loading}>
              {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} />&nbsp;Saving…</> : <>Let's go! 🎉</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
