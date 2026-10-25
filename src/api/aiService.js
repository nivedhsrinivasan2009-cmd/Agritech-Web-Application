/**
 * AI Service for Gracia Visitor App
 * Handles communication with the Ollama backend (RAG over the app's live data)
 */

import { getKnowledgeSnapshot } from './localDataService';
import { buildDocuments, retrieveContext, composeAnswer, locationAwareQuery } from '@/lib/rag';
import { faqs, policies, graciaInfo } from '@/data/knowledgeBase';
import { getVisitorZone } from '@/lib/visitorLocation';

const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:3002/api/ai';
const AI_TIMEOUT_MS = parseInt(import.meta.env.VITE_AI_TIMEOUT_MS) || 60000; // Max wait without any new output
const isDev = import.meta.env.DEV;

// Headers for all AI API requests (includes ngrok bypass header)
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
});

// The visitor's current time and time zone (so "today" means the visitor's today) and, when
// known from GPS on the map page, the farm zone they're in (so "what's near me?" works)
const getClientContext = () => ({
  now: new Date().toISOString(),
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  currentZone: getVisitorZone()?.name,
});

// Request body shared by the chat endpoints: the question plus the live data to retrieve from
const buildChatBody = ({ message, conversationHistory, pageContext }) => JSON.stringify({
  message,
  conversationHistory: conversationHistory.filter(m => m.content),
  pageContext,
  knowledge: getKnowledgeSnapshot(),
  clientContext: getClientContext(),
});

/**
 * Check if the AI backend is available
 * @returns {Promise<{available: boolean, models: string[], rag: object}>}
 */
export async function checkAIStatus() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for status check

  try {
    const response = await fetch(`${AI_API_URL}/status`, {
      method: 'GET',
      headers: getHeaders(),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { available: false, models: [], rag: null, error: 'Backend not responding' };
    }

    const data = await response.json();
    return {
      available: data.status === 'connected',
      models: data.models || [],
      rag: data.rag || null,
      error: data.error,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      available: false,
      models: [],
      rag: null,
      error: error.name === 'AbortError' ? 'Connection timeout' : 'Cannot connect to AI backend',
    };
  }
}

/**
 * Stream chat response from AI
 * @param {Object} options
 * @param {string} options.message - User message
 * @param {Array} options.conversationHistory - Previous messages
 * @param {string} options.pageContext - Current page context
 * @param {Function} options.onChunk - Callback for each streamed chunk
 * @param {Function} options.onComplete - Callback when complete, with (fullResponse, sources)
 * @param {Function} options.onError - Callback on error
 * @param {number} options.timeout - Max ms to wait without any new output (optional)
 * @returns {Promise<{abort: Function}>} - Returns abort controller
 */
export async function streamChat({
  message,
  conversationHistory = [],
  pageContext,
  onChunk,
  onComplete,
  onError,
  timeout = AI_TIMEOUT_MS,
}) {
  const controller = new AbortController();
  let timeoutId = null;

  // Idle timeout: restarted whenever output arrives, so long answers that keep streaming aren't cut off
  const resetTimeout = () => {
    clearTimeout(timeoutId);
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        controller.abort();
        onError?.('Request timed out. The AI is taking too long to respond.');
      }, timeout);
    }
  };
  resetTimeout();

  try {
    const response = await fetch(`${AI_API_URL}/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: buildChatBody({ message, conversationHistory, pageContext }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let sources = [];
    let buffer = '';

    // Returns true once the stream is finished (done or error)
    const handleEvent = (line) => {
      if (!line.startsWith('data: ')) return false;
      try {
        const data = JSON.parse(line.slice(6));

        if (data.error) {
          onError?.(data.error);
          return true;
        }
        if (data.sources) {
          sources = data.sources;
        }
        if (data.content) {
          fullResponse += data.content;
          onChunk?.(data.content, fullResponse);
        }
        if (data.done) {
          onComplete?.(fullResponse, sources);
          return true;
        }
      } catch (e) {
        // Log parse errors in development for debugging
        if (isDev && line !== 'data: ') {
          console.warn('SSE parse warning:', e.message, 'Line:', line.slice(0, 100));
        }
      }
      return false;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      resetTimeout();

      // An event can be split across network chunks: keep the incomplete tail for the next read
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      if (lines.some(handleEvent)) {
        clearTimeout(timeoutId);
        return { abort: () => controller.abort() };
      }
    }

    clearTimeout(timeoutId);
    if (!handleEvent(buffer)) {
      onComplete?.(fullResponse, sources);
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      // Don't log abort errors - they're intentional
      return { abort: () => {} };
    }

    console.error('Stream chat error:', error);
    onError?.(error.message || 'Failed to connect to AI');
  }

  return { abort: () => controller.abort() };
}

/**
 * Send chat message (non-streaming)
 * @param {Object} options
 * @param {string} options.message - User message
 * @param {Array} options.conversationHistory - Previous messages
 * @param {string} options.pageContext - Current page context
 * @param {number} options.timeout - Timeout in ms (optional)
 * @returns {Promise<{content: string, error?: string}>}
 */
export async function sendChat({ message, conversationHistory = [], pageContext, timeout = AI_TIMEOUT_MS }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${AI_API_URL}/chat/sync`, {
      method: 'POST',
      headers: getHeaders(),
      body: buildChatBody({ message, conversationHistory, pageContext }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      return { error: 'Request timed out. The AI is taking too long to respond.' };
    }

    console.error('Send chat error:', error);
    return { error: error.message || 'Failed to get response' };
  }
}

/**
 * Submit feedback for a chat response
 * @param {Object} options
 * @param {string} options.conversationId - Conversation ID
 * @param {number} options.messageIndex - Index of the message
 * @param {string} options.rating - 'positive' or 'negative'
 * @param {string} options.feedbackText - Optional feedback text
 * @returns {Promise<{success: boolean}>}
 */
export async function submitFeedback({ conversationId, messageIndex, rating, feedbackText }) {
  try {
    const response = await fetch(`${AI_API_URL}/feedback`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        conversationId,
        messageIndex,
        rating,
        feedbackText,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('Submit feedback error:', error);
    return { success: false };
  }
}

/**
 * Fallback response when the AI model is unavailable.
 * Retrieves from the same live data and knowledge base the AI uses (RAG without the LLM)
 * and composes an answer directly from the best-matching documents.
 */
export function getFallbackResponse(message, conversationHistory = []) {
  const { timeZone, currentZone } = getClientContext();
  const docs = buildDocuments(
    { ...getKnowledgeSnapshot(), faqs, policies, info: graciaInfo },
    { now: new Date(), timeZone }
  );
  const query = locationAwareQuery(message, currentZone);
  return composeAnswer(message, retrieveContext(docs, query, { history: conversationHistory }));
}

export default {
  checkAIStatus,
  streamChat,
  sendChat,
  submitFeedback,
  getFallbackResponse,
};
