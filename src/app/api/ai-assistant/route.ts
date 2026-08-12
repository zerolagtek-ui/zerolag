import { NextResponse } from 'next/server';
import { getStoredProducts } from '@/lib/storeManager';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  try {
    const { message, conversationHistory } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const products = getStoredProducts();
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (apiKey && apiKey !== 'your_anthropic_api_key') {
      try {
        const anthropic = new Anthropic({ apiKey });

        const catalogSummary = products.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          brand: p.brand,
          priceLkr: p.priceLkr,
          priceUsd: p.priceUsd,
          specs: p.specs,
          description: p.description,
          inStock: p.inStock
        }));

        const systemPrompt = `You are "TekBot", ZeroLag Tek Store's AI tech specialist. 
Store catalog products across 10 categories: ${JSON.stringify(catalogSummary)}.
Answer queries with concise, expert tech recommendations. 
Whenever you recommend specific store products, include their exact IDs in a JSON block at the end of your response:
[RECOMMENDATIONS: "id1", "id2"]

Format your response in clean markdown bullet points.`;

        const messages: Anthropic.MessageParam[] = [
          ...(conversationHistory || []).map((msg: { role?: string; content?: string }) => ({
            role: msg.role === 'assistant' ? ('assistant' as const) : ('user' as const),
            content: msg.content || ''
          })),
          { role: 'user', content: message }
        ];

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 800,
          system: systemPrompt,
          messages: messages
        });

        const textResponse = response.content[0].type === 'text' ? response.content[0].text : '';

        const recMatch = textResponse.match(/\[RECOMMENDATIONS:\s*([\s\S]*?)\]/);
        let recommendedIds: string[] = [];
        let cleanText = textResponse;

        if (recMatch) {
          try {
            const rawIds = recMatch[1];
            recommendedIds = JSON.parse(`[${rawIds}]`);
            cleanText = textResponse.replace(/\[RECOMMENDATIONS:\s*[\s\S]*?\]/, '').trim();
          } catch (e) {
            console.error('Failed to parse recommendations', e);
          }
        }

        const recommendedProducts = products.filter(p => recommendedIds.includes(p.id));

        return NextResponse.json({
          reply: cleanText,
          recommendedProducts
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.warn('Anthropic API error, using smart fallback', errorMessage);
      }
    }

    // Smart Local Fallback Heuristics across all 10 categories
    const lowerMessage = message.toLowerCase();
    let reply = "";
    let recommendedProducts = [];

    if (lowerMessage.includes('mouse') || lowerMessage.includes('mice') || lowerMessage.includes('esports') || lowerMessage.includes('lightweight')) {
      reply = "Here are our top ultra-lightweight esports wireless gaming mice available at ZeroLag Tek:";
      recommendedProducts = products.filter(p => p.category === 'gaming-mice').slice(0, 3);
    } else if (lowerMessage.includes('keyboard') || lowerMessage.includes('keycaps') || lowerMessage.includes('hall effect') || lowerMessage.includes('optical')) {
      reply = "For ultimate responsiveness, here are our premier mechanical & analog optical keyboards:";
      recommendedProducts = products.filter(p => p.category === 'keyboards').slice(0, 3);
    } else if (lowerMessage.includes('controller') || lowerMessage.includes('ps5') || lowerMessage.includes('xbox') || lowerMessage.includes('gamepad')) {
      reply = "Here are top pro-tier wireless controllers with custom triggers and Hall Effect sticks:";
      recommendedProducts = products.filter(p => p.category === 'controllers');
    } else if (lowerMessage.includes('headset') || lowerMessage.includes('headphone') || lowerMessage.includes('audio') || lowerMessage.includes('sound')) {
      reply = "Gear up with our high-fidelity spatial audio gaming headsets:";
      recommendedProducts = products.filter(p => p.category === 'audio');
    } else if (lowerMessage.includes('speaker') || lowerMessage.includes('soundbar') || lowerMessage.includes('audio bar')) {
      reply = "Check out our RGB desktop speakers and 3D spatial soundbars:";
      recommendedProducts = products.filter(p => p.category === 'speakers');
    } else if (lowerMessage.includes('cam') || lowerMessage.includes('webcam') || lowerMessage.includes('stream')) {
      reply = "For crisp 4K & 1080p 60FPS video streams, here are our top webcams:";
      recommendedProducts = products.filter(p => p.category === 'webcams');
    } else if (lowerMessage.includes('router') || lowerMessage.includes('wifi') || lowerMessage.includes('ping') || lowerMessage.includes('network')) {
      reply = "Eliminate latency with our WiFi 7 & Tri-Band low-ping gaming routers:";
      recommendedProducts = products.filter(p => p.category === 'networking');
    } else if (lowerMessage.includes('hub') || lowerMessage.includes('dock') || lowerMessage.includes('adapter') || lowerMessage.includes('thunderbolt')) {
      reply = "Expand your setup with high-speed Thunderbolt 4 docks and USB-C multiport hubs:";
      recommendedProducts = products.filter(p => p.category === 'hubs-adapters');
    } else if (lowerMessage.includes('charge') || lowerMessage.includes('power bank') || lowerMessage.includes('gan') || lowerMessage.includes('battery')) {
      reply = "Keep your gear fully powered with 200W GaN power banks and fast chargers:";
      recommendedProducts = products.filter(p => p.category === 'power-charging');
    } else if (lowerMessage.includes('storage') || lowerMessage.includes('ssd') || lowerMessage.includes('nvme') || lowerMessage.includes('drive')) {
      reply = "Boost game load speeds with 7450 MB/s NVMe SSDs and aluminum enclosures:";
      recommendedProducts = products.filter(p => p.category === 'storage');
    } else {
      reply = "Welcome to ZeroLag Tek! I'm TekBot, your AI tech advisor. Here are some of our top featured products today:";
      recommendedProducts = products.filter(p => p.featured).slice(0, 3);
    }

    return NextResponse.json({
      reply,
      recommendedProducts
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
