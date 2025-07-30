const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

const cors = require('cors');
const express = require('express');
const { Readable } = require('stream');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

let currentPrompt = '';

function webStreamToNodeStream(webStream) {
	const reader = webStream.getReader();
	return new Readable({
		async read() {
			const { done, value } = await reader.read();
			if (done) {
				this.push(null);
			} else {
				this.push(Buffer.from(value));
			}
		}
	});
}

app.post('/api/chat', async (req, res) => {
	const { prompt } = req.body;
	if (!prompt) {
		return res.status(400).json({ error: 'Prompt is required.' });
	}

	currentPrompt = prompt;
	res.status(200).json({ ok: true });
});

app.get('/api/stream', async (req, res) => {
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache');
	res.setHeader('Connection', 'keep-alive');
	res.setHeader('X-Accel-Buffering', 'no');

	try {
		const ollamaRes = await fetch(`${OLLAMA_HOST}/api/generate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'llama2:7b',
				prompt: currentPrompt || 'Hello!',
				stream: true
			})
		});

		const nodeStream = webStreamToNodeStream(ollamaRes.body);
		let buffer = '';

		for await (const chunk of nodeStream) {
			buffer += chunk.toString();

			const lines = buffer.split('\n');
			buffer = lines.pop(); // save any partial line

			for (const line of lines) {
				if (!line.trim()) continue;

				try {
					const parsed = JSON.parse(line);

					if (parsed.response) {
						res.write(`data: ${parsed.response}\n\n`);
						res.flush?.();
					}

					if (parsed.done) {
						res.write(`event: done\ndata: [DONE]\n\n`);
						res.end();
						return;
					}
				} catch (err) {
					console.error('❌ Failed to parse NDJSON line:', line);
				}
			}
		}
	} catch (err) {
		console.error('🚨 Streaming error:', err.message);
		res.write(`event: error\ndata: ${JSON.stringify(err.message)}\n\n`);
		res.end();
	}
});

app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});
