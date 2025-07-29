import { useState, useRef, useEffect } from 'react';

function App() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const assistantBufferRef = useRef(''); // temp buffer for streamed content

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendPrompt = async () => {
    if (!prompt.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    assistantBufferRef.current = '';
    setLoading(true);
    setPrompt('');

    await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    const eventSource = new EventSource('http://localhost:3001/api/stream');

    eventSource.onmessage = (e) => {
      assistantBufferRef.current += e.data;

      // Optimistically update last assistant message (or create new)
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return [...prev.slice(0, -1), { role: 'assistant', content: assistantBufferRef.current }];
        } else {
          return [...prev, { role: 'assistant', content: e.data }];
        }
      });
    };

    eventSource.addEventListener('done', () => {
      eventSource.close();
      setLoading(false);
    });

    eventSource.onerror = (err) => {
      console.error('Stream error:', err);
      eventSource.close();
      setLoading(false);
    };
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1>Ollama Chat</h1>

      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: 8,
          padding: '1rem',
          height: '400px',
          overflowY: 'auto',
          marginBottom: '1rem',
          backgroundColor: '#fafafa'
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              margin: '0.5rem 0',
              textAlign: msg.role === 'user' ? 'right' : 'left'
            }}
          >
            <div
              style={{
                display: 'inline-block',
                backgroundColor: msg.role === 'user' ? '#d1e7dd' : '#f8d7da',
                padding: '0.5rem 1rem',
                borderRadius: 12,
                maxWidth: '80%'
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <textarea
        rows={3}
        style={{ width: '100%', padding: '0.5rem' }}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask something..."
      />
      <button onClick={sendPrompt} disabled={loading} style={{ marginTop: '0.5rem' }}>
        {loading ? 'Thinking...' : 'Send'}
      </button>
    </div>
  );
}

export default App;
