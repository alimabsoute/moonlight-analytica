import { useState, useRef, useCallback } from 'react';

interface StreamOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  system?: string;
}

interface StreamMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseStreamingReturn {
  response: string;
  isStreaming: boolean;
  error: string | null;
  startStream: (messages: StreamMessage[], opts?: StreamOptions) => Promise<string>;
  stopStream: () => void;
  reset: () => void;
}

export function useStreaming(): UseStreamingReturn {
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stopStream();
    setResponse('');
    setError(null);
  }, [stopStream]);

  const startStream = useCallback(
    async (messages: StreamMessage[], opts?: StreamOptions): Promise<string> => {
      reset();
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let accumulated = '';

      try {
        const res = await fetch('/api/claude/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, ...opts }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Stream request failed: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          // Keep the last potentially incomplete line in the buffer
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            if (trimmed.startsWith('data: ')) {
              const data = trimmed.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data) as { text?: string; error?: string };
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.text) {
                  accumulated += parsed.text;
                  setResponse(accumulated);
                }
              } catch (e) {
                // If it's not valid JSON, treat the raw data as text
                if (e instanceof SyntaxError) {
                  accumulated += data;
                  setResponse(accumulated);
                } else {
                  throw e;
                }
              }
            }
          }
        }

        setIsStreaming(false);
        abortRef.current = null;
        return accumulated;
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          // User-initiated cancellation — not an error
          setIsStreaming(false);
          return accumulated;
        }

        const message =
          err instanceof Error ? err.message : 'Streaming failed';
        setError(message);
        setIsStreaming(false);
        abortRef.current = null;
        throw err;
      }
    },
    [reset],
  );

  return { response, isStreaming, error, startStream, stopStream, reset };
}
