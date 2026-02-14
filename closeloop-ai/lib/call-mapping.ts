// Shared utility for mapping between Twilio callSid and ElevenLabs conversationId

// Bidirectional mapping between Twilio callSid and ElevenLabs conversationId
const conversationToCallMap = new Map<string, string>();
const callToConversationMap = new Map<string, string>();

/**
 * Register a bidirectional mapping between Twilio callSid and ElevenLabs conversationId
 */
export function registerCallMapping(callSid: string, conversationId: string) {
  conversationToCallMap.set(conversationId, callSid);
  callToConversationMap.set(callSid, conversationId);
  console.log(`🔗 Registered mapping: callSid=${callSid} ↔️ conversationId=${conversationId}`);
}

/**
 * Resolve either callSid or conversationId to a session identifier
 * Tries conversationId first, then callSid, then defaults to the input
 */
export function resolveSessionId(sessionId: string): string {
  // Try to map conversationId -> callSid
  const mappedCallSid = conversationToCallMap.get(sessionId);
  if (mappedCallSid) {
    console.log(`🔄 Mapped conversationId ${sessionId} → callSid ${mappedCallSid}`);
    return mappedCallSid;
  }
  
  // Try to map callSid -> conversationId
  const mappedConversationId = callToConversationMap.get(sessionId);
  if (mappedConversationId) {
    console.log(`🔄 Mapped callSid ${sessionId} → conversationId ${mappedConversationId}`);
    return mappedConversationId;
  }
  
  // No mapping found, use as-is
  console.log(`✨ Using sessionId as-is: ${sessionId}`);
  return sessionId;
}
