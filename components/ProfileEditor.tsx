'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { User, Save, Edit3, X } from 'lucide-react';

interface UserProfile {
  age: string;
  diagnosis: string[];
  symptoms: string[];
  lastPeriod: string | Date;
  periodDuration: number;
  irregularPeriods: boolean;
  stressLevel: string;
  sleepQuality: string;
  otherDiagnosis?: string;
  otherSymptoms?: string;
  name?: string;
  email?: string;
}

export default function ProfileEditor() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserProfile>({
    age: '',
    diagnosis: [],
    symptoms: [],
    lastPeriod: new Date(),
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

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsub = onSnapshot(doc(db, 'users', user.uid), (userDoc) => {
      if (userDoc.exists()) {
        const data = userDoc.data() as any;
        let lastPeriodDate = new Date();
        if (data.lastPeriod) {
          try {
            lastPeriodDate = new Date(data.lastPeriod);
            if (isNaN(lastPeriodDate.getTime())) {
              lastPeriodDate = new Date();
            }
          } catch (error) {
            lastPeriodDate = new Date();
          }
        }
        const processedData: UserProfile = {
          ...data,
          lastPeriod: lastPeriodDate,
          diagnosis: data.diagnosis || [],
          symptoms: data.symptoms || [],
          age: data.age || '',
          periodDuration: data.periodDuration || 5,
          irregularPeriods: data.irregularPeriods || false,
          stressLevel: data.stressLevel || '',
          sleepQuality: data.sleepQuality || '',
        };
        setProfile(processedData);
        setFormData(processedData);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleInputChange = (field: keyof UserProfile, value: any) => {
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

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Convert Date object to string for Firebase storage
      const dataToSave = {
        ...formData,
        lastPeriod: formData.lastPeriod instanceof Date ? formData.lastPeriod.toISOString() : formData.lastPeriod,
        updatedAt: new Date(),
      };

      await updateDoc(doc(db, 'users', user.uid), dataToSave);
      
      setProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-primary-400 to-accent-400 p-2 rounded-full">
            <User className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Health Profile</h2>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData(profile || formData);
              }}
              className="btn-secondary flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Age Group</h3>
                <p className="text-gray-900">{profile?.age || 'Not specified'}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Stress Level</h3>
                <p className="text-gray-900">{profile?.stressLevel || 'Not specified'}</p>
              </div>
            </div>

            {/* Health Conditions */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Health Conditions</h3>
              <div className="flex flex-wrap gap-2">
                {profile?.diagnosis.length ? (
                  profile.diagnosis.map((condition) => (
                    <span
                      key={condition}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                    >
                      {condition}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No conditions specified</p>
                )}
              </div>
            </div>

            {/* Symptoms */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Symptoms</h3>
              <div className="flex flex-wrap gap-2">
                {profile?.symptoms.length ? (
                  profile.symptoms.map((symptom) => (
                    <span
                      key={symptom}
                      className="px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-sm"
                    >
                      {symptom}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No symptoms specified</p>
                )}
              </div>
            </div>

            {/* Cycle Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Last Period</h3>
                <p className="text-gray-900">
                  {profile?.lastPeriod ? 
                    (profile.lastPeriod instanceof Date ? 
                      profile.lastPeriod.toLocaleDateString() : 
                      new Date(profile.lastPeriod).toLocaleDateString()
                    ) : 'Not specified'}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Period Duration</h3>
                <p className="text-gray-900">{profile?.periodDuration || 'Not specified'} days</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Irregular Periods</h3>
                <p className="text-gray-900">{profile?.irregularPeriods ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Sleep Quality */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Sleep Quality</h3>
              <p className="text-gray-900">{profile?.sleepQuality || 'Not specified'}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Age Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Age Group
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ageGroups.map((age) => (
                  <label key={age} className="flex items-center p-3 border border-lavender-200 rounded-xl cursor-pointer hover:bg-lavender-50 transition-colors">
                    <input
                      type="radio"
                      name="age"
                      value={age}
                      checked={formData.age === age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="radio-custom mr-3"
                    />
                    <span className="text-sm">{age}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Health Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Health Conditions
              </label>
              <div className="space-y-3">
                {diagnoses.map((diagnosis) => (
                  <label key={diagnosis} className="flex items-center p-3 border border-lavender-200 rounded-xl cursor-pointer hover:bg-lavender-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.diagnosis.includes(diagnosis)}
                      onChange={() => handleCheckboxChange('diagnosis', diagnosis)}
                      className="checkbox-custom mr-3"
                    />
                    <span className="text-sm">{diagnosis}</span>
                  </label>
                ))}
              </div>
              {formData.diagnosis.includes('Other') && (
                <input
                  type="text"
                  placeholder="Please specify..."
                  value={formData.otherDiagnosis || ''}
                  onChange={(e) => handleInputChange('otherDiagnosis', e.target.value)}
                  className="input-field mt-3"
                />
              )}
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Symptoms
              </label>
              <div className="space-y-3">
                {symptoms.map((symptom) => (
                  <label key={symptom} className="flex items-center p-3 border border-lavender-200 rounded-xl cursor-pointer hover:bg-lavender-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.symptoms.includes(symptom)}
                      onChange={() => handleCheckboxChange('symptoms', symptom)}
                      className="checkbox-custom mr-3"
                    />
                    <span className="text-sm">{symptom}</span>
                  </label>
                ))}
              </div>
              {formData.symptoms.includes('Other') && (
                <input
                  type="text"
                  placeholder="Please specify..."
                  value={formData.otherSymptoms || ''}
                  onChange={(e) => handleInputChange('otherSymptoms', e.target.value)}
                  className="input-field mt-3"
                />
              )}
            </div>

            {/* Cycle Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Last Period
                </label>
                <DatePicker
                  selected={(() => {
                    try {
                      if (formData.lastPeriod instanceof Date) {
                        return isNaN(formData.lastPeriod.getTime()) ? new Date() : formData.lastPeriod;
                      }
                      const date = new Date(formData.lastPeriod);
                      return isNaN(date.getTime()) ? new Date() : date;
                    } catch (error) {
                      return new Date();
                    }
                  })()}
                  onChange={(date) => handleInputChange('lastPeriod', date)}
                  className="input-field"
                  placeholderText="Select date"
                  maxDate={new Date()}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Period Duration (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={formData.periodDuration}
                  onChange={(e) => handleInputChange('periodDuration', parseInt(e.target.value))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Irregular Periods
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="irregularPeriods"
                      checked={formData.irregularPeriods === true}
                      onChange={() => handleInputChange('irregularPeriods', true)}
                      className="radio-custom mr-2"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="irregularPeriods"
                      checked={formData.irregularPeriods === false}
                      onChange={() => handleInputChange('irregularPeriods', false)}
                      className="radio-custom mr-2"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Stress and Sleep */}
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
        )}
      </AnimatePresence>
    </div>
  );
} 