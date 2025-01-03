"use client";

import { Copy, RefreshCw, AlertCircle, Bug, Home, ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [copied, setCopied] = useState(false);

  // Comprehensive error information
  const errorInfo = useMemo(() => ({
    name: error.name,
    message: error.message,
    stack: error.stack,
    digest: error.digest,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
    platform: typeof window !== 'undefined' ? window.navigator.platform : '',
    viewport: typeof window !== 'undefined' ? {
      width: window.innerWidth,
      height: window.innerHeight,
    } : null,
    browserInfo: typeof window !== 'undefined' ? {
      language: window.navigator.language,
      cookiesEnabled: window.navigator.cookieEnabled,
      onLine: window.navigator.onLine,
    } : null,
  }), [
    error.name,
    error.message,
    error.stack,
    error.digest,
  ]);
  // Console logging
  useEffect(() => {
    console.group('🔥 Error Details');
    console.error('Error Object:', error);
    console.error('Full Error Info:', errorInfo);
    console.error('Stack Trace:', error.stack);
    console.table({
      'Error Name': error.name,
      'Error Message': error.message,
      'Error ID': error.digest || 'Unknown',
      'Timestamp': errorInfo.timestamp,
      'URL': errorInfo.url,
    });
    console.groupEnd();

    // You could also send this to your error tracking service
    // sendToErrorTracking(errorInfo);
  }, [error, errorInfo]);

  const copyError = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy error details:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 shadow-2xl border border-gray-700">
        {/* Error Header */}
        <div className="flex items-center justify-center space-x-3 mb-6">
          <AlertCircle className="w-8 h-8 text-red-500 animate-pulse" />
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
            Error Detected
          </h2>
        </div>

        {/* Error Message */}
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-300 font-mono break-all">{error.message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <button
            onClick={() => reset()}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-blue-500/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all duration-200"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </button>

          <button
            onClick={() => setShowConsole(!showConsole)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all duration-200"
          >
            <Terminal className="w-4 h-4" />
            <span>Toggle Console</span>
          </button>
        </div>

        {/* Console Output */}
        {showConsole && (
          <div className="mb-6">
            <div className="bg-black rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
              <div className="space-y-2">
                <div className="text-blue-400">{'>'} console.error('Error Object:')</div>
                <div className="text-red-400">{JSON.stringify(error, null, 2)}</div>
                <div className="text-blue-400">{'>'} console.error('Stack Trace:')</div>
                <div className="text-red-400 whitespace-pre-wrap">{error.stack}</div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Error Information */}
        <div className="space-y-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between px-4 py-2 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-all duration-200"
          >
            <div className="flex items-center space-x-2">
              <Bug className="w-4 h-4" />
              <span>Technical Details</span>
            </div>
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="relative">
              <pre className="bg-black/50 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
                {JSON.stringify(errorInfo, null, 2)}
              </pre>
              <button
                onClick={copyError}
                className={`absolute top-2 right-2 p-2 rounded-md transition-all duration-200 ${
                  copied ? 'bg-green-500' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Copy error details"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Error ID Footer */}
        <div className="mt-6 text-center text-sm text-gray-400">
          Error ID: {error.digest || 'Unknown'} | Timestamp: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
}