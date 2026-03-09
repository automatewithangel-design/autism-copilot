'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

// Static evidence-based guide for FREE users
const STATIC_STEPS = [
  { icon: '🧘', action: 'Stay calm yourself first', detail: 'Your child feels your energy. Take one slow breath before doing anything.' },
  { icon: '🔇', action: 'Reduce sensory input', detail: 'Lower lights, turn off sounds, remove crowds. Less stimulation = faster recovery.' },
  { icon: '🤐', action: 'Stop talking', detail: 'Avoid instructions, questions or reasoning. Words add more to process during overload.' },
  { icon: '📏', action: 'Give space', detail: 'Stay nearby but don\'t crowd. Let your child move if they need to.' },
  { icon: '🛡️', action: 'Ensure safety only', detail: 'Only intervene physically if there is a safety risk. Otherwise wait it out.' },
  { icon: '⏳', action: 'Wait it out', detail: 'Meltdowns have a natural peak and end. Your presence is enough right now.' },
  { icon: '💙', action: 'Reconnect after', detail: 'Once calm, offer a quiet hug or just sit together. No discussion of what happened yet.' },
]

const TRIGGERS = [
  { icon: '🔊', label: 'Loud noises' },
  { icon: '💡', label: 'Bright lights' },
  { icon: '👥', label: 'Crowds' },
  { icon: '🔄', label: 'Routine change' },
  { icon: '😩', label: 'Overtired' },
  { icon: '🍽️', label: 'Hunger' },
  { icon: '👕', label: 'Uncomfortable clothes' },
  { icon: '😤', label: 'Frustration' },
  { icon: '🌡️', label: 'Too hot/cold' },
  { icon: '⏰', label: 'Transitions' },
]

