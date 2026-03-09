'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '../../components/BottomNav'

function ReportAnalysisContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reportId = searchParams.get('id')
  const [report, setReport] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({ strengths: true, triggers: false, focus: false, questions: false })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('*').eq('auth_id', user.id).single()
      if (profile) setProfile(profile)

      if (reportId) {
        const { data: report } = await supabase.from('reports').select('*').eq('id', reportId).single()
        if (report) setReport(report)
      } else {
        if (profile) {
          const { data: report } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', profile.id)
            .eq('status', 'complete')
            .order('uploaded_at', { ascending: false })
            .limit(1)
            .single()
          if (report) setReport(report)
        }
      }
      setLoading(false)
    }
    load()
  }, [reportId])

  function toggle(key) {
    setExpanded(e => ({ ...e, [key]: !e[key] }))
  }

  if (loading) return (
    <div style={{ background: '#0d1e18', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(19,236,182,.2)', borderTopColor: '#13ecb6', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!report || !report.ai_summary) return (
    <div className="app mesh-bg">
      <div className="app-header">
        <Link href="/reports/upload" className="btn-back"><span className="msi" style={{ fontSize: 20 }}>arrow_back</span></Link>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>Report Analysis</h2>
        <div style={{ width: 36 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '3rem' }}>📋</span>
        <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>No analysis yet</p>
        <p style={{ fontSize: '.85rem', color: 'var(--text-3)', lineHeight: 1.6 }}>Upload a report to get your AI-powered insights.</p>
        <Link href="/reports/upload" className="btn btn-primary" style={{ padding: '.875rem 1.5rem', height: 'auto', marginTop: '.5rem' }}>
          Upload a Report
        </Link>
      </div>
      <BottomNav active="more" />
    </div>
  )

  const s = report.ai_summary

  const sections = [
    {
      key: 'strengths',
      icon: '⭐',
      title: `${profile?.child_name}'s Strengths`,
      color: 'var(--success)',
      bg: 'rgba(74,222,128,.06)',
      border: 'rgba(74,222,128,.15)',
      content: s.strengths?.map((item, i) => (
        <div key={i} style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '.25rem' }}>💪 {item.title}</p>
          <p style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.65 }}>{item.description}</p>
        </div>
      ))
    },
    {
      key: 'triggers',
      icon: '⚡',
      title: 'Sensory Triggers & What They Mean',
      color: 'var(--warning)',
      bg: 'rgba(251,191,36,.06)',
      border: 'rgba(251,191,36,.15)',
      content: s.sensory_triggers?.map((item, i) => (
        <div key={i} style={{ background: 'var(--surface-2)', borderRadius: '.625rem', padding: '.875rem', marginBottom: '.75rem' }}>
          <p style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--warning)', marginBottom: '.375rem' }}>⚡ {item.trigger}</p>
          <p style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.65, marginBottom: '.5rem' }}>{item.explanation}</p>
          <div style={{ background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.15)', borderRadius: '.5rem', padding: '.625rem .75rem' }}>
            <p style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--warning)', marginBottom: '.2rem' }}>💡 Home tip</p>
            <p style={{ fontSize: '.78rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{item.tip}</p>
          </div>
        </div>
      ))
    },
    {
      key: 'focus',
      icon: '🎯',
      title: 'Recommended Focus Areas',
      color: 'var(--primary)',
      bg: 'rgba(19,236,182,.06)',
      border: 'rgba(19,236,182,.15)',
      content: s.recommended_focus?.map((item, i) => (
        <div key={i} style={{ background: 'var(--surface-2)', borderRadius: '.625rem', padding: '.875rem', marginBottom: '.75rem' }}>
          <p style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '.375rem' }}>🎯 {item.area}</p>
          <p style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.65, marginBottom: '.5rem' }}>{item.why}</p>
          <div style={{ background: 'rgba(19,236,182,.06)', border: '1px solid rgba(19,236,182,.15)', borderRadius: '.5rem', padding: '.625rem .75rem' }}>
            <p style={{ fontSize: '.72rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '.2rem' }}>🏠 Try at home</p>
            <p style={{ fontSize: '.78rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{item.home_activity}</p>
          </div>
        </div>
      ))
    },
    {
      key: 'questions',
      icon: '❓',
      title: 'Questions to Ask Your Therapist',
      color: 'var(--info)',
      bg: 'rgba(96,165,250,.06)',
      border: 'rgba(96,165,250,.15)',
      content: s.questions_for_therapist?.map((q, i) => (
        <div key={i} style={{ display: 'flex', gap: '.625rem', marginBottom: '.625rem' }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(96,165,250,.12)', color: 'var(--info)', fontSize: '.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
          <p style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.65 }}>{q}</p>
        </div>
      ))
    }
  ]

  return (
    <div className="app mesh-bg">
      <div className="app-header">
        <Link href="/reports/upload" className="btn-back"><span className="msi" style={{ fontSize: 20 }}>arrow_back</span></Link>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>Report Analysis</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="main-scroll">
        <div className="anim-up" style={{ padding: '1.25rem 1rem 0' }}>
          <div style={{ background: 'linear-gradient(135deg, rgba(19,236,182,.1), rgba(96,165,250,.06))', border: '1px solid rgba(19,236,182,.2)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.625rem', marginBottom: '.875rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📋</span>
              <div>
                <p style={{ fontSize: '.72rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>AI Summary</p>
                <p style={{ fontSize: '.78rem', color: 'var(--text-3)' }}>{report.file_name}</p>
              </div>
            </div>
            <p style={{ fontSize: '.875rem', color: 'var(--text-2)', lineHeight: 1.75 }}>{s.summary}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.625rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.875rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>{s.strengths?.length || 0}</p>
              <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: '.2rem' }}>Strengths identified</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.875rem', textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{s.recommended_focus?.length || 0}</p>
              <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: '.2rem' }}>Focus areas</p>
            </div>
          </div>
        </div>

        <div className="anim-up d1" style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {sections.map(section => (
            <div key={section.key} style={{ background: 'var(--surface)', border: `1px solid ${expanded[section.key] ? section.border : 'var(--border)'}`, borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'border-color .2s' }}>
              <button onClick={() => toggle(section.key)} style={{ width: '100%', background: expanded[section.key] ? section.bg : 'transparent', border: 'none', padding: '1rem', display: 'flex', alignItems: 'center', gap: '.75rem', cursor: 'pointer', fontFamily: 'Lexend, sans-serif' }}>
                <span style={{ fontSize: '1.2rem' }}>{section.icon}</span>
                <p style={{ flex: 1, textAlign: 'left', fontSize: '.9rem', fontWeight: 700, color: expanded[section.key] ? section.color : 'var(--text-1)' }}>{section.title}</p>
                <span className="msi" style={{ fontSize: 20, color: 'var(--text-3)', transition: 'transform .25s', transform: expanded[section.key] ? 'rotate(180deg)' : 'none' }}>expand_more</span>
              </button>
              {expanded[section.key] && (
                <div className="anim-fade" style={{ padding: '1rem', borderTop: `1px solid ${section.border}` }}>
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="anim-up d2" style={{ padding: '1.25rem 1rem 1.5rem' }}>
          <Link href="/activities" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'linear-gradient(135deg,rgba(19,236,182,.1),rgba(96,165,250,.06))', border: '1px solid rgba(19,236,182,.2)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '.875rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(19,236,182,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="msi fill" style={{ color: 'var(--primary)', fontSize: 22 }}>auto_awesome</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text-1)' }}>Generate activities from this report</p>
                <p style={{ fontSize: '.75rem', color: 'var(--text-3)', marginTop: 2 }}>AI will use these insights to tailor activities for {profile?.child_name}</p>
              </div>
              <span className="msi" style={{ color: 'var(--text-3)', fontSize: 20 }}>chevron_right</span>
            </div>
          </Link>

          <Link href="/reports/upload" style={{ textDecoration: 'none', display: 'block', marginTop: '.75rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.875rem 1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
              <span className="msi" style={{ color: 'var(--text-3)', fontSize: 20 }}>upload_file</span>
              <p style={{ fontSize: '.875rem', color: 'var(--text-2)', fontWeight: 600 }}>Upload another report</p>
              <span className="msi" style={{ color: 'var(--text-3)', fontSize: 18, marginLeft: 'auto' }}>chevron_right</span>
            </div>
          </Link>
        </div>
      </div>

      <BottomNav active="more" />
    </div>
  )
}

export default function ReportAnalysisPage() {
  return (
    <Suspense fallback={
      <div style={{ background: '#0d1e18', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(19,236,182,.2)', borderTopColor: '#13ecb6', animation: 'spin .7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ReportAnalysisContent />
    </Suspense>
  )
}
