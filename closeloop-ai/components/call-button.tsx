'use client';

import { useState } from 'react';
import { Phone, PhoneOff } from 'lucide-react';

interface CallButtonProps {
  phoneNumber?: string;
  buttonText?: string;
  className?: string;
}

export default function CallButton({
  phoneNumber = '+13472229576',
  buttonText = 'Call Now',
  className = '',
}: CallButtonProps) {
  const [calling, setCalling] = useState(false);
  const [callStatus, setCallStatus] = useState<string>('');

  const handleCall = async () => {
    setCalling(true);
    setCallStatus('Initiating call...');

    try {
      const response = await fetch('/api/twilio/make-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCallStatus(`Call initiated! (${data.callSid})`);
        console.log('Call details:', data);

        // Reset status after 5 seconds
        setTimeout(() => {
          setCallStatus('');
          setCalling(false);
        }, 5000);
      } else {
        setCallStatus(`Error: ${data.error || 'Failed to initiate call'}`);
        setCalling(false);
      }
    } catch (error) {
      console.error('Error making call:', error);
      setCallStatus('Error: Failed to connect');
      setCalling(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleCall}
        disabled={calling}
        className={`
          flex items-center justify-center gap-2 px-4 py-2
          bg-green-600 hover:bg-green-700
          disabled:bg-gray-600 disabled:cursor-not-allowed
          text-white font-semibold rounded-lg
          transition-colors duration-200
          ${className}
        `}
      >
        {calling ? (
          <>
            <PhoneOff className="h-5 w-5 animate-pulse" />
            <span>Calling...</span>
          </>
        ) : (
          <>
            <Phone className="h-5 w-5" />
            <span>{buttonText}</span>
          </>
        )}
      </button>

      {callStatus && (
        <p className="text-sm text-gray-400 text-center">
          {callStatus}
        </p>
      )}
    </div>
  );
}
