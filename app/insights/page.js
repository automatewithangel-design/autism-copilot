'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

const MOODS = [
  { key: 'great',     emoji: '😄', label: 'Great',     score: 5, color: '#4ade80' },
  { key: 'good',      emoji: '🙂', label: 'Good',      score: 4, color: '#60a5fa' },
  { key: 'okay',      emoji: '😐', label: 'Okay',      score: 3, color: '#fbbf24' },
  { key: 'hard',      emoji: '😔', label: 'Hard',      score: 2, color: '#f97316' },
  { key: 'very_hard', emoji: '😢', label: 'Very Hard', score: 1, color: '#f87171' },
]

export default function InsightsPage() {
  const [profile, setProfile] = useState(null)
  const [journalEntries, setJournalEntries] = useState([])
  const [activities, setActivities] = useState([])
  const [latestReport, setLatestReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(7) // 7 or 30 days

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from('profiles').select('*').eq('auth_id', user.id).single()
        if (profile) {
          setProfile(profile)

          // Load journal entries (last 30 days)
          const { data: journal } = await supabase
            .from('journal').select('*')
            .eq('user_id', profile.id)
            .order('date', { ascending: false })
            .limit(30)
          setJournalEntries(journal || [])

          // Load activities
          const { data: acts } = await supabase
            .from('activities').select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(50)
          setActivities(acts || [])

          // Load report for Pro
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
      finally { setLoading(false) }
    }
    load()
  }, [])

  // Filter entries by period
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - period)
  const filteredEntries = journalEntries.filter(e => new Date(e.date) >= cutoff)

  // Mood stats
  const moodScores = filteredEntries.map(e => MOODS.find(m => m.key === e.mood)?.score || 0).filter(Boolean)
  const avgMoodScore = moodScores.length ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1) : null
  const avgMoodData = MOODS.find(m => m.score === Math.round(avgMoodScore)) || MOODS[2]

  // Mood counts
  const moodCounts = filteredEntries.reduce((acc, e) => {
    acc[e.mood] = (acc[e.mood] || 0) + 1
    return acc
  }, {})

  // Streak
  const streak = (() => {
    let count = 0
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      if (journalEntries.find(e => e.date === dateStr)) count++
      else if (i > 0) break
    }
    return count
  })()

  // Tag frequency
  const tagCounts = filteredEntries.flatMap(e => e.tags || []).reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1
    return acc
  }, {})
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // Meltdown count
  const meltdownCount = filteredEntries.filter(e => e.tags?.includes('😤 Meltdown')).length
  const goodDays = filteredEntries.filter(e => ['great', 'good'].includes(e.mood)).length

  // Mood trend for mini chart (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const entry = journalEntries.find(e => e.date === dateStr)
    const score = entry ? MOODS.find(m => m.key === entry.mood)?.score || 0 : null
    return {
      day: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      score,
      mood: entry?.mood,
      date: dateStr
    }
  })

  const maxBarScore = 5

  if (loading) return (
    <div style={{ background: '#0d1e18', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(19,236,182,.2)', borderTopColor: '#13ecb6', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div className="app mesh-bg">
      <div className="app-header">
        <Link href="/dashboard" className="btn-back">
          <span className="msi" style={{ fontSize: 20 }}>arrow_back</span>
        </Link>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>Insights</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="main-scroll">
        <div className="anim-up" style={{ padding: '1.25rem 1rem 0' }}>

          {/* Period toggle */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '9999px', padding: '.25rem', display: 'flex', marginBottom: '1.25rem' }}>
            {[7, 30].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{
                flex: 1, padding: '.5rem', borderRadius: '9999px',
                fontFamily: 'Lexend, sans-serif', fontSize: '.82rem', fontWeight: 700,
                cursor: 'pointer', border: 'none', transition: 'all .2s',
                background: period === p ? 'var(--primary)' : 'transparent',
                color: period === p ? '#0d1e18' : 'var(--text-3)',
              }}>
                Last {p} days
              </button>
            ))}
          </div>

          {filteredEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📊</span>
              <p style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--text-2)' }}>No data yet</p>
              <p style={{ fontSize: '.82rem', color: 'var(--text-3)', marginTop: '.375rem', lineHeight: 1.6, maxWidth: 260, margin: '.375rem auto 0' }}>
                Start logging daily entries in the Journal to see trends and insights here.
              </p>
              <Link href="/journal" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: '1.25rem', padding: '.875rem 1.5rem', height: 'auto' }}>
                Open Journal
              </Link>
            </div>
          ) : (
            <>
              {/* Summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '.625rem', marginBottom: '1.25rem' }}>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem' }}>{avgMoodData?.emoji}</p>
                  <p style={{ fontSize: '.95rem', fontWeight: 800, color: avgMoodData?.color, marginTop: '.25rem' }}>{avgMoodScore}/5</p>
                  <p style={{ fontSize: '.65rem', color: 'var(--text-3)', marginTop: '.2rem' }}>Avg mood score</p>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem' }}>🔥</p>
                  <p style={{ fontSize: '.95rem', fontWeight: 800, color: 'var(--warning)', marginTop: '.25rem' }}>{streak} days</p>
                  <p style={{ fontSize: '.65rem', color: 'var(--text-3)', marginTop: '.2rem' }}>Current streak</p>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem' }}>✅</p>
                  <p style={{ fontSize: '.95rem', fontWeight: 800, color: 'var(--success)', marginTop: '.25rem' }}>{goodDays}</p>
                  <p style={{ fontSize: '.65rem', color: 'var(--text-3)', marginTop: '.2rem' }}>Good/great days</p>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem' }}>😤</p>
                  <p style={{ fontSize: '.95rem', fontWeight: 800, color: meltdownCount > 3 ? 'var(--danger)' : 'var(--text-1)', marginTop: '.25rem' }}>{meltdownCount}</p>
                  <p style={{ fontSize: '.65rem', color: 'var(--text-3)', marginTop: '.2rem' }}>Meltdown days</p>
                </div>
              </div>

              {/* 7-day mood chart */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: '1rem' }}>7-day mood trend</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.375rem', height: 80 }}>
                  {last7.map((day, i) => {
                    const moodData = MOODS.find(m => m.key === day.mood)
                    const height = day.score ? `${(day.score / maxBarScore) * 100}%` : '8px'
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.25rem', height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ width: '100%', height, background: day.score ? moodData?.color || 'var(--border)' : 'var(--surface-2)', borderRadius: '.375rem .375rem 0 0', transition: 'height .3s', minHeight: 6, position: 'relative' }}>
                          {day.score && (
                            <span style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', fontSize: '.8rem' }}>{moodData?.emoji}</span>
                          )}
                        </div>
                        <p style={{ fontSize: '.58rem', color: 'var(--text-3)', fontWeight: 600 }}>{day.day}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Mood breakdown */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem' }}>
                <p style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: '.875rem' }}>Mood breakdown</p>
                {MOODS.map(m => {
                  const count = moodCounts[m.key] || 0
                  const pct = filteredEntries.length ? (count / filteredEntries.length) * 100 : 0
                  return (
                    <div key={m.key} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.625rem' }}>
                      <span style={{ fontSize: '1.1rem', width: 24, textAlign: 'center', flexShrink: 0 }}>{m.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.25rem' }}>
                          <p style={{ fontSize: '.75rem', color: 'var(--text-2)', fontWeight: 600 }}>{m.label}</p>
                          <p style={{ fontSize: '.72rem', color: 'var(--text-3)' }}>{count} {count === 1 ? 'day' : 'days'}</p>
                        </div>
                        <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: '9999px', transition: 'width .4s' }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Top tags */}
              {topTags.length > 0 && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: '.875rem' }}>Most frequent events</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {topTags.map(([tag, count], i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '.82rem', color: 'var(--text-2)' }}>{tag}</p>
                        <span style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '9999px', padding: '.15rem .625rem', fontSize: '.7rem', color: 'var(--text-3)', fontWeight: 700 }}>{count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activities count */}
              {activities.length > 0 && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: '.875rem' }}>Activity history</p>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{activities.length}</p>
                      <p style={{ fontSize: '.65rem', color: 'var(--text-3)' }}>Total generated</p>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '.375rem' }}>
                      {[...new Set(activities.flatMap(a => a.sensory_tags || []))].slice(0, 5).map((tag, i) => (
                        <span key={i} className="chip chip-muted" style={{ fontSize: '.65rem' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Pro report goals */}
              {profile?.is_pro && latestReport?.ai_summary?.recommended_focus?.length > 0 && (
                <div style={{ background: 'linear-gradient(135deg, rgba(19,236,182,.08), rgba(96,165,250,.04))', border: '1px solid rgba(19,236,182,.2)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--primary)', marginBottom: '.875rem' }}>📋 Focus areas from {profile.child_name}'s report</p>
                  {latestReport.ai_summary.recommended_focus.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: '.625rem', marginBottom: '.625rem', alignItems: 'flex-start' }}>
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(19,236,182,.12)', color: 'var(--primary)', fontSize: '.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                      <div>
                        <p style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--text-1)' }}>{f.area}</p>
                        <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: 2 }}>{f.home_activity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Positive insight */}
              {goodDays > 0 && (
                <div style={{ background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.15)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.5rem' }}>
                  <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--success)', marginBottom: '.375rem' }}>💚 Progress note</p>
                  <p style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.7 }}>
                    {profile?.child_name} had <strong style={{ color: 'var(--success)' }}>{goodDays} good or great {goodDays === 1 ? 'day' : 'days'}</strong> in the last {period} days.
                    {meltdownCount === 0 ? ' No meltdowns recorded — that\'s wonderful! 🎉' : meltdownCount < 3 ? ' Keep going — you\'re making a real difference.' : ' Every hard day is data that helps you support them better.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <BottomNav active="more" />
    </div>
  )
}
