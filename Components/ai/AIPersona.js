import React, { useState, useEffect, useRef } from "react";
import { streamChat, checkAIStatus, getFallbackResponse } from "@/api/aiService";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Volume2, VolumeX, Mic, MicOff, Wifi, WifiOff, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MessageBubble from "../assistant/MessageBubble";
import VoiceChat from "./VoiceChat";
import { cn } from "@/lib/utils";

const contextualTips = {
  Home: "Welcome to Gracia! 🌱 Want a quick tour of what's happening today?",
  Events: "Looking for specific events? I can help you find family-friendly activities or upcoming workshops!",
  Activities: "Need recommendations? Tell me what you're interested in and I'll suggest the best activities!",
  Shops: "Want to know what's open now? I can help you find cafes, shops, and more!",
  MapZones: "Need directions? Ask me how to get to any zone or what's happening in a specific area!",
  About: "Got questions about Gracia? I'm here to help with visiting hours, guidelines, or anything else!",
  Assistant: null, // Don't show tip on the full assistant page
};

export default function AIPersona({ currentPageName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [conversationId] = useState(() => `conv_${Date.now()}`);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [voiceChatOpen, setVoiceChatOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Check AI backend status on mount
  useEffect(() => {
    const checkStatus = async () => {
      const status = await checkAIStatus();
      setAiAvailable(status.available);
    };
    checkStatus();
    // Re-check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Show contextual tip after 3 seconds on page load
  useEffect(() => {
    const tip = contextualTips[currentPageName];
    if (tip && !isOpen) {
      setShowTip(false);
      const timer = setTimeout(() => setShowTip(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowTip(false);
    }
  }, [currentPageName, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || isStreaming) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    // Add user message to the list
    const newUserMessage = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);

    if (aiAvailable) {
      // Use streaming AI
      setIsStreaming(true);
      setStreamingContent("");

      // Add placeholder for assistant message
      const assistantMessage = { role: "assistant", content: "" };
      setMessages(prev => [...prev, assistantMessage]);

      await streamChat({
        message: userMessage,
        conversationHistory: messages,
        pageContext: currentPageName,
        onChunk: (chunk, fullContent) => {
          setStreamingContent(fullContent);
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: fullContent };
            return updated;
          });
        },
        onComplete: (finalContent, sources) => {
          setIsStreaming(false);
          setStreamingContent("");
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: finalContent, sources };
            return updated;
          });
          // Speak if voice enabled
          if (voiceEnabled && finalContent) {
            speakText(finalContent);
          }
        },
        onError: (error) => {
          console.error("AI error:", error);
          setIsStreaming(false);
          // Fall back to an answer composed from the retrieved documents
          const fallbackResponse = getFallbackResponse(userMessage, messages);
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: fallbackResponse };
            return updated;
          });
        },
      });
    } else {
      // AI offline: answer from the retrieved documents directly
      setIsLoading(true);
      setTimeout(() => {
        const response = getFallbackResponse(userMessage, messages);
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
        setIsLoading(false);
        if (voiceEnabled) {
          speakText(response);
        }
      }, 500);
    }
  };

  const handleQuickPrompt = (prompt) => {
    if (isLoading || isStreaming) return;
    setInputValue(prompt);
  };

  // Auto-send when quick prompt is selected
  useEffect(() => {
    if (inputValue && !isLoading && !isStreaming && messages.length === 0) {
      // Small delay to show the prompt in input first
      const timer = setTimeout(() => {
        handleSend();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [inputValue]);

  // Text-to-Speech
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    utterance.volume = 1;
    
    // Try to find a natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const toggleVoice = () => {
    if (voiceEnabled) {
      window.speechSynthesis?.cancel();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  return (
    <>
      {/* Floating Avatar */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 lg:bottom-6 right-6 z-40"
          >
            {/* Contextual Tip Bubble */}
            <AnimatePresence>
              {showTip && contextualTips[currentPageName] && (
                <motion.div
                  initial={{ opacity: 0, x: 20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, x: 20, y: 10 }}
                  className="absolute bottom-full right-0 mb-3 w-64 bg-white rounded-2xl shadow-lg border border-stone-200 p-4"
                >
                  <button
                    onClick={() => setShowTip(false)}
                    className="absolute top-2 right-2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <p className="text-sm text-stone-700 pr-4">
                    {contextualTips[currentPageName]}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setIsOpen(true);
                      setShowTip(false);
                    }}
                    className="mt-3 w-full bg-[#2D5016] hover:bg-[#4A7C23] text-xs"
                  >
                    Chat with me
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bunny Avatar Button */}
            <motion.button
              onClick={() => setIsOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#4A7C23] to-[#2D5016] shadow-lg flex items-center justify-center group"
            >
              {/* Pulse effect */}
              <span className="absolute inset-0 rounded-full bg-[#4A7C23] animate-ping opacity-20" />
              
              {/* Bunny SVG */}
              <svg
                viewBox="0 0 64 64"
                className="w-9 h-9 text-white relative z-10"
                fill="currentColor"
              >
                {/* Left ear */}
                <ellipse cx="22" cy="16" rx="5" ry="14" transform="rotate(-15 22 16)" />
                {/* Right ear */}
                <ellipse cx="42" cy="16" rx="5" ry="14" transform="rotate(15 42 16)" />
                {/* Head */}
                <circle cx="32" cy="34" r="16" />
                {/* Left eye */}
                <circle cx="26" cy="32" r="2.5" fill="#2D5016" />
                {/* Right eye */}
                <circle cx="38" cy="32" r="2.5" fill="#2D5016" />
                {/* Nose */}
                <circle cx="32" cy="38" r="1.5" fill="#2D5016" />
                {/* Mouth */}
                <path
                  d="M 32 38 Q 28 41 26 40 M 32 38 Q 36 41 38 40"
                  stroke="#2D5016"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>

              {/* Sparkle indicator */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md"
              >
                <Sparkles className="w-3 h-3 text-[#4A7C23]" />
              </motion.div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center lg:justify-end lg:p-6"
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-stone-50 w-full lg:w-96 lg:h-[600px] h-full lg:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#2D5016] to-[#4A7C23] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Mini Bunny */}
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg viewBox="0 0 64 64" className="w-6 h-6 text-white" fill="currentColor">
                      <ellipse cx="22" cy="16" rx="5" ry="14" transform="rotate(-15 22 16)" />
                      <ellipse cx="42" cy="16" rx="5" ry="14" transform="rotate(15 42 16)" />
                      <circle cx="32" cy="34" r="16" />
                      <circle cx="26" cy="32" r="2.5" fill="#2D5016" />
                      <circle cx="38" cy="32" r="2.5" fill="#2D5016" />
                      <circle cx="32" cy="38" r="1.5" fill="#2D5016" />
                      <path d="M 32 38 Q 28 41 26 40 M 32 38 Q 36 41 38 40" stroke="#2D5016" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Gracia AI</h3>
                    <p className="text-xs text-white/80">Your friendly farm guide</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* AI Status Indicator */}
                  <div
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
                      aiAvailable ? "bg-green-500/20 text-green-100" : "bg-yellow-500/20 text-yellow-100"
                    )}
                    title={aiAvailable ? "AI Connected" : "Using basic mode"}
                  >
                    {aiAvailable ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    <span>{aiAvailable ? "AI" : "Basic"}</span>
                  </div>
                  {/* Voice Call Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setVoiceChatOpen(true)}
                    className="text-white hover:bg-white/20"
                    title="Start voice conversation"
                  >
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleVoice}
                    className="text-white hover:bg-white/20"
                    title={voiceEnabled ? "Disable voice" : "Enable voice"}
                  >
                    {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-[#2D5016]/10 flex items-center justify-center mb-4">
                      <svg viewBox="0 0 64 64" className="w-10 h-10 text-[#2D5016]" fill="currentColor">
                        <ellipse cx="22" cy="16" rx="5" ry="14" transform="rotate(-15 22 16)" />
                        <ellipse cx="42" cy="16" rx="5" ry="14" transform="rotate(15 42 16)" />
                        <circle cx="32" cy="34" r="16" />
                        <circle cx="26" cy="32" r="2.5" fill="white" />
                        <circle cx="38" cy="32" r="2.5" fill="white" />
                        <circle cx="32" cy="38" r="1.5" fill="white" />
                        <path d="M 32 38 Q 28 41 26 40 M 32 38 Q 36 41 38 40" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-stone-900 mb-2">Hi! I'm Gracia AI 🌱</h4>
                    <p className="text-sm text-stone-500 mb-4">
                      Your friendly guide to everything at Gracia Farm. Ask me about events, activities, shops, or navigation!
                    </p>
                    <div className="grid grid-cols-1 gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPrompt("What events are happening today?")}
                        className="text-left justify-start text-xs"
                      >
                        What's happening today?
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPrompt("Show me family-friendly activities")}
                        className="text-left justify-start text-xs"
                      >
                        Family activities
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPrompt("Where can I get food?")}
                        className="text-left justify-start text-xs"
                      >
                        Where to eat?
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <MessageBubble
                        key={index}
                        message={message}
                        isStreaming={isStreaming && index === messages.length - 1 && message.role === "assistant"}
                        showFeedback={!isStreaming && message.role === "assistant"}
                        conversationId={conversationId}
                        messageIndex={index}
                      />
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white rounded-2xl px-4 py-3 border border-stone-200">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-stone-200 bg-white p-4">
                <div className="flex gap-2">
                  {recognitionRef.current && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleVoiceInput}
                      disabled={isLoading}
                      className={cn(isListening && "bg-red-50 border-red-300")}
                    >
                      {isListening ? <MicOff className="w-4 h-4 text-red-600" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  )}
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder={isListening ? "Listening..." : isStreaming ? "AI is typing..." : "Ask me anything..."}
                    disabled={isLoading || isStreaming || isListening}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading || isStreaming}
                    className="bg-[#2D5016] hover:bg-[#4A7C23]"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Chat Modal */}
      <VoiceChat
        isOpen={voiceChatOpen}
        onClose={() => setVoiceChatOpen(false)}
        currentPageName={currentPageName}
      />
    </>
  );
}