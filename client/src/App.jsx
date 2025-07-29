import { useState } from 'react';

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const sendPrompt = async () => {
    setLoading(true);
    setResponse('');

    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (err) {
      setResponse('Error talking to Ollama');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Ollama Chat</h1>
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
