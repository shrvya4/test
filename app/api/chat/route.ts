import { NextRequest, NextResponse } from 'next/server';
import { doc, addDoc, collection, serverTimestamp, getDocs, query, orderBy, limit, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
const PINECONE_INDEX = process.env.PINECONE_INDEX;

async function getRecentResearchSummary() {
  try {
    // Get the latest overall summary document
    const summariesRef = collection(db, 'weeklyResearchSummaries');
    const q = query(summariesRef, orderBy('date', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return '';
    const latestDoc = querySnapshot.docs[0];
    const overallSummary = latestDoc.data();
    if (!overallSummary.conditions || !Array.isArray(overallSummary.conditions)) return '';
    let summaryText = `Here are the most recent research papers on women's health (PCOS, Thyroid, Endometriosis):\n`;
    for (const condition of overallSummary.conditions) {
      const conditionDoc = await getDoc(doc(db, 'weeklyResearchSummaries', latestDoc.id, 'conditions', condition.toLowerCase()));
      if (!conditionDoc.exists()) continue;
      const condData = conditionDoc.data();
      if (!condData.papers || !Array.isArray(condData.papers) || condData.papers.length === 0) continue;
      summaryText += `\n- ${condition}:\n`;
      for (const paper of condData.papers.slice(0, 2)) { // Only include top 2 per condition
        summaryText += `  • "${paper.title}" (${paper.journal}, ${paper.publicationDate})\n`;
        if (paper.abstract) summaryText += `    - Abstract: ${paper.abstract.substring(0, 200)}...\n`;
        if (paper.url) summaryText += `    - [Read more](${paper.url})\n`;
      }
    }
    return summaryText;
  } catch (err) {
    console.error('Error fetching research summary:', err);
    return '';
  }
}

async function getRelevantResearchSnippets(question: string, topK = 4): Promise<string> {
  if (!PINECONE_API_KEY || !PINECONE_INDEX) return '';
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
    const index = pinecone.Index(PINECONE_INDEX);
    // Embed the question
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: question,
    });
    const questionEmbedding = embeddingResponse.data[0].embedding;
    // Query Pinecone
    const queryResult = await index.query({
      topK,
      vector: questionEmbedding,
      includeMetadata: true,
    });
    if (!queryResult.matches || queryResult.matches.length === 0) return '';
    let context = 'Relevant research findings:\n';
    for (const match of queryResult.matches) {
      const meta = match.metadata as any;
      context += `- ${meta?.title ? meta.title + ': ' : ''}${meta?.text || ''}\n`;
      if (meta?.url) context += `  [Read more](${meta.url})\n`;
    }
    return context;
  } catch (err) {
    console.error('Error fetching relevant research from Pinecone:', err);
    return '';
  }
}

