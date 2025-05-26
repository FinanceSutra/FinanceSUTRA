import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  Search, 
  TrendingUp, 
  Brain, 
  Sparkles,
  Clock,
  ExternalLink,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ResearchMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: string[];
  isLoading?: boolean;
}

interface ResearchResponse {
  response: string;
  citations?: string[];
}

const suggestedQuestions = [
  "What are the top performing sectors in Indian stock market this month?",
  "Analyze the recent performance of Reliance Industries stock",
  "What are the key factors affecting Nifty 50 movement today?",
  "Compare mutual funds vs direct equity investment in India",
  "Explain the impact of RBI policy changes on banking stocks",
  "What are the best small-cap stocks to watch in India?",
  "How do crude oil prices affect Indian stock market?",
  "Analyze the growth prospects of EV companies in India"
];

export default function ResearchPage() {
  const [messages, setMessages] = useState<ResearchMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const researchMutation = useMutation({
    mutationFn: async (query: string): Promise<ResearchResponse> => {
      const res = await apiRequest("POST", "/api/research/query", { query });
      return await res.json();
    },
    onSuccess: (data, query) => {
      setMessages(prev => prev.map(msg => 
        msg.id === 'loading' 
          ? {
              id: Date.now().toString(),
              type: 'assistant' as const,
              content: data.response,
              timestamp: new Date(),
              citations: data.citations
            }
          : msg
      ));
      setIsTyping(false);
    },
    onError: (error: any) => {
      setMessages(prev => prev.filter(msg => msg.id !== 'loading'));
      setIsTyping(false);
      toast({
        title: "Research Failed",
        description: error.message || "Failed to get research results. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || researchMutation.isPending) return;

    const userMessage: ResearchMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    const loadingMessage: ResearchMessage = {
      id: 'loading',
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setIsTyping(true);
    researchMutation.mutate(inputValue.trim());
    setInputValue('');
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputValue(question);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Response copied successfully",
    });
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-white flex">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white/50 backdrop-blur-sm flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Trading Research
              </h1>
              <p className="text-sm text-muted-foreground">AI-powered market insights</p>
            </div>
          </div>
          
          <Button 
            onClick={clearChat}
            variant="outline" 
            className="w-full"
            disabled={messages.length === 0}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            New Research
          </Button>
        </div>

        <div className="flex-1 p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            Suggested Questions
          </h3>
          <div className="space-y-3">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full text-left p-3 h-auto text-sm justify-start hover:bg-blue-50"
                onClick={() => handleSuggestedQuestion(question)}
              >
                <Search className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                <span className="line-clamp-2">{question}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="text-xs text-muted-foreground mb-2">Powered by</div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Live Market Data
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Brain className="w-3 h-3 mr-1" />
              AI Analysis
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-white/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Research Assistant</h2>
              <p className="text-sm text-muted-foreground">
                Ask anything about Indian markets, stocks, and trading strategies
              </p>
            </div>
            {messages.length > 0 && (
              <Badge variant="outline" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Start Your Research</h3>
                <p className="text-muted-foreground mb-6">
                  Ask questions about Indian stock market, specific stocks, trading strategies, 
                  or market analysis. Get real-time insights powered by AI.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedQuestions.slice(0, 3).map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestedQuestion(question)}
                      className="text-xs"
                    >
                      {question.split(' ').slice(0, 4).join(' ')}...
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className={
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    }>
                      {message.type === 'user' ? 'You' : <Brain className="w-4 h-4" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex-1 ${message.type === 'user' ? 'max-w-2xl' : ''}`}>
                    <div className={`rounded-2xl p-4 ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white ml-auto' 
                        : 'bg-white border shadow-sm'
                    }`}>
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-sm text-muted-foreground">Researching...</span>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none">
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        </div>
                      )}
                    </div>
                    
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Sources:</div>
                        <div className="space-y-1">
                          {message.citations.map((citation, index) => (
                            <a
                              key={index}
                              href={citation}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{citation}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {message.type === 'assistant' && !message.isLoading && (
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.content)}
                          className="h-8 px-2 text-xs"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          <ThumbsUp className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                        <div className="text-xs text-muted-foreground ml-auto">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-white/80 backdrop-blur-sm p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about stocks, market trends, trading strategies..."
                  className="pr-12 h-12 text-base"
                  disabled={researchMutation.isPending}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-1 top-1 h-10 w-10"
                  disabled={!inputValue.trim() || researchMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Research assistant can make mistakes. Please verify important information.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}