'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

const SENSORY_OPTIONS = [
  { key: 'Touch & Texture',  icon: '🤲', desc: 'Hands-on, tactile play',         api: 'Tactile' },
  { key: 'Sight & Colour',   icon: '👁️', desc: 'Visual, light-based activities',  api: 'Visual' },
  { key: 'Sound & Music',    icon: '🎵', desc: 'Listening, rhythm, music',        api: 'Auditory' },
  { key: 'Body & Movement',  icon: '🏃', desc: 'Running, jumping, stretching',    api: 'Proprioceptive' },
  { key: 'Balance & Spin',   icon: '🌀', desc: 'Swinging, spinning, rocking',     api: 'Vestibular' },
]

const ENERGY_OPTIONS = [
  { label: 'Calm & Quiet',     icon: '😌', desc: 'Low stimulation, winding down',       color: 'var(--success)' },
  { label: 'Playful & Active', icon: '😄', desc: 'Moderate energy, engaged',             color: 'var(--warning)' },
  { label: 'High Energy',      icon: '🤸', desc: 'Lots of movement, burning off energy', color: 'var(--danger)' },
]

export default function ActivitiesPage() {
  const [profile, setProfile] = useState(null)
  const [latestReport, setLatestReport] = useState(null)
  const [sensory, setSensory] = useState(SENSORY_OPTIONS[0])
  const [energy, setEnergy] = useState(0)
  const [duration, setDuration] = useState('15–30 mins')
  const [activities, setActivities] = useState([])
  const [disclaimer, setDisclaimer] = useState('')
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [useReport, setUseReport] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from('profiles').select('*').eq('auth_id', user.id).single()
        if (profile) {
          setProfile(profile)
          // Load latest complete report for Pro users
          if (profile.is_pro) {
            const { data: report } = await supabase
              .from('reports')
              .select('*')
              .eq('user_id', profile.id)
              .eq('status', 'complete')
              .order('uploaded_at', { ascending: false })
              .limit(1)
              .single()
            if (report) setLatestReport(report)
          }
        }
      } catch(e) {
        console.error('Load error:', e)
      } finally {
        setProfileLoading(false)
      }
    }
    load()
  }, [])

  async function generateActivities() {
    setLoading(true)
    setError('')
    setActivities([])
    setDisclaimer('')
    setExpanded(null)

    try {
      const reportSummary = useReport && latestReport?.ai_summary
        ? JSON.stringify(latestReport.ai_summary)
        : null

      const res = await fetch('/api/generate-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: profile?.child_name || 'your child',
          age: profile?.age || 6,
          sensory: sensory.api,
          energy: ENERGY_OPTIONS[energy].label,
          duration,
          goals: profile?.primary_goals || [],
          isPro: profile?.is_pro || false,
          reportSummary
        })
      })

      if (!res.ok) {
        setError(`Generation failed (${res.status}). Please check your OpenAI API key in Vercel.`)
        return
      }

      const data = await res.json()
      if (data.error) { setError(data.error); return }
      if (!data.activities?.length) { setError('No activities returned. Please try again.'); return }

      setActivities(data.activities)
      setDisclaimer(data.disclaimer || '')

      if (profile?.id) {
        for (const act of data.activities) {
          await supabase.from('activities').insert({
            user_id: profile.id,
            title: act.title,
            description: act.description,
            sensory_tags: [act.sensory_focus || sensory.api],
            duration_min: parseInt(act.duration) || 20,
            energy_level: act.energy || ENERGY_OPTIONS[energy].label,
          })
        }
      }
    } catch(e) {
      console.error('Generate error:', e)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app mesh-bg">
      <div className="app-header">
        <Link href="/dashboard" className="btn-back">
          <span className="msi" style={{ fontSize: 20 }}>arrow_back</span>
        </Link>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>Activity Generator</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="main-scroll">
        <div className="anim-up" style={{ padding: '1.25rem 1rem 0' }}>

          {/* Child pill */}
          {profileLoading ? (
            <div style={{ height: 44, background: 'var(--surface-2)', borderRadius: 12, marginBottom: '1.25rem', width: '55%' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(19,236,182,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                {profile?.avatar || '🧒'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)' }}>
                    {profile ? `Tailored for ${profile.child_name}` : 'Loading…'}
                  </p>
                  {profile?.is_pro && (
                    <span style={{ background: 'rgba(19,236,182,.12)', color: 'var(--primary)', fontSize: '.6rem', fontWeight: 800, padding: '.15rem .5rem', borderRadius: '9999px', textTransform: 'uppercase' }}>Pro</span>
                  )}
                </div>
                {profile && <p style={{ fontSize: '.72rem', color: 'var(--text-3)' }}>Age {profile.age}</p>}
              </div>
            </div>
          )}

          {/* Pro report toggle */}
          {profile?.is_pro && latestReport && (
            <div style={{ background: 'rgba(19,236,182,.06)', border: '1px solid rgba(19,236,182,.15)', borderRadius: 'var(--radius)', padding: '.875rem 1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>📋</span>
                  <div>
                    <p style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--text-1)' }}>Use report insights</p>
                    <p style={{ fontSize: '.7rem', color: 'var(--text-3)' }}>Activities tailored from {profile.child_name}'s assessment</p>
                  </div>
                </div>
                <button onClick={() => setUseReport(u => !u)} style={{
                  width: 44, height: 24, borderRadius: '9999px', border: 'none', cursor: 'pointer',
                  background: useReport ? 'var(--primary)' : 'var(--border)', transition: 'all .2s', position: 'relative', flexShrink: 0
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: useReport ? 23 : 3, transition: 'left .2s' }} />
                </button>
              </div>
            </div>
          )}

          {/* Pro user - no report uploaded yet */}
          {profile?.is_pro && !latestReport && (
            <Link href="/reports/upload" style={{ textDecoration: 'none', display: 'block', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(96,165,250,.06)', border: '1px solid rgba(96,165,250,.18)', borderRadius: 'var(--radius)', padding: '.875rem 1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <span className="msi" style={{ fontSize: 22, color: 'var(--info)', flexShrink: 0 }}>upload_file</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--text-1)' }}>Upload a report to unlock personalised activities</p>
                  <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: 2 }}>AI will read it and tailor every activity to {profile.child_name}</p>
                </div>
                <span className="msi" style={{ color: 'var(--text-3)', fontSize: 18 }}>chevron_right</span>
              </div>
            </Link>
          )}

          {/* Free user - science badge + report nudge */}
          {!profile?.is_pro && (
            <div style={{ background: 'rgba(96,165,250,.06)', border: '1px solid rgba(96,165,250,.15)', borderRadius: 'var(--radius)', padding: '.875rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '.75rem' }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>🔬</span>
              <div>
                <p style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--text-1)' }}>Science-based activities</p>
                <p style={{ fontSize: '.72rem', color: 'var(--text-2)', marginTop: 2, lineHeight: 1.6 }}>Based on ABA, Sensory Integration & DIR/Floortime research. <Link href="/subscription" style={{ color: 'var(--primary)', fontWeight: 700 }}>Upgrade to Pro</Link> to personalise with {profile?.child_name || 'your child'}'s assessment report.</p>
              </div>
            </div>
          )}

          {/* Sensory Focus */}
          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.625rem' }}>
            What type of activity?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.25rem' }}>
            {SENSORY_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => setSensory(opt)} style={{
                display: 'flex', alignItems: 'center', gap: '.875rem',
                padding: '.75rem 1rem', borderRadius: 'var(--radius)',
                fontFamily: 'Lexend, sans-serif', cursor: 'pointer', textAlign: 'left',
                border: sensory.key === opt.key ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                background: sensory.key === opt.key ? 'rgba(19,236,182,.08)' : 'var(--surface)',
                transition: 'all .15s'
              }}>
                <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '.875rem', fontWeight: 700, color: sensory.key === opt.key ? 'var(--primary)' : 'var(--text-1)' }}>{opt.key}</p>
                  <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: 1 }}>{opt.desc}</p>
                </div>
                {sensory.key === opt.key && (
                  <span className="msi fill" style={{ color: 'var(--primary)', fontSize: 20, flexShrink: 0 }}>check_circle</span>
                )}
              </button>
            ))}
          </div>

          {/* Energy */}
          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.625rem' }}>How is your child feeling right now?</p>
          <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem' }}>
            {ENERGY_OPTIONS.map((opt, i) => (
              <button key={opt.label} onClick={() => setEnergy(i)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.25rem',
                padding: '.75rem .5rem', borderRadius: 'var(--radius)',
                fontFamily: 'Lexend, sans-serif', cursor: 'pointer',
                border: energy === i ? `1.5px solid ${opt.color}` : '1.5px solid var(--border)',
                background: energy === i ? `${opt.color}18` : 'var(--surface)',
                transition: 'all .15s'
              }}>
                <span style={{ fontSize: '1.4rem' }}>{opt.icon}</span>
                <p style={{ fontSize: '.65rem', fontWeight: 700, color: energy === i ? opt.color : 'var(--text-2)', textAlign: 'center', lineHeight: 1.3 }}>{opt.label}</p>
              </button>
            ))}
          </div>

          {/* Duration + Generate */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', alignItems: 'end', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.5rem' }}>How long do you have?</p>
              <select className="select-input" value={duration} onChange={e => setDuration(e.target.value)} style={{ height: '2.875rem' }}>
                <option>5–15 mins</option>
                <option>15–30 mins</option>
                <option>30–60 mins</option>
                <option>1 hour+</option>
              </select>
            </div>
            <button onClick={generateActivities} disabled={loading} className="btn btn-primary" style={{ height: '2.875rem', fontSize: '.875rem' }}>
              {loading
                ? <><div className="spinner" style={{ width: 16, height: 16 }} />&nbsp;Creating…</>
                : <><span className="msi" style={{ fontSize: 18 }}>auto_awesome</span> Generate</>}
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '0 1rem' }} />

        {/* Results */}
        <div style={{ padding: '1rem' }}>
          {error && (
            <div style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem', fontSize: '.82rem', color: 'var(--danger)', lineHeight: 1.6 }}>
              ⚠️ {error}
            </div>
          )}

          {!loading && activities.length === 0 && !error && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>✨</span>
              <p style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text-2)' }}>Ready to generate</p>
              <p style={{ fontSize: '.8rem', color: 'var(--text-3)', marginTop: '.375rem', lineHeight: 1.6, maxWidth: 240, margin: '.375rem auto 0' }}>
                Choose your options above and tap <strong style={{ color: 'var(--primary)' }}>Generate</strong>
              </p>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <p style={{ fontSize: '.8rem', color: 'var(--text-3)', textAlign: 'center', marginBottom: '.25rem' }}>
                {useReport && latestReport ? '📋 Creating activities from the report…' : '🔬 Generating evidence-based activities…'}
              </p>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', gap: '.875rem' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '.75rem', background: 'var(--surface-2)', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    <div style={{ height: 14, background: 'var(--surface-2)', borderRadius: 4, width: '70%' }} />
                    <div style={{ height: 12, background: 'var(--surface-2)', borderRadius: 4, width: '100%' }} />
                    <div style={{ height: 12, background: 'var(--surface-2)', borderRadius: 4, width: '60%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activities.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {/* Source badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.25rem' }}>
                <p style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--text-1)' }}>
                  {profile ? `For ${profile.child_name}` : 'Your activities'}
                </p>
                <span className="chip">
                  {useReport && latestReport ? '📋 From report' : '🔬 Science-based'}
                </span>
              </div>

              {activities.map((act, idx) => (
                <div key={idx} className="anim-up" style={{ animationDelay: `${idx * .08}s`, background: 'var(--surface)', border: `1px solid ${act.from_report ? 'rgba(19,236,182,.2)' : 'var(--border)'}`, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  {act.from_report && (
                    <div style={{ background: 'rgba(19,236,182,.06)', padding: '.5rem 1rem', display: 'flex', alignItems: 'center', gap: '.5rem', borderBottom: '1px solid rgba(19,236,182,.1)' }}>
                      <span style={{ fontSize: '.7rem' }}>📋</span>
                      <p style={{ fontSize: '.7rem', color: 'var(--primary)', fontWeight: 600 }}>{act.report_reason}</p>
                    </div>
                  )}
                  {act.evidence_base && (
                    <div style={{ background: 'rgba(96,165,250,.05)', padding: '.5rem 1rem', display: 'flex', alignItems: 'center', gap: '.5rem', borderBottom: '1px solid rgba(96,165,250,.1)' }}>
                      <span style={{ fontSize: '.7rem' }}>🔬</span>
                      <p style={{ fontSize: '.7rem', color: 'var(--info)', fontWeight: 600 }}>{act.evidence_base}</p>
                    </div>
                  )}

                  <div style={{ padding: '1rem', display: 'flex', gap: '.875rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '.75rem', background: 'rgba(19,236,182,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.6rem' }}>
                      {sensory.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h5 style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--text-1)', paddingRight: '.5rem', lineHeight: 1.3 }}>{act.title}</h5>
                        <button onClick={() => setSaved(s => ({ ...s, [idx]: !s[idx] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: saved[idx] ? 'var(--primary)' : 'var(--text-3)', flexShrink: 0, padding: 0 }}>
                          <span className={`msi${saved[idx] ? ' fill' : ''}`} style={{ fontSize: 20 }}>bookmark</span>
                        </button>
                      </div>
                      <p style={{ fontSize: '.78rem', color: 'var(--text-2)', marginTop: '.25rem', lineHeight: 1.55 }}>{act.description}</p>
                      <div style={{ display: 'flex', gap: '.625rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '.65rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span className="msi" style={{ fontSize: 13 }}>schedule</span> {act.duration}
                        </span>
                        <span style={{ fontSize: '.65rem', display: 'flex', alignItems: 'center', gap: 3, color: ENERGY_OPTIONS[energy].color }}>
                          <span className="msi" style={{ fontSize: 13 }}>bolt</span> {ENERGY_OPTIONS[energy].label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setExpanded(expanded === idx ? null : idx)} style={{ width: '100%', background: 'var(--surface-2)', border: 'none', borderTop: '1px solid var(--border)', padding: '.625rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: 'var(--text-2)', fontFamily: 'Lexend, sans-serif', fontSize: '.78rem', fontWeight: 600 }}>
                    View steps & what you need
                    <span className="msi" style={{ fontSize: 18, transition: 'transform .25s', transform: expanded === idx ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                  </button>

                  {expanded === idx && (
                    <div className="anim-fade" style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {act.materials?.length > 0 && (
                        <div>
                          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: '.5rem' }}>What you need</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.375rem' }}>
                            {act.materials.map((m, i) => <span key={i} className="chip chip-muted">{m}</span>)}
                          </div>
                        </div>
                      )}
                      {act.steps?.length > 0 && (
                        <div>
                          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: '.5rem' }}>How to do it</p>
                          {act.steps.map((step, i) => (
                            <div key={i} style={{ display: 'flex', gap: '.625rem', marginBottom: '.5rem' }}>
                              <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(19,236,182,.12)', color: 'var(--primary)', fontSize: '.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                              <p style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{step}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {act.tip && (
                        <div style={{ background: 'rgba(19,236,182,.06)', border: '1px solid rgba(19,236,182,.15)', borderRadius: '.625rem', padding: '.75rem' }}>
                          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '.25rem' }}>💡 Parent tip</p>
                          <p style={{ fontSize: '.8rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{act.tip}</p>
                        </div>
                      )}
                      {act.safety_note && (
                        <div style={{ background: 'rgba(251,191,36,.05)', border: '1px solid rgba(251,191,36,.2)', borderRadius: '.625rem', padding: '.75rem' }}>
                          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--warning)', marginBottom: '.25rem' }}>⚠️ Safety note</p>
                          <p style={{ fontSize: '.78rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{act.safety_note}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Disclaimer */}
              {disclaimer && (
                <div style={{ background: 'rgba(251,191,36,.04)', border: '1px solid rgba(251,191,36,.15)', borderRadius: 'var(--radius)', padding: '.875rem 1rem', marginTop: '.25rem' }}>
                  <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--warning)', marginBottom: '.375rem' }}>⚠️ Important disclaimer</p>
                  <p style={{ fontSize: '.75rem', color: 'var(--text-3)', lineHeight: 1.7 }}>{disclaimer}</p>
                </div>
              )}

              <button onClick={generateActivities} className="btn btn-ghost btn-full" style={{ height: '3rem', marginTop: '.25rem' }}>
                <span className="msi" style={{ fontSize: 18 }}>refresh</span>
                Generate different ideas
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav active="activities" />
    </div>
  )
}
