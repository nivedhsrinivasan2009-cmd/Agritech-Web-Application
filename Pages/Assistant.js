import React, { useState, useEffect, useRef } from "react";
import { streamChat, checkAIStatus, getFallbackResponse } from "@/api/aiService";
import { motion, AnimatePresence } from "framer-motion";
import MessageBubble from "../Components/assistant/MessageBubble";
import {
  MessageCircle, Send, Loader2, Calendar, Leaf, Store, Map,
  Sparkles, RefreshCw, Wifi, WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function Assistant() {
  const [conversationId] = useState(() => `conv_${Date.now()}`);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { icon: Calendar, text: "What events are happening today?", color: "text-emerald-600 bg-emerald-50" },
    { icon: Leaf, text: "What activities can I do with kids?", color: "text-lime-600 bg-lime-50" },
    { icon: Store, text: "Where can I get coffee?", color: "text-amber-600 bg-amber-50" },
    { icon: Map, text: "How do I get to the animal yard?", color: "text-blue-600 bg-blue-50" },
  ];

  // Check AI status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkAIStatus();
      setAiAvailable(status.available);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading || isStreaming) return;

    const userMessage = text.trim();
    setInputValue("");

    // Add user message
    const newUserMessage = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);

    if (aiAvailable) {
      // Use streaming AI
      setIsStreaming(true);

      // Add placeholder for assistant
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      await streamChat({
        message: userMessage,
        conversationHistory: messages,
        pageContext: "Assistant",
        onChunk: (chunk, fullContent) => {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: fullContent };
            return updated;
          });
        },
        onComplete: (fullContent, sources) => {
          setIsStreaming(false);
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: fullContent, sources };
            return updated;
          });
        },
        onError: (error) => {
          console.error("AI error:", error);
          setIsStreaming(false);
          const fallbackResponse = getFallbackResponse(userMessage, messages);
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: fallbackResponse };
            return updated;
          });
        },
      });
    } else {
      // Use fallback
      setIsLoading(true);
      setTimeout(() => {
        const response = getFallbackResponse(userMessage, messages);
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
        setIsLoading(false);
      }, 500);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleQuickPrompt = (prompt) => {
    sendMessage(prompt);
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] pb-16 lg:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D5016] to-[#4A7C23] flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-stone-900">Gracia AI Assistant</h1>
            <p className="text-xs text-stone-500">Ask me anything about the venue</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* AI Status */}
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
              aiAvailable ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
            )}
          >
            {aiAvailable ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{aiAvailable ? "AI Connected" : "Basic Mode"}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            className="text-stone-500"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-stone-50">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              {/* Welcome Message */}
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2D5016] to-[#4A7C23] flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-stone-900 mb-2">
                Hi! I'm Gracia AI
              </h2>
              <p className="text-stone-500 mb-8 max-w-md mx-auto">
                I can help you find events, activities, shops, and navigate the venue.
                What would you like to know?
              </p>

              {/* Quick Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                {quickPrompts.map((prompt, index) => {
                  const Icon = prompt.icon;
                  return (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleQuickPrompt(prompt.text)}
                      disabled={isLoading || isStreaming}
                      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all text-left disabled:opacity-50"
                    >
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", prompt.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-sm text-stone-700">{prompt.text}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <MessageBubble
                      message={message}
                      isStreaming={isStreaming && index === messages.length - 1 && message.role === "assistant"}
                      showFeedback={!isStreaming && message.role === "assistant"}
                      conversationId={conversationId}
                      messageIndex={index}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#2D5016] to-[#4A7C23] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-semibold">G</span>
                  </div>
                  <div className="bg-white border border-stone-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-stone-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Quick Prompts (when in conversation) */}
      {messages.length > 0 && !isLoading && !isStreaming && (
        <div className="bg-white border-t border-stone-200 px-4 py-2 overflow-x-auto">
          <div className="flex gap-2 max-w-3xl mx-auto">
            {quickPrompts.slice(0, 3).map((prompt, index) => (
              <button
                key={index}
                onClick={() => handleQuickPrompt(prompt.text)}
                className="flex-shrink-0 px-3 py-1.5 bg-stone-100 rounded-full text-xs text-stone-600 hover:bg-stone-200 transition-colors"
              >
                {prompt.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t border-stone-200 px-4 py-3">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isStreaming ? "AI is typing..." : "Ask about events, activities, shops, or directions..."}
              className="flex-1 bg-stone-50 border-stone-200 focus:border-[#2D5016] focus:ring-[#2D5016]"
              disabled={isLoading || isStreaming}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading || isStreaming}
              className="bg-[#2D5016] hover:bg-[#4A7C23] px-4"
            >
              {isLoading || isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
