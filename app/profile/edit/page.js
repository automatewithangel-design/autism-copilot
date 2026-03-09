'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '../../components/BottomNav'

const SENSORY_OPTIONS = [
  { key: 'Tactile', icon: '🖐️', label: 'Tactile (touch)' },
  { key: 'Auditory', icon: '👂', label: 'Auditory (sound)' },
  { key: 'Visual', icon: '👁️', label: 'Visual (sight)' },
  { key: 'Vestibular', icon: '🌀', label: 'Vestibular (movement)' },
  { key: 'Proprioceptive', icon: '💪', label: 'Proprioceptive (body awareness)' },
  { key: 'Oral', icon: '👄', label: 'Oral (taste/smell)' },
]

const GOAL_OPTIONS = [
  { key: 'Communication', icon: '💬', label: 'Communication skills' },
  { key: 'Social skills', icon: '🤝', label: 'Social skills' },
  { key: 'Sensory regulation', icon: '🧘', label: 'Sensory regulation' },
  { key: 'Daily routines', icon: '📅', label: 'Daily routines' },
  { key: 'Emotional regulation', icon: '💙', label: 'Emotional regulation' },
  { key: 'Fine motor skills', icon: '✏️', label: 'Fine motor skills' },
  { key: 'Gross motor skills', icon: '🏃', label: 'Gross motor skills' },
  { key: 'Academic skills', icon: '📚', label: 'Academic skills' },
]

export default function EditProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [childName, setChildName] = useState('')
  const [age, setAge] = useState('')
  const [sensoryProfile, setSensoryProfile] = useState([])
  const [primaryGoals, setPrimaryGoals] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('profiles').select('*').eq('auth_id', user.id).single()
      if (data) {
        setProfile(data)
        setChildName(data.child_name || '')
        setAge(data.age || '')
        setSensoryProfile(data.sensory_profile || [])
        setPrimaryGoals(data.primary_goals || [])
      }
    }
    load()
  }, [])

  function toggleSensory(key) {
    setSensoryProfile(s => s.includes(key) ? s.filter(x => x !== key) : [...s, key])
    setSaved(false)
  }

  function toggleGoal(key) {
    setPrimaryGoals(g => g.includes(key) ? g.filter(x => x !== key) : [...g, key])
    setSaved(false)
  }

  async function handleSave() {
    if (!childName.trim()) { setError('Please enter your child\'s name'); return }
    if (!age) { setError('Please enter your child\'s age'); return }
    setSaving(true)
    setError('')

    const { error: err } = await supabase
      .from('profiles')
      .update({
        child_name: childName.trim(),
        age: parseInt(age),
        sensory_profile: sensoryProfile,
        primary_goals: primaryGoals,
      })
      .eq('id', profile.id)

    setSaving(false)
    if (err) { setError('Could not save. Please try again.'); return }
    setSaved(true)
    setTimeout(() => router.back(), 1200)
  }

  return (
    <div className="app mesh-bg">
      <div className="app-header">
        <button onClick={() => router.back()} className="btn-back">
          <span className="msi" style={{ fontSize: 20 }}>arrow_back</span>
        </button>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>Edit Profile</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="main-scroll">
        <div className="anim-up" style={{ padding: '1.25rem 1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Child name */}
          <div>
            <label style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', display: 'block', marginBottom: '.5rem' }}>Child's name</label>
            <input
              value={childName}
              onChange={e => { setChildName(e.target.value); setSaved(false) }}
              placeholder="Enter name"
              style={{
                width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '.875rem 1rem', color: 'var(--text-1)',
                fontFamily: 'Lexend, sans-serif', fontSize: '1rem', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Age */}
          <div>
            <label style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', display: 'block', marginBottom: '.5rem' }}>Age</label>
            <input
              type="number"
              value={age}
              onChange={e => { setAge(e.target.value); setSaved(false) }}
              placeholder="Age in years"
              min="1" max="25"
              style={{
                width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '.875rem 1rem', color: 'var(--text-1)',
                fontFamily: 'Lexend, sans-serif', fontSize: '1rem', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Sensory profile */}
          <div>
            <label style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', display: 'block', marginBottom: '.625rem' }}>Sensory sensitivities (tap all that apply)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {SENSORY_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => toggleSensory(opt.key)} style={{
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  padding: '.875rem 1rem', borderRadius: 'var(--radius)',
                  fontFamily: 'Lexend, sans-serif', cursor: 'pointer', textAlign: 'left',
                  background: sensoryProfile.includes(opt.key) ? 'rgba(19,236,182,.08)' : 'var(--surface)',
                  border: sensoryProfile.includes(opt.key) ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                  transition: 'all .15s'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>{opt.icon}</span>
                  <p style={{ flex: 1, fontSize: '.875rem', fontWeight: 600, color: sensoryProfile.includes(opt.key) ? 'var(--primary)' : 'var(--text-2)' }}>{opt.label}</p>
                  {sensoryProfile.includes(opt.key) && <span className="msi fill" style={{ color: 'var(--primary)', fontSize: 20 }}>check_circle</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Primary goals */}
          <div>
            <label style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', display: 'block', marginBottom: '.625rem' }}>Primary goals (tap all that apply)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
              {GOAL_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => toggleGoal(opt.key)} style={{
                  display: 'flex', alignItems: 'center', gap: '.5rem',
                  padding: '.5rem .875rem', borderRadius: '9999px',
                  fontFamily: 'Lexend, sans-serif', cursor: 'pointer',
                  background: primaryGoals.includes(opt.key) ? 'rgba(96,165,250,.12)' : 'var(--surface)',
                  border: primaryGoals.includes(opt.key) ? '1.5px solid #60a5fa' : '1px solid var(--border)',
                  transition: 'all .15s'
                }}>
                  <span style={{ fontSize: '1rem' }}>{opt.icon}</span>
                  <p style={{ fontSize: '.8rem', fontWeight: 600, color: primaryGoals.includes(opt.key) ? '#60a5fa' : 'var(--text-2)' }}>{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p style={{ fontSize: '.82rem', color: 'var(--danger)', textAlign: 'center' }}>⚠️ {error}</p>
          )}

          <button onClick={handleSave} disabled={saving} className={`btn btn-full btn-lg ${saved ? 'btn-ghost' : 'btn-primary'}`}>
            {saving
              ? <><div className="spinner" style={{ width: 18, height: 18 }} />&nbsp;Saving…</>
              : saved
                ? <><span className="msi fill" style={{ fontSize: 20 }}>check_circle</span> Saved!</>
                : <><span className="msi" style={{ fontSize: 20 }}>save</span> Save changes</>
            }
          </button>

        </div>
      </div>
      <BottomNav active="more" />
    </div>
  )
}
