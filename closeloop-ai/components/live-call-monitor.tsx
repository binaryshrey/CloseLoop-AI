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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const analysisQueueRef = useRef<boolean>(false);

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

  // Set up Server-Sent Events connection for real-time transcripts
  useEffect(() => {
    if (callSid && isCallActive) {
      console.log('Establishing SSE connection for call:', callSid);
      
      const eventSource = new EventSource(`/api/transcript/stream?callSid=${callSid}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE message received:', data);

          if (data.type === 'connected') {
            console.log('Connected to transcript stream');
          } else if (data.type === 'transcript' && data.data) {
            const entry: TranscriptEntry = {
              ...data.data,
              timestamp: new Date(data.data.timestamp),
            };
            
            setTranscript((prev) => [...prev, entry]);
            
            // Trigger analysis for each new transcript entry
            analyzeTranscriptRealtime(entry);
          } else if (data.type === 'call_ended') {
            console.log('Call ended via SSE');
            setIsCallActive(false);
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
      };

      return () => {
        console.log('Cleaning up SSE connection');
        eventSource.close();
        eventSourceRef.current = null;
      };
    }
  }, [callSid, isCallActive]);

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
    setTranscript([]); // Clear previous transcript
    setCurrentAnalysis(null); // Clear previous analysis
    
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

        // Show message about call initiation
        const initialMessage: TranscriptEntry = {
          id: `msg-initial`,
          speaker: 'agent',
          text: `📞 Calling ${targetNumber}... The call is being connected with ElevenLabs AI agent. Transcription will appear in real-time.`,
          timestamp: new Date(),
        };
        setTranscript([initialMessage]);
      } else {
        // Show detailed error message
        const errorMsg = data.message || data.error || 'Unknown error';
        const suggestion = data.suggestion || 'Please check your configuration.';
        alert(`⚠️ ${errorMsg}\n\n💡 ${suggestion}`);
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
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsCallActive(false);
    setCallDuration(0);
  };

  // Analyze transcript with Claude in real-time
  const analyzeTranscriptRealtime = async (entry: TranscriptEntry) => {
    // Prevent multiple simultaneous analyses
    if (analysisQueueRef.current) {
      return;
    }

    analysisQueueRef.current = true;
    setIsAnalyzing(true);

    try {
      // Get conversation history
      const history = transcript.map(t => ({
        speaker: t.speaker,
        text: t.text,
      }));

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
    } finally {
      setIsAnalyzing(false);
      analysisQueueRef.current = false;
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
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
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
            <div className="flex items-center gap-2">
              <button
                onClick={initiateTestCall}
                disabled={isInitiating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Activity className="h-4 w-4" />
                {isInitiating ? 'Starting...' : 'Demo Mode'}
              </button>
              <button
                onClick={initiateCall}
                disabled={isInitiating || !phoneNumber}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Phone className="h-4 w-4" />
                {isInitiating ? 'Calling...' : 'Start Real Call'}
              </button>
            </div>
          )}
        </div>
button
              onClick={initiateCall}
              disabled={isInitiating || !phoneNumber}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Phone className="h-4 w-4" />
              {isInitiating ? 'Calling...' : 'Start Call'}
            </button/div>
              )}
            </div>
            {currentAnalysis ? (
              <>
                <div className={`text-4xl font-bold ${getConfidenceColor(currentAnalysis.confidenceScore)}`}>
                  {currentAnalysis.confidenceScore}%
                </div>
                <p className="text-xs text-gray-500 mt-2">{currentAnalysis.reasoning}</p>
              </>
            ) : (
              <div className="text-2xl text-gray-600">
                Analyzing...
              </div>
            )}
          </div>

          {/* Sentiment */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-5 w-5 text-purple-400" />
              <h4 className="text-sm font-medium text-gray-300">Sentiment</h4>
            </div>
            {currentAnalysis ? (
              <>
                <div className={`text-2xl font-bold ${getSentimentColor(currentAnalysis.sentiment)}`}>
                  {currentAnalysis.sentiment}
                </div>
                <p className="text-xs text-gray-500 mt-2">{currentAnalysis.recommendation}</p>
              </>
            ) : (
              <div className="text-lg text-gray-600">
                Waiting...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Signals */}
      {isCallActive && currentAnalysis && currentAnalysis.signals.length > 0 && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
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
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mic className="h-5 w-5 text-orange-400" />
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
                        ? 'bg-orange-900/30 text-orange-100'
                        : 'bg-zinc-800 text-gray-100'
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
