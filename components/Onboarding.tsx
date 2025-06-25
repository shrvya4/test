'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ArrowRight, ArrowLeft, Save } from 'lucide-react';

interface OnboardingData {
  age: string;
  diagnosis: string[];
  symptoms: string[];
  lastPeriod: Date;
  cycleLength: number;
  periodDuration: number;
  irregularPeriods: boolean;
  stressLevel: string;
  sleepQuality: string;
  otherDiagnosis?: string;
  otherSymptoms?: string;
}

export default function Onboarding() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    age: '',
    diagnosis: [],
    symptoms: [],
    lastPeriod: new Date(),
    cycleLength: 28,
    periodDuration: 5,
    irregularPeriods: false,
    stressLevel: '',
    sleepQuality: '',
  });

  const ageGroups = [
    'Below 18', '18–25', '25–35', '35–45', '45–55', '55+'
  ];

  const diagnoses = [
    'PCOS', 'PCOD', 'Endometriosis', 'Thyroid', 'Other'
  ];

  const symptoms = [
    'Irregular periods', 'Acne', 'Fatigue', 'Hair fall', 
    'Mood swings', 'Weight gain', 'Other'
  ];

  const stressLevels = ['Low', 'Medium', 'High'];
  const sleepQualities = ['Poor', 'Fair', 'Good', 'Excellent'];

  const handleInputChange = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field: 'diagnosis' | 'symptoms', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Save to Firebase
      await setDoc(doc(db, 'users', user.uid), {
        ...formData,
        lastPeriod: formData.lastPeriod.toISOString(),
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        // Redirect to dashboard or show success message
        window.location.href = '/';
      }, 2000);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.age !== '';
      case 2:
        return formData.diagnosis.length > 0;
      case 3:
        return formData.symptoms.length > 0;
      case 4:
        return formData.lastPeriod && formData.cycleLength > 0;
      case 5:
        return formData.stressLevel !== '' && formData.sleepQuality !== '';
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Your Health Journey</h2>
              <p className="text-gray-600">Let's personalize your experience by understanding your health profile</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                What's your age group?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ageGroups.map((age) => (
                  <label key={age} className="flex items-center p-4 border border-lavender-200 rounded-xl cursor-pointer hover:bg-lavender-50 transition-colors">
                    <input
                      type="radio"
                      name="age"
                      value={age}
                      checked={formData.age === age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="radio-custom mr-3"
                    />
                    <span className="text-sm font-medium">{age}</span>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Health Conditions</h2>
              <p className="text-gray-600">Select any conditions you've been diagnosed with</p>
            </div>

            <div className="space-y-3">
              {diagnoses.map((diagnosis) => (
                <label key={diagnosis} className="flex items-center p-4 border border-lavender-200 rounded-xl cursor-pointer hover:bg-lavender-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.diagnosis.includes(diagnosis)}
                    onChange={() => handleCheckboxChange('diagnosis', diagnosis)}
                    className="checkbox-custom mr-3"
                  />
                  <span className="text-sm font-medium">{diagnosis}</span>
                </label>
              ))}
            </div>

            {formData.diagnosis.includes('Other') && (
              <input
                type="text"
                placeholder="Please specify your condition..."
                value={formData.otherDiagnosis || ''}
                onChange={(e) => handleInputChange('otherDiagnosis', e.target.value)}
                className="input-field"
              />
            )}
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Symptoms</h2>
              <p className="text-gray-600">Select symptoms you commonly experience</p>
            </div>

            <div className="space-y-3">
              {symptoms.map((symptom) => (
                <label key={symptom} className="flex items-center p-4 border border-lavender-200 rounded-xl cursor-pointer hover:bg-lavender-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.symptoms.includes(symptom)}
                    onChange={() => handleCheckboxChange('symptoms', symptom)}
                    className="checkbox-custom mr-3"
                  />
                  <span className="text-sm font-medium">{symptom}</span>
                </label>
              ))}
            </div>

            {formData.symptoms.includes('Other') && (
              <input
                type="text"
                placeholder="Please specify your symptoms..."
                value={formData.otherSymptoms || ''}
                onChange={(e) => handleInputChange('otherSymptoms', e.target.value)}
                className="input-field"
              />
            )}
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Period Tracking</h2>
              <p className="text-gray-600">Help us understand your menstrual cycle for personalized recommendations</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  When did your last period start?
                </label>
                <input
                  type="date"
                  value={formData.lastPeriod.toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange('lastPeriod', new Date(e.target.value))}
                  className="input-field w-full"
                  max={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">This helps us calculate your current cycle phase</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Do you have regular periods?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center p-4 border border-lavender-200 rounded-xl cursor-pointer hover:bg-lavender-50 transition-colors">
                    <input
                      type="radio"
                      name="irregularPeriods"
                      value="false"
                      checked={formData.irregularPeriods === false}
                      onChange={() => handleInputChange('irregularPeriods', false)}
                      className="radio-custom mr-3"
                    />
                    <span className="text-sm font-medium">Yes, regular</span>
                  </label>
                  <label className="flex items-center p-4 border border-lavender-200 rounded-xl cursor-pointer hover:bg-lavender-50 transition-colors">
                    <input
                      type="radio"
                      name="irregularPeriods"
                      value="true"
                      checked={formData.irregularPeriods === true}
                      onChange={() => handleInputChange('irregularPeriods', true)}
                      className="radio-custom mr-3"
                    />
                    <span className="text-sm font-medium">No, irregular</span>
                  </label>
                </div>
              </div>

              {formData.irregularPeriods === false && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What's your typical cycle length? (days)
                  </label>
                  <input
                    type="number"
                    min="21"
                    max="35"
                    value={formData.cycleLength}
                    onChange={(e) => handleInputChange('cycleLength', Number(e.target.value))}
                    className="input-field w-full"
                    placeholder="28"
                  />
                  <p className="text-xs text-gray-500 mt-1">Most women have cycles between 21-35 days</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How long do your periods typically last? (days)
                </label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={formData.periodDuration}
                  onChange={(e) => handleInputChange('periodDuration', Number(e.target.value))}
                  className="input-field w-full"
                  placeholder="5"
                />
                <p className="text-xs text-gray-500 mt-1">Typical period duration is 3-7 days</p>
              </div>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Lifestyle & Wellness</h2>
              <p className="text-gray-600">Help us understand your current lifestyle factors</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Stress Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {stressLevels.map((level) => (
                    <label key={level} className="flex items-center p-3 border border-lavender-200 rounded-xl cursor-pointer hover:bg-lavender-50 transition-colors">
                      <input
                        type="radio"
                        name="stressLevel"
                        value={level}
                        checked={formData.stressLevel === level}
                        onChange={(e) => handleInputChange('stressLevel', e.target.value)}
                        className="radio-custom mr-2"
                      />
                      <span className="text-sm">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sleep Quality
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {sleepQualities.map((quality) => (
                    <label key={quality} className="flex items-center p-3 border border-lavender-200 rounded-xl cursor-pointer hover:bg-lavender-50 transition-colors">
                      <input
                        type="radio"
                        name="sleepQuality"
                        value={quality}
                        checked={formData.sleepQuality === quality}
                        onChange={(e) => handleInputChange('sleepQuality', e.target.value)}
                        className="radio-custom mr-2"
                      />
                      <span className="text-sm">{quality}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            key="step6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">You're All Set!</h2>
              <p className="text-gray-600">Review your information and save to get started</p>
            </div>

            <div className="bg-lavender-50 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Age Group</h3>
                  <p className="text-gray-600">{formData.age}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Health Conditions</h3>
                  <div className="flex flex-wrap gap-1">
                    {formData.diagnosis.map((condition) => (
                      <span key={condition} className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs">
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-800 mb-2">Symptoms</h3>
                <div className="flex flex-wrap gap-1">
                  {formData.symptoms.map((symptom) => (
                    <span key={symptom} className="px-2 py-1 bg-accent-100 text-accent-700 rounded-full text-xs">
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Period Data</h3>
                  <p className="text-gray-600">
                    Last period: {formData.lastPeriod.toLocaleDateString()}<br/>
                    Cycle length: {formData.cycleLength} days<br/>
                    Period duration: {formData.periodDuration} days<br/>
                    Regular periods: {formData.irregularPeriods ? 'No' : 'Yes'}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">Lifestyle</h3>
                  <p className="text-gray-600">
                    Stress level: {formData.stressLevel}<br/>
                    Sleep quality: {formData.sleepQuality}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 to-primary-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="card">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Step {currentStep} of 6</span>
              <span className="text-sm font-medium text-gray-600">{Math.round((currentStep / 6) * 100)}%</span>
            </div>
            <div className="w-full bg-lavender-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-primary-400 to-accent-400 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / 6) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-lavender-100">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentStep < 6 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save & Continue'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 