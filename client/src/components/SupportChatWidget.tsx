import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { MessageCircle, X, Send, AlertCircle, Mail } from "lucide-react";
import { Streamdown } from "streamdown";
import clsx from "clsx";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  category?: string;
};

export default function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMessageMutation = trpc.supportChat.sendMessage.useMutation();
  const escalationInfoQuery = trpc.supportChat.getEscalationInfo.useQuery();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load conversation history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("supportChatHistory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(
          parsed.map((msg: Message) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }))
        );
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    }
  }, []);

  // Save conversation history to localStorage
  useEffect(() => {
    localStorage.setItem("supportChatHistory", JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendMessageMutation.mutateAsync({
        message: input,
        conversationHistory: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      // Check if escalation is needed
      if (response.requiresEscalation) {
        setShowEscalation(true);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
        category: response.category,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again or contact support.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([]);
    localStorage.removeItem("supportChatHistory");
  };

  const handleEscalate = () => {
    const escalationMessage: Message = {
      id: Date.now().toString(),
      role: "assistant",
      content: `Thank you for reaching out. Our support team will contact you shortly at the email associated with your account. Response time is usually within 24 hours.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, escalationMessage]);
    setShowEscalation(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-sage-500 to-sage-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
        aria-label="Open support chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] flex flex-col h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-sage-50 to-cream-50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-sage-600" />
          <h3 className="font-semibold text-gray-800">Support</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-200 rounded-md transition-colors"
          aria-label="Close support chat"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <MessageCircle className="w-12 h-12 text-sage-200 mb-3" />
            <p className="text-sm text-gray-600">
              Hi! I'm here to help with questions about biomarkers, lab analysis, books, billing, and more.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={clsx("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={clsx(
                    "max-w-xs px-4 py-2 rounded-lg",
                    message.role === "user"
                      ? "bg-sage-500 text-white rounded-br-none"
                      : "bg-gray-100 text-gray-800 rounded-bl-none"
                  )}
                >
                  {message.role === "assistant" ? (
                    <Streamdown className="text-sm">{message.content}</Streamdown>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  {message.category && message.role === "assistant" && (
                    <p className="text-xs mt-1 opacity-70">Category: {message.category}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </>
        )}
      </ScrollArea>

      {/* Escalation Alert */}
      {showEscalation && (
        <Card className="mx-4 mb-4 p-3 bg-amber-50 border-amber-200">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">Need human support?</p>
              <p className="text-xs text-amber-800 mt-1">
                {escalationInfoQuery.data?.message || "Our team will be in touch soon."}
              </p>
              <Button
                onClick={handleEscalate}
                size="sm"
                className="mt-2 bg-amber-600 hover:bg-amber-700"
              >
                <Mail className="w-4 h-4 mr-1" />
                Contact Support
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            size="sm"
            className="bg-sage-500 hover:bg-sage-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <button
          onClick={handleClearHistory}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Clear history
        </button>
      </div>
    </div>
  );
}
