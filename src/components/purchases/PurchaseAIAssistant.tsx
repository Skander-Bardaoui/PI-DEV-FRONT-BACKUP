// src/components/purchases/PurchaseAIAssistant.tsx
import { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader, MessageCircle } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  timestamp: Date;
}

interface Props {
  businessId: string;
  onClose: () => void;
}

const EXAMPLE_QUESTIONS = [
  "Quel fournisseur m'a le plus facturé ce trimestre ?",
  "Y a-t-il des factures en retard ?",
  "Combien ai-je dépensé ce mois-ci ?",
  "Quels sont mes meilleurs fournisseurs ?",
  "Ai-je des litiges en cours ?",
  "Combien de commandes sont en attente ?",
  "Quels paiements ai-je effectués récemment ?",
  "Quel fournisseur livre le plus rapidement ?",
];

export default function PurchaseAIAssistant({ businessId, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant achats intelligent. Posez-moi des questions sur vos fournisseurs, factures, commandes ou paiements.',
      suggestions: EXAMPLE_QUESTIONS.slice(0, 3),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (question?: string) => {
    const q = question || input.trim();
    if (!q || loading) return;

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
      
      const { data } = await axiosInstance.post(
        `/businesses/${businessId}/purchases/ai-assistant/chat`,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Assistant IA Achats</h2>
              <p className="text-xs text-gray-600">Posez vos questions en langage naturel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-white rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
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
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question..."
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-100"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Envoyer</span>
            </button>
          </div>
          
          {/* Quick questions */}
          {messages.length === 1 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Questions rapides :</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
