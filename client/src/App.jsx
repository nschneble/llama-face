import { useState, useRef } from 'react';

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const eventSourceRef = useRef(null);

  const sendPrompt = async () => {
    setResponse('');
    setLoading(true);

    await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const eventSource = new EventSource('http://localhost:3001/api/stream');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (e) => {
      setResponse((prev) => prev + e.data);
    };

    eventSource.addEventListener('done', () => {
      setLoading(false);
      eventSource.close();
    });

    eventSource.onerror = (err) => {
      console.error('Stream error', err);
      setLoading(false);
      eventSource.close();
    };
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Ollama Chat (Live)</h1>
      <textarea
        rows={4}
        style={{ width: '100%' }}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask me something..."
      />
      <button onClick={sendPrompt} disabled={loading}>
        {loading ? 'Thinking...' : 'Send'}
      </button>
      <pre style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{response}</pre>
    </div>
  );
}

export default App;
