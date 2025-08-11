import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "../ui/textarea";
import { BarChart3, TrendingUp, Target, FlaskConical, RotateCcw, Trash2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { chatThreadManager, ChatMessage } from "@/lib/chat-thread";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RagAIAssistantHeroProps {
  user: any;
  openAuthModal: () => void;
  onNavigateToDashboard: () => void;
  onShowProjectionCalculator: () => void;
  onShowTestingProtocols: () => void;
  onShowTrainingProtocols: () => void;
}

const SAMPLE_QUESTIONS = [
  "What is VO₂max and why does it matter?",
  "How can I improve my VO₂max?",
  "What is a good VO₂max for my age?",
  "How do I test my VO₂max at home?",
  "What training protocols boost VO₂max fastest?",
  "What are VO2max training protocols?",
  "What are VO2max testing protocols?",
  "How does sleep affect VO2max?",
];

function useTypingAnimation(samples: string[], speed = 60, pause = 1200) {
  const [display, setDisplay] = useState("");
  const [sampleIdx, setSampleIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (!isTyping) return;
    if (charIdx < samples[sampleIdx].length) {
      const timeout = setTimeout(() => {
        setDisplay(samples[sampleIdx].slice(0, charIdx + 1));
        setCharIdx((c) => c + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
      const timeout = setTimeout(() => {
        setIsTyping(true);
        setCharIdx(0);
        setSampleIdx((i) => (i + 1) % samples.length);
      }, pause);
      return () => clearTimeout(timeout);
    }
  }, [charIdx, isTyping, sampleIdx, samples, speed, pause]);

  return display;
}

export function RagAIAssistantHero({
  user,
  openAuthModal,
  onNavigateToDashboard,
  onShowProjectionCalculator,
  onShowTestingProtocols,
  onShowTrainingProtocols,
}: RagAIAssistantHeroProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>("");
  const [isFormFocused, setIsFormFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingSample = useTypingAnimation(SAMPLE_QUESTIONS);

  // Load existing thread on component mount
  useEffect(() => {
    const threadMessages = chatThreadManager.getMessages();
    setMessages(threadMessages);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, currentStreamingMessage]);

  // Enhanced auto-scroll with smooth behavior
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Scroll to bottom when streaming starts
  useEffect(() => {
    if (isLoading && currentStreamingMessage) {
      // Small delay to ensure content is rendered
      setTimeout(scrollToBottom, 100);
    }
  }, [currentStreamingMessage, isLoading]);

  // Scroll to bottom when new message is added
  useEffect(() => {
    if (messages.length > 0) {
      // Small delay to ensure content is rendered
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length]);

  // Feature card click handlers
  const featureCards = [
    {
      icon: BarChart3,
      title: "Your Dashboard",
      onClick: () => {
        if (user) {
          onNavigateToDashboard();
        } else {
          openAuthModal();
        }
      },
      color: "text-primary",
      bgColor: "bg-primary/10",
      hoverColor: "hover:bg-primary/20",
    },
    {
      icon: TrendingUp,
      title: "VO₂max Projection",
      onClick: onShowProjectionCalculator,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-950/30",
      hoverColor: "hover:bg-emerald-200 dark:hover:bg-emerald-900/40",
    },
    {
      icon: Target,
      title: "VO₂max Training",
      onClick: onShowTrainingProtocols,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      hoverColor: "hover:bg-purple-200",
    },
    {
      icon: FlaskConical,
      title: "VO₂max Testing",
      onClick: onShowTestingProtocols,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      hoverColor: "hover:bg-orange-200",
    },
  ];

  // Fetch answer from RAG backend with thread context
  async function fetchAssistantAnswer(userInput: string) {
    setIsLoading(true);
    setCurrentStreamingMessage("");

    // Add user message to thread
    const userMessage: ChatMessage = {
      role: 'user',
      content: userInput,
      timestamp: Date.now(),
    };
    
    chatThreadManager.addMessage(userMessage);
    setMessages(chatThreadManager.getMessages());

    try {
      // Get conversation thread for context
      const threadMessages = chatThreadManager.getThreadForAPI();
      
      const res = await fetch("/api/rag-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: userInput,
          history: threadMessages // Send conversation history
        }),
      });

      if (!res.body) throw new Error("No response body");
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setCurrentStreamingMessage(fullText);
      }

      // Add assistant message to thread
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: fullText,
        timestamp: Date.now(),
      };
      
      chatThreadManager.addMessage(assistantMessage);
      setMessages(chatThreadManager.getMessages());
      setCurrentStreamingMessage("");

    } catch (err) {
      console.error('Error fetching assistant answer:', err);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "Sorry, there was an error getting a response from the assistant.",
        timestamp: Date.now(),
      };
      
      chatThreadManager.addMessage(errorMessage);
      setMessages(chatThreadManager.getMessages());
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    setInput("");
    fetchAssistantAnswer(input.trim());
  };

  const clearConversation = () => {
    chatThreadManager.clearThread();
    setMessages([]);
    setCurrentStreamingMessage("");
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const hasConversation = messages.length > 0;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-primary/10 h-screen flex flex-col items-center px-4 pt-16 pb-8"
      style={{ zIndex: 1 }}
    >
      <div className={`max-w-2xl w-full flex flex-col items-center gap-6 ${!hasConversation ? 'h-full justify-center' : 'h-full'}`}>
        {/* Hero title and subtitle only before first question is asked */}
        {!hasConversation && (
          <>
            <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Anything you need to boost your VO₂max
            </h1>
            <p className="text-lg md:text-xl text-center text-muted-foreground mb-6">
              Ask anything about VO₂max, training, protocols, or fitness science.
            </p>
          </>
        )}

        {/* Conversation area - Fixed height with scroll */}
        {hasConversation && (
          <div className="w-full max-w-2xl flex-1 overflow-y-auto mb-4 transition-all relative scrollbar-thin scrollbar-thumb-border scrollbar-track-background max-h-[60vh]" ref={scrollRef}>
            {/* Thread controls */}
            <div className="flex justify-between items-center mb-4 p-2 bg-card/50 rounded-lg border border-border sticky top-0 z-10 backdrop-blur-sm">
              <span className="text-sm text-muted-foreground">
                {messages.length} messages in conversation
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={clearConversation}
                className="h-8 px-2 text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            </div>

            {/* Messages */}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground border border-border'
                  }`}
                >
                  <div className="prose prose-neutral dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {isLoading && currentStreamingMessage && (
              <div className="mb-4 flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted text-foreground border border-border shadow-sm">
                  <div className="prose prose-neutral dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown>{currentStreamingMessage}</ReactMarkdown>
                  </div>
                  <div className="text-xs mt-2 text-muted-foreground flex items-center gap-2">
                    <span>{formatTimestamp(Date.now())}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && !currentStreamingMessage && (
              <div className="mb-4 flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted text-foreground border border-border shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Input box with typing animation - Fixed at bottom */}
        <div className="w-full max-w-2xl flex-shrink-0">
          <form
            onSubmit={handleSubmit}
            className={`w-full flex items-center gap-2 bg-card rounded-2xl shadow-lg border transition-all duration-200 ${
              isFormFocused 
                ? 'border-primary/50 shadow-primary/10 ring-2 ring-primary/20' 
                : 'border-border md:hover:border-primary/30'
            } px-4 py-4`}
          >
            <Textarea
              ref={textareaRef}
              className="flex-1 border-none bg-transparent text-base focus:ring-0 focus:outline-none focus:border-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground text-foreground resize-none min-h-[56px] max-h-[120px] leading-relaxed"
              placeholder={
                hasConversation 
                  ? "Continue the conversation..." 
                  : (input.trim() ? "Ask anything about VO₂max..." : typingSample || "Ask anything about VO₂max...")
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              onFocus={() => setIsFormFocused(true)}
              onBlur={() => setIsFormFocused(false)}
              disabled={isLoading}
              aria-label="Ask anything about VO₂max"
              autoFocus
            />
            <Button
              type="submit"
              className={`rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all duration-200 ${
                isLoading || !input.trim()
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary md:hover:bg-primary/90 text-white md:hover:shadow-xl'
              }`}
              disabled={isLoading || !input.trim()}
              aria-label="Send question"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
              ) : (
                <svg width="26" height="26" fill="none" viewBox="0 0 24 24" className="transition-transform duration-200 md:group-hover:translate-x-0.5">
                  <path d="M3 12l18-7-7 18-2.5-7.5L3 12z" fill="currentColor" />
                </svg>
              )}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>

        {/* Feature cards - Always visible below input */}
        <div className="w-full flex-shrink-0">
          <TooltipProvider>
            <div className={`grid gap-2 md:gap-4 w-full max-w-2xl ${hasConversation ? 'grid-cols-4' : 'grid-cols-2 md:grid-cols-4'} place-items-center`}>
              {featureCards.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Tooltip key={feature.title}>
                    <TooltipTrigger asChild>
                      <Card
                        className={`group cursor-pointer transition-all duration-300 border-2 flex sm:flex-col justify-center items-center bg-card/80 backdrop-blur-sm md:hover:shadow-lg md:hover:border-primary/20 p-1 sm:p-2 md:p-3 h-[50px] sm:h-[80px] md:h-[120px] ${hasConversation ? 'aspect-square' : ''} text-center w-full`}
                        onClick={feature.onClick}
                      >
                        <div className={`inline-flex items-center justify-center w-4 h-4 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full transition-all duration-300 ${feature.bgColor} ${feature.hoverColor}`}>
                          <IconComponent className={`w-2 h-2 sm:w-4 sm:h-4 md:w-5 md:h-5 ${feature.color} transition-colors duration-300`} />
                        </div>
                        <h3 className={`text-xs sm:text-sm font-normal text-foreground ml-1 sm:ml-0 sm:mt-1 sm:text-center transition-colors duration-300 ${hasConversation ? 'hidden md:block' : 'block'} md:group-hover:text-primary leading-tight`}>
                          {feature.title}
                        </h3>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{feature.title}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
      </div>
    </section>
  );
} 