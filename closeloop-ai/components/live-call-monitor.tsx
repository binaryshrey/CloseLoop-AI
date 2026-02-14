"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff, Activity, TrendingUp, AlertCircle } from "lucide-react";

interface TranscriptEntry {
  id: string;
  speaker: 'agent' | 'prospect';
  text: string;
  timestamp: Date;
}

interface AnalysisResult {
  confidenceScore: number;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  signals: string[];
  recommendation: string;
  reasoning: string;
}

interface LiveCallMonitorProps {
  phoneNumber?: string;
  campaignData?: any;
}

export default function LiveCallMonitor({ phoneNumber, campaignData }: LiveCallMonitorProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Call duration timer
  useEffect(() => {
    if (isCallActive && !durationInterval.current) {
      durationInterval.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else if (!isCallActive && durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [isCallActive]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Initiate call
  const initiateCall = async () => {
    const targetNumber = '+13472229576'; // Your phone number

    setIsInitiating(true);
    try {
      // Use the Twilio make-call endpoint for REAL phone calls
      const response = await fetch('/api/twilio/make-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: targetNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setCallSid(data.callSid);
        setIsCallActive(true);
        setCallDuration(0);

        // Show message about real call
        const initialMessage: TranscriptEntry = {
          id: `msg-initial`,
          speaker: 'agent',
          text: `Calling ${targetNumber} from ${data.from}... Phone should be ringing now!`,
          timestamp: new Date(),
        };
        setTranscript([initialMessage]);

        // Note: Real transcript would come from Twilio/ElevenLabs webhooks
        // For now, just show call initiated message
      } else {
        alert(`Failed to initiate call: ${data.error || data.message}`);
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      alert('Failed to initiate call. Check console for details.');
    } finally {
      setIsInitiating(false);
    }
  };

  // End call
  const endCall = () => {
    setIsCallActive(false);
    setCallDuration(0);
  };

  // Simulate transcript for demo (replace with WebSocket in production)
  const simulateTranscript = () => {
    const demoMessages = [
      { speaker: 'agent' as const, text: "Hello! I'm calling from CloseLoop AI. How are you today?" },
      { speaker: 'prospect' as const, text: "Hi, I'm doing well, thanks. What can I do for you?" },
      { speaker: 'agent' as const, text: "I wanted to share information about our AI-powered sales automation platform that can help increase your conversion rates by up to 40%." },
      { speaker: 'prospect' as const, text: "That sounds interesting. Tell me more about how it works." },
      { speaker: 'agent' as const, text: "Our platform uses AI to analyze customer interactions in real-time, providing insights and recommendations to your sales team." },
      { speaker: 'prospect' as const, text: "Hmm, we're already using a CRM system. How would this integrate with what we have?" },
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < demoMessages.length) {
        const message = demoMessages[index];
        const entry: TranscriptEntry = {
          id: `msg-${Date.now()}-${index}`,
          speaker: message.speaker,
          text: message.text,
          timestamp: new Date(),
        };

        setTranscript((prev) => [...prev, entry]);

        // Analyze after each message
        analyzeTranscript(entry, demoMessages.slice(0, index + 1));

        index++;
      } else {
        clearInterval(interval);
      }
    }, 3000);
  };

  // Analyze transcript with Claude
  const analyzeTranscript = async (entry: TranscriptEntry, history: any[]) => {
    try {
      const response = await fetch('/api/analyze/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: entry.text,
          speaker: entry.speaker,
          conversationHistory: history,
        }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        setCurrentAnalysis(data.analysis);
      }
    } catch (error) {
      console.error('Error analyzing transcript:', error);
    }
  };

  // Get confidence color
  const getConfidenceColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'POSITIVE') return 'text-green-400';
    if (sentiment === 'NEUTRAL') return 'text-gray-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Call Controls */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Call Control</h3>
            <p className="text-sm text-gray-400">
              {phoneNumber || 'No phone number provided'}
            </p>
          </div>

          {isCallActive ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-green-400">
                <Activity className="h-5 w-5 animate-pulse" />
                <span className="text-sm font-medium">{formatDuration(callDuration)}</span>
              </div>
              <button
                onClick={endCall}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <PhoneOff className="h-4 w-4" />
                End Call
              </button>
            </div>
          ) : (
            <button
              onClick={initiateCall}
              disabled={isInitiating || !phoneNumber}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Phone className="h-4 w-4" />
              {isInitiating ? 'Calling...' : 'Start Call'}
            </button>
          )}
        </div>

        {callSid && (
          <p className="text-xs text-gray-500">Call SID: {callSid}</p>
        )}
      </div>

      {/* Live Analysis Dashboard */}
      {isCallActive && currentAnalysis && (
        <div className="grid grid-cols-2 gap-4">
          {/* Confidence Score */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <h4 className="text-sm font-medium text-gray-300">Confidence Score</h4>
            </div>
            <div className={`text-4xl font-bold ${getConfidenceColor(currentAnalysis.confidenceScore)}`}>
              {currentAnalysis.confidenceScore}%
            </div>
            <p className="text-xs text-gray-500 mt-2">{currentAnalysis.reasoning}</p>
          </div>

          {/* Sentiment */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-5 w-5 text-purple-400" />
              <h4 className="text-sm font-medium text-gray-300">Sentiment</h4>
            </div>
            <div className={`text-2xl font-bold ${getSentimentColor(currentAnalysis.sentiment)}`}>
              {currentAnalysis.sentiment}
            </div>
            <p className="text-xs text-gray-500 mt-2">{currentAnalysis.recommendation}</p>
          </div>
        </div>
      )}

      {/* Key Signals */}
      {isCallActive && currentAnalysis && currentAnalysis.signals.length > 0 && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <h4 className="text-sm font-medium text-gray-300">Key Signals</h4>
          </div>
          <ul className="space-y-2">
            {currentAnalysis.signals.map((signal, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-400">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Live Transcript */}
      {isCallActive && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="h-5 w-5 text-blue-400" />
            <h4 className="text-sm font-medium text-gray-300">Live Transcript</h4>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transcript.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Waiting for conversation to start...
              </p>
            ) : (
              transcript.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex flex-col gap-1 ${
                    entry.speaker === 'agent' ? 'items-start' : 'items-end'
                  }`}
                >
                  <span className="text-xs text-gray-500">
                    {entry.speaker === 'agent' ? 'AI Agent' : 'Prospect'}
                  </span>
                  <div
                    className={`px-4 py-2 rounded-lg max-w-[80%] ${
                      entry.speaker === 'agent'
                        ? 'bg-blue-900/30 text-blue-100'
                        : 'bg-gray-800 text-gray-100'
                    }`}
                  >
                    <p className="text-sm">{entry.text}</p>
                  </div>
                  <span className="text-xs text-gray-600">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
