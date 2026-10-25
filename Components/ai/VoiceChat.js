import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { streamChat, checkAIStatus, getFallbackResponse } from "@/api/aiService";
import BunnyAvatar from "./BunnyAvatar";
import { X, Mic, MicOff, Volume2, VolumeX, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Live Voice Chat Component
 * Enables real-time voice conversation with the AI assistant
 */
export default function VoiceChat({ isOpen, onClose, currentPageName }) {
  // States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [status, setStatus] = useState("idle"); // idle, listening, processing, speaking

  // Refs
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const currentUtteranceRef = useRef(null);
  // The recognizer is created once, so its callbacks call the latest handler through this ref
  // (otherwise they'd keep the first render's aiAvailable=false and empty history)
  const handleUserInputRef = useRef(null);

  // Check AI status
  useEffect(() => {
    const checkStatus = async () => {
      const result = await checkAIStatus();
      setAiAvailable(result.available);
    };
    checkStatus();
  }, [isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn("Speech recognition not supported");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("listening");
      setTranscript("");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      // If we have a final transcript, process it
      if (finalTranscript) {
        handleUserInputRef.current?.(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      setStatus("idle");

      if (event.error === 'no-speech') {
        // No speech detected, just reset
        setTranscript("");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setStatus((current) => (current === "listening" ? "idle" : current));
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  // Handle user input and get AI response
  const handleUserInput = useCallback(async (userText) => {
    if (!userText.trim()) return;

    setStatus("processing");
    setIsProcessing(true);
    setAiResponse("");

    // Add to conversation history (the backend gets the new message separately, so send the prior history)
    const previousHistory = conversationHistory;
    setConversationHistory([...previousHistory, { role: "user", content: userText }]);

    let fullResponse = "";

    if (aiAvailable) {
      await streamChat({
        message: userText,
        conversationHistory: previousHistory,
        pageContext: currentPageName,
        onChunk: (chunk, content) => {
          fullResponse = content;
          setAiResponse(content);
        },
        onComplete: (finalContent) => {
          setIsProcessing(false);
          setConversationHistory(prev => [...prev, { role: "assistant", content: finalContent }]);
          if (voiceEnabled) {
            speakResponse(finalContent);
          } else {
            setStatus("idle");
          }
        },
        onError: (error) => {
          console.error("AI error:", error);
          const fallback = getFallbackResponse(userText, previousHistory);
          setAiResponse(fallback);
          setIsProcessing(false);
          setConversationHistory(prev => [...prev, { role: "assistant", content: fallback }]);
          if (voiceEnabled) {
            speakResponse(fallback);
          } else {
            setStatus("idle");
          }
        },
      });
    } else {
      // Fallback mode
      setTimeout(() => {
        const response = getFallbackResponse(userText, previousHistory);
        setAiResponse(response);
        setIsProcessing(false);
        setConversationHistory(prev => [...prev, { role: "assistant", content: response }]);
        if (voiceEnabled) {
          speakResponse(response);
        } else {
          setStatus("idle");
        }
      }, 500);
    }
  }, [aiAvailable, conversationHistory, currentPageName, voiceEnabled]);

  useEffect(() => {
    handleUserInputRef.current = handleUserInput;
  }, [handleUserInput]);

  // Text-to-Speech
  const speakResponse = useCallback((text) => {
    if (!window.speechSynthesis || !voiceEnabled) {
      setStatus("idle");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean text for speech (remove markdown)
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`[^`]+`/g, '')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    // Get voices and select a good one
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google'))
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatus("speaking");
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setStatus("idle");
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
      setStatus("idle");
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  // Start listening
  const startListening = () => {
    if (!recognitionRef.current) return;

    // Stop any ongoing speech
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error("Failed to start recognition:", error);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Toggle voice output
  const toggleVoice = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setStatus("idle");
    }
    setVoiceEnabled(!voiceEnabled);
  };

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis?.cancel();
      setIsListening(false);
      setIsSpeaking(false);
      setStatus("idle");
    }
  }, [isOpen]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis?.getVoices();
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-b from-[#2D5016] to-[#1a3009] z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              aiAvailable ? "bg-green-500/20 text-green-300" : "bg-yellow-500/20 text-yellow-300"
            )}>
              {aiAvailable ? "AI Connected" : "Basic Mode"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVoice}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {/* Avatar */}
          <motion.div
            animate={{
              scale: isSpeaking ? [1, 1.02, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: isSpeaking ? Infinity : 0,
            }}
            className="mb-8"
          >
            <BunnyAvatar
              size="xl"
              isSpeaking={isSpeaking}
              isThinking={isProcessing}
              isListening={isListening}
            />
          </motion.div>

          {/* Status Text */}
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-2">
              {status === "idle" && "Hi! I'm Gracia AI"}
              {status === "listening" && "I'm listening..."}
              {status === "processing" && "Thinking..."}
              {status === "speaking" && "Speaking..."}
            </h2>
            <p className="text-white/60 text-sm max-w-xs mx-auto">
              {status === "idle" && "Tap the microphone to start talking"}
              {status === "listening" && (transcript || "Speak now...")}
              {status === "processing" && "Processing your request"}
              {status === "speaking" && ""}
            </p>
          </motion.div>

          {/* AI Response Display */}
          {aiResponse && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 max-w-md w-full mb-8 max-h-40 overflow-y-auto"
            >
              <p className="text-white/90 text-sm leading-relaxed">
                {aiResponse}
              </p>
            </motion.div>
          )}

          {/* Mic Button */}
          <motion.button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing || isSpeaking}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all",
              isListening
                ? "bg-red-500 shadow-lg shadow-red-500/30"
                : "bg-white shadow-lg shadow-white/20",
              (isProcessing || isSpeaking) && "opacity-50 cursor-not-allowed"
            )}
          >
            {isListening ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : (
              <Mic className={cn("w-8 h-8", isProcessing || isSpeaking ? "text-stone-400" : "text-[#2D5016]")} />
            )}
          </motion.button>

          {/* Listening Animation */}
          {isListening && (
            <div className="flex items-center gap-1 mt-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-white rounded-full"
                  animate={{
                    height: [8, 24, 8],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Conversation History Toggle */}
        {conversationHistory.length > 0 && (
          <div className="p-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 max-h-32 overflow-y-auto">
              <div className="flex items-center gap-2 text-white/60 text-xs mb-2">
                <MessageCircle className="w-3 h-3" />
                <span>Conversation</span>
              </div>
              <div className="space-y-2">
                {conversationHistory.slice(-4).map((msg, i) => (
                  <div key={i} className={cn(
                    "text-xs",
                    msg.role === "user" ? "text-white/80" : "text-green-300"
                  )}>
                    <span className="font-medium">{msg.role === "user" ? "You: " : "Gracia: "}</span>
                    {msg.content.slice(0, 100)}{msg.content.length > 100 ? "..." : ""}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 text-center">
          <p className="text-white/40 text-xs">
            {voiceEnabled
              ? "Voice responses enabled • Tap mic to speak"
              : "Voice responses disabled • Tap mic to speak"}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
