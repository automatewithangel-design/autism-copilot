'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '../../components/BottomNav'

export default function UploadReportPage() {
  const router = useRouter()
  const fileRef = useRef()
  const [profile, setProfile] = useState(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [error, setError] = useState('')
  const [recentReports, setRecentReports] = useState([])
  const [step, setStep] = useState('idle') // idle | uploading | analysing | done

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('*').eq('auth_id', user.id).single()
      if (profile) {
        setProfile(profile)
        const { data: reports } = await supabase
          .from('reports')
          .select('*')
          .eq('user_id', profile.id)
          .order('uploaded_at', { ascending: false })
          .limit(5)
        setRecentReports(reports || [])
      }
    }
    load()
  }, [])

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped)
      setError('')
    } else {
      setError('Please upload a PDF file only.')
    }
  }

  function handleFileSelect(e) {
    const selected = e.target.files[0]
    if (selected && selected.type === 'application/pdf') {
      setFile(selected)
      setError('')
    } else {
      setError('Please upload a PDF file only.')
    }
  }

  async function handleUploadAndAnalyse() {
    if (!file || !profile) return
    setError('')
    setStep('uploading')

    try {
      // 1. Upload PDF to Supabase Storage
      const fileName = `${profile.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(fileName, file, { contentType: 'application/pdf' })

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

      const { data: { publicUrl } } = supabase.storage.from('reports').getPublicUrl(fileName)

      // 2. Create report record in DB
      const { data: report, error: dbError } = await supabase
        .from('reports')
        .insert({
          user_id: profile.id,
          file_name: file.name,
          file_url: publicUrl,
          status: 'processing'
        })
        .select()
        .single()

      if (dbError) throw new Error(`Database error: ${dbError.message}`)

      setStep('analysing')

      // 3. Extract text from PDF using FileReader
      const arrayBuffer = await file.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

      // 4. Send to AI for analysis
      const res = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64,
          fileName: file.name,
          childName: profile.child_name,
          age: profile.age,
          reportId: report.id
        })
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Analysis failed (${res.status}): ${text}`)
      }

      const analysis = await res.json()
      if (analysis.error) throw new Error(analysis.error)

      // 5. Save analysis to DB
      await supabase
        .from('reports')
        .update({ status: 'complete', ai_summary: analysis })
        .eq('id', report.id)

      setStep('done')
      setTimeout(() => router.push(`/reports/analysis?id=${report.id}`), 1500)

    } catch (e) {
      console.error('Upload/analysis error:', e)
      setError(e.message || 'Something went wrong. Please try again.')
      setStep('idle')
    }
  }

  const stepMessages = {
    uploading: { icon: '📤', text: 'Uploading your report securely…', sub: 'This takes a few seconds' },
    analysing: { icon: '🤖', text: 'AI is reading the report…', sub: 'Translating clinical language into plain English' },
    done:      { icon: '✅', text: 'Analysis complete!', sub: 'Redirecting to your results…' },
  }

  return (
    <div className="app mesh-bg">
      <div className="app-header">
        <Link href="/dashboard" className="btn-back">
          <span className="msi" style={{ fontSize: 20 }}>arrow_back</span>
        </Link>
        <h2 style={{ flex: 1, textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}>Upload Report</h2>
        <div style={{ width: 36 }} />
      </div>

      <div className="main-scroll">

        {/* Processing overlay */}
        {step !== 'idle' && (
          <div className="anim-up" style={{ margin: '1.25rem 1rem 0' }}>
            <div style={{ background: step === 'done' ? 'rgba(74,222,128,.08)' : 'rgba(19,236,182,.06)', border: `1px solid ${step === 'done' ? 'rgba(74,222,128,.2)' : 'rgba(19,236,182,.15)'}`, borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>
                {step !== 'done' ? (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(19,236,182,.2)', borderTopColor: 'var(--primary)', animation: 'spin .8s linear infinite' }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </div>
                ) : stepMessages[step].icon}
              </div>
              <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)', marginBottom: '.375rem' }}>{stepMessages[step].text}</p>
              <p style={{ fontSize: '.8rem', color: 'var(--text-3)' }}>{stepMessages[step].sub}</p>
            </div>
          </div>
        )}

        {/* Upload area */}
        {step === 'idle' && (
          <div className="anim-up" style={{ padding: '1.25rem 1rem 0' }}>

            {/* Info banner */}
            <div style={{ background: 'rgba(96,165,250,.06)', border: '1px solid rgba(96,165,250,.15)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem', display: 'flex', gap: '.75rem' }}>
              <span className="msi fill" style={{ color: 'var(--info)', fontSize: 22, flexShrink: 0 }}>auto_awesome</span>
              <div>
                <p style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '.25rem' }}>AI-powered report analysis</p>
                <p style={{ fontSize: '.78rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
                  Upload {profile?.child_name}'s assessment report and our AI will translate the clinical language into clear, actionable insights — just for you.
                </p>
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !file && fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--primary)' : file ? 'var(--success)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-lg)',
                background: dragging ? 'rgba(19,236,182,.05)' : file ? 'rgba(74,222,128,.04)' : 'var(--surface)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: file ? 'default' : 'pointer',
                transition: 'all .2s',
                marginBottom: '1rem'
              }}
            >
              {file ? (
                <>
                  <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>📄</div>
                  <p style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--success)', marginBottom: '.25rem' }}>{file.name}</p>
                  <p style={{ fontSize: '.78rem', color: 'var(--text-3)', marginBottom: '1rem' }}>
                    {(file.size / 1024 / 1024).toFixed(1)} MB · PDF ready to analyse
                  </p>
                  <button onClick={e => { e.stopPropagation(); setFile(null) }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '9999px', padding: '.25rem .875rem', color: 'var(--text-3)', fontSize: '.75rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Lexend, sans-serif' }}>
                    Remove
                  </button>
                </>
              ) : (
                <>
                  <span className="msi" style={{ fontSize: 48, color: 'var(--border)', display: 'block', marginBottom: '.875rem' }}>upload_file</span>
                  <p style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: '.375rem' }}>Drag & drop your PDF here</p>
                  <p style={{ fontSize: '.78rem', color: 'var(--text-3)', marginBottom: '1rem' }}>or tap to browse your files</p>
                  <span className="chip chip-muted">PDF files only · Max 10MB</span>
                </>
              )}
            </div>

            <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileSelect} style={{ display: 'none' }} />

            {error && (
              <p className="error-msg" style={{ marginBottom: '.875rem' }}>
                <span className="msi" style={{ fontSize: 14 }}>error</span>{error}
              </p>
            )}

            {/* What reports work */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1rem', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-3)', marginBottom: '.75rem' }}>What reports work best?</p>
              {[
                { icon: '🧠', text: 'Psychological assessments' },
                { icon: '🗣️', text: 'Speech & language reports' },
                { icon: '🖐️', text: 'Occupational therapy reports' },
                { icon: '📋', text: 'School or EHCP assessments' },
                { icon: '🏥', text: 'Paediatrician / diagnostic reports' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.625rem', marginBottom: i < 4 ? '.5rem' : 0 }}>
                  <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                  <span style={{ fontSize: '.82rem', color: 'var(--text-2)' }}>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Privacy note */}
            <div style={{ display: 'flex', gap: '.625rem', background: 'rgba(251,191,36,.05)', border: '1px solid rgba(251,191,36,.15)', borderRadius: 'var(--radius)', padding: '.875rem', marginBottom: '1.25rem' }}>
              <span className="msi fill" style={{ color: 'var(--warning)', fontSize: 18, flexShrink: 0 }}>lock</span>
              <p style={{ fontSize: '.75rem', color: 'var(--text-2)', lineHeight: 1.65 }}>
                <strong style={{ color: 'var(--text-1)' }}>Your privacy is protected.</strong> Reports are encrypted, stored securely, and never shared. Only you can access your child's data.
              </p>
            </div>

            <button
              onClick={handleUploadAndAnalyse}
              disabled={!file || !profile}
              className="btn btn-primary btn-full btn-lg"
            >
              <span className="msi" style={{ fontSize: 20 }}>auto_awesome</span>
              Analyse with AI
            </button>
          </div>
        )}

        {/* Recent reports */}
        {recentReports.length > 0 && step === 'idle' && (
          <div className="anim-up d2" style={{ padding: '1.25rem 1rem' }}>
            <p style={{ fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--text-3)', marginBottom: '.75rem' }}>Previous Reports</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
              {recentReports.map((report, i) => (
                <Link key={i} href={`/reports/analysis?id=${report.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.875rem 1rem', display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--text-1)' }}>{report.file_name}</p>
                      <p style={{ fontSize: '.72rem', color: 'var(--text-3)', marginTop: 2 }}>
                        {new Date(report.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`chip${report.status === 'complete' ? '' : ' chip-warn'}`}>
                      {report.status === 'complete' ? '✓ Ready' : 'Processing'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav active="more" />
    </div>
  )
}
