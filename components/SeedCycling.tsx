'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Clock, Zap, Heart } from 'lucide-react';

interface UserProfile {
  lastPeriod?: string;
  cycleLength?: number;
  diagnosis?: string[];
  symptoms?: string[];
  irregularPeriods?: boolean;
}

interface SeedCyclingProps {
  userProfile: UserProfile | null;
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

const SeedCycling: React.FC<SeedCyclingProps> = ({ userProfile }) => {
  // Check for required data
  const missingFields = [];
  if (!userProfile?.lastPeriod) missingFields.push('the start date of your last period');
  if (userProfile?.irregularPeriods === undefined) missingFields.push('whether your cycles are regular or irregular');
  if (!userProfile?.cycleLength && userProfile?.irregularPeriods === false) missingFields.push('your typical cycle length');

  const getCurrentPhase = () => {
    if (userProfile?.irregularPeriods) {
      // Use lunar cycle
      const lunarDay = getLunarDay();
      if (lunarDay < 7) return 'Menstrual';
      if (lunarDay < 14) return 'Follicular';
      if (lunarDay < 21) return 'Ovulatory';
      return 'Luteal';
    }
    if (!userProfile?.lastPeriod || !userProfile?.cycleLength) return 'Unknown';
    const daysSinceLastPeriod = Math.floor(
      (new Date().getTime() - new Date(userProfile.lastPeriod).getTime()) / (1000 * 60 * 60 * 24)
    );
    const cycleLength = userProfile.cycleLength;
    // Standard 28-day mapping, but use cycleLength if provided
    if (daysSinceLastPeriod >= 1 && daysSinceLastPeriod <= 5) {
      return 'Menstrual';
    } else if (daysSinceLastPeriod >= 6 && daysSinceLastPeriod <= 14) {
      return 'Follicular';
    } else if (daysSinceLastPeriod >= 15 && daysSinceLastPeriod <= 17) {
      return 'Ovulatory';
    } else if (daysSinceLastPeriod >= 18 && daysSinceLastPeriod <= cycleLength) {
      return 'Luteal';
    }
    return 'Unknown';
  };

  const getPhaseSeeds = (phase: string) => {
    switch (phase) {
      case 'Menstrual':
        return {
          title: 'Menstrual Phase Seeds',
          subtitle: 'Days 1-5: Rest & Nourishment',
          seeds: [
            {
              name: 'Pumpkin Seeds',
              benefits: 'Iron, magnesium, zinc for energy',
              easyWays: [
                'Sprinkle on oatmeal (1 tbsp)',
                'Add to smoothies (1 tbsp)',
                'Mix with yogurt (1 tbsp)',
                'Top on toast with avocado'
              ]
            },
            {
              name: 'Sunflower Seeds',
              benefits: 'Vitamin E, selenium for mood',
              easyWays: [
                'Add to salads (1 tbsp)',
                'Mix with trail mix',
                'Sprinkle on soups',
                'Blend in smoothies'
              ]
            }
          ],
          tips: [
            'Eat 1-2 tbsp daily',
            'Best consumed in the morning',
            'Can be soaked overnight for easier digestion',
            'Pair with vitamin C foods for better absorption'
          ]
        };
      
      case 'Follicular':
        return {
          title: 'Follicular Phase Seeds',
          subtitle: 'Days 6-14: Building Energy',
          seeds: [
            {
              name: 'Flax Seeds',
              benefits: 'Omega-3, fiber for energy building',
              easyWays: [
                'Add to smoothies (1 tbsp ground)',
                'Sprinkle on cereal (1 tbsp)',
                'Mix in yogurt (1 tbsp)',
                'Add to baking recipes'
              ]
            },
            {
              name: 'Pumpkin Seeds',
              benefits: 'Zinc, magnesium for hormone support',
              easyWays: [
                'Add to salads (1 tbsp)',
                'Mix with granola',
                'Sprinkle on avocado toast',
                'Blend in protein shakes'
              ]
            }
          ],
          tips: [
            'Eat 1-2 tbsp daily',
            'Ground flax seeds for better absorption',
            'Great for pre-workout energy',
            'Can be added to any meal'
          ]
        };
      
      case 'Ovulatory':
        return {
          title: 'Ovulatory Phase Seeds',
          subtitle: 'Days 15-17: Peak Energy',
          seeds: [
            {
              name: 'Chia Seeds',
              benefits: 'Protein, omega-3 for peak performance',
              easyWays: [
                'Make chia pudding (2 tbsp + milk)',
                'Add to smoothies (1 tbsp)',
                'Sprinkle on yogurt (1 tbsp)',
                'Mix in overnight oats'
              ]
            },
            {
              name: 'Sesame Seeds',
              benefits: 'Calcium, zinc for strength',
              easyWays: [
                'Add to stir-fries (1 tbsp)',
                'Sprinkle on rice dishes',
                'Mix in tahini sauce',
                'Top on roasted vegetables'
              ]
            }
          ],
          tips: [
            'Eat 1-2 tbsp daily',
            'Perfect for high-energy activities',
            'Great pre-workout addition',
            'Can be soaked for easier digestion'
          ]
        };
      
      case 'Luteal':
        return {
          title: 'Luteal Phase Seeds',
          subtitle: 'Days 18-28: Mood & Preparation',
          seeds: [
            {
              name: 'Pumpkin Seeds',
              benefits: 'Magnesium for mood stability',
              easyWays: [
                'Add to oatmeal (1 tbsp)',
                'Mix with dark chocolate',
                'Sprinkle on warm milk',
                'Add to calming tea'
              ]
            },
            {
              name: 'Flax Seeds',
              benefits: 'Omega-3, fiber for hormone balance',
              easyWays: [
                'Add to smoothies (1 tbsp ground)',
                'Mix in warm porridge',
                'Sprinkle on toast',
                'Add to calming drinks'
              ]
            }
          ],
          tips: [
            'Eat 1-2 tbsp daily',
            'Best consumed in the evening',
            'Great for stress relief',
            'Can help with sleep quality'
          ]
        };
      
      default:
        return {
          title: 'Seed Cycling Guide',
          subtitle: 'Track your cycle to get personalized recommendations',
          seeds: [
            {
              name: 'General Seed Mix',
              benefits: 'Overall hormonal support',
              easyWays: [
                'Mix equal parts of all seeds',
                'Add 1 tbsp to any meal',
                'Sprinkle on yogurt or oatmeal',
                'Blend in smoothies'
              ]
            }
          ],
          tips: [
            'Start with 1 tbsp daily',
            'Gradually increase to 2 tbsp',
            'Listen to your body',
            'Track your cycle for best results'
          ]
        };
    }
  };

  const currentPhase = getCurrentPhase();
  const phaseData = getPhaseSeeds(currentPhase);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 h-[900px] overflow-y-auto">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-2 rounded-full">
          <Sprout className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Seed Cycling</h2>
          <p className="text-sm text-gray-600">Cycle-synced seed recommendations</p>
        </div>
      </div>

      {missingFields.length > 0 ? (
        <div className="text-center py-8">
          <Sprout className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">
            To give you personalized seed cycling advice, could you please share {missingFields.join(', ')}?
          </p>
          <p className="text-sm text-gray-400">
            You can update this information in your profile or let me know in the chat!
          </p>
        </div>
      ) : (
        <>
          {userProfile?.irregularPeriods && (
            <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded text-yellow-800 text-sm">
              Your cycle phase is estimated using the lunar cycle because you reported irregular periods. For best results, try tracking your symptoms and cycle dates.
            </div>
          )}
          {currentPhase !== 'Unknown' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {phaseData.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {phaseData.subtitle}
                </p>
              </div>
              <div className="space-y-4">
                {phaseData.seeds.map((seed, index) => (
                  <motion.div
                    key={seed.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <Zap className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-1">
                          {seed.name}
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          {seed.benefits}
                        </p>
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            Easy Ways to Consume:
                          </h5>
                          <ul className="space-y-1">
                            {seed.easyWays.map((way, wayIndex) => (
                              <li key={wayIndex} className="text-sm text-gray-600 flex items-start">
                                <span className="text-green-500 mr-2">•</span>
                                {way}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Heart className="w-4 h-4 mr-1 text-blue-500" />
                  Pro Tips:
                </h5>
                <ul className="space-y-1">
                  {phaseData.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="text-sm text-gray-600 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : null}
        </>
      )}
    </div>
  );
};

export default SeedCycling; 