async function getPerplexityAnswer(question: string): Promise<string> {
  try {
    // Replace with your actual Perplexity API endpoint and key
    const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
    if (!PERPLEXITY_API_KEY) return '';
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'pplx-70b-online',
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Answer concisely and cite sources if possible.' },
          { role: 'user', content: question }
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    });
    if (!response.ok) return '';
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    console.error('Error fetching answer from Perplexity:', err);
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, context, userProfile, userId, conversationHistory } = await request.json();

    // Store user question in Firebase
    if (userId) {
      try {
        await addDoc(collection(db, 'chat_history'), {
          userId: userId,
          userMessage: message,
          timestamp: serverTimestamp(),
          userProfile: userProfile,
          context: context
        });
      } catch (error) {
        console.error('Error storing chat history:', error);
      }
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      // Fallback to local response if no API key
      return NextResponse.json({
        response: generateLocalResponse(message, userProfile)
      });
    }

    // Utility to get lunar phase index (0-29, where 0 is new moon)
    function getLunarDay(today = new Date()) {
      // Reference new moon: Jan 11, 2024 (UTC)
      const referenceNewMoon = new Date(Date.UTC(2024, 0, 11));
      const msPerDay = 1000 * 60 * 60 * 24;
      const daysSinceNewMoon = Math.floor((today.getTime() - referenceNewMoon.getTime()) / msPerDay);
      const lunarDay = ((daysSinceNewMoon % 29.53) + 29.53) % 29.53; // always positive
      return lunarDay;
    }

    // Calculate current cycle phase if user has period data
    let cyclePhase = 'Unknown';
    let cycleContext = '';
    let lunarUsed = false;
    if (userProfile?.irregularPeriods) {
      // Use lunar cycle
      lunarUsed = true;
      const lunarDay = getLunarDay();
      if (lunarDay < 7) {
        cyclePhase = 'Menstrual';
        cycleContext = 'User has irregular periods. Phase is estimated using the lunar cycle: Menstrual phase (days 1-7 of lunar month).';
      } else if (lunarDay < 14) {
        cyclePhase = 'Follicular';
        cycleContext = 'User has irregular periods. Phase is estimated using the lunar cycle: Follicular phase (days 8-14 of lunar month).';
      } else if (lunarDay < 21) {
        cyclePhase = 'Ovulatory';
        cycleContext = 'User has irregular periods. Phase is estimated using the lunar cycle: Ovulatory phase (days 15-21 of lunar month).';
      } else {
        cyclePhase = 'Luteal';
        cycleContext = 'User has irregular periods. Phase is estimated using the lunar cycle: Luteal phase (days 22-29 of lunar month).';
      }
    } else if (userProfile?.lastPeriod) {
      const daysSinceLastPeriod = Math.floor(
        (new Date().getTime() - new Date(userProfile.lastPeriod).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastPeriod >= 1 && daysSinceLastPeriod <= 5) {
        cyclePhase = 'Menstrual';
        cycleContext = 'User is currently in their menstrual phase (days 1-5). Focus on rest, warm foods, and gentle self-care.';
      } else if (daysSinceLastPeriod >= 6 && daysSinceLastPeriod <= 14) {
        cyclePhase = 'Follicular';
        cycleContext = 'User is currently in their follicular phase (days 6-14). Energy is building, great time for fresh foods and exercise.';
      } else if (daysSinceLastPeriod >= 15 && daysSinceLastPeriod <= 17) {
        cyclePhase = 'Ovulatory';
        cycleContext = 'User is currently in their ovulatory phase (days 15-17). Peak energy and confidence, perfect for high-intensity activities.';
      } else if (daysSinceLastPeriod >= 18 && daysSinceLastPeriod <= 28) {
        cyclePhase = 'Luteal';
        cycleContext = 'User is currently in their luteal phase (days 18-28). Energy is declining, focus on preparation and slower movement.';
      }
    }

    // Fetch relevant research from Pinecone
    let pineconeResearchContext = await getRelevantResearchSnippets(message, 4);
    // If Pinecone returns nothing, fallback to Perplexity
    if (!pineconeResearchContext) {
      pineconeResearchContext = await getPerplexityAnswer(message);
      if (pineconeResearchContext) {
        pineconeResearchContext = 'Perplexity answer (not from our research database):\n' + pineconeResearchContext;
      }
    }

    // Create the system prompt with improved prompt engineering
    const systemPrompt = `You are Auvra, a compassionate, knowledgeable health coach specializing in women's hormonal health. You have deep expertise in conditions like PCOS, PCOD, Endometriosis, and Thyroid disorders.

IMPORTANT RESPONSE GUIDELINES:
- Always provide SPECIFIC, ACTIONABLE advice
- Give exactly 3 concrete suggestions or recommendations
- Be direct and avoid vague responses
- Use bullet points for clarity
- Reference the user's specific health conditions
- Consider their current cycle phase
- Keep responses focused and practical

You are up-to-date with the latest research. Use the following research findings to inform your answers when relevant:
${pineconeResearchContext}

Your personality is warm, supportive, and like a caring older sister. You provide evidence-based advice while being empathetic and understanding.

User Context: ${context}

Current Cycle Phase: ${cyclePhase}
Cycle Context: ${cycleContext}
${lunarUsed ? '\nNOTE: User has irregular periods. All cycle-based recommendations are estimated using the lunar (moon) cycle, which is about 29.5 days. Explain this to the user and encourage them to track their symptoms for more accuracy.' : ''}

User Health Conditions: ${userProfile?.diagnosis?.join(', ') || 'None specified'}
User Symptoms: ${userProfile?.symptoms?.join(', ') || 'None specified'}
User Age Group: ${userProfile?.age || 'Not specified'}
User Stress Level: ${userProfile?.stressLevel || 'Not specified'}
User Sleep Quality: ${userProfile?.sleepQuality || 'Not specified'}

RESPONSE FORMAT:
- Start with a brief, empathetic acknowledgment
- Provide exactly 3 specific, actionable suggestions
- Use bullet points (•) for each suggestion
- End with a supportive, encouraging note
- Keep total response under 200 words

Remember: Be specific, actionable, and always provide exactly 3 concrete suggestions.`;

    // Build messages array with conversation history
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      // Add conversation history for context
      ...(conversationHistory || []),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.';

    // Store AI response in Firebase
    if (userId) {
      try {
        await addDoc(collection(db, 'chat_history'), {
          userId: userId,
          aiResponse: aiResponse,
          timestamp: serverTimestamp(),
          cyclePhase: cyclePhase
        });
      } catch (error) {
        console.error('Error storing AI response:', error);
      }
    }

    return NextResponse.json({
      response: aiResponse
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Fallback to local response - extract message from request if possible
    let fallbackMessage = 'Hello';
    let fallbackUserProfile = null;
    try {
      const body = await request.json();
      fallbackMessage = body.message || 'Hello';
      fallbackUserProfile = body.userProfile || null;
    } catch {
      // If we can't parse the request, use default message
    }
    
    return NextResponse.json({
      response: generateLocalResponse(fallbackMessage, fallbackUserProfile)
    });
  }
}

function generateLocalResponse(message: string, userProfile: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Calculate current cycle phase
  let cyclePhase = 'Unknown';
  if (userProfile?.lastPeriod) {
    const daysSinceLastPeriod = Math.floor(
      (new Date().getTime() - new Date(userProfile.lastPeriod).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastPeriod >= 1 && daysSinceLastPeriod <= 5) {
      cyclePhase = 'Menstrual';
    } else if (daysSinceLastPeriod >= 6 && daysSinceLastPeriod <= 14) {
      cyclePhase = 'Follicular';
    } else if (daysSinceLastPeriod >= 15 && daysSinceLastPeriod <= 17) {
      cyclePhase = 'Ovulatory';
    } else if (daysSinceLastPeriod >= 18 && daysSinceLastPeriod <= 28) {
      cyclePhase = 'Luteal';
    }
  }
  
  // Personalized responses based on user profile and cycle phase
  if (userProfile) {
    const hasPCOS = userProfile.diagnosis?.includes('PCOS') || userProfile.diagnosis?.includes('PCOD');
    const hasThyroid = userProfile.diagnosis?.includes('Thyroid');
    const hasEndometriosis = userProfile.diagnosis?.includes('Endometriosis');
    const isIrregular = userProfile.irregularPeriods;
    const stressLevel = userProfile.stressLevel;
    const sleepQuality = userProfile.sleepQuality;

    // Diet recommendations with seeds and cycle awareness
    if (lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
      if (hasPCOS) {
        return `I understand you're looking for PCOS-friendly diet advice during your ${cyclePhase} phase. Here are 3 specific recommendations:\n\n• **Start your day with a protein-rich breakfast** - Try Greek yogurt with chia seeds and berries to stabilize blood sugar\n• **Include anti-inflammatory foods** - Add turmeric to your meals and snack on walnuts for omega-3s\n• **Choose low-glycemic carbs** - Replace white rice with quinoa and add pumpkin seeds for extra nutrition\n\nThese changes can help manage insulin resistance and support your hormonal balance!`;
      } else if (hasThyroid) {
        return `Great question about thyroid-supportive nutrition during your ${cyclePhase} phase! Here are 3 specific recommendations:\n\n• **Add iodine-rich foods daily** - Include seaweed snacks or fish 2-3 times per week for thyroid hormone production\n• **Include selenium sources** - Eat 2 Brazil nuts daily or add tuna to your meals for thyroid function\n• **Optimize vitamin D** - Spend 15 minutes in morning sunlight and include fortified dairy or fatty fish\n\nThese nutrients are essential for your thyroid health and energy levels!`;
      }
      return `I'd love to help you with healthy eating during your ${cyclePhase} phase! Here are 3 specific recommendations:\n\n• **Eat every 3-4 hours** - Include protein, healthy fats, and complex carbs in each meal to balance hormones\n• **Add seeds to your diet** - Sprinkle chia, flax, pumpkin, or sunflower seeds on meals for essential nutrients\n• **Stay hydrated with herbal teas** - Try chamomile for stress relief or peppermint for digestion\n\nThese simple changes can make a big difference in your energy and mood!`;
    }

    // Stress management with cycle awareness
    if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') || lowerMessage.includes('overwhelmed')) {
      if (stressLevel === 'High') {
        return `I can see you're dealing with high stress during your ${cyclePhase} phase. Here are 3 immediate relief strategies:\n\n• **Practice 4-7-8 breathing** - Inhale 4 counts, hold 7, exhale 8, repeat 5 times whenever you feel overwhelmed\n• **Take a 10-minute walk** - Physical movement releases endorphins and helps clear your mind\n• **Create a worry window** - Set aside 15 minutes daily to write down concerns, then let them go\n\nRemember, it's okay to prioritize your mental health - you're doing great!`;
      }
      return `Managing stress is crucial for hormonal balance during your ${cyclePhase} phase. Here are 3 effective strategies:\n\n• **Start with 5-minute meditation** - Use apps like Headspace or simply focus on your breath\n• **Practice progressive muscle relaxation** - Tense and release each muscle group for 5 minutes daily\n• **Set clear boundaries** - Learn to say no and protect your energy, especially during this phase\n\nSmall daily practices add up to big stress relief!`;
    }

    // Sleep advice with cycle awareness
    if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') || lowerMessage.includes('tired')) {
      if (sleepQuality === 'Poor' || sleepQuality === 'Fair') {
        return `I understand sleep struggles during your ${cyclePhase} phase. Here are 3 specific improvements:\n\n• **Create a 1-hour bedtime routine** - No screens, try reading or gentle stretching, dim the lights\n• **Keep your bedroom at 65-68°F** - Cooler temperatures signal your body it's time to sleep\n• **Try magnesium before bed** - Take 200-400mg of magnesium glycinate 30 minutes before sleep\n\nBetter sleep is within reach - start with one change and build from there!`;
      }
      return `Great sleep is essential for hormonal balance during your ${cyclePhase} phase! Here are 3 maintenance tips:\n\n• **Maintain consistent sleep/wake times** - Even on weekends, stay within 1 hour of your usual schedule\n• **Use blue light filters** - Enable night mode on devices 2 hours before bed\n• **Create a sleep sanctuary** - Keep your bedroom dark, quiet, and clutter-free\n\nYour body will thank you for these healthy sleep habits!`;
    }

    // Period tracking and cycle syncing
    if (lowerMessage.includes('period') || lowerMessage.includes('cycle') || lowerMessage.includes('menstrual')) {
      if (isIrregular) {
        return `I understand irregular periods can be challenging. Here are 3 specific strategies:\n\n• **Track symptoms daily** - Use apps like Flo or Clue to identify patterns and triggers\n• **Try vitex supplements** - Take 400mg daily for 3-6 months to support regular cycles\n• **Manage stress with yoga** - Practice gentle yoga 3 times per week to reduce cortisol levels\n\nRemember, irregular periods often improve with consistent lifestyle changes!`;
      }
      return `Understanding your cycle is key to hormonal health! You're in your ${cyclePhase} phase. Here are 3 phase-specific tips:\n\n• **Menstrual (Days 1-5)**: Rest more, eat warm foods, add pumpkin seeds for iron\n• **Follicular (Days 6-14)**: Increase exercise, try new activities, add flax seeds for energy\n• **Ovulatory (Days 15-17)**: Peak energy time, perfect for important conversations and workouts\n• **Luteal (Days 18-28)**: Focus on preparation, slower movement, add sunflower seeds for mood\n\nWorking with your cycle can transform your energy and mood!`;
    }

    // Exercise recommendations with cycle awareness
    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('fitness')) {
      if (hasPCOS) {
        return `Exercise is especially important for PCOS during your ${cyclePhase} phase! Here are 3 specific recommendations:\n\n• **Strength train 3 times per week** - Focus on compound movements like squats and deadlifts to improve insulin sensitivity\n• **Add 20-minute HIIT sessions** - High-intensity intervals 2-3 times per week for metabolic benefits\n• **Include daily walking** - Aim for 10,000 steps to support weight management and stress reduction\n\nThese exercises specifically help manage PCOS symptoms and hormone balance!`;
      }
      return `Regular exercise is fantastic for hormonal health during your ${cyclePhase} phase! Here are 3 specific recommendations:\n\n• **Strength train 2-3 times per week** - Build muscle to support metabolism and bone health\n• **Include 30 minutes of cardio** - Walking, cycling, or swimming 3-5 times per week\n• **Add flexibility work** - Yoga or stretching 2-3 times per week for stress relief\n\nMovement is medicine for your hormones and mood!`;
    }
  }

  // General responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Hello! 👋 I'm Auvra, your personal health coach. Here are 3 ways I can help you today:\n\n• **Nutrition guidance** - Get personalized diet recommendations for your health conditions\n• **Stress management** - Learn specific techniques for your stress level and cycle phase\n• **Sleep optimization** - Discover strategies to improve your sleep quality\n\nWhat would you like to focus on first?`;
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return `I'm Auvra, your personal health coach! Here are 3 main areas I specialize in:\n\n• **Hormonal health support** - PCOS, Thyroid, Endometriosis, and cycle-specific advice\n• **Lifestyle optimization** - Diet, exercise, stress, and sleep recommendations\n• **Evidence-based guidance** - Research-backed tips tailored to your unique profile\n\nI'm here to support your wellness journey with personalized, actionable advice!`;
  }

  if (lowerMessage.includes('thank')) {
    return `You're very welcome! 💜 I'm here to support your health journey. Here are 3 things to remember:\n\n• **Small changes create big results** - Start with one habit at a time\n• **Listen to your body** - It knows what you need better than anyone\n• **Be patient with yourself** - Health is a journey, not a destination\n\nYou're doing amazing - keep going!`;
  }

  // Default response
  return `That's a great question! I'd love to help you with that. Here are 3 ways I can support you:\n\n• **Personalized advice** - Based on your health conditions and cycle phase\n• **Specific recommendations** - Actionable steps you can take today\n• **Evidence-based guidance** - Research-backed strategies for your unique needs\n\nWhat specific area would you like to focus on?`;
} 