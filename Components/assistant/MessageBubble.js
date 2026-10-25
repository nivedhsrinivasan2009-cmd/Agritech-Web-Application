import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, Zap, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { submitFeedback } from "@/api/aiService";

const FunctionDisplay = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name || 'Function';
  const status = toolCall?.status || 'pending';
  const results = toolCall?.results;
  
  const parsedResults = (() => {
    if (!results) return null;
    try {
      return typeof results === 'string' ? JSON.parse(results) : results;
    } catch {
      return results;
    }
  })();
  
  const isError = results && (
    (typeof results === 'string' && /error|failed/i.test(results)) ||
    (parsedResults?.success === false)
  );
  
  const statusConfig = {
    pending: { icon: Clock, color: 'text-stone-400', text: 'Pending' },
    running: { icon: Loader2, color: 'text-stone-500', text: 'Searching...', spin: true },
    in_progress: { icon: Loader2, color: 'text-stone-500', text: 'Searching...', spin: true },
    completed: isError ? 
      { icon: AlertCircle, color: 'text-red-500', text: 'Failed' } : 
      { icon: CheckCircle2, color: 'text-green-600', text: 'Found' },
    success: { icon: CheckCircle2, color: 'text-green-600', text: 'Found' },
    failed: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' },
    error: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' }
  }[status] || { icon: Zap, color: 'text-stone-500', text: '' };
  
  const Icon = statusConfig.icon;
  const formattedName = name.split('.').pop()?.replace(/_/g, ' ') || name;
  
  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all",
          "hover:bg-stone-50",
          expanded ? "bg-stone-50 border-stone-300" : "bg-white border-stone-200"
        )}
      >
        <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
        <span className="text-stone-700 capitalize">{formattedName}</span>
        {statusConfig.text && (
          <span className={cn("text-stone-500", isError && "text-red-600")}>
            • {statusConfig.text}
          </span>
        )}
        {!statusConfig.spin && (toolCall.arguments_string || results) && (
          <ChevronRight className={cn("h-3 w-3 text-stone-400 transition-transform ml-auto", 
            expanded && "rotate-90")} />
        )}
      </button>
    </div>
  );
};

export default function MessageBubble({
  message,
  isStreaming = false,
  showFeedback = false,
  conversationId,
  messageIndex,
}) {
  const isUser = message.role === 'user';
  const [feedback, setFeedback] = useState(null);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const handleFeedback = async (rating) => {
    if (feedback || feedbackSubmitting) return;

    setFeedbackSubmitting(true);
    try {
      await submitFeedback({
        conversationId,
        messageIndex,
        rating,
      });
      setFeedback(rating);
      toast.success(rating === 'positive' ? 'Thanks for the feedback!' : 'Thanks, we\'ll improve!');
    } catch (error) {
      console.error('Feedback error:', error);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#2D5016] to-[#4A7C23] flex items-center justify-center mt-0.5 flex-shrink-0">
          <span className="text-white text-xs font-semibold">G</span>
        </div>
      )}
      <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
        {message.content && (
          <div className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-[#2D5016] text-white rounded-br-md"
              : "bg-white border border-stone-200 rounded-bl-md shadow-sm"
          )}>
            {isUser ? (
              <p className="text-sm leading-relaxed">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="text-sm prose prose-sm prose-stone max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  code: ({ inline, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <div className="relative group/code">
                        <pre className="bg-stone-900 text-stone-100 rounded-lg p-3 overflow-x-auto my-2">
                          <code className={className} {...props}>{children}</code>
                        </pre>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover/code:opacity-100 bg-stone-800 hover:bg-stone-700"
                          onClick={() => {
                            navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                            toast.success('Code copied');
                          }}
                        >
                          <Copy className="h-3 w-3 text-stone-400" />
                        </Button>
                      </div>
                    ) : (
                      <code className="px-1 py-0.5 rounded bg-stone-100 text-stone-700 text-xs">
                        {children}
                      </code>
                    );
                  },
                  a: ({ children, ...props }) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" className="text-[#2D5016] underline">{children}</a>
                  ),
                  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  h1: ({ children }) => <h1 className="text-lg font-semibold my-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-base font-semibold my-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold my-2">{children}</h3>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-stone-300 pl-3 my-2 text-stone-600">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {/* "•" lines (FAQ answers, some model replies) aren't markdown list items and
                    would run together into one paragraph, so render them as a list */}
                {message.content.replace(/^(\s*)•\s?/gm, "$1- ")}
              </ReactMarkdown>
            )}
            {/* Streaming cursor */}
            {isStreaming && !isUser && (
              <span className="inline-block w-2 h-4 bg-[#2D5016] animate-pulse ml-1 align-middle" />
            )}
          </div>
        )}

        {/* Knowledge the answer was grounded in (RAG sources) */}
        {!isUser && !isStreaming && message.sources?.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-1.5 text-[11px] text-stone-500">
            <span>Sources:</span>
            {message.sources.slice(0, 4).map((source, idx) => (
              <span key={idx} className="px-1.5 py-0.5 rounded-md bg-stone-100 border border-stone-200">
                {source.type}: {source.title}
              </span>
            ))}
          </div>
        )}

        {message.tool_calls?.length > 0 && (
          <div className="space-y-1 mt-1">
            {message.tool_calls.map((toolCall, idx) => (
              <FunctionDisplay key={idx} toolCall={toolCall} />
            ))}
          </div>
        )}

        {/* Feedback buttons */}
        {showFeedback && !isUser && !isStreaming && message.content && (
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={() => handleFeedback('positive')}
              disabled={feedback !== null || feedbackSubmitting}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                feedback === 'positive'
                  ? "bg-green-100 text-green-600"
                  : "hover:bg-stone-100 text-stone-400 hover:text-stone-600",
                (feedback !== null && feedback !== 'positive') && "opacity-40"
              )}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleFeedback('negative')}
              disabled={feedback !== null || feedbackSubmitting}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                feedback === 'negative'
                  ? "bg-red-100 text-red-600"
                  : "hover:bg-stone-100 text-stone-400 hover:text-stone-600",
                (feedback !== null && feedback !== 'negative') && "opacity-40"
              )}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}