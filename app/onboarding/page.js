'use client'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

const SENSORY_OPTIONS = [
  {
    key: 'Tactile',
    emoji: '🖐️',
    label: 'Touch sensitivity',
    desc: 'Bothered by clothing tags, textures, or being touched unexpectedly'
  },
  {
    key: 'Auditory',
    emoji: '👂',
    label: 'Sound sensitivity',
    desc: 'Covers ears, distressed by loud noises, crowds or background sounds'
  },
  {
    key: 'Visual',
    emoji: '👁️',
    label: 'Light sensitivity',
    desc: 'Bothered by bright lights, screens, flickering or busy visual environments'
  },
  {
    key: 'Vestibular',
    emoji: '🌀',
    label: 'Movement & balance',
    desc: 'Seeks spinning, swinging or rocking — or avoids it and gets dizzy easily'
  },
  {
    key: 'Proprioceptive',
    emoji: '💪',
    label: 'Body awareness',
    desc: 'Seeks heavy pressure, bear hugs, or crashes into things to feel grounded'
  },
  {
    key: 'Oral',
    emoji: '👄',
    label: 'Taste & smell',
    desc: 'Very picky with food textures, sensitive to strong smells, chews on objects'
  },
]

const GOAL_OPTIONS = [
  { key: 'Improve communication', emoji: '💬', label: 'Improve communication', desc: 'Words, gestures, or AAC devices' },
  { key: 'Build social skills', emoji: '🤝', label: 'Build social skills', desc: 'Playing with others, taking turns, friendships' },
  { key: 'Sensory regulation', emoji: '🧘', label: 'Sensory regulation', desc: 'Managing sensory overload and meltdowns' },
  { key: 'Daily living skills', emoji: '🏠', label: 'Daily living skills', desc: 'Getting dressed, eating, brushing teeth' },
  { key: 'Emotional regulation', emoji: '💙', label: 'Emotional regulation', desc: 'Understanding and managing feelings' },
  { key: 'Physical activity', emoji: '🏃', label: 'Physical activity', desc: 'Movement, coordination and motor skills' },
]

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

  function toggleSensory(key) {
    setSensory(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key])
  }
  function toggleGoal(key) {
    setGoals(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key])
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
        <div className="anim-up" style={{ flex: 1, padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)' }}>Does {childName} have any of these?</h1>
            <p style={{ fontSize: '.85rem', color: 'var(--text-2)', marginTop: '.375rem', lineHeight: 1.6 }}>Tap everything that sounds familiar. This helps us suggest the right activities.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
            {SENSORY_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => toggleSensory(opt.key)} style={{
                display: 'flex', alignItems: 'center', gap: '.875rem',
                padding: '.875rem 1rem', borderRadius: 'var(--radius)',
                cursor: 'pointer', fontFamily: 'Lexend, sans-serif', textAlign: 'left',
                background: sensory.includes(opt.key) ? 'rgba(19,236,182,.08)' : 'var(--surface)',
                border: sensory.includes(opt.key) ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                transition: 'all .15s'
              }}>
                <div style={{ width: 44, height: 44, borderRadius: '.75rem', background: sensory.includes(opt.key) ? 'rgba(19,236,182,.15)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                  {opt.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '.9rem', fontWeight: 700, color: sensory.includes(opt.key) ? 'var(--primary)' : 'var(--text-1)', marginBottom: '.2rem' }}>{opt.label}</p>
                  <p style={{ fontSize: '.75rem', color: 'var(--text-3)', lineHeight: 1.5 }}>{opt.desc}</p>
                </div>
                {sensory.includes(opt.key) && (
                  <span className="msi fill" style={{ fontSize: 22, color: 'var(--primary)', flexShrink: 0 }}>check_circle</span>
                )}
              </button>
            ))}
          </div>

          <p style={{ fontSize: '.72rem', color: 'var(--text-3)', textAlign: 'center', marginTop: '.25rem' }}>
            Not sure? That's okay — you can update this anytime in settings.
          </p>

          <div style={{ display: 'flex', gap: '.75rem', marginTop: 'auto', paddingTop: '.5rem' }}>
            <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ flex: 1, height: '3.25rem' }}>Back</button>
            <button onClick={() => setStep(3)} className="btn btn-primary" style={{ flex: 2, height: '3.25rem' }} disabled={sensory.length === 0}>
              Continue <span className="msi" style={{ fontSize: 18 }}>arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Goals */}
      {step === 3 && (
        <div className="anim-up" style={{ flex: 1, padding: '1.5rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-1)' }}>What would you like to work on?</h1>
            <p style={{ fontSize: '.85rem', color: 'var(--text-2)', marginTop: '.375rem', lineHeight: 1.6 }}>Choose the areas you'd most like to support for {childName}.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
            {GOAL_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => toggleGoal(opt.key)} style={{
                display: 'flex', alignItems: 'center', gap: '.875rem',
                padding: '.875rem 1rem', borderRadius: 'var(--radius)',
                cursor: 'pointer', fontFamily: 'Lexend, sans-serif', textAlign: 'left',
                background: goals.includes(opt.key) ? 'rgba(19,236,182,.08)' : 'var(--surface)',
                border: goals.includes(opt.key) ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                transition: 'all .15s'
              }}>
                <div style={{ width: 44, height: 44, borderRadius: '.75rem', background: goals.includes(opt.key) ? 'rgba(19,236,182,.15)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                  {opt.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '.9rem', fontWeight: 700, color: goals.includes(opt.key) ? 'var(--primary)' : 'var(--text-1)', marginBottom: '.2rem' }}>{opt.label}</p>
                  <p style={{ fontSize: '.75rem', color: 'var(--text-3)', lineHeight: 1.5 }}>{opt.desc}</p>
                </div>
                {goals.includes(opt.key) && (
                  <span className="msi fill" style={{ fontSize: 22, color: 'var(--primary)', flexShrink: 0 }}>check_circle</span>
                )}
              </button>
            ))}
          </div>

          {error && <p className="error-msg"><span className="msi" style={{ fontSize: 14 }}>error</span>{error}</p>}

          <div style={{ display: 'flex', gap: '.75rem', marginTop: 'auto', paddingTop: '.5rem' }}>
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
