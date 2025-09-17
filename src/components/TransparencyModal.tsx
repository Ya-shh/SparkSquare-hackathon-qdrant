"use client";

import { useState, useEffect } from 'react';
import { FiX, FiInfo, FiDatabase, FiCpu, FiZap, FiSearch, FiShield } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface TransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedType: string;
}

export default function TransparencyModal({ isOpen, onClose, feedType }: TransparencyModalProps) {
  const [explanation, setExplanation] = useState(null);
  const [qdrantStats, setQdrantStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && feedType) {
      fetchTransparencyData();
    }
  }, [isOpen, feedType]);

  const fetchTransparencyData = async () => {
    setLoading(true);
    try {
      const [explanationResponse, statsResponse] = await Promise.all([
        fetch(`/api/recommendation-explanation?feedType=${feedType}`),
        fetch('/api/statistics')
      ]);
      
      const explanationData = await explanationResponse.json();
      const statsData = await statsResponse.json();
      
      setExplanation(explanationData);
      setQdrantStats(statsData.qdrantStats);
    } catch (error) {
      console.error('Error fetching transparency data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiInfo className="w-6 h-6 text-blue-400" />
                <div>
                  <h2 className="text-xl font-bold text-white">How This Works</h2>
                  <p className="text-gray-400 text-sm">Transparency into AI-powered recommendations</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              <p className="mt-4 text-gray-400">Loading transparency data...</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {explanation && (
                <>
                  {/* Feed Explanation */}
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <FiZap className="w-5 h-5 mr-2 text-yellow-400" />
                      {explanation.explanation.title}
                    </h3>
                    <p className="text-gray-300 mb-4">{explanation.explanation.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-white mb-2">Algorithm Used:</h4>
                        <p className="text-sm text-blue-400 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                          {explanation.explanation.algorithm}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-2">Score Threshold:</h4>
                        <p className="text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                          {explanation.explanation.scoreThreshold} similarity score
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium text-white mb-2">Ranking Factors:</h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        {explanation.explanation.factors.map((factor, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-gray-300">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                            <span>{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Vector Search Details */}
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <FiDatabase className="w-5 h-5 mr-2 text-purple-400" />
                      Vector Search Technology
                    </h3>
                    
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                        <h4 className="font-medium text-purple-400 mb-1">Embedding Model</h4>
                        <p className="text-sm text-gray-300">{explanation.vectorSearchDetails.embeddingModel}</p>
                      </div>
                      <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                        <h4 className="font-medium text-purple-400 mb-1">Similarity Metric</h4>
                        <p className="text-sm text-gray-300">{explanation.vectorSearchDetails.similarityMetric}</p>
                      </div>
                      <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                        <h4 className="font-medium text-purple-400 mb-1">Search Latency</h4>
                        <p className="text-sm text-gray-300">{explanation.technicalDetails.searchLatency}</p>
                      </div>
                    </div>

                    <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/20">
                      <h4 className="font-medium text-indigo-400 mb-2">How it works:</h4>
                      <p className="text-sm text-gray-300">{explanation.explanation.qdrantUsage}</p>
                    </div>
                  </div>

                  {/* Real-time Statistics */}
                  {qdrantStats && (
                    <div className="bg-gray-800/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                        <FiCpu className="w-5 h-5 mr-2 text-green-400" />
                        Live System Status
                      </h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-white mb-2">Vector Database Status:</h4>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${qdrantStats.status === 'ready' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span className={`text-sm ${qdrantStats.status === 'ready' ? 'text-green-400' : 'text-red-400'}`}>
                              {qdrantStats.status === 'ready' ? 'Online & Ready' : 'Offline'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-2">Total Vectorized Content:</h4>
                          <span className="text-sm text-blue-400">{qdrantStats.totalVectors || 0} items</span>
                        </div>
                      </div>

                      {qdrantStats.collections && (
                        <div className="mt-4">
                          <h4 className="font-medium text-white mb-2">Collections:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.entries(qdrantStats.collections).map(([name, stats]) => (
                              <div key={name} className="bg-gray-700/50 rounded-lg p-3">
                                <div className="text-xs font-medium text-gray-400 uppercase">{name}</div>
                                <div className="text-sm text-white">{stats.points || 0} vectors</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Privacy & Data Usage */}
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <FiShield className="w-5 h-5 mr-2 text-emerald-400" />
                      Privacy & Data Usage
                    </h3>
                    
                    <div className="space-y-3 text-sm text-gray-300">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2"></div>
                        <div>
                          <span className="font-medium text-white">Personal Data Used: </span>
                          {explanation.dataPrivacy.personalDataUsed}
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2"></div>
                        <div>
                          <span className="font-medium text-white">Data Retention: </span>
                          {explanation.dataPrivacy.dataRetention}
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2"></div>
                        <div>
                          <span className="font-medium text-white">Opt-out Available: </span>
                          {explanation.dataPrivacy.optOut}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <p className="text-sm text-blue-300">{explanation.transparencyNote}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
