'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

const MOODS = [
  { key: 'great',     emoji: '😄', label: 'Great day',      color: 'var(--success)' },
  { key: 'good',      emoji: '🙂', label: 'Good day',       color: '#60a5fa' },
  { key: 'okay',      emoji: '😐', label: 'Okay day',       color: 'var(--warning)' },
  { key: 'hard',      emoji: '😔', label: 'Hard day',       color: '#f97316' },
  { key: 'very_hard', emoji: '😢', label: 'Very hard day',  color: 'var(--danger)' },
]

const TAGS = [
  '✅ Good sleep',   '😴 Poor sleep',   '🍽️ Ate well',     '🚫 Refused food',
  '🏫 School day',  '🏠 Home day',     '🎉 Social event', '🏥 Therapy',
  '🌞 Outdoors',    '📺 Screen time',  '🤝 Good sharing', '😤 Meltdown',
  '💬 New words',   '🎯 Hit a goal',   '💊 Medication',   '🌙 Good bedtime',
]

export default function JournalPage() {
  const [profile, setProfile] = useState(null)
  const [view, setView] = useState('today') // today | history
  const [mood, setMood] = useState(null)
  const [notes, setNotes] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [entries, setEntries] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [todayEntry, setTodayEntry] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('*').eq('auth_id', user.id).single()
      if (profile) {
        setProfile(profile)
        // Check if today's entry exists
        const today = new Date().toISOString().split('T')[0]
        const { data: existing } = await supabase
          .from('journal')
          .select('*')
          .eq('user_id', profile.id)
          .eq('date', today)
          .single()
        if (existing) {
          setTodayEntry(existing)
          setMood(existing.mood)
          setNotes(existing.notes || '')
          setSelectedTags(existing.tags || [])
          setSaved(true)
        }
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (view === 'history' && profile) loadHistory()
  }, [view, profile])

  async function loadHistory() {
    setLoadingHistory(true)
    const { data } = await supabase
      .from('journal')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: false })
      .limit(30)
    setEntries(data || [])
    setLoadingHistory(false)
  }

  function toggleTag(tag) {
    setSelectedTags(t => t.includes(tag) ? t.filter(x => x !== tag) : [...t, tag])
  }

  async function saveEntry() {
    if (!mood || !profile) return
    setSaving(true)
    const today = new Date().toISOString().split('T')[0]
    const payload = {
      user_id: profile.id,
      date: today,
      mood,
      notes: notes.trim(),
      tags: selectedTags
    }

    let error
    if (todayEntry) {
      const { error: e } = await supabase.from('journal').update(payload).eq('id', todayEntry.id)
      error = e
    } else {
      const { data, error: e } = await supabase.from('journal').insert(payload).select().single()
      error = e
      if (data) setTodayEntry(data)
    }

    setSaving(false)
    if (!error) setSaved(true)
  }

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const moodCounts = entries.reduce((acc, e) => {
    acc[e.mood] = (acc[e.mood] || 0) + 1
    return acc
  }, {})

  const streak = (() => {
    if (!entries.length) return 0
    let count = 0
    const d = new Date()
    for (let i = 0; i < 30; i++) {
      const dateStr = new Date(d - i * 86400000).toISOString().split('T')[0]
      if (entries.find(e => e.date === dateStr)) count++
      else if (i > 0) break
    }
    return count
  })()

  return (
    <div className="app mesh-bg">
      <div className="app-header">
        <Link href="/dashboard" className="btn-back">
          <span className="msi" style={{ fontSize: 20 }}>arrow_back</span>
        </Link>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>Daily Journal</h2>
        <div style={{ width: 36 }} />
      </div>

      {/* Tab switcher */}
      <div style={{ padding: '0 1rem', marginTop: '1rem' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '9999px', padding: '.25rem', display: 'flex' }}>
          {['today', 'history'].map(t => (
            <button key={t} onClick={() => setView(t)} style={{
              flex: 1, padding: '.625rem', borderRadius: '9999px',
              fontFamily: 'Lexend, sans-serif', fontSize: '.85rem', fontWeight: 700,
              cursor: 'pointer', border: 'none', transition: 'all .2s',
              background: view === t ? 'var(--primary)' : 'transparent',
              color: view === t ? '#0d1e18' : 'var(--text-3)',
            }}>
              {t === 'today' ? "📝 Today's Entry" : '📅 History'}
            </button>
          ))}
        </div>
      </div>

      <div className="main-scroll" style={{ paddingTop: '1rem' }}>

        {view === 'today' && (
          <div className="anim-up" style={{ padding: '0 1rem' }}>

            {/* Date + streak */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)' }}>{dateStr}</p>
                <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: 2 }}>
                  {profile ? `How was ${profile.child_name} today?` : 'How was your child today?'}
                </p>
              </div>
              {streak > 0 && (
                <div style={{ textAlign: 'center', background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)', borderRadius: '.75rem', padding: '.5rem .75rem' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--warning)' }}>🔥 {streak}</p>
                  <p style={{ fontSize: '.6rem', color: 'var(--text-3)' }}>day streak</p>
                </div>
              )}
            </div>

            {/* Mood selector */}
            <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.625rem' }}>Overall mood</p>
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem' }}>
              {MOODS.map(m => (
                <button key={m.key} onClick={() => { setMood(m.key); setSaved(false) }} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.25rem',
                  padding: '.75rem .25rem', borderRadius: 'var(--radius)',
                  fontFamily: 'Lexend, sans-serif', cursor: 'pointer',
                  border: mood === m.key ? `2px solid ${m.color}` : '1.5px solid var(--border)',
                  background: mood === m.key ? `${m.color}15` : 'var(--surface)',
                  transition: 'all .15s'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{m.emoji}</span>
                  <p style={{ fontSize: '.55rem', fontWeight: 700, color: mood === m.key ? m.color : 'var(--text-3)', textAlign: 'center', lineHeight: 1.3 }}>{m.label}</p>
                </button>
              ))}
            </div>

            {/* Tags */}
            <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.625rem' }}>What happened today? (tap all that apply)</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.375rem', marginBottom: '1.25rem' }}>
              {TAGS.map(tag => (
                <button key={tag} onClick={() => { toggleTag(tag); setSaved(false) }} style={{
                  padding: '.35rem .75rem', borderRadius: '9999px',
                  fontFamily: 'Lexend, sans-serif', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer',
                  border: selectedTags.includes(tag) ? 'none' : '1px solid var(--border)',
                  background: selectedTags.includes(tag) ? 'rgba(19,236,182,.15)' : 'var(--surface)',
                  color: selectedTags.includes(tag) ? 'var(--primary)' : 'var(--text-2)',
                  transition: 'all .15s'
                }}>
                  {tag}
                </button>
              ))}
            </div>

            {/* Notes */}
            <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.5rem' }}>Notes (optional)</p>
            <textarea
              value={notes}
              onChange={e => { setNotes(e.target.value); setSaved(false) }}
              placeholder={`Write anything about today — what worked, what was hard, moments to remember...`}
              rows={4}
              style={{
                width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '.875rem', color: 'var(--text-1)',
                fontFamily: 'Lexend, sans-serif', fontSize: '.85rem', lineHeight: 1.65,
                resize: 'none', boxSizing: 'border-box', marginBottom: '1rem'
              }}
            />

            {/* Save button */}
            <button
              onClick={saveEntry}
              disabled={!mood || saving}
              className={`btn btn-full btn-lg ${saved ? 'btn-ghost' : 'btn-primary'}`}
              style={{ marginBottom: '1.5rem' }}
            >
              {saving
                ? <><div className="spinner" style={{ width: 18, height: 18 }} />&nbsp;Saving…</>
                : saved
                  ? <><span className="msi fill" style={{ fontSize: 20 }}>check_circle</span> Saved for today</>
                  : <><span className="msi" style={{ fontSize: 20 }}>save</span> Save today's entry</>
              }
            </button>

            {!mood && (
              <p style={{ fontSize: '.75rem', color: 'var(--text-3)', textAlign: 'center', marginTop: '-.5rem', marginBottom: '1rem' }}>
                Select a mood to save your entry
              </p>
            )}
          </div>
        )}

        {view === 'history' && (
          <div className="anim-up" style={{ padding: '0 1rem' }}>

            {/* Stats row */}
            {entries.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.625rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.875rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{entries.length}</p>
                  <p style={{ fontSize: '.62rem', color: 'var(--text-3)', marginTop: 2 }}>Total entries</p>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.875rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warning)' }}>🔥{streak}</p>
                  <p style={{ fontSize: '.62rem', color: 'var(--text-3)', marginTop: 2 }}>Day streak</p>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.875rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>
                    {MOODS.find(m => m.key === Object.entries(moodCounts).sort((a,b) => b[1]-a[1])[0]?.[0])?.emoji || '😄'}
                  </p>
                  <p style={{ fontSize: '.62rem', color: 'var(--text-3)', marginTop: 2 }}>Most common</p>
                </div>
              </div>
            )}

            {loadingHistory ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ height: 80, background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }} />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📓</span>
                <p style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--text-2)' }}>No entries yet</p>
                <p style={{ fontSize: '.82rem', color: 'var(--text-3)', marginTop: '.375rem', lineHeight: 1.6 }}>
                  Start by adding today's entry and come back each day to build your history.
                </p>
                <button onClick={() => setView('today')} className="btn btn-primary" style={{ marginTop: '1.25rem', padding: '.875rem 1.5rem', height: 'auto' }}>
                  Add today's entry
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
                {entries.map((entry, i) => {
                  const moodData = MOODS.find(m => m.key === entry.mood)
                  const entryDate = new Date(entry.date + 'T12:00:00')
                  const isToday = entry.date === new Date().toISOString().split('T')[0]
                  return (
                    <div key={i} style={{ background: 'var(--surface)', border: `1px solid ${isToday ? 'rgba(19,236,182,.2)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: entry.notes || entry.tags?.length ? '.75rem' : 0 }}>
                        <span style={{ fontSize: '1.75rem' }}>{moodData?.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                            <p style={{ fontSize: '.875rem', fontWeight: 700, color: moodData?.color }}>{moodData?.label}</p>
                            {isToday && <span className="chip" style={{ fontSize: '.58rem' }}>Today</span>}
                          </div>
                          <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: 2 }}>
                            {entryDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      {entry.tags?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', marginBottom: entry.notes ? '.625rem' : 0 }}>
                          {entry.tags.slice(0, 4).map((tag, j) => (
                            <span key={j} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '9999px', padding: '.2rem .6rem', fontSize: '.65rem', color: 'var(--text-3)' }}>{tag}</span>
                          ))}
                          {entry.tags.length > 4 && (
                            <span style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '9999px', padding: '.2rem .6rem', fontSize: '.65rem', color: 'var(--text-3)' }}>+{entry.tags.length - 4} more</span>
                          )}
                        </div>
                      )}
                      {entry.notes && (
                        <p style={{ fontSize: '.78rem', color: 'var(--text-2)', lineHeight: 1.6, fontStyle: 'italic' }}>"{entry.notes}"</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            <div style={{ height: '1.5rem' }} />
          </div>
        )}
      </div>

      <BottomNav active="more" />
    </div>
  )
}
