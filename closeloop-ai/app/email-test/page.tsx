"use client";

import { useState } from "react";

export default function EmailTestPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testEmail = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/send-email/test');
      const data = await response.json();
      setResult({ success: response.ok, data });
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  const testCampaignEmail = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: 'Test Campaign',
          campaignDescription: 'This is a test campaign to verify email functionality',
          productUrl: 'https://example.com',
          productAboutUrl: 'https://example.com/about',
          productPricingUrl: 'https://example.com/pricing',
        }),
      });
      const data = await response.json();
      setResult({ success: response.ok || data.success, data });
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Email Configuration Test</h1>

        <div className="space-y-6">
          {/* Environment Check */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">RESEND_API_KEY:</span>
                <code className="bg-gray-800 px-2 py-1 rounded text-green-400">
                  {process.env.NEXT_PUBLIC_RESEND_API_KEY ? '✅ Set' : '❌ Not Set (This is normal - server-side only)'}
                </code>
              </div>
              <p className="text-gray-500 text-xs mt-2">
                Note: The API key is server-side only and won't show here. Check your .env file.
              </p>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Run Tests</h2>
            <div className="space-y-3">
              <button
                onClick={testEmail}
                disabled={testing}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                {testing ? 'Testing...' : 'Test 1: Simple Email (Resend Test Inbox)'}
              </button>
              <p className="text-xs text-gray-500">
                Sends a test email to delivered@resend.dev (Resend's test inbox)
              </p>

              <button
                onClick={testCampaignEmail}
                disabled={testing}
                className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                {testing ? 'Testing...' : 'Test 2: Campaign Email (Actual Recipients)'}
              </button>
              <p className="text-xs text-gray-500">
                Sends a campaign notification to configured recipients
              </p>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className={`rounded-lg border p-6 ${
              result.success
                ? 'bg-green-900/20 border-green-800'
                : 'bg-red-900/20 border-red-800'
            }`}>
              <h2 className="text-xl font-semibold mb-4">
                {result.success ? '✅ Test Passed' : '❌ Test Failed'}
              </h2>
              <pre className="bg-gray-950 p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(result.data || result.error, null, 2)}
              </pre>

              {!result.success && (
                <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-800 rounded">
                  <h3 className="font-semibold mb-2">Troubleshooting Steps:</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Check that RESEND_API_KEY is set in your .env file</li>
                    <li>Verify the API key is valid in Resend dashboard</li>
                    <li>Restart your development server after editing .env</li>
                    <li>Check the server console/terminal for detailed errors</li>
                    <li>See TROUBLESHOOTING_EMAIL.md for more help</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4">How to Fix Common Issues</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-gray-300 mb-2">1. API Key Not Working:</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
                  <li>Go to <a href="https://resend.com/api-keys" target="_blank" className="text-blue-400 hover:underline">Resend API Keys</a></li>
                  <li>Copy your API key</li>
                  <li>Update .env: <code className="bg-gray-800 px-2 py-0.5 rounded">RESEND_API_KEY=re_your_key</code></li>
                  <li>Restart dev server: <code className="bg-gray-800 px-2 py-0.5 rounded">npm run dev</code></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-300 mb-2">2. Emails Not Delivering:</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
                  <li>Check spam/junk folders</li>
                  <li>Verify email addresses in config/email.config.ts</li>
                  <li>Check <a href="https://resend.com/emails" target="_blank" className="text-blue-400 hover:underline">Resend Dashboard</a> for delivery status</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-300 mb-2">3. Sender Email Issues:</h3>
                <ul className="list-disc list-inside text-gray-400 space-y-1 ml-2">
                  <li>Default: <code className="bg-gray-800 px-2 py-0.5 rounded">onboarding@resend.dev</code> (works for testing)</li>
                  <li>For production: Verify your domain in <a href="https://resend.com/domains" target="_blank" className="text-blue-400 hover:underline">Resend Domains</a></li>
                  <li>Update sender in config/email.config.ts after verification</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Configuration Info */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h2 className="text-xl font-semibold mb-4">Current Configuration</h2>
            <div className="space-y-2 text-sm font-mono">
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-gray-400">Sender:</span>
                <span className="text-green-400">onboarding@resend.dev</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-gray-400">Recipients:</span>
                <div className="text-blue-400">
                  <div>shreyansh.saurabh0107@gmail.com</div>
                  <div>binaryshrey@gmail.com</div>
                </div>
              </div>
              <div className="grid grid-cols-[140px_1fr] gap-2">
                <span className="text-gray-400">Config File:</span>
                <span className="text-gray-300">config/email.config.ts</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800 rounded">
              <p className="text-xs text-yellow-300 font-semibold mb-1">⚠️ Resend Free Tier Note:</p>
              <p className="text-xs text-yellow-200">
                You must verify recipient emails in Resend Dashboard before sending, OR upgrade to a paid plan.
                See <code className="bg-gray-800 px-1 py-0.5 rounded">QUICK_FIX.md</code> for solutions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
