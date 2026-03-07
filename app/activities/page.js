'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

const SENSORY_OPTIONS = [
  { key: 'Tactile', icon: 'touch_app' },
  { key: 'Visual', icon: 'visibility' },
  { key: 'Auditory', icon: 'hearing' },
  { key: 'Proprioceptive', icon: 'accessibility_new' },
  { key: 'Vestibular', icon: 'self_improvement' },
]

const ENERGY_LABELS = ['Low', 'Medium', 'High']

export default function ActivitiesPage() {
  const [profile, setProfile] = useState(null)
  const [sensory, setSensory] = useState('Tactile')
  const [energy, setEnergy] = useState(1)
  const [duration, setDuration] = useState('15–30 mins')
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState({})
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('auth_id', user.id).single()
      if (data) setProfile(data)
    }
    loadProfile()
  }, [])

  async function generateActivities() {
    if (!profile) return
    setLoading(true)
    setError('')
    setActivities([])
    setExpanded(null)
    try {
      const res = await fetch('/api/generate-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: profile.child_name,
          age: profile.age,
          sensory,
          energy: ENERGY_LABELS[energy],
          duration,
          goals: profile.primary_goals
        })
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setActivities(data.activities)
      // Save to Supabase
      for (const act of data.activities) {
        await supabase.from('activities').insert({
          user_id: profile.id,
          title: act.title,
          description: act.description,
          sensory_tags: [act.sensory_focus],
          duration_min: parseInt(act.duration),
          energy_level: act.energy,
        })
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleSave(idx) {
    setSaved(s => ({ ...s, [idx]: !s[idx] }))
  }

  const energyColors = ['var(--success)', 'var(--warning)', 'var(--danger)']

  return (
    <div className="app mesh-bg">
      {/* Header */}
      <div className="app-header">
        <Link href="/dashboard" className="btn-back"><span className="msi" style={{ fontSize: 20 }}>arrow_back</span></Link>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>Activity Generator</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="main-scroll">
        {/* Config */}
        <div className="anim-up" style={{ padding: '1.25rem 1rem 0' }}>
          {profile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(19,236,182,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🧒</div>
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)' }}>Tailor for {profile.child_name}</p>
                <p style={{ fontSize: '.75rem', color: 'var(--text-3)' }}>Age {profile.age} · {profile.sensory_profile?.join(', ')}</p>
              </div>
            </div>
          ) : (
            <div style={{ height: 38, background: 'var(--surface-2)', borderRadius: 8, marginBottom: '1.25rem', width: '60%' }} />
          )}

          {/* Sensory */}
          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.625rem' }}>Sensory Focus</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '1.25rem' }}>
            {SENSORY_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => setSensory(opt.key)} style={{
                display: 'flex', alignItems: 'center', gap: '.375rem',
                padding: '.375rem .875rem', borderRadius: '9999px',
                fontFamily: 'Lexend, sans-serif', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer',
                border: sensory === opt.key ? 'none' : '1.5px solid var(--border)',
                background: sensory === opt.key ? 'var(--primary)' : 'var(--surface)',
                color: sensory === opt.key ? '#0d1e18' : 'var(--text-2)',
                transition: 'all .15s'
              }}>
                <span className="msi" style={{ fontSize: 16 }}>{opt.icon}</span>{opt.key}
              </button>
            ))}
          </div>

          {/* Energy slider */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
              <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)' }}>Energy Level</p>
              <span style={{ fontSize: '.85rem', color: energyColors[energy], fontWeight: 700 }}>{ENERGY_LABELS[energy]}</span>
            </div>
            <input type="range" min="0" max="2" value={energy} onChange={e => setEnergy(Number(e.target.value))}
              style={{ width: '100%', accentColor: energyColors[energy], cursor: 'pointer', height: '4px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.25rem' }}>
              {ENERGY_LABELS.map(l => <span key={l} style={{ fontSize: '.65rem', color: 'var(--text-3)' }}>{l}</span>)}
            </div>
          </div>

          {/* Duration + Generate */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', alignItems: 'end', marginBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.5rem' }}>Duration</p>
              <select className="select-input" value={duration} onChange={e => setDuration(e.target.value)} style={{ height: '2.875rem' }}>
                <option>5–15 mins</option>
                <option>15–30 mins</option>
                <option>30–60 mins</option>
                <option>1 hour+</option>
              </select>
            </div>
            <button onClick={generateActivities} disabled={loading || !profile} className="btn btn-primary" style={{ height: '2.875rem', fontSize: '.875rem' }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} />&nbsp;Generating…</> : <><span className="msi" style={{ fontSize: 18 }}>auto_awesome</span> Generate</>}
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border)', margin: '0 1rem' }} />

        {/* Results */}
        <div style={{ padding: '1rem' }}>
          {error && (
            <div style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1rem', color: 'var(--danger)', fontSize: '.85rem' }}>
              {error}
            </div>
          )}

          {!loading && activities.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-3)' }}>
              <span className="msi" style={{ fontSize: 48, color: 'var(--border)', display: 'block', marginBottom: '1rem' }}>auto_awesome</span>
              <p style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text-2)' }}>Ready to generate</p>
              <p style={{ fontSize: '.8rem', marginTop: '.375rem', lineHeight: 1.6 }}>Adjust the settings above and tap <strong style={{ color: 'var(--primary)' }}>Generate</strong> to get AI-personalised activities for {profile?.child_name || 'your child'}.</p>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', gap: '.875rem' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '.75rem', background: 'var(--surface-2)', flexShrink: 0 }} />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.25rem' }}>
                <p style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--text-1)' }}>For {profile?.child_name}</p>
                <span className="chip">{activities.length} activities</span>
              </div>
              {activities.map((act, idx) => (
                <div key={idx} className="anim-up" style={{ animationDelay: `${idx * .08}s`, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem', display: 'flex', gap: '.875rem' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '.75rem', background: 'rgba(19,236,182,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span className="msi" style={{ color: 'var(--primary)', fontSize: 28 }}>auto_awesome</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h5 style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--text-1)', paddingRight: '.5rem' }}>{act.title}</h5>
                        <button onClick={() => toggleSave(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: saved[idx] ? 'var(--primary)' : 'var(--text-3)', flexShrink: 0 }}>
                          <span className={`msi${saved[idx] ? ' fill' : ''}`} style={{ fontSize: 20 }}>bookmark</span>
                        </button>
                      </div>
                      <p style={{ fontSize: '.78rem', color: 'var(--text-2)', marginTop: '.25rem', lineHeight: 1.55 }}>{act.description}</p>
                      <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '.65rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span className="msi" style={{ fontSize: 14 }}>schedule</span> {act.duration}
                        </span>
                        <span style={{ fontSize: '.65rem', display: 'flex', alignItems: 'center', gap: 3, color: act.energy === 'Low' ? 'var(--success)' : act.energy === 'Medium' ? 'var(--warning)' : 'var(--danger)' }}>
                          <span className="msi" style={{ fontSize: 14 }}>bolt</span> {act.energy}
                        </span>
                        <span style={{ fontSize: '.65rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span className="msi" style={{ fontSize: 14 }}>touch_app</span> {act.sensory_focus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expand/collapse steps */}
                  <button onClick={() => setExpanded(expanded === idx ? null : idx)} style={{ width: '100%', background: 'var(--surface-2)', border: 'none', borderTop: '1px solid var(--border)', padding: '.625rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: 'var(--text-2)', fontFamily: 'Lexend, sans-serif', fontSize: '.78rem', fontWeight: 600 }}>
                    View steps & materials
                    <span className="msi" style={{ fontSize: 18, transition: 'transform .25s', transform: expanded === idx ? 'rotate(180deg)' : 'none' }}>expand_more</span>
                  </button>

                  {expanded === idx && (
                    <div className="anim-fade" style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {act.materials?.length > 0 && (
                        <div>
                          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: '.5rem' }}>Materials needed</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.375rem' }}>
                            {act.materials.map((m, i) => <span key={i} className="chip chip-muted">{m}</span>)}
                          </div>
                        </div>
                      )}
                      {act.steps?.length > 0 && (
                        <div>
                          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: '.5rem' }}>Steps</p>
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
                          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', marginBottom: '.25rem' }}>Parent tip</p>
                          <p style={{ fontSize: '.8rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{act.tip}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav active="activities" />
    </div>
  )
}
