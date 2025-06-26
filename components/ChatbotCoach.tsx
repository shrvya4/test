'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { differenceInDays, isSameDay, parseISO, parse, isValid } from 'date-fns';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface UserProfile {
  age?: string;
  diagnosis?: string[];
  symptoms?: string[];
  lastPeriod?: string;
  cycleLength?: number;
  periodDuration?: number;
  irregularPeriods?: boolean;
  stressLevel?: string;
  sleepQuality?: string;
  otherDiagnosis?: string;
  otherSymptoms?: string;
}

interface ChatbotCoachProps {
  userProfile: UserProfile | null;
}

const ChatbotCoach: React.FC<ChatbotCoachProps> = ({ userProfile }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUsingAI, setIsUsingAI] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history from Firebase
  useEffect(() => {
    const loadConversationHistory = async () => {
      if (!user?.uid) {
        // If no user, show welcome message
        setMessages([{
          id: '1',
          text: `Hi there! 👋 I'm Auvra, your personal health coach, and I'm here to support you on your wellness journey. I can help you with diet recommendations, stress management, sleep tips, and so much more. What would you like to chat about today?`,
          sender: 'bot',
          timestamp: new Date(),
        }]);
        setIsLoadingHistory(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.conversationHistory && userData.conversationHistory.length > 0) {
            // Only keep messages from the last 30 days
            const now = new Date();
            const loadedMessages = userData.conversationHistory
              .map((msg: any) => ({
                ...msg,
                timestamp: msg.timestamp instanceof Timestamp ? msg.timestamp.toDate() : new Date(msg.timestamp)
              }))
              .filter((msg: any) => differenceInDays(now, msg.timestamp) <= 30);
            setMessages(loadedMessages.length > 0 ? loadedMessages : [{
              id: '1',
              text: `Hi there! 👋 I'm Auvra, your personal health coach, and I'm here to support you on your wellness journey. I can help you with diet recommendations, stress management, sleep tips, and so much more. What would you like to chat about today?`,
              sender: 'bot',
              timestamp: new Date(),
            }]);
          } else {
            // No previous conversation, show welcome message
            setMessages([{
              id: '1',
              text: `Hi there! 👋 I'm Auvra, your personal health coach, and I'm here to support you on your wellness journey. I can help you with diet recommendations, stress management, sleep tips, and so much more. What would you like to chat about today?`,
              sender: 'bot',
              timestamp: new Date(),
            }]);
          }
        } else {
          // New user, show welcome message
          setMessages([{
            id: '1',
            text: `Hi there! 👋 I'm Auvra, your personal health coach, and I'm here to support you on your wellness journey. I can help you with diet recommendations, stress management, sleep tips, and so much more. What would you like to chat about today?`,
            sender: 'bot',
            timestamp: new Date(),
          }]);
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
        // Fallback to welcome message
        setMessages([{
          id: '1',
          text: `Hi there! 👋 I'm Auvra, your personal health coach, and I'm here to support you on your wellness journey. I can help you with diet recommendations, stress management, sleep tips, and so much more. What would you like to chat about today?`,
          sender: 'bot',
          timestamp: new Date(),
        }]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadConversationHistory();
  }, [user?.uid]);

  // Save conversation to Firebase
  const saveConversationToFirebase = async (newMessages: Message[]) => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Convert Date objects to Firestore timestamps for storage
      const messagesForStorage = newMessages.map(msg => ({
        ...msg,
        timestamp: Timestamp.fromDate(msg.timestamp)
      }));

      await updateDoc(userRef, {
        conversationHistory: messagesForStorage,
        lastConversationUpdate: Timestamp.now()
      });
    } catch (error) {
      console.error('Error saving conversation to Firebase:', error);
    }
  };

  const generateChatGPTResponse = async (userMessage: string): Promise<string> => {
    try {
      // Create context from user profile
      const context = userProfile ? `
        User Profile:
        - Age: ${userProfile.age}
        - Health Conditions: ${userProfile.diagnosis?.join(', ')}${userProfile.otherDiagnosis ? `, ${userProfile.otherDiagnosis}` : ''}
        - Symptoms: ${userProfile.symptoms?.join(', ')}${userProfile.otherSymptoms ? `, ${userProfile.otherSymptoms}` : ''}
        - Last Period: ${userProfile.lastPeriod ? new Date(userProfile.lastPeriod).toLocaleDateString() : 'Not specified'}
        - Cycle Length: ${userProfile.cycleLength || 'Not specified'} days
        - Period Duration: ${userProfile.periodDuration || 'Not specified'} days
        - Irregular Periods: ${userProfile.irregularPeriods ? 'Yes' : 'No'}
        - Stress Level: ${userProfile.stressLevel}
        - Sleep Quality: ${userProfile.sleepQuality}
      ` : 'No user profile available';

      // Create conversation history for context
      const conversationHistory = messages
        .filter(msg => msg.sender === 'user' || msg.sender === 'bot')
        .slice(-6) // Keep last 6 messages for context
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: context,
          userProfile: userProfile,
          userId: user?.uid,
          conversationHistory: conversationHistory
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from ChatGPT');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error calling ChatGPT API:', error);
      // Fallback to local responses if API fails
      return generateLocalResponse(userMessage, userProfile);
    }
  };

  const generateLocalResponse = (userMessage: string, userProfile: any, getRecentUpdateNote?: (field: string) => string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Personalized responses based on user profile
    if (userProfile) {
      const hasPCOS = userProfile.diagnosis?.includes('PCOS') || userProfile.diagnosis?.includes('PCOD');
      const hasThyroid = userProfile.diagnosis?.includes('Thyroid');
      const hasEndometriosis = userProfile.diagnosis?.includes('Endometriosis');
      const isIrregular = userProfile.irregularPeriods;
      const stressLevel = userProfile.stressLevel;
      const sleepQuality = userProfile.sleepQuality;
      const ageGroup = userProfile.age;
      const symptoms = userProfile.symptoms || [];
      const otherConditions = userProfile.otherDiagnosis;
      const otherSymptoms = userProfile.otherSymptoms;
      const cycleLength = userProfile.cycleLength;
      const periodDuration = userProfile.periodDuration;

      // Diet recommendations
      if (lowerMessage.includes('diet') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
        if (hasPCOS) {
          return `For PCOS, I recommend focusing on a low-glycemic diet. Here are some key tips:\n\n✅ **Do's:**\n• Complex carbs (quinoa, brown rice, oats)\n• Lean proteins (chicken, fish, legumes)\n• Healthy fats (avocado, nuts, olive oil)\n• Anti-inflammatory foods (turmeric, ginger, leafy greens)\n\n❌ **Don'ts:**\n• Refined sugars and white flour\n• Processed foods\n• Excessive dairy\n• High-glycemic fruits\n\nWould you like specific meal ideas or recipes?`;
        } else if (hasThyroid) {
          return `For thyroid health, focus on these dietary guidelines:\n\n✅ **Do's:**\n• Iodine-rich foods (seaweed, fish, eggs)\n• Selenium sources (Brazil nuts, tuna, turkey)\n• Zinc-rich foods (oysters, beef, pumpkin seeds)\n• Vitamin D (fatty fish, fortified dairy)\n\n❌ **Don'ts:**\n• Raw cruciferous vegetables (in excess)\n• Soy products (can interfere with medication)\n• Processed foods\n• Excessive caffeine\n\nHow are you feeling with your current diet?`;
        }
        return `Here are some general healthy eating tips for hormonal balance:\n\n✅ **Do's:**\n• Eat regular, balanced meals\n• Include plenty of vegetables\n• Choose whole grains\n• Stay hydrated\n• Include healthy fats\n\n❌ **Don'ts:**\n• Skip meals\n• Eat too much processed food\n• Consume excessive sugar\n• Drink too much caffeine\n\nWhat specific dietary concerns do you have?`;
      }

      // Stress management
      if (lowerMessage.includes('stress') || lowerMessage.includes('anxiety') || lowerMessage.includes('overwhelmed')) {
        if (stressLevel === 'High') {
          return `I understand you're dealing with high stress levels. Here are some immediate relief techniques:\n\n🧘 **Quick Stress Relief:**\n• 4-7-8 breathing: Inhale 4s, hold 7s, exhale 8s\n• Progressive muscle relaxation\n• 5-minute meditation\n• Gentle stretching\n\n🌿 **Long-term Strategies:**\n• Regular exercise (even 10 minutes helps)\n• Consistent sleep schedule\n• Mindfulness practices\n• Setting boundaries\n\nWould you like me to guide you through a quick breathing exercise?`;
        }
        return `Managing stress is crucial for hormonal health. Here are some effective strategies:\n\n🧘 **Mindfulness & Meditation:**\n• Start with 5-10 minutes daily\n• Use apps like Headspace or Calm\n• Practice deep breathing\n\n🏃 **Physical Activity:**\n• Yoga or gentle stretching\n• Walking in nature\n• Dancing to your favorite music\n\n💤 **Sleep Hygiene:**\n• Consistent bedtime routine\n• Avoid screens before bed\n• Create a calm sleep environment\n\nWhat stress management technique would you like to try?`;
      }

      // Sleep advice
      if (lowerMessage.includes('sleep') || lowerMessage.includes('insomnia') || lowerMessage.includes('tired')) {
        const updateNote = getRecentUpdateNote ? getRecentUpdateNote('sleepQuality') : '';
        if (sleepQuality === 'Poor' || sleepQuality === 'Fair') {
          return `${updateNote}I see you're struggling with sleep quality. Let's work on improving it:\n\n🌙 **Sleep Hygiene Tips:**\n• Go to bed and wake up at the same time daily\n• Create a relaxing bedtime routine\n• Keep your bedroom cool and dark\n• Avoid screens 1 hour before bed\n\n🍵 **Natural Sleep Aids:**\n• Chamomile tea\n• Lavender essential oil\n• Magnesium supplements\n• Warm bath before bed\n\n📱 **Digital Detox:**\n• Use night mode on devices\n• Keep phones away from bed\n• Try reading instead of scrolling\n\nWould you like a personalized bedtime routine?`;
        }
        return `${updateNote}Great sleep is essential for hormonal balance! Here are some tips to maintain or improve your sleep quality:\n\n🌙 **Optimal Sleep Environment:**\n• Keep room temperature between 65-68°F\n• Use blackout curtains\n• White noise machine if needed\n• Comfortable, supportive mattress\n\n📱 **Technology Boundaries:**\n• No screens 1 hour before bed\n• Use blue light filters\n• Keep devices in another room\n\n🧘 **Relaxation Techniques:**\n• Gentle stretching\n• Meditation or deep breathing\n• Reading a book\n• Warm bath or shower\n\nHow's your current sleep routine?`;
      }

      // Period tracking and cycle syncing
      if (lowerMessage.includes('period') || lowerMessage.includes('cycle') || lowerMessage.includes('menstrual')) {
        if (isIrregular) {
          return `I understand you're dealing with irregular periods. Here are some strategies that might help:\n\n📅 **Cycle Tracking:**\n• Track your symptoms daily\n• Note any patterns or triggers\n• Use apps like Flo or Clue\n• Monitor stress and sleep\n\n🌿 **Natural Support:**\n• Vitex (chasteberry) supplements\n• Evening primrose oil\n• Regular exercise\n• Stress management\n\n🍽️ **Dietary Support:**\n• Omega-3 fatty acids\n• Vitamin D\n• Magnesium\n• B-complex vitamins\n\nRemember, irregular periods can have many causes. Have you discussed this with your healthcare provider?`;
        }
        return `Understanding your menstrual cycle is key to hormonal health! Here's how to work with your cycle:\n\n🌙 **Cycle Phases & Self-Care:**\n\n**Menstrual Phase (Days 1-5):**\n• Rest and gentle movement\n• Warm foods and teas\n• Self-compassion and reflection\n\n**Follicular Phase (Days 6-14):**\n• Increased energy for exercise\n• Creative projects\n• Social activities\n\n**Ovulatory Phase (Days 15-17):**\n• Peak energy and confidence\n• High-intensity workouts\n• Important conversations\n\n**Luteal Phase (Days 18-28):**\n• Slower, mindful movement\n• Nourishing foods\n• Preparation and planning\n\nWould you like to learn more about any specific phase?`;
      }

      // Exercise recommendations
      if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('fitness')) {
        if (hasPCOS) {
          return `Exercise is especially important for PCOS management! Here are some recommendations:\n\n💪 **Best Exercises for PCOS:**\n• Strength training (2-3 times/week)\n• HIIT workouts (20-30 minutes)\n• Walking or light cardio\n• Yoga for stress relief\n\n🎯 **Benefits:**\n• Improves insulin sensitivity\n• Helps with weight management\n• Reduces stress hormones\n• Supports regular cycles\n\n⏰ **Timing:**\n• Morning workouts can help with energy\n• Avoid late evening (can affect sleep)\n• Listen to your body's signals\n\nStart with 20-30 minutes, 3-4 times per week. What type of exercise do you enjoy?`;
        }
        return `Regular exercise is fantastic for hormonal health! Here are some recommendations:\n\n💪 **Types of Exercise:**\n• Strength training (2-3 times/week)\n• Cardiovascular exercise (3-5 times/week)\n• Flexibility work (yoga, stretching)\n• Mind-body practices (pilates, tai chi)\n\n🎯 **Benefits for Hormonal Health:**\n• Reduces stress hormones\n• Improves insulin sensitivity\n• Supports healthy weight\n• Better sleep quality\n• Mood enhancement\n\n⏰ **Getting Started:**\n• Start with 20-30 minutes daily\n• Choose activities you enjoy\n• Gradually increase intensity\n• Listen to your body\n\nWhat type of movement feels good to you?`;
      }
    }

    // General responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return `Hello! 👋 I'm Auvra, here to support your health journey. I can help with diet advice, stress management, sleep tips, exercise recommendations, and more. What would you like to focus on today?`;
    }

    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return `I'm Auvra, your personal health coach! Here's how I can help you:\n\n🍽️ **Nutrition & Diet:**\n• Personalized meal recommendations\n• Food dos and don'ts for your conditions\n• Recipe suggestions\n• Supplement advice\n\n🧘 **Wellness & Lifestyle:**\n• Stress management techniques\n• Sleep improvement tips\n• Exercise recommendations\n• Mindfulness practices\n\n📅 **Cycle & Hormonal Health:**\n• Period tracking guidance\n• Cycle syncing advice\n• Symptom management\n• Natural remedies\n\n💡 **General Support:**\n• Answer health questions\n• Provide motivation\n• Share evidence-based tips\n• Emotional support\n\nWhat area would you like to explore?`;
    }

    if (lowerMessage.includes('thank')) {
      return `You're very welcome! 💜 I'm here to support you on your health journey. Remember, small changes add up to big results. Is there anything else you'd like to chat about?`;
    }

    // Default response
    return `That's an interesting question! I'd love to help you with that. Could you tell me a bit more about what you're looking for? I can help with diet, exercise, stress management, sleep, hormonal health, and more. What specific area would you like to focus on?`;
  };

  // Helper: Try to parse a date from various formats
  const tryParseDate = (input: string): Date | null => {
    const formats = [
      'yyyy-MM-dd',
      'dd/MM/yyyy',
      'd/M/yyyy',
      'MMMM d, yyyy',
      'd MMMM yyyy',
      'd MMM yyyy',
      'MMM d, yyyy',
      'd MMM, yyyy',
      'd MMMM, yyyy',
      'do MMMM yyyy',
      'do MMM yyyy',
      'd MMM',
      'd MMMM',
      'MMMM d',
      'MMM d',
      'd/M/yy',
      'dd/MM/yy',
    ];
    for (const format of formats) {
      const parsed = parse(input, format, new Date());
      if (isValid(parsed)) return parsed;
    }
    // Fallback to Date constructor
    const fallback = new Date(input);
    if (isValid(fallback)) return fallback;
    return null;
  };

  // Helper: Parse update intent from user message
  const parseProfileUpdate = (message: string) => {
    // Period date update
    const periodMatch = message.match(/(update|set|change) (my )?(period|last period|period date) (to|as|on)?\s*([\w\-\/\.,]+|today|yesterday)/i);
    if (periodMatch) {
      let dateStr = periodMatch[5]?.trim().toLowerCase();
      let newDate: Date | null = null;
      if (dateStr === 'today') newDate = new Date();
      else if (dateStr === 'yesterday') {
        newDate = new Date();
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate = tryParseDate(dateStr);
      }
      if (newDate) return { field: 'lastPeriod', value: newDate.toISOString() };
    }
    // Sleep quality update
    const sleepMatch = message.match(/(update|set|change) (my )?(sleep quality|sleep) (to|as)?\s*(poor|fair|good|excellent)/i);
    if (sleepMatch) {
      return { field: 'sleepQuality', value: sleepMatch[5][0].toUpperCase() + sleepMatch[5].slice(1).toLowerCase() };
    }
    // Stress level update
    const stressMatch = message.match(/(update|set|change) (my )?(stress level|stress) (to|as)?\s*(low|medium|high)/i);
    if (stressMatch) {
      return { field: 'stressLevel', value: stressMatch[5][0].toUpperCase() + stressMatch[5].slice(1).toLowerCase() };
    }
    // Cycle length update
    const cycleMatch = message.match(/(update|set|change) (my )?(cycle length|cycle) (to|as)?\s*(\d{2})/i);
    if (cycleMatch) {
      return { field: 'cycleLength', value: Number(cycleMatch[5]) };
    }
    // Period duration update
    const durationMatch = message.match(/(update|set|change) (my )?(period duration|period length|duration) (to|as)?\s*(\d{1,2})/i);
    if (durationMatch) {
      return { field: 'periodDuration', value: Number(durationMatch[5]) };
    }
    return null;
  };

  // Helper: Fetch profile updates from Firestore for the last 30 days
  const fetchRecentProfileUpdates = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return [];
      const data = userDoc.data();
      if (!data.profileUpdates) return [];
      const now = new Date();
      return data.profileUpdates
        .map((u: any) => ({
          ...u,
          timestamp: u.timestamp instanceof Timestamp ? u.timestamp.toDate() : new Date(u.timestamp)
        }))
        .filter((u: any) => differenceInDays(now, u.timestamp) <= 30);
    } catch (err) {
      return [];
    }
  };

  // Helper: Summarize profile updates
  const summarizeProfileUpdates = (updates: any[]) => {
    if (!updates.length) return '';
    let summary = 'Profile changes in the last 30 days:\n';
    updates.forEach(u => {
      summary += `• ${u.field.replace(/([A-Z])/g, ' $1').toLowerCase()} updated to ${typeof u.value === 'boolean' ? (u.value ? 'Yes' : 'No') : u.value} on ${u.timestamp.toLocaleDateString()}\n`;
    });
    return summary;
  };

  // Helper: Map symptoms/concerns to positive goals
  const concernToGoal: { [key: string]: string } = {
    'acne': 'clearer skin',
    'irregular periods': 'regulating your cycle',
    'fatigue': 'more energy',
    'weight gain': 'sustainable weight management',
    'anxiety': 'feeling more balanced',
    'hair fall': 'stronger hair',
    'mood swings': 'emotional balance',
    'other': 'better wellbeing',
  };

  const getUserGoals = (userProfile: any): string[] => {
    if (!userProfile) return [];
    const goals: string[] = [];
    if (userProfile.symptoms && userProfile.symptoms.length) {
      for (const s of userProfile.symptoms) {
        const key = String(s).toLowerCase();
        if (concernToGoal[key] && !goals.includes(concernToGoal[key])) goals.push(concernToGoal[key]);
      }
    }
    // Fallback: use diagnosis
    if (goals.length === 0 && userProfile.diagnosis && userProfile.diagnosis.length) {
      for (const d of userProfile.diagnosis) {
        const key = String(d).toLowerCase();
        if (concernToGoal[key] && !goals.includes(concernToGoal[key])) goals.push(concernToGoal[key]);
      }
    }
    // Fallback: generic
    if (goals.length === 0) goals.push('better wellbeing');
    return goals.slice(0, 2);
  };

  // Chatbot state for onboarding flow
  const [goalFlowStep, setGoalFlowStep] = useState(0); // 0 = not started, 1 = asked how many, 2 = asked category, 3 = suggested actions
  const [goalFlowNum, setGoalFlowNum] = useState<number | null>(null);
  const [goalFlowCategory, setGoalFlowCategory] = useState<string | null>(null);

  // On new session, start the goal flow
  useEffect(() => {
    if (messages.length === 0 && userProfile) {
      const goals = getUserGoals(userProfile);
      const goalMsg = goals.length === 1
        ? `Hi, I'm here to support you in ${goals[0]}. 🌸 Let's make today simple and doable.`
        : `Hi, I'm here to support you in ${goals.map(g => `*${g}*`).join(' and ')}. 🌸 Let's make today simple and doable.`;
      setMessages([
        {
          id: 'welcome',
          text: goalMsg,
          sender: 'bot',
          timestamp: new Date(),
        },
        {
          id: 'howmany',
          text: 'How many small actions would you like to take today to move toward your goal? You can pick 1, 2 or 3 — whatever feels easiest for you right now.',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
      setGoalFlowStep(1);
    }
    // eslint-disable-next-line
  }, [userProfile]);

  // Handle onboarding flow in handleSendMessage
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // If in goal flow
    if (goalFlowStep === 1) {
      const num = parseInt(inputMessage.trim());
      if ([1, 2, 3].includes(num)) {
        setGoalFlowNum(num);
        setMessages(prev => [
          ...prev,
          { id: Date.now().toString(), text: inputMessage, sender: 'user', timestamp: new Date() },
          {
            id: 'whicharea',
            text: 'Great! Which area feels most doable today? 💪\n- Exercise\n- Diet\n- Mindfulness',
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        setGoalFlowStep(2);
        setInputMessage('');
        return;
      } else {
        setMessages(prev => [
          ...prev,
          { id: Date.now().toString(), text: inputMessage, sender: 'user', timestamp: new Date() },
          {
            id: 'howmanyagain',
            text: 'Please type 1, 2, or 3 for how many small actions you want to take today.',
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        setInputMessage('');
        return;
      }
    }
    if (goalFlowStep === 2) {
      const cat = inputMessage.trim().toLowerCase();
      let picked: string | null = null;
      if (cat.includes('exercise')) picked = 'exercise';
      if (cat.includes('diet')) picked = 'diet';
      if (cat.includes('mindfulness')) picked = 'mindfulness';
      if (picked) {
        setGoalFlowCategory(picked);
        // Suggest actions next
        const goals = getUserGoals(userProfile);
        const mainGoal = goals[0] || 'better wellbeing';
        const num = goalFlowNum || 1;
        // Generate suggestions
        let suggestions: string[] = [];
        if (mainGoal.includes('regulating')) {
          if (picked === 'diet') {
            suggestions = [
              'Eat a handful of soaked sesame seeds in the morning.',
              'Add leafy greens like spinach or kale to one meal.',
              'Drink a cup of spearmint tea in the afternoon.'
            ];
          } else if (picked === 'exercise') {
            suggestions = [
              'Take a 10-minute brisk walk after lunch.',
              'Do 5 minutes of gentle yoga stretches.',
              'Try 10 bodyweight squats or lunges.'
            ];
          } else if (picked === 'mindfulness') {
            suggestions = [
              'Try 5 minutes of deep breathing.',
              'Write down 3 things you are grateful for today.',
              'Do a short guided meditation before bed.'
            ];
          }
        } else if (mainGoal.includes('clearer skin')) {
          if (picked === 'diet') {
            suggestions = [
              'Drink 2 extra glasses of water today.',
              'Eat a serving of berries or citrus fruit.',
              'Avoid sugary snacks for one meal.',
            ];
          } else if (picked === 'exercise') {
            suggestions = [
              'Do 10 minutes of light cardio (like dancing or walking).',
              'Try a gentle face massage after cleansing.',
              'Do 10 jumping jacks to get your blood flowing.',
            ];
          } else if (picked === 'mindfulness') {
            suggestions = [
              'Try 5 minutes of deep breathing or a short guided meditation.',
              'Take 3 slow, mindful breaths before each meal.',
              'Write down one thing you love about your skin.',
            ];
          }
        } else if (mainGoal.includes('energy')) {
          if (picked === 'diet') {
            suggestions = [
              'Eat a protein-rich snack (like nuts or yogurt).',
              'Have a piece of fruit for a natural energy boost.',
              'Drink a glass of water first thing in the morning.',
            ];
          } else if (picked === 'exercise') {
            suggestions = [
              'Do 10 jumping jacks to wake up your body.',
              'Take a 5-minute walk outside.',
              'Stretch your arms and legs for 2 minutes.',
            ];
          } else if (picked === 'mindfulness') {
            suggestions = [
              'Take 3 deep breaths when you feel tired.',
              'Stand up and stretch every hour.',
              'Listen to a favorite song and move gently.',
            ];
          }
        } else if (mainGoal.includes('weight')) {
          if (picked === 'diet') {
            suggestions = [
              'Swap one sugary drink for water today.',
              'Add a serving of vegetables to your lunch or dinner.',
              'Eat slowly and mindfully at one meal.',
            ];
          } else if (picked === 'exercise') {
            suggestions = [
              'Take the stairs instead of the elevator once today.',
              'Do 10 squats or lunges.',
              'Go for a 10-minute walk after dinner.',
            ];
          } else if (picked === 'mindfulness') {
            suggestions = [
              'Pause and check in with your hunger before eating.',
              'Write down one thing you appreciate about your body.',
              'Take 3 deep breaths before your next meal.',
            ];
          }
        } else if (mainGoal.includes('balanced')) {
          if (picked === 'diet') {
            suggestions = [
              'Eat a meal without distractions (no phone or TV).',
              'Try a calming herbal tea like chamomile.',
              'Include a source of healthy fat (like avocado or nuts) in a meal.',
            ];
          } else if (picked === 'exercise') {
            suggestions = [
              'Do 5 minutes of gentle stretching.',
              'Take a mindful walk, focusing on your breath.',
              'Try a short yoga or tai chi video.',
            ];
          } else if (picked === 'mindfulness') {
            suggestions = [
              'Try a 3-minute body scan meditation.',
              'Write down one thing you are grateful for today.',
              'Take 3 slow breaths before responding to stress.',
            ];
          }
        } else {
          // Generic suggestions
          if (picked === 'diet') {
            suggestions = [
              'Drink a glass of water.',
              'Eat a piece of fruit.',
              'Add a handful of greens to a meal.',
            ];
          } else if (picked === 'exercise') {
            suggestions = [
              'Take a short walk.',
              'Do 5 minutes of stretching.',
              'Try 10 jumping jacks.',
            ];
          } else if (picked === 'mindfulness') {
            suggestions = [
              'Take 3 deep breaths.',
              'Write down one thing you are grateful for.',
              'Pause and notice your surroundings for 1 minute.',
            ];
          }
        }
        const chosen = suggestions.slice(0, goalFlowNum || 1);
        setMessages(prev => [
          ...prev,
          { id: Date.now().toString(), text: inputMessage, sender: 'user', timestamp: new Date() },
          {
            id: 'suggestions',
            text: `Here ${chosen.length === 1 ? 'is' : 'are'} ${chosen.length} small ${picked} step${chosen.length > 1 ? 's' : ''} you can try today:\n` +
              chosen.map((s, i) => `${i + 1}. ${s}`).join('\n'),
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        setGoalFlowStep(3);
        setInputMessage('');
        return;
      } else {
        setMessages(prev => [
          ...prev,
          { id: Date.now().toString(), text: inputMessage, sender: 'user', timestamp: new Date() },
          {
            id: 'whichareaagain',
            text: 'Please type Exercise, Diet, or Mindfulness to pick an area.',
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        setInputMessage('');
        return;
      }
    }

    // After onboarding flow, continue with normal chat
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsTyping(true);
    setIsUsingAI(true);

    if (/yesterday|previous day|last night/i.test(inputMessage)) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const summary = summarizeDayConversation(messages, yesterday);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: summary,
        sender: 'bot',
        timestamp: new Date(),
      };
      const finalMessages = [...messages, userMessage, botMessage];
      setMessages(finalMessages);
      await saveConversationToFirebase(finalMessages);
      setIsTyping(false);
      setIsUsingAI(false);
      setInputMessage('');
      return;
    }

    if (/summar(y|ise)|what have we discussed|last 30 days|this month|last week/i.test(inputMessage)) {
      let days = 30;
      if (/last week|this week/i.test(inputMessage)) days = 7;
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const recentMessages = messages.filter(msg => msg.timestamp >= startDate);
      let chatSummary = `Here's a summary of your conversation in the last ${days} days:\n`;
      recentMessages.forEach(msg => {
        if (msg.sender === 'user') chatSummary += `• You: ${msg.text}\n`;
        else chatSummary += `• Auvra: ${msg.text.substring(0, 80)}...\n`;
      });
      let profileSummary = '';
      if (user?.uid) {
        const updates = await fetchRecentProfileUpdates(user.uid);
        profileSummary = summarizeProfileUpdates(updates);
      }
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `${chatSummary}\n${profileSummary}`.trim(),
        sender: 'bot',
        timestamp: new Date(),
      };
      const finalMessages = [...messages, userMessage, botMessage];
      setMessages(finalMessages);
      await saveConversationToFirebase(finalMessages);
      setIsTyping(false);
      setIsUsingAI(false);
      setInputMessage('');
      return;
    }

    const updateIntent = parseProfileUpdate(inputMessage);
    if (updateIntent && user && userProfile) {
      // Update Firestore and in-memory profile
      const updatedProfile = { ...userProfile, [updateIntent.field]: updateIntent.value };
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          [updateIntent.field]: updateIntent.value,
          updatedAt: Timestamp.now(),
          profileUpdates: arrayUnion({
            field: updateIntent.field,
            value: updateIntent.value,
            timestamp: Timestamp.now(),
          })
        });
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            text: `Your ${updateIntent.field.replace(/([A-Z])/g, ' $1').toLowerCase()} has been updated to ${typeof updateIntent.value === 'boolean' ? (updateIntent.value ? 'Yes' : 'No') : updateIntent.value}.`,
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        await saveConversationToFirebase([
          ...messages,
          userMessage,
          {
            id: (Date.now() + 2).toString(),
            text: `Your ${updateIntent.field.replace(/([A-Z])/g, ' $1').toLowerCase()} has been updated to ${typeof updateIntent.value === 'boolean' ? (updateIntent.value ? 'Yes' : 'No') : updateIntent.value}.`,
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        setIsTyping(false);
        setIsUsingAI(false);
        setInputMessage('');
        // Optionally update in-memory profile if you keep it in state
        // setUserProfile(updatedProfile);
        return;
      } catch (err) {
        // Log error to Firestore
        try {
          await addDoc(collection(db, 'errorLogs'), {
            userId: user?.uid,
            error: err?.toString(),
            context: `chatbot profile update (${updateIntent.field})`,
            attemptedValue: updateIntent.value,
            timestamp: new Date(),
          });
        } catch (logErr) {
          // Ignore logging errors
        }
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 2).toString(),
            text: `Sorry, I couldn't update your ${updateIntent.field.replace(/([A-Z])/g, ' $1').toLowerCase()} right now. Please try again later or use the Edit Profile section!`,
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
        setIsTyping(false);
        setIsUsingAI(false);
        setInputMessage('');
        return;
      }
    }

    let recentProfileUpdates: any[] = [];
    let getRecentUpdateNote = (field: string) => '';
    if (user?.uid) {
      recentProfileUpdates = await fetchRecentProfileUpdates(user.uid);
      getRecentUpdateNote = (field: string) => {
        const update = recentProfileUpdates.find(u => u.field === field && differenceInDays(new Date(), u.timestamp) <= 7);
        if (update) {
          return `You recently updated your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} to ${typeof update.value === 'boolean' ? (update.value ? 'Yes' : 'No') : update.value} on ${update.timestamp.toLocaleDateString()}.
`;
        }
        return '';
      };
    }

    try {
      const botResponse = await generateChatGPTResponse(inputMessage);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      const finalMessages = [...messages, userMessage, botMessage];
      setMessages(finalMessages);
      
      // Save the complete conversation to Firebase
      await saveConversationToFirebase(finalMessages);
    } catch (error) {
      console.error('Error getting response:', error);
      // Fallback to local response
      const fallbackResponse = generateLocalResponse(inputMessage, userProfile, getRecentUpdateNote);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fallbackResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      const finalMessages = [...messages, userMessage, botMessage];
      setMessages(finalMessages);
      
      // Save the complete conversation to Firebase even for fallback responses
      await saveConversationToFirebase(finalMessages);
    } finally {
      setIsTyping(false);
      setIsUsingAI(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Enhanced formatting for chatbot responses
  const formatMessageText = (text: string) => {
    // Split by lines for easier parsing
    return text.split('\n').map((line, index) => {
      // Bold formatting: **text**
      if (/^\*\*.*\*\*$/.test(line.trim())) {
        return (
          <div key={index} className="font-semibold text-primary-600 mb-2 mt-3">
            {line.replace(/\*\*/g, '')}
          </div>
        );
      }
      // Section headers with emoji (e.g., ✅ **Do's:**)
      if (/^[\u2705\u274C\u1F4AA\u1F4A1\u1F4D6\u1F4CB\u1F4DD\u1F4C8\u1F4C9\u1F4CA\u1F4CC\u1F4CD\u1F4CE\u1F4CF\u1F4D0\u1F4D1\u1F4D2\u1F4D3\u1F4D4\u1F4D5\u1F4D7\u1F4D8\u1F4D9\u1F4DA\u1F4DB\u1F4DC\u1F4DD\u1F4DE\u1F4DF\u1F4E0\u1F4E1\u1F4E2\u1F4E3\u1F4E4\u1F4E5\u1F4E6\u1F4E7\u1F4E8\u1F4E9\u1F4EA\u1F4EB\u1F4EC\u1F4ED\u1F4EE\u1F4EF\u1F4F0\u1F4F1\u1F4F2\u1F4F3\u1F4F4\u1F4F5\u1F4F6\u1F4F7\u1F4F8\u1F4F9\u1F4FA\u1F4FB\u1F4FC\u1F4FD\u1F4FE\u1F4FF][^\n]*\*\*.*\*\*$/.test(line.trim())) {
        return (
          <div key={index} className="font-bold text-base mb-2 flex items-center gap-2">
            <span>{line.match(/^[^a-zA-Z0-9]*/)?.[0]}</span>
            <span>{line.replace(/^[^a-zA-Z0-9]*/, '').replace(/\*\*/g, '')}</span>
          </div>
        );
      }
      // Bullet points
      if (line.trim().startsWith('• ')) {
        return (
          <div key={index} className="flex items-start space-x-2 ml-6 mb-1">
            <span className="text-primary-400 mt-1">•</span>
            <span>{line.substring(2)}</span>
          </div>
        );
      }
      // Empty line for spacing
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }
      // Default: render as normal text, but replace **bold** inline
      const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
      return (
        <div key={index} className="mb-2">
          {parts.map((part, i) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={i} className="font-semibold text-primary-600">{part.replace(/\*\*/g, '')}</strong>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </div>
      );
    });
  };

  // Clear conversation history
  const clearConversationHistory = async () => {
    if (!user?.uid) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        conversationHistory: [],
        lastConversationUpdate: Timestamp.now()
      });
      
      // Reset to welcome message
      setMessages([{
        id: '1',
        text: `Hi there! 👋 I'm Auvra, your personal health coach, and I'm here to support you on your wellness journey. I can help you with diet recommendations, stress management, sleep tips, and so much more. What would you like to chat about today?`,
        sender: 'bot',
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Error clearing conversation history:', error);
    }
  };

  // Helper to get messages from a specific day
  const getMessagesForDay = (messages: Message[], date: Date) => {
    return messages.filter(msg => isSameDay(msg.timestamp, date));
  };

  // Helper to summarize a day's conversation
  const summarizeDayConversation = (messages: Message[], date: Date) => {
    const dayMessages = getMessagesForDay(messages, date);
    if (dayMessages.length === 0) {
      return `No conversation found for ${date.toLocaleDateString()}.`;
    }
    let summary = `Here's a summary of your conversation on ${date.toLocaleDateString()}:\n`;
    dayMessages.forEach(msg => {
      if (msg.sender === 'user') {
        summary += `• You asked: ${msg.text}\n`;
      } else {
        summary += `• Auvra replied: ${msg.text.substring(0, 80)}...\n`;
      }
    });
    return summary;
  };

  return (
    <div className="flex flex-col h-[700px] bg-white rounded-2xl border border-primary-100 shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="shrink-0 border-b border-primary-100 p-4 bg-gradient-to-r from-primary-50 to-accent-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accent-400 to-primary-400 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Auvra Health Coach</h3>
              <p className="text-xs text-gray-600">Your personalized health companion</p>
            </div>
          </div>
          {user && messages.length > 1 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearConversationHistory}
              className="p-2 rounded-full bg-white border border-primary-200 text-gray-600 hover:text-primary-600 hover:border-primary-300 transition-all duration-200 shadow-sm"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your conversation history...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-r from-primary-400 to-accent-400' 
                        : 'bg-gradient-to-r from-accent-400 to-primary-400'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className={`rounded-2xl px-5 py-4 shadow-sm max-w-full ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-primary-400 to-accent-400 text-white'
                        : 'bg-white border border-primary-100 text-gray-800 shadow-md'
                    }`}>
                      <div className={`text-sm leading-relaxed ${
                        message.sender === 'user' ? 'text-white' : 'text-gray-700'
                      }`}>
                        {formatMessageText(message.text)}
                      </div>
                      <div className={`text-xs mt-3 ${
                        message.sender === 'user' ? 'text-primary-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-3 max-w-[85%]">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-gradient-to-r from-accent-400 to-primary-400">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="rounded-2xl px-5 py-4 shadow-sm bg-white border border-primary-100">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-500 ml-2">
                        {isUsingAI ? 'Auvra is thinking...' : 'Typing...'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-primary-100 p-6 bg-white rounded-b-2xl">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about diet, exercise, stress, sleep, or anything health-related..."
              className="w-full px-4 py-3 border border-primary-200 rounded-2xl focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none transition-all duration-200 bg-white shadow-sm"
              rows={1}
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className={`p-3 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md ${
              inputMessage.trim() && !isTyping
                ? 'bg-gradient-to-r from-primary-400 to-accent-400 text-white hover:from-primary-500 hover:to-accent-500 shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
        {/* AI Status Indicator */}
        {isUsingAI && (
          <div className="mt-3 flex items-center justify-center text-xs text-gray-500">
            <Sparkles className="w-3 h-3 mr-1 text-primary-400" />
            Powered by Smart AI
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotCoach; 