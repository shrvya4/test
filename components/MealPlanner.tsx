'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Sparkles, RefreshCw, Calendar, Clock, Heart } from 'lucide-react';

interface UserProfile {
  age: string;
  diagnosis: string[];
  symptoms: string[];
  lastPeriod: Date;
  periodDuration: number;
  irregularPeriods: boolean;
  stressLevel: string;
  sleepQuality: string;
}

interface MealPlan {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string[];
  hydration: string;
  tips: string[];
}

interface MealPlannerProps {
  userProfile: UserProfile | null;
}

export default function MealPlanner({ userProfile }: MealPlannerProps) {
  const [selectedCuisine, setSelectedCuisine] = useState('Indian');
  const [selectedPhase, setSelectedPhase] = useState('Follicular');
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const cuisines = ['Indian', 'Mediterranean', 'Asian', 'Continental'];
  const phases = ['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'];

  const phaseDescriptions = {
    Menstrual: 'Rest and nourishment phase - focus on warm, comforting foods',
    Follicular: 'Building energy phase - incorporate fresh, vibrant foods',
    Ovulatory: 'Peak energy phase - include energizing, nutrient-dense meals',
    Luteal: 'Preparation phase - balance hormones with supportive nutrition'
  };

  const cuisineIcons = {
    Indian: '🍛',
    Mediterranean: '🥗',
    Asian: '🍜',
    Continental: '🍝'
  };

  useEffect(() => {
    generateMealPlan();
  }, [selectedCuisine, selectedPhase, userProfile]);

  const generateMealPlan = async () => {
    setLoading(true);
    setGenerating(true);

    // Simulate API call delay
    setTimeout(() => {
      const plan = createPersonalizedMealPlan(selectedCuisine, selectedPhase, userProfile);
      setMealPlan(plan);
      setLoading(false);
      setGenerating(false);
    }, 1500);
  };

  const createPersonalizedMealPlan = (cuisine: string, phase: string, profile: UserProfile | null): MealPlan => {
    const hasPCOS = profile?.diagnosis?.includes('PCOS') || profile?.diagnosis?.includes('PCOD');
    const hasThyroid = profile?.diagnosis?.includes('Thyroid');
    const hasEndometriosis = profile?.diagnosis?.includes('Endometriosis');

    const basePlan = getBaseMealPlan(cuisine, phase);
    
    // Personalize based on health conditions
    if (hasPCOS) {
      return personalizeForPCOS(basePlan, cuisine);
    } else if (hasThyroid) {
      return personalizeForThyroid(basePlan, cuisine);
    } else if (hasEndometriosis) {
      return personalizeForEndometriosis(basePlan, cuisine);
    }

    return basePlan;
  };

  const getBaseMealPlan = (cuisine: string, phase: string): MealPlan => {
    const plans: Record<string, Record<string, MealPlan>> = {
      Indian: {
        Menstrual: {
          breakfast: 'Warm oatmeal with dates, almonds, chia seeds, and cinnamon',
          lunch: 'Khichdi with ghee, steamed vegetables, and turmeric (one-pot meal)',
          dinner: 'Dal soup with brown rice and sautéed spinach (quick 15-min meal)',
          snacks: ['Warm milk with honey and pumpkin seeds', 'Roasted sunflower seeds'],
          hydration: 'Ginger tea, warm water with lemon',
          tips: ['Eat warm, cooked foods', 'Include plenty of ghee', 'Avoid cold foods', 'Add seeds for nutrition']
        },
        Follicular: {
          breakfast: 'Poha with vegetables, peanuts, and flax seeds (quick 10-min meal)',
          lunch: 'Quinoa pulao with mixed vegetables and sesame seeds',
          dinner: 'Grilled fish with dal and brown rice (easy 20-min prep)',
          snacks: ['Fresh fruits with chia seeds', 'Mixed nuts and seeds'],
          hydration: 'Coconut water, herbal teas',
          tips: ['Include fresh vegetables', 'Add protein to every meal', 'Stay hydrated', 'Sprinkle seeds on meals']
        },
        Ovulatory: {
          breakfast: 'Sprouts salad with lemon juice, pumpkin seeds, and sunflower seeds',
          lunch: 'Chicken curry with brown rice and vegetables (batch cook for week)',
          dinner: 'Lentil soup with quinoa and greens (one-pot wonder)',
          snacks: ['Greek yogurt with berries and chia seeds', 'Almonds and flax seeds'],
          hydration: 'Green tea, infused water',
          tips: ['High protein intake', 'Include omega-3 foods', 'Eat energizing foods', 'Add seeds for energy']
        },
        Luteal: {
          breakfast: 'Ragi dosa with coconut chutney and sesame seeds (pre-made batter)',
          lunch: 'Vegetable biryani with raita (one-pot meal)',
          dinner: 'Mushroom curry with brown rice (quick 15-min meal)',
          snacks: ['Dark chocolate with pumpkin seeds', 'Pumpkin seeds and almonds'],
          hydration: 'Chamomile tea, warm water',
          tips: ['Include magnesium-rich foods', 'Eat mood-boosting foods', 'Reduce caffeine', 'Add seeds for minerals']
        }
      },
      Mediterranean: {
        Menstrual: {
          breakfast: 'Greek yogurt with honey, walnuts, and chia seeds (5-min prep)',
          lunch: 'Minestrone soup with whole grain bread (batch cook)',
          dinner: 'Grilled salmon with quinoa and roasted vegetables (sheet pan meal)',
          snacks: ['Olives with pumpkin seeds', 'Dark chocolate with almonds'],
          hydration: 'Herbal tea, warm water',
          tips: ['Focus on anti-inflammatory foods', 'Include healthy fats', 'Eat warming foods', 'Add seeds for omega-3']
        },
        Follicular: {
          breakfast: 'Avocado toast with eggs and flax seeds (10-min meal)',
          lunch: 'Mediterranean salad with chickpeas and sunflower seeds',
          dinner: 'Grilled chicken with couscous and vegetables (one-pan meal)',
          snacks: ['Hummus with vegetables and sesame seeds', 'Mixed nuts and seeds'],
          hydration: 'Green tea, infused water',
          tips: ['Include fresh vegetables', 'Add protein to meals', 'Stay hydrated', 'Sprinkle seeds on everything']
        },
        Ovulatory: {
          breakfast: 'Smoothie bowl with berries, granola, and chia seeds (5-min prep)',
          lunch: 'Tuna salad with whole grain bread and flax seeds',
          dinner: 'Grilled fish with brown rice and vegetables (quick 20-min)',
          snacks: ['Greek yogurt with pumpkin seeds', 'Almonds and sunflower seeds'],
          hydration: 'Green tea, coconut water',
          tips: ['High protein intake', 'Include omega-3 foods', 'Eat energizing foods', 'Add seeds for protein']
        },
        Luteal: {
          breakfast: 'Oatmeal with berries, almonds, and chia seeds (5-min meal)',
          lunch: 'Vegetable soup with whole grain bread (batch cook)',
          dinner: 'Grilled vegetables with quinoa and sesame seeds (one-pan meal)',
          snacks: ['Dark chocolate with pumpkin seeds', 'Pumpkin seeds and flax seeds'],
          hydration: 'Chamomile tea, warm water',
          tips: ['Include magnesium-rich foods', 'Eat mood-boosting foods', 'Reduce caffeine', 'Add seeds for minerals']
        }
      },
      Asian: {
        Menstrual: {
          breakfast: 'Congee with ginger, vegetables, and sesame seeds (slow cooker meal)',
          lunch: 'Miso soup with brown rice and vegetables (10-min prep)',
          dinner: 'Steamed fish with vegetables and brown rice (one-pot meal)',
          snacks: ['Warm tea with pumpkin seeds', 'Roasted seaweed with sunflower seeds'],
          hydration: 'Ginger tea, warm water',
          tips: ['Eat warm, cooked foods', 'Include ginger and turmeric', 'Avoid cold foods', 'Add seeds for nutrition']
        },
        Follicular: {
          breakfast: 'Tofu scramble with vegetables and flax seeds (10-min meal)',
          lunch: 'Buddha bowl with quinoa, vegetables, and chia seeds',
          dinner: 'Stir-fried vegetables with brown rice and sesame seeds (15-min meal)',
          snacks: ['Fresh fruits with pumpkin seeds', 'Mixed nuts and seeds'],
          hydration: 'Green tea, infused water',
          tips: ['Include fresh vegetables', 'Add protein to every meal', 'Stay hydrated', 'Sprinkle seeds on meals']
        },
        Ovulatory: {
          breakfast: 'Smoothie with berries, protein powder, and chia seeds (5-min prep)',
          lunch: 'Sushi with brown rice, vegetables, and sesame seeds',
          dinner: 'Grilled fish with vegetables and brown rice (20-min meal)',
          snacks: ['Greek yogurt with sunflower seeds', 'Almonds and flax seeds'],
          hydration: 'Green tea, coconut water',
          tips: ['High protein intake', 'Include omega-3 foods', 'Eat energizing foods', 'Add seeds for energy']
        },
        Luteal: {
          breakfast: 'Oatmeal with berries, almonds, and chia seeds (5-min meal)',
          lunch: 'Vegetable soup with brown rice and pumpkin seeds (batch cook)',
          dinner: 'Steamed vegetables with quinoa and sesame seeds (15-min meal)',
          snacks: ['Dark chocolate with pumpkin seeds', 'Pumpkin seeds and sunflower seeds'],
          hydration: 'Chamomile tea, warm water',
          tips: ['Include magnesium-rich foods', 'Eat mood-boosting foods', 'Reduce caffeine', 'Add seeds for minerals']
        }
      },
      Continental: {
        Menstrual: {
          breakfast: 'Warm porridge with berries, nuts, and chia seeds (5-min meal)',
          lunch: 'Chicken soup with whole grain bread and flax seeds (batch cook)',
          dinner: 'Grilled salmon with sweet potato, vegetables, and pumpkin seeds (sheet pan meal)',
          snacks: ['Dark chocolate with sunflower seeds', 'Mixed nuts and seeds'],
          hydration: 'Herbal tea, warm water',
          tips: ['Focus on anti-inflammatory foods', 'Include healthy fats', 'Eat warming foods', 'Add seeds for omega-3']
        },
        Follicular: {
          breakfast: 'Avocado toast with eggs and flax seeds (10-min meal)',
          lunch: 'Grilled chicken salad with quinoa and sunflower seeds',
          dinner: 'Grilled fish with brown rice, vegetables, and sesame seeds (20-min meal)',
          snacks: ['Greek yogurt with chia seeds', 'Mixed nuts and seeds'],
          hydration: 'Green tea, infused water',
          tips: ['Include fresh vegetables', 'Add protein to meals', 'Stay hydrated', 'Sprinkle seeds on everything']
        },
        Ovulatory: {
          breakfast: 'Smoothie bowl with protein powder, berries, and chia seeds (5-min prep)',
          lunch: 'Tuna salad with whole grain bread and flax seeds',
          dinner: 'Grilled chicken with quinoa, vegetables, and pumpkin seeds (one-pan meal)',
          snacks: ['Greek yogurt with berries and sunflower seeds', 'Almonds and chia seeds'],
          hydration: 'Green tea, coconut water',
          tips: ['High protein intake', 'Include omega-3 foods', 'Eat energizing foods', 'Add seeds for protein']
        },
        Luteal: {
          breakfast: 'Oatmeal with berries, almonds, and chia seeds (5-min meal)',
          lunch: 'Vegetable soup with whole grain bread and pumpkin seeds (batch cook)',
          dinner: 'Grilled vegetables with quinoa and sesame seeds (one-pan meal)',
          snacks: ['Dark chocolate with pumpkin seeds', 'Pumpkin seeds and flax seeds'],
          hydration: 'Chamomile tea, warm water',
          tips: ['Include magnesium-rich foods', 'Eat mood-boosting foods', 'Reduce caffeine', 'Add seeds for minerals']
        }
      }
    };

    return plans[cuisine][phase];
  };

  const personalizeForPCOS = (basePlan: MealPlan, cuisine: string): MealPlan => {
    return {
      ...basePlan,
      breakfast: basePlan.breakfast + ' (Low glycemic)',
      lunch: basePlan.lunch + ' (High protein)',
      dinner: basePlan.dinner + ' (Anti-inflammatory)',
      snacks: [...basePlan.snacks, 'Cinnamon tea for blood sugar balance'],
      hydration: basePlan.hydration + ', Green tea for insulin sensitivity',
      tips: [...basePlan.tips, 'Avoid refined carbs', 'Include cinnamon in meals', 'Eat protein with every meal']
    };
  };

  const personalizeForThyroid = (basePlan: MealPlan, cuisine: string): MealPlan => {
    return {
      ...basePlan,
      breakfast: basePlan.breakfast + ' (Iodine-rich)',
      lunch: basePlan.lunch + ' (Selenium sources)',
      dinner: basePlan.dinner + ' (Zinc-rich)',
      snacks: [...basePlan.snacks, 'Brazil nuts for selenium'],
      hydration: basePlan.hydration + ', Seaweed tea for iodine',
      tips: [...basePlan.tips, 'Include iodine-rich foods', 'Add selenium sources', 'Avoid raw cruciferous vegetables']
    };
  };

  const personalizeForEndometriosis = (basePlan: MealPlan, cuisine: string): MealPlan => {
    return {
      ...basePlan,
      breakfast: basePlan.breakfast + ' (Anti-inflammatory)',
      lunch: basePlan.lunch + ' (Omega-3 rich)',
      dinner: basePlan.dinner + ' (Fiber-rich)',
      snacks: [...basePlan.snacks, 'Turmeric tea for inflammation'],
      hydration: basePlan.hydration + ', Ginger tea for pain relief',
      tips: [...basePlan.tips, 'Include anti-inflammatory foods', 'Add omega-3 sources', 'Eat fiber-rich foods']
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() => setSelectedCuisine(cuisine)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedCuisine === cuisine
                  ? 'bg-primary-400 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:text-primary-600 hover:bg-lavender-50 border border-lavender-200'
              }`}
            >
              <span className="text-lg">{cuisineIcons[cuisine as keyof typeof cuisineIcons]}</span>
              <span>{cuisine}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          {phases.map((phase) => (
            <button
              key={phase}
              onClick={() => setSelectedPhase(phase)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedPhase === phase
                  ? 'bg-accent-400 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:text-accent-600 hover:bg-lavender-50 border border-lavender-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{phase}</span>
            </button>
          ))}
        </div>

        <div className="bg-lavender-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Heart className="w-4 h-4 text-primary-600" />
            <span className="font-medium text-gray-800">{selectedPhase} Phase</span>
          </div>
          <p className="text-sm text-gray-600">{phaseDescriptions[selectedPhase as keyof typeof phaseDescriptions]}</p>
        </div>
      </div>

      {/* Meal Plan */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-64 space-y-4"
            >
              <div className="relative">
                <RefreshCw className={`w-8 h-8 text-primary-400 ${generating ? 'animate-spin' : ''}`} />
                <Sparkles className="w-4 h-4 text-accent-400 absolute -top-1 -right-1" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-800">Creating your personalized meal plan...</p>
                <p className="text-sm text-gray-600">Tailored to your cycle phase and preferences</p>
              </div>
            </motion.div>
          ) : mealPlan ? (
            <motion.div
              key="mealplan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Meals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <h3 className="font-semibold text-gray-800">Breakfast</h3>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{mealPlan.breakfast}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <h3 className="font-semibold text-gray-800">Lunch</h3>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{mealPlan.lunch}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <h3 className="font-semibold text-gray-800">Dinner</h3>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{mealPlan.dinner}</p>
                </div>
              </div>

              {/* Snacks and Hydration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                    <h3 className="font-semibold text-gray-800">Snacks</h3>
                  </div>
                  <ul className="space-y-1">
                    {mealPlan.snacks.map((snack, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-center space-x-2">
                        <span className="w-1 h-1 bg-pink-400 rounded-full"></span>
                        <span>{snack}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <h3 className="font-semibold text-gray-800">Hydration</h3>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{mealPlan.hydration}</p>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-br from-lavender-50 to-primary-50 rounded-xl p-4 border border-lavender-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary-600" />
                  <h3 className="font-semibold text-gray-800">Smart Tips</h3>
                </div>
                <ul className="space-y-2">
                  {mealPlan.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                      <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Regenerate Button */}
      <div className="mt-6 pt-4 border-t border-lavender-100">
        <button
          onClick={generateMealPlan}
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Regenerate Smart Meal Plan</span>
        </button>
      </div>
    </div>
  );
} 