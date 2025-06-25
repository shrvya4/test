'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BookOpen, Calendar, Users, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  journal: string;
  publicationDate: string;
  doi?: string;
  url?: string;
}

interface ResearchSummary {
  date: string;
  condition: string;
  papers: ResearchPaper[];
  totalCount: number;
  lastUpdated: any;
}

interface OverallSummary {
  date: string;
  totalConditions: number;
  totalPapers: number;
  conditions: string[];
  lastUpdated: any;
}

const ResearchSummary: React.FC = () => {
  const [latestSummary, setLatestSummary] = useState<OverallSummary | null>(null);
  const [conditionSummaries, setConditionSummaries] = useState<ResearchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedConditions, setExpandedConditions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchLatestResearch();
  }, []);

  const fetchLatestResearch = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the latest overall summary
      const summariesRef = collection(db, 'weeklyResearchSummaries');
      const q = query(summariesRef, orderBy('date', 'desc'), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No research summaries found. The weekly research fetch may not have run yet.');
        setLoading(false);
        return;
      }

      const latestDoc = querySnapshot.docs[0];
      const overallSummary = latestDoc.data() as OverallSummary;
      setLatestSummary(overallSummary);

      // Get individual condition summaries
      const conditionSummariesData: ResearchSummary[] = [];
      
      for (const condition of overallSummary.conditions) {
        const conditionDoc = await getDoc(
          doc(db, 'weeklyResearchSummaries', latestDoc.id, 'conditions', condition.toLowerCase())
        );
        
        if (conditionDoc.exists()) {
          conditionSummariesData.push(conditionDoc.data() as ResearchSummary);
        }
      }

      setConditionSummaries(conditionSummariesData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching research summaries:', err);
      setError('Failed to load research summaries. Please try again later.');
      setLoading(false);
    }
  };

  const toggleCondition = (condition: string) => {
    const newExpanded = new Set(expandedConditions);
    if (newExpanded.has(condition)) {
      newExpanded.delete(condition);
    } else {
      newExpanded.add(condition);
    }
    setExpandedConditions(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateAbstract = (abstract: string, maxLength: number = 200) => {
    if (abstract.length <= maxLength) return abstract;
    return abstract.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        <span className="ml-3 text-gray-600">Loading latest research...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <BookOpen className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Research Summary Unavailable</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!latestSummary) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <BookOpen className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No Research Data Available</h3>
            <p className="mt-1 text-sm text-yellow-700">
              Research summaries will appear here once the weekly fetch runs (every Monday).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 border border-pink-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Smart Research Summary
            </h2>
            <p className="text-gray-600">
              Latest research papers on PCOS, Thyroid, and Endometriosis
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(latestSummary.date)}
            </div>
            <div className="text-lg font-semibold text-pink-600">
              {latestSummary.totalPapers} new papers
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-pink-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-pink-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Papers</p>
              <p className="text-lg font-semibold text-gray-900">{latestSummary.totalPapers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Conditions</p>
              <p className="text-lg font-semibold text-gray-900">{latestSummary.totalConditions}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-sm font-semibold text-gray-900">
                {latestSummary.lastUpdated?.toDate?.()?.toLocaleDateString() || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Condition Summaries */}
      <div className="space-y-4">
        {conditionSummaries.map((summary) => (
          <div key={summary.condition} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggleCondition(summary.condition)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {summary.condition}
                </h3>
                <span className="ml-3 px-2 py-1 text-xs font-medium bg-pink-100 text-pink-800 rounded-full">
                  {summary.totalCount} papers
                </span>
              </div>
              {expandedConditions.has(summary.condition) ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            
            {expandedConditions.has(summary.condition) && (
              <div className="px-6 pb-4 border-t border-gray-100">
                <div className="space-y-4 mt-4">
                  {summary.papers.map((paper) => (
                    <div key={paper.id} className="border-l-4 border-pink-200 pl-4">
                      <h4 className="font-medium text-gray-900 mb-2">{paper.title}</h4>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Authors:</span> {paper.authors.join(', ')}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Journal:</span> {paper.journal}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Published:</span> {formatDate(paper.publicationDate)}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">
                        {truncateAbstract(paper.abstract)}
                      </p>
                      <div className="flex space-x-2">
                        {paper.url && (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-pink-700 bg-pink-100 rounded-md hover:bg-pink-200 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Read Paper
                          </a>
                        )}
                        {paper.doi && (
                          <a
                            href={`https://doi.org/${paper.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                          >
                            DOI
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchLatestResearch}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-pink-700 bg-pink-100 rounded-md hover:bg-pink-200 transition-colors"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Refresh Research Data
        </button>
      </div>
    </div>
  );
};

export default ResearchSummary; 