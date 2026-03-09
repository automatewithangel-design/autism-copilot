'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

const SUGGESTED_QUESTIONS = [
  "How can I help with transitions between activities?",
  "What should I do when my child refuses to eat?",
  "How do I explain autism to my child's siblings?",
  "What are signs my child is overstimulated?",
  "How can I improve sleep routines?",
  "What communication strategies work best?",
  "How do I handle public meltdowns?",
  "What sensory tools are recommended?",
]

export default function ExpertChatPage() {
  const [profile, setProfile] = useState(null)
  const [latestReport, setLatestReport] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function sendMessage(text) {
    const userText = text || input.trim()
    if (!userText || sending) return

    const userMsg = { role: 'user', content: userText, time: new Date() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setSending(true)

    try {
      // Build context from report if available
      const reportContext = latestReport?.ai_summary
        ? `\n\nCHILD'S ASSESSMENT REPORT SUMMARY:\n${JSON.stringify(latestReport.ai_summary, null, 2)}`
        : ''

      const systemPrompt = `You are a warm, knowledgeable autism support specialist helping a parent.
You are talking to the parent of ${profile?.child_name || 'a child'}, aged ${profile?.age || 'unknown'}.
Known sensory profile: ${profile?.sensory_profile?.join(', ') || 'not specified'}.
Goals: ${profile?.primary_goals?.join(', ') || 'general support'}.${reportContext}

Guidelines:
- Be warm, empathetic and non-judgmental
- Give practical, actionable advice
- Keep responses clear and parent-friendly — no clinical jargon
- If asked about something medical or diagnostic, recommend consulting a professional
- Always validate the parent's efforts and feelings
- Use the child's name (${profile?.child_name || 'their child'}) when relevant
- Keep responses concise — 2-4 short paragraphs maximum`

      // Build conversation history for context
      const conversationHistory = messages.slice(-8).map(m => ({
        role: m.role,
        content: m.content
      }))

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [...conversationHistory, { role: 'user', content: userText }]
        })
      })

      // Fallback to OpenAI if Anthropic not available
      if (!res.ok) {
        const openaiRes = await fetch('/api/expert-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            history: conversationHistory,
            childName: profile?.child_name,
            age: profile?.age,
            sensoryProfile: profile?.sensory_profile,
            goals: profile?.primary_goals,
            reportSummary: latestReport?.ai_summary
          })
        })
        const openaiData = await openaiRes.json()
        const aiMsg = { role: 'assistant', content: openaiData.reply || 'Sorry, I could not respond right now.', time: new Date() }
        setMessages(m => [...m, aiMsg])
        setSending(false)
        return
      }

      const data = await res.json()
      const reply = data.content?.[0]?.text || 'Sorry, I could not respond right now.'
      const aiMsg = { role: 'assistant', content: reply, time: new Date() }
      setMessages(m => [...m, aiMsg])
    } catch(e) {
      console.error('Chat error:', e)
      // Try OpenAI fallback
      try {
        const openaiRes = await fetch('/api/expert-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
            childName: profile?.child_name,
            age: profile?.age,
            sensoryProfile: profile?.sensory_profile,
            goals: profile?.primary_goals,
            reportSummary: latestReport?.ai_summary
          })
        })
        const openaiData = await openaiRes.json()
        const aiMsg = { role: 'assistant', content: openaiData.reply || 'Sorry, I could not respond right now.', time: new Date() }
        setMessages(m => [...m, aiMsg])
      } catch {
        setMessages(m => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', time: new Date(), error: true }])
      }
    } finally {
      setSending(false)
    }
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  if (profileLoading) return (
    <div style={{ background: '#0d1e18', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(19,236,182,.2)', borderTopColor: '#13ecb6', animation: 'spin .7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // Free user gate
  if (profile && !profile.is_pro) return (
    <div className="app mesh-bg">
      <div className="app-header">
        <Link href="/dashboard" className="btn-back"><span className="msi" style={{ fontSize: 20 }}>arrow_back</span></Link>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>AI Expert Chat</h2>
        <div style={{ width: 36 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center', gap: '1rem' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(19,236,182,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '.5rem' }}>🤖</div>
        <div style={{ display: 'inline-block', background: 'rgba(19,236,182,.1)', border: '1px solid rgba(19,236,182,.2)', color: 'var(--primary)', padding: '.3rem .875rem', borderRadius: '9999px', fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Pro Feature</div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.3 }}>Ask anything about {profile?.child_name}</h2>
        <p style={{ fontSize: '.875rem', color: 'var(--text-2)', lineHeight: 1.75, maxWidth: 300 }}>
          Get personalised answers from an AI autism specialist that knows your child's profile, sensory needs and assessment report.
        </p>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', width: '100%', maxWidth: 300, textAlign: 'left' }}>
          <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '.625rem' }}>Example questions</p>
          {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
            <p key={i} style={{ fontSize: '.78rem', color: 'var(--text-2)', marginBottom: '.375rem', paddingLeft: '.75rem', borderLeft: '2px solid var(--primary)' }}>"{q}"</p>
          ))}
        </div>
        <Link href="/subscription" className="btn btn-primary btn-full btn-lg" style={{ maxWidth: 300 }}>
          <span className="msi" style={{ fontSize: 20 }}>lock_open</span> Upgrade to Pro
        </Link>
      </div>
      <BottomNav active="expert" />
    </div>
  )

  return (
    <div className="app mesh-bg" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="app-header">
        <Link href="/dashboard" className="btn-back"><span className="msi" style={{ fontSize: 20 }}>arrow_back</span></Link>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>AI Expert Chat</h2>
          {latestReport && <p style={{ fontSize: '.62rem', color: 'var(--primary)', marginTop: 1 }}>📋 Using {profile?.child_name}'s report</p>}
        </div>
        <div style={{ width: 36 }} />
      </div>

      {/* Chat messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '.875rem', paddingBottom: '5rem' }}>

        {/* Welcome message */}
        {messages.length === 0 && (
          <div className="anim-up">
            {/* AI intro bubble */}
            <div style={{ display: 'flex', gap: '.625rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(19,236,182,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem' }}>🤖</div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0 var(--radius) var(--radius) var(--radius)', padding: '1rem', maxWidth: '85%' }}>
                <p style={{ fontSize: '.875rem', color: 'var(--text-1)', lineHeight: 1.7, marginBottom: '.625rem' }}>
                  Hi! I'm your autism support specialist. I know {profile?.child_name}'s profile{latestReport ? ' and have read their assessment report' : ''}.
                </p>
                <p style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
                  Ask me anything — from managing daily routines to understanding behaviours. I'm here to help. 💙
                </p>
              </div>
            </div>

            {/* Suggested questions */}
            <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: '.625rem', paddingLeft: '.25rem' }}>Suggested questions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.375rem' }}>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  padding: '.75rem 1rem', textAlign: 'left', cursor: 'pointer',
                  fontFamily: 'Lexend, sans-serif', fontSize: '.82rem', color: 'var(--text-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.5rem',
                  transition: 'all .15s'
                }}>
                  {q}
                  <span className="msi" style={{ color: 'var(--text-3)', fontSize: 16, flexShrink: 0 }}>chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} className="anim-up" style={{ display: 'flex', gap: '.625rem', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(19,236,182,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem', alignSelf: 'flex-end' }}>🤖</div>
            )}
            <div style={{ maxWidth: '80%' }}>
              <div style={{
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface)',
                color: msg.role === 'user' ? '#0d1e18' : 'var(--text-1)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                borderRadius: msg.role === 'user' ? 'var(--radius) var(--radius) 0 var(--radius)' : '0 var(--radius) var(--radius) var(--radius)',
                padding: '.875rem 1rem',
              }}>
                {msg.content.split('\n').map((line, j) => (
                  <p key={j} style={{ fontSize: '.875rem', lineHeight: 1.7, marginBottom: j < msg.content.split('\n').length - 1 ? '.5rem' : 0 }}>{line}</p>
                ))}
              </div>
              <p style={{ fontSize: '.6rem', color: 'var(--text-3)', marginTop: '.25rem', textAlign: msg.role === 'user' ? 'right' : 'left', paddingLeft: msg.role === 'assistant' ? '.25rem' : 0 }}>
                {formatTime(msg.time)}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {sending && (
          <div style={{ display: 'flex', gap: '.625rem', alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(19,236,182,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>🤖</div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0 var(--radius) var(--radius) var(--radius)', padding: '.875rem 1.25rem', display: 'flex', gap: '.375rem', alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', animation: `bounce .9s ${i * .15}s infinite` }} />
              ))}
              <style>{`@keyframes bounce{0%,80%,100%{transform:scale(0.6);opacity:.4}40%{transform:scale(1);opacity:1}}`}</style>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ position: 'fixed', bottom: 64, left: 0, right: 0, padding: '.75rem 1rem', background: 'var(--bg)', borderTop: '1px solid var(--border)', display: 'flex', gap: '.625rem', alignItems: 'flex-end', maxWidth: 430, margin: '0 auto' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Ask anything about your child…"
          rows={1}
          style={{
            flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '.875rem', padding: '.75rem 1rem', color: 'var(--text-1)',
            fontFamily: 'Lexend, sans-serif', fontSize: '.875rem', lineHeight: 1.5,
            resize: 'none', maxHeight: 120, overflow: 'auto', boxSizing: 'border-box'
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || sending}
          style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: input.trim() && !sending ? 'var(--primary)' : 'var(--surface-2)',
            border: 'none', cursor: input.trim() && !sending ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s'
          }}
        >
          <span className="msi" style={{ fontSize: 20, color: input.trim() && !sending ? '#0d1e18' : 'var(--text-3)' }}>send</span>
        </button>
      </div>

      <BottomNav active="expert" />
    </div>
  )
}
