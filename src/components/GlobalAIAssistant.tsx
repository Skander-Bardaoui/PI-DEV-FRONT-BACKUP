// src/components/GlobalAIAssistant.tsx
import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader, MessageCircle, Minimize2 } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

const EXAMPLE_QUESTIONS = [
  "Quel est mon chiffre d'affaires ce mois-ci ?",
  "Combien de factures sont en retard ?",
  "Quels sont mes meilleurs clients ?",
  "Quel est l'état de mon stock ?",
  "Ai-je des paiements en attente ?",
  "Quels sont mes fournisseurs principaux ?",
  "Combien de commandes sont en cours ?",
  "Quel est mon solde de trésorerie ?",
  "Combien de tâches sont en cours ?",
  "Qui sont les membres actifs de mon équipe ?",
  "Quelles sont les tâches urgentes ?",
  "Combien de transactions ce mois ?",
  "Quel est le statut de mes projets ?",
  "Qui travaille sur quoi actuellement ?",
];

export default function GlobalAIAssistant() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant intelligent NovaEntra. Posez-moi des questions sur vos ventes, achats, stock, trésorerie, équipe, tâches ou toute autre donnée de votre entreprise.',
      suggestions: EXAMPLE_QUESTIONS.slice(0, 3),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Don't render if user doesn't have a business
  if (!user?.business_id) {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (question?: string) => {
    const q = question || input.trim();
    if (!q || loading) return;

    if (!user?.business_id) {
      console.error('No business ID available');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: q,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      
      // Global AI assistant endpoint
      const { data } = await axiosInstance.post(
        `/businesses/${user.business_id}/ai-assistant/chat`,
        { question: q, history }
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.answer || 'Désolé, je n\'ai pas pu générer une réponse.',
        suggestions: data.suggestions || [],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Erreur chat IA:', error);
      
      let errorContent = 'Désolé, une erreur s\'est produite. Pouvez-vous reformuler votre question ?';
      
      if (error.response?.status === 429) {
        errorContent = 'Trop de requêtes. Veuillez patienter quelques secondes avant de réessayer.';
      } else if (error.response?.data?.message) {
        errorContent = error.response.data.message;
      }
      
      const errorMessage: Message = {
        role: 'assistant',
        content: errorContent,
        suggestions: ['Reformuler la question', 'Réessayer'],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/50 hover:scale-110 transition-all duration-300 group"
        aria-label="Ouvrir l'assistant IA"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
        </span>
        
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Assistant IA NovaEntra
          <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/50 transition-all"
        >
          <Sparkles className="h-5 w-5" />
          <span className="font-medium">Assistant IA</span>
          {loading && <Loader className="h-4 w-4 animate-spin" />}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Assistant IA</h2>
            <p className="text-xs text-gray-600">NovaEntra Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-lg"
            aria-label="Minimiser"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-lg"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div className={`rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              
              {/* Suggestions */}
              {msg.role === 'assistant' && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500 px-2">Questions suggérées :</p>
                  {msg.suggestions.map((suggestion, j) => (
                    <button
                      key={j}
                      onClick={() => handleSend(suggestion)}
                      disabled={loading}
                      className="block w-full text-left px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400 mt-1 px-2">
                {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader className="h-4 w-4 animate-spin text-indigo-600" />
              <span className="text-sm text-gray-600">L'IA réfléchit...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Posez votre question..."
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        
        {/* Quick questions */}
        {messages.length === 1 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Questions rapides :</p>
            <div className="flex flex-wrap gap-1">
              {EXAMPLE_QUESTIONS.slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  disabled={loading}
                  className="text-xs px-2 py-1 bg-white border border-gray-300 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
