import { NextRequest, NextResponse } from 'next/server';
import { doc, addDoc, collection, serverTimestamp, getDocs, query, orderBy, limit, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

export async function POST(request: NextRequest) {
  try {
    const { message, context, userProfile, userId } = await request.json();

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

    // Fetch recent research summary
    const researchSummary = await getRecentResearchSummary();

    // Create the system prompt with user context, cycle phase, and research
    const systemPrompt = `You are a compassionate, knowledgeable health coach specializing in women's hormonal health. You have deep expertise in conditions like PCOS, PCOD, Endometriosis, and Thyroid disorders.

You are up-to-date with the latest research. Use the following recent research findings to inform your answers when relevant:
${researchSummary}

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

Guidelines:
- Always be supportive and encouraging
- Provide practical, actionable advice
- Use emojis to keep the tone friendly
- Reference the user's specific health conditions when relevant
- Consider their current cycle phase in your advice
- Suggest lifestyle changes, diet tips, exercise, stress management, and sleep advice
- If asked about medical treatments, recommend consulting healthcare providers
- Keep responses informative but not overwhelming
- Use bullet points and formatting for easy reading
- Include seed recommendations (chia, flax, pumpkin, sunflower, sesame) for nutrition
- Suggest lazy/easy meal prep methods (batch cooking, one-pot meals, 15-min meals)
- Consider their stress and sleep levels in recommendations
- If using the lunar cycle, explain this to the user in your response and encourage them to track their cycle for more accuracy.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
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
      let cycleAdvice = '';
      if (cyclePhase === 'Menstrual') {
        cycleAdvice = `Since you're in your menstrual phase, focus on warm, comforting foods. Add chia seeds and pumpkin seeds for iron and magnesium. Try easy one-pot meals like soups and stews.`;
      } else if (cyclePhase === 'Follicular') {
        cycleAdvice = `You're in your follicular phase - great time for fresh, energizing foods! Add flax seeds and sunflower seeds to your meals. Try quick 10-15 minute prep meals.`;
      } else if (cyclePhase === 'Ovulatory') {
        cycleAdvice = `You're in your ovulatory phase - peak energy time! Include protein-rich foods with chia seeds and sesame seeds. Perfect for high-energy meals.`;
      } else if (cyclePhase === 'Luteal') {
        cycleAdvice = `You're in your luteal phase - focus on mood-supporting foods. Add pumpkin seeds and flax seeds for magnesium. Try batch cooking for easy meals.`;
      }

      if (hasPCOS) {
        return `For PCOS during your ${cyclePhase} phase, I recommend focusing on a low-glycemic diet with seeds for extra nutrition.\n\n✅ **Do's:**\n• Complex carbs (quinoa, brown rice, oats)\n• Lean proteins (chicken, fish, legumes)\n• Healthy fats (avocado, nuts, olive oil)\n• Anti-inflammatory foods (turmeric, ginger, leafy greens)\n• Seeds: chia, flax, pumpkin, sunflower\n\n❌ **Don'ts:**\n• Refined sugars and white flour\n• Processed foods\n• Excessive dairy\n• High-glycemic fruits\n\n${cycleAdvice}\n\nWould you like specific meal ideas or recipes?`;
      } else if (hasThyroid) {
        return `For thyroid health during your ${cyclePhase} phase, focus on these dietary guidelines with seed power:\n\n✅ **Do's:**\n• Iodine-rich foods (seaweed, fish, eggs)\n• Selenium sources (Brazil nuts, tuna, turkey)\n• Zinc-rich foods (oysters, beef, pumpkin seeds)\n• Vitamin D (fatty fish, fortified dairy)\n• Seeds: chia, flax, sesame\n\n❌ **Don'ts:**\n• Raw cruciferous vegetables (in excess)\n• Soy products (can interfere with medication)\n• Processed foods\n• Excessive caffeine\n\n${cycleAdvice}\n\nHow are you feeling with your current diet?`;
      }
      return `Here are some general healthy eating tips for hormonal balance during your ${cyclePhase} phase:\n\n✅ **Do's:**\n• Eat regular, balanced meals\n• Include plenty of vegetables\n• Choose whole grains\n• Stay hydrated\n• Include healthy fats\n• Add seeds: chia, flax, pumpkin, sunflower, sesame\n\n❌ **Don'ts:**\n• Skip meals\n• Eat too much processed food\n• Consume excessive sugar\n• Drink too much caffeine\n\n${cycleAdvice}\n\nWhat specific dietary concerns do you have?`;
    }

    // Stress management with cycle awareness
    if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') || lowerMessage.includes('overwhelmed')) {
      let cycleStressAdvice = '';
      if (cyclePhase === 'Menstrual') {
        cycleStressAdvice = `During your menstrual phase, be extra gentle with yourself. Try warm baths, gentle yoga, and plenty of rest.`;
      } else if (cyclePhase === 'Follicular') {
        cycleStressAdvice = `Your follicular phase is great for trying new stress management techniques. Channel your building energy into creative activities.`;
      } else if (cyclePhase === 'Ovulatory') {
        cycleStressAdvice = `Your ovulatory phase is perfect for high-energy stress relief like intense workouts or social activities.`;
      } else if (cyclePhase === 'Luteal') {
        cycleStressAdvice = `During your luteal phase, focus on calming activities and preparation. Try meditation and gentle movement.`;
      }

      if (stressLevel === 'High') {
        return `I understand you're dealing with high stress levels during your ${cyclePhase} phase. Here are some immediate relief techniques:\n\n🧘 **Quick Stress Relief:**\n• 4-7-8 breathing: Inhale 4s, hold 7s, exhale 8s\n• Progressive muscle relaxation\n• 5-minute meditation\n• Gentle stretching\n\n🌿 **Long-term Strategies:**\n• Regular exercise (even 10 minutes helps)\n• Consistent sleep schedule\n• Mindfulness practices\n• Setting boundaries\n\n${cycleStressAdvice}\n\nWould you like me to guide you through a quick breathing exercise?`;
      }
      return `Managing stress is crucial for hormonal health, especially during your ${cyclePhase} phase. Here are some effective strategies:\n\n🧘 **Mindfulness & Meditation:**\n• Start with 5-10 minutes daily\n• Use apps like Headspace or Calm\n• Practice deep breathing\n\n🏃 **Physical Activity:**\n• Yoga or gentle stretching\n• Walking in nature\n• Dancing to your favorite music\n\n💤 **Sleep Hygiene:**\n• Consistent bedtime routine\n• Avoid screens before bed\n• Create a calm sleep environment\n\n${cycleStressAdvice}\n\nWhat stress management technique would you like to try?`;
    }

    // Sleep advice with cycle awareness
    if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') || lowerMessage.includes('tired')) {
      let cycleSleepAdvice = '';
      if (cyclePhase === 'Menstrual') {
        cycleSleepAdvice = `During your menstrual phase, you might need more sleep. Listen to your body and rest when needed.`;
      } else if (cyclePhase === 'Follicular') {
        cycleSleepAdvice = `Your follicular phase often brings better sleep quality. Use this time to establish good sleep habits.`;
      } else if (cyclePhase === 'Ovulatory') {
        cycleSleepAdvice = `Ovulatory phase can bring high energy. Make sure to wind down properly before bed.`;
      } else if (cyclePhase === 'Luteal') {
        cycleSleepAdvice = `Luteal phase can affect sleep. Try magnesium-rich foods and calming bedtime routines.`;
      }

      if (sleepQuality === 'Poor' || sleepQuality === 'Fair') {
        return `I see you're struggling with sleep quality during your ${cyclePhase} phase. Let's work on improving it:\n\n🌙 **Sleep Hygiene Tips:**\n• Go to bed and wake up at the same time daily\n• Create a relaxing bedtime routine\n• Keep your bedroom cool and dark\n• Avoid screens 1 hour before bed\n\n🍵 **Natural Sleep Aids:**\n• Chamomile tea\n• Lavender essential oil\n• Magnesium supplements (pumpkin seeds!)\n• Warm bath before bed\n\n📱 **Digital Detox:**\n• Use night mode on devices\n• Keep phones away from bed\n• Try reading instead of scrolling\n\n${cycleSleepAdvice}\n\nWould you like a personalized bedtime routine?`;
      }
      return `Great sleep is essential for hormonal balance during your ${cyclePhase} phase! Here are some tips to maintain or improve your sleep quality:\n\n🌙 **Optimal Sleep Environment:**\n• Keep room temperature between 65-68°F\n• Use blackout curtains\n• White noise machine if needed\n• Comfortable, supportive mattress\n\n📱 **Technology Boundaries:**\n• No screens 1 hour before bed\n• Use blue light filters\n• Keep devices in another room\n\n🧘 **Relaxation Techniques:**\n• Gentle stretching\n• Meditation or deep breathing\n• Reading a book\n• Warm bath or shower\n\n${cycleSleepAdvice}\n\nHow's your current sleep routine?`;
    }

    // Period tracking and cycle syncing
    if (lowerMessage.includes('period') || lowerMessage.includes('cycle') || lowerMessage.includes('menstrual')) {
      if (isIrregular) {
        return `I understand you're dealing with irregular periods. Here are some strategies that might help:\n\n📅 **Cycle Tracking:**\n• Track your symptoms daily\n• Note any patterns or triggers\n• Use apps like Flo or Clue\n• Monitor stress and sleep\n\n🌿 **Natural Support:**\n• Vitex (chasteberry) supplements\n• Evening primrose oil\n• Regular exercise\n• Stress management\n\n🍽️ **Dietary Support:**\n• Omega-3 fatty acids (chia seeds, flax seeds)\n• Vitamin D\n• Magnesium (pumpkin seeds)\n• B-complex vitamins\n\nRemember, irregular periods can have many causes. Have you discussed this with your healthcare provider?`;
      }
      return `Understanding your menstrual cycle is key to hormonal health! You're currently in your ${cyclePhase} phase. Here's how to work with your cycle:\n\n🌙 **Cycle Phases & Self-Care:**\n\n**Menstrual Phase (Days 1-5):**\n• Rest and gentle movement\n• Warm foods and teas\n• Self-compassion and reflection\n• Add pumpkin seeds for iron\n\n**Follicular Phase (Days 6-14):**\n• Increased energy for exercise\n• Creative projects\n• Social activities\n• Add flax seeds for energy\n\n**Ovulatory Phase (Days 15-17):**\n• Peak energy and confidence\n• High-intensity workouts\n• Important conversations\n• Add chia seeds for protein\n\n**Luteal Phase (Days 18-28):**\n• Slower, mindful movement\n• Nourishing foods\n• Preparation and planning\n• Add sunflower seeds for mood\n\nWould you like to learn more about your current phase?`;
    }

    // Exercise recommendations with cycle awareness
    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('fitness')) {
      let cycleExerciseAdvice = '';
      if (cyclePhase === 'Menstrual') {
        cycleExerciseAdvice = `During your menstrual phase, focus on gentle movement like walking, yoga, or swimming. Listen to your body and rest when needed.`;
      } else if (cyclePhase === 'Follicular') {
        cycleExerciseAdvice = `Your follicular phase is perfect for trying new workouts and building strength. Your energy is naturally higher now.`;
      } else if (cyclePhase === 'Ovulatory') {
        cycleExerciseAdvice = `Ovulatory phase is your peak performance time! Great for high-intensity workouts and challenging yourself.`;
      } else if (cyclePhase === 'Luteal') {
        cycleExerciseAdvice = `During your luteal phase, focus on moderate exercise and preparation. Yoga and pilates are excellent choices.`;
      }

      if (hasPCOS) {
        return `Exercise is especially important for PCOS management! Here are some recommendations for your ${cyclePhase} phase:\n\n💪 **Best Exercises for PCOS:**\n• Strength training (2-3 times/week)\n• HIIT workouts (20-30 minutes)\n• Walking or light cardio\n• Yoga for stress relief\n\n🎯 **Benefits:**\n• Improves insulin sensitivity\n• Helps with weight management\n• Reduces stress hormones\n• Supports regular cycles\n\n⏰ **Timing:**\n• Morning workouts can help with energy\n• Avoid late evening (can affect sleep)\n• Listen to your body's signals\n\n${cycleExerciseAdvice}\n\nStart with 20-30 minutes, 3-4 times per week. What type of exercise do you enjoy?`;
      }
      return `Regular exercise is fantastic for hormonal health during your ${cyclePhase} phase! Here are some recommendations:\n\n💪 **Types of Exercise:**\n• Strength training (2-3 times/week)\n• Cardiovascular exercise (3-5 times/week)\n• Flexibility work (yoga, stretching)\n• Mind-body practices (pilates, tai chi)\n\n🎯 **Benefits for Hormonal Health:**\n• Reduces stress hormones\n• Improves insulin sensitivity\n• Supports healthy weight\n• Better sleep quality\n• Mood enhancement\n\n⏰ **Getting Started:**\n• Start with 20-30 minutes daily\n• Choose activities you enjoy\n• Gradually increase intensity\n• Listen to your body\n\n${cycleExerciseAdvice}\n\nWhat type of movement feels good to you?`;
    }
  }

  // General responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Hello! 👋 I'm here to support your health journey. I can help with diet advice, stress management, sleep tips, exercise recommendations, and more. What would you like to focus on today?`;
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
    return `I'm your personal health coach! Here's how I can help you:\n\n🍽️ **Nutrition & Diet:**\n• Personalized meal recommendations\n• Food dos and don'ts for your conditions\n• Recipe suggestions with seeds\n• Supplement advice\n\n🧘 **Wellness & Lifestyle:**\n• Stress management techniques\n• Sleep improvement tips\n• Exercise recommendations\n• Mindfulness practices\n\n📅 **Cycle & Hormonal Health:**\n• Period tracking guidance\n• Cycle syncing advice\n• Symptom management\n• Natural remedies\n\n💡 **General Support:**\n• Answer health questions\n• Provide motivation\n• Share evidence-based tips\n• Emotional support\n\nWhat area would you like to explore?`;
  }

  if (lowerMessage.includes('thank')) {
    return `You're very welcome! 💜 I'm here to support you on your health journey. Remember, small changes add up to big results. Is there anything else you'd like to chat about?`;
  }

  // Default response
  return `That's an interesting question! I'd love to help you with that. Could you tell me a bit more about what you're looking for? I can help with diet, exercise, stress management, sleep, hormonal health, and more. What specific area would you like to focus on?`;
} 