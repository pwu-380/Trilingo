import { useEffect, useState } from 'react'

function App() {
  const [health, setHealth] = useState<string>('checking...')

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealth(data.status))
      .catch(() => setHealth('error — is the backend running?'))
  }, [])

  return (
    <div style={{ fontFamily: 'system-ui', padding: '2rem', textAlign: 'center' }}>
      <h1>Trilingo</h1>
      <p>Mandarin Chinese Learning App</p>
      <p style={{ color: health === 'ok' ? 'green' : 'red' }}>
        Backend: {health}
      </p>
    </div>
  )
}

export default App
