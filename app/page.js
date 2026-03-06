export default function Home() {
  return (
    <main style={{
      background: '#0d1e18',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      color: '#f0faf6',
      gap: '1.5rem',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{fontSize:'3rem'}}>🧩</div>
      <h1 style={{fontSize:'1.75rem',fontWeight:'800'}}>
        Autism Copilot
      </h1>
      <p style={{color:'#9bbfb2',maxWidth:'300px'}}>
        A supportive space for your child's journey.
      </p>
      <a href="/01-login.html" style={{
        background: '#13ecb6',
        color: '#0d1e18',
        padding: '1rem 2rem',
        borderRadius: '0.875rem',
        fontWeight: '700',
        textDecoration: 'none',
        fontSize: '1rem'
      }}>
        Get Started →
      </a>
    </main>
  )
}