export default function MeltdownGuidePage() {
  const [profile, setProfile] = useState(null)
  const [latestReport, setLatestReport] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // AI ask mode
  const [showAsk, setShowAsk] = useState(false)
  const [situation, setSituation] = useState('')
  const [selectedTriggers, setSelectedTriggers] = useState([])
  const [aiGuide, setAiGuide] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // Static checklist state
  const [checked, setChecked] = useState({})
  const [phase, setPhase] = useState('happening') // happening | calming | after

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from('profiles').select('*').eq('auth_id', user.id).single()
        if (profile) {
          setProfile(profile)
          if (profile.is_pro) {
            const { data: report } = await supabase
              .from('reports').select('*')
              .eq('user_id', profile.id)
              .eq('status', 'complete')
              .order('uploaded_at', { ascending: false })
              .limit(1).single()
            if (report) setLatestReport(report)
          }
        }
      } catch(e) { console.error(e) }
      finally { setProfileLoading(false) }
    }
    load()
  }, [])

  function toggleTrigger(label) {
    setSelectedTriggers(t => t.includes(label) ? t.filter(x => x !== label) : [...t, label])
  }

  async function askAI() {
    setAiLoading(true)
    setAiError('')
    setAiGuide(null)
    try {
      const reportContext = latestReport?.ai_summary
        ? `Report context: ${JSON.stringify(latestReport.ai_summary.sensory_triggers || [])}`
        : ''

      const res = await fetch('/api/meltdown-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: profile?.child_name,
          sensoryProfile: profile?.sensory_profile,
          situation: `${situation || 'Child is having a meltdown'}. Triggers present: ${selectedTriggers.join(', ') || 'unknown'}. ${reportContext}`
        })
      })
      if (!res.ok) { setAiError(`Failed (${res.status}). Check OpenAI billing.`); return }
      const data = await res.json()
      if (data.error) { setAiError(data.error); return }
      setAiGuide(data)
    } catch(e) {
      setAiError('Something went wrong. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const phases = [
    { key: 'happening', label: '🔴 It\'s happening now', color: 'var(--danger)' },
    { key: 'calming', label: '🟡 Starting to calm', color: 'var(--warning)' },
    { key: 'after', label: '🟢 All calm now', color: 'var(--success)' },
  ]

  const phaseSteps = {
    happening: STATIC_STEPS.slice(0, 4),
    calming: STATIC_STEPS.slice(4, 6),
    after: STATIC_STEPS.slice(6),
  }

  return (
    <div className="app mesh-bg">
      <div className="app-header">
        <Link href="/dashboard" className="btn-back">
          <span className="msi" style={{ fontSize: 20 }}>arrow_back</span>
        </Link>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>Meltdown Guide</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="main-scroll">

        {/* Emergency banner */}
        <div style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', margin: '1rem 1rem 0', borderRadius: 'var(--radius)', padding: '.875rem 1rem', display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🚨</span>
          <div>
            <p style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--danger)' }}>If your child is in danger</p>
            <p style={{ fontSize: '.75rem', color: 'var(--text-3)', marginTop: 2 }}>Call emergency services immediately. This guide is for emotional meltdowns, not medical emergencies.</p>
          </div>
        </div>

        <div className="anim-up" style={{ padding: '1.25rem 1rem 0' }}>

          {/* Phase selector */}
          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.625rem' }}>What stage are you at?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.25rem' }}>
            {phases.map(p => (
              <button key={p.key} onClick={() => setPhase(p.key)} style={{
                display: 'flex', alignItems: 'center', gap: '.75rem',
                padding: '.875rem 1rem', borderRadius: 'var(--radius)',
                fontFamily: 'Lexend, sans-serif', cursor: 'pointer', textAlign: 'left', border: 'none',
                background: phase === p.key ? `${p.color}15` : 'var(--surface)',
                outline: phase === p.key ? `2px solid ${p.color}` : '1px solid var(--border)',
                transition: 'all .15s'
              }}>
                <p style={{ fontSize: '.9rem', fontWeight: 700, color: phase === p.key ? p.color : 'var(--text-2)' }}>{p.label}</p>
                {phase === p.key && <span className="msi fill" style={{ color: p.color, fontSize: 18, marginLeft: 'auto' }}>check_circle</span>}
              </button>
            ))}
          </div>

          {/* Static checklist */}
          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.75rem' }}>
            {phase === 'happening' ? '🔴 Do these right now' : phase === 'calming' ? '🟡 As they start to settle' : '🟢 Once calm'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem', marginBottom: '1.25rem' }}>
            {phaseSteps[phase].map((step, i) => (
              <button key={i} onClick={() => setChecked(c => ({ ...c, [`${phase}-${i}`]: !c[`${phase}-${i}`] }))} style={{
                display: 'flex', gap: '.875rem', padding: '1rem',
                background: checked[`${phase}-${i}`] ? 'rgba(74,222,128,.06)' : 'var(--surface)',
                border: `1px solid ${checked[`${phase}-${i}`] ? 'rgba(74,222,128,.2)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'Lexend, sans-serif', transition: 'all .15s', width: '100%'
              }}>
                <div style={{ width: 40, height: 40, borderRadius: '.75rem', background: checked[`${phase}-${i}`] ? 'rgba(74,222,128,.12)' : 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem' }}>
                  {checked[`${phase}-${i}`] ? '✅' : step.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '.875rem', fontWeight: 700, color: checked[`${phase}-${i}`] ? 'var(--success)' : 'var(--text-1)', marginBottom: '.25rem', textDecoration: checked[`${phase}-${i}`] ? 'line-through' : 'none' }}>{step.action}</p>
                  <p style={{ fontSize: '.78rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{step.detail}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Evidence base note */}
          <div style={{ background: 'rgba(96,165,250,.05)', border: '1px solid rgba(96,165,250,.12)', borderRadius: 'var(--radius)', padding: '.875rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '.75rem' }}>
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>🔬</span>
            <p style={{ fontSize: '.75rem', color: 'var(--text-3)', lineHeight: 1.65 }}>
              This guide is based on evidence-based practices from the <strong style={{ color: 'var(--text-2)' }}>TEACCH Autism Program</strong>, <strong style={{ color: 'var(--text-2)' }}>Positive Behaviour Support (PBS)</strong>, and <strong style={{ color: 'var(--text-2)' }}>Sensory Integration Therapy</strong>. It is not a substitute for professional advice.
            </p>
          </div>

          {/* Pro AI section */}
          {profile?.is_pro ? (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                <div>
                  <p style={{ fontSize: '.9rem', fontWeight: 800, color: 'var(--text-1)' }}>🤖 Ask AI for help</p>
                  <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: 2 }}>
                    {latestReport ? `Personalised using ${profile.child_name}'s report` : 'AI-powered guidance just for your child'}
                  </p>
                </div>
                <button onClick={() => setShowAsk(s => !s)} style={{
                  background: showAsk ? 'var(--surface-2)' : 'var(--primary)', color: showAsk ? 'var(--text-2)' : '#0d1e18',
                  border: 'none', borderRadius: '9999px', padding: '.375rem .875rem',
                  fontFamily: 'Lexend, sans-serif', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer'
                }}>
                  {showAsk ? 'Hide' : 'Get AI Help'}
                </button>
              </div>

              {showAsk && (
                <div className="anim-fade" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Trigger selector */}
                  <div>
                    <p style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: '.625rem' }}>What triggered it? (tap all that apply)</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.375rem' }}>
                      {TRIGGERS.map(t => (
                        <button key={t.label} onClick={() => toggleTrigger(t.label)} style={{
                          display: 'flex', alignItems: 'center', gap: '.375rem',
                          padding: '.35rem .75rem', borderRadius: '9999px',
                          fontFamily: 'Lexend, sans-serif', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer',
                          border: selectedTriggers.includes(t.label) ? 'none' : '1px solid var(--border)',
                          background: selectedTriggers.includes(t.label) ? 'rgba(248,113,113,.15)' : 'var(--surface-2)',
                          color: selectedTriggers.includes(t.label) ? 'var(--danger)' : 'var(--text-2)',
                        }}>
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Situation */}
                  <div>
                    <p style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: '.5rem' }}>Describe what's happening (optional)</p>
                    <textarea
                      value={situation}
                      onChange={e => setSituation(e.target.value)}
                      placeholder={`e.g. ${profile?.child_name} started screaming at the supermarket after the lights flickered...`}
                      rows={3}
                      style={{
                        width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
                        borderRadius: '.625rem', padding: '.75rem', color: 'var(--text-1)',
                        fontFamily: 'Lexend, sans-serif', fontSize: '.82rem', lineHeight: 1.6,
                        resize: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <button onClick={askAI} disabled={aiLoading} className="btn btn-primary btn-full">
                    {aiLoading
                      ? <><div className="spinner" style={{ width: 16, height: 16 }} />&nbsp;Getting guidance…</>
                      : <><span className="msi" style={{ fontSize: 18 }}>psychology</span> Get personalised guidance</>
                    }
                  </button>

                  {aiError && (
                    <p style={{ fontSize: '.8rem', color: 'var(--danger)', textAlign: 'center' }}>⚠️ {aiError}</p>
                  )}

                  {/* AI Results */}
                  {aiGuide && (
                    <div className="anim-fade" style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
                      <div style={{ height: 1, background: 'var(--border)' }} />

                      {/* Immediate steps */}
                      <div>
                        <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--danger)', marginBottom: '.625rem' }}>🔴 Do this right now</p>
                        {aiGuide.immediate_steps?.map((step, i) => (
                          <div key={i} style={{ display: 'flex', gap: '.625rem', marginBottom: '.625rem' }}>
                            <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(248,113,113,.12)', color: 'var(--danger)', fontSize: '.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                            <div>
                              <p style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '.15rem' }}>{step.action}</p>
                              <p style={{ fontSize: '.78rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{step.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Breathing cue */}
                      {aiGuide.breathing_cue && (
                        <div style={{ background: 'rgba(19,236,182,.06)', border: '1px solid rgba(19,236,182,.15)', borderRadius: '.625rem', padding: '.875rem', textAlign: 'center' }}>
                          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '.375rem' }}>💙 For you right now</p>
                          <p style={{ fontSize: '.9rem', color: 'var(--text-1)', fontWeight: 600, lineHeight: 1.6 }}>"{aiGuide.breathing_cue}"</p>
                        </div>
                      )}

                      {/* Avoid */}
                      {aiGuide.avoid && (
                        <div style={{ background: 'rgba(251,191,36,.05)', border: '1px solid rgba(251,191,36,.15)', borderRadius: '.625rem', padding: '.875rem' }}>
                          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--warning)', marginBottom: '.25rem' }}>⚠️ Avoid right now</p>
                          <p style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{aiGuide.avoid}</p>
                        </div>
                      )}

                      {/* After */}
                      {aiGuide.when_calmer && (
                        <div style={{ background: 'rgba(74,222,128,.05)', border: '1px solid rgba(74,222,128,.15)', borderRadius: '.625rem', padding: '.875rem' }}>
                          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--success)', marginBottom: '.25rem' }}>🟢 Once calm</p>
                          <p style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{aiGuide.when_calmer}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Free user - upgrade nudge */
            <Link href="/subscription" style={{ textDecoration: 'none', display: 'block', marginBottom: '1.5rem' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(19,236,182,.08), rgba(96,165,250,.04))', border: '1px solid rgba(19,236,182,.2)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '.875rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(19,236,182,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.4rem' }}>🤖</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--text-1)' }}>Get AI-powered guidance</p>
                  <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: 2, lineHeight: 1.5 }}>Pro users get personalised steps based on their child's specific triggers and assessment report</p>
                </div>
                <div>
                  <span className="chip" style={{ background: 'var(--primary)', color: '#0d1e18', fontSize: '.65rem' }}>Pro</span>
                </div>
              </div>
            </Link>
          )}

          {/* Report triggers for Pro */}
          {profile?.is_pro && latestReport?.ai_summary?.sensory_triggers?.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: '.75rem' }}>📋 Known triggers from {profile.child_name}'s report</p>
              {latestReport.ai_summary.sensory_triggers.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: '.625rem', marginBottom: '.625rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚡</span>
                  <div>
                    <p style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--warning)' }}>{t.trigger}</p>
                    <p style={{ fontSize: '.75rem', color: 'var(--text-3)', marginTop: 2 }}>{t.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ background: 'rgba(251,191,36,.04)', border: '1px solid rgba(251,191,36,.12)', borderRadius: 'var(--radius)', padding: '.875rem 1rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--warning)', marginBottom: '.375rem' }}>⚠️ Disclaimer</p>
            <p style={{ fontSize: '.75rem', color: 'var(--text-3)', lineHeight: 1.7 }}>
              This guide provides general support strategies only. Every child is unique. Always consult your child's therapist, psychologist or paediatrician for personalised advice. In an emergency, call your local emergency services immediately.
            </p>
          </div>
        </div>
      </div>

      <BottomNav active="guide" />
    </div>
  )
}
