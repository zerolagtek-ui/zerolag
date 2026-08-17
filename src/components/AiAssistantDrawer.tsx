/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ChatMessage } from '@/types';
import { formatPrice, getProductSlug } from '@/lib/productsData';
import { Bot, X, Send, Zap, ShoppingCart, Eye } from 'lucide-react';

let msgCounter = 0;
function makeMessageId(prefix: string): string {
  msgCounter += 1;
  return `${prefix}-${msgCounter}-${Math.random().toString(36).substring(2, 7)}`;
}

export function AiAssistantDrawer() {
  const { isAiOpen, setIsAiOpen, addToCart } = useCart();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'assistant',
      content: "👋 Hi! I'm **TekBot**, ZeroLag Tek Store's AI Specialist. Tell me your tech requirements or budget, and I'll match you with the best gaming mice, mechanical keyboards, audio, webcams, or storage!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAiOpen) {
      scrollToBottom();
    }
  }, [messages, isAiOpen]);

  if (!isAiOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const msgId = makeMessageId('user');
    const userMsg: ChatMessage = {
      id: msgId,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: messages
        })
      });

      const data = await res.json();

      const botMsgId = makeMessageId('bot');
      const botMsg: ChatMessage = {
        id: botMsgId,
        role: 'assistant',
        content: data.reply || "I have found the optimal products for your setup below!",
        recommendedProducts: data.recommendedProducts || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch {
      const errId = makeMessageId('err');
      setMessages(prev => [
        ...prev,
        {
          id: errId,
          role: 'assistant',
          content: "Sorry, I had trouble reaching the AI server. Please try again shortly!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const starterPrompts = [
    "Best Wireless Gaming Mouse under 60g",
    "Analog Optical Rapid Trigger Keyboards",
    "WiFi 7 Router for Zero Lag Ping",
    "4K 60FPS Streaming Webcams",
    "200W Fast Charger for Laptops",
    "Fastest NVMe SSD for Gaming"
  ];

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden">
      {/* Dark Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 cursor-pointer animate-fade-in"
        onClick={() => setIsAiOpen(false)}
        aria-hidden="true"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 z-[85]">
        
        <div
          className="w-screen max-w-lg bg-[#0c0e14] border-l border-zinc-800 text-white flex flex-col shadow-2xl transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          
          {/* Top Bar */}
          <div className="p-4 md:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lime-400 to-emerald-500 p-0.5 shadow-lg shadow-lime-400/30">
                <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-lime-400" />
                </div>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>TekBot AI Assistant</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-400/20 text-lime-400 font-mono font-semibold border border-lime-400/30">
                    ONLINE SPECIALIST
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ZeroLag Hardware Specialist</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAiOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Conversation Thread */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-bold rounded-br-none shadow-md shadow-lime-400/20'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.content}</p>

                  {/* Embedded Recommended Product Cards */}
                  {msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                    <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                      <p className="text-[11px] font-mono font-bold text-lime-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Recommended Hardware Items:</span>
                      </p>

                      <div className="space-y-2">
                        {msg.recommendedProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-lime-400/40 transition-colors"
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 rounded-lg object-cover bg-zinc-900 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/product/${getProductSlug(product)}`}
                                onClick={() => setIsAiOpen(false)}
                                className="font-bold text-[11px] text-white truncate block hover:text-lime-400"
                              >
                                {product.name}
                              </Link>
                              <span className="text-[10px] font-mono text-lime-400 font-bold block">
                                {formatPrice(product.priceLkr)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Link
                                href={`/product/${getProductSlug(product)}`}
                                onClick={() => setIsAiOpen(false)}
                                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-lime-400"
                                title="View Specs"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => addToCart(product)}
                                className="p-1.5 rounded-lg bg-lime-400 text-slate-950 hover:bg-lime-300 font-bold"
                                title="Add to Cart"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="text-[9px] font-mono text-zinc-500 block text-right mt-1 opacity-70">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-lime-400 text-xs font-mono w-fit animate-pulse">
                <Bot className="w-4 h-4" />
                <span>TekBot is querying store catalog...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Prompts */}
          <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-900 flex gap-2 overflow-x-auto scrollbar-none">
            {starterPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-lime-400/40 text-[10px] font-mono text-lime-300 whitespace-nowrap transition-colors"
              >
                + {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/60">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                placeholder="Ask TekBot about mice, mechanical keyboards, audio, routers..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 px-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-lime-400 font-mono"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 text-slate-950 font-bold hover:shadow-lg hover:shadow-lime-400/20 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
