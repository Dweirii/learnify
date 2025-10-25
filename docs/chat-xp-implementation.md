# Chat Message XP Implementation

## Overview

This document explains how XP (experience points) is awarded for chat messages in the Learnify application.

## Architecture

### Why Not Use LiveKit Webhooks?

Initially, there was an attempt to award XP for chat messages via LiveKit webhooks using a `data_received` event. However, this approach had a critical issue:

**LiveKit webhooks do NOT provide a `data_received` or `room_data_received` event type.**

The valid LiveKit webhook event types are:
- `room_started`
- `room_finished`
- `participant_joined`
- `participant_left`
- `participant_connection_aborted`
- `track_published`
- `track_unpublished`
- `egress_started`
- `egress_updated`
- `egress_ended`

### Solution: Client-Side API Call

Instead, we use a **client-side approach** where the chat component calls a dedicated API endpoint after sending a message.

## Implementation Details

### 1. Chat API Endpoint (`/api/chat`)

**Location:** `src/app/api/chat/route.ts`

**Responsibilities:**
- Authenticates the user
- Validates the request (streamId, messageId)
- Checks daily chat XP limits (max 50 XP/day from chat)
- Awards XP using `XPService.awardXP()`
- Tracks daily count in Redis
- Returns level-up information if applicable

**Request:**
```typescript
POST /api/chat
{
  "streamId": "stream-123",
  "messageId": "msg-456"
}
```

**Response:**
```typescript
{
  "success": true,
  "xpAwarded": 1,
  "leveledUp": false,
  "newLevel": 5,
  "oldLevel": 5,
  "dailyCount": 10,
  "dailyLimit": 50
}
```

### 2. Chat Component Integration

**Location:** `src/features/chat/components/chat.tsx`

**Flow:**
1. User types a message and submits
2. Message is sent via LiveKit's `send()` function
3. Immediately after, an async call is made to `/api/chat`
4. If user levels up, a toast notification is shown
5. XP award failures are silent (don't block chat functionality)

**Code:**
```typescript
const onSubmit = async () => {
  if (!send) return;

  // Send message via LiveKit
  send(messageToSend);
  
  // Generate unique message ID
  const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Award XP (fire and forget)
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streamId, messageId }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.leveledUp && data.newLevel) {
        toast.success("Level Up!", {
          description: `You reached level ${data.newLevel}!`,
        });
      }
    }
  } catch (error) {
    // Silently fail - XP award shouldn't block chat
    console.error("Failed to award XP for chat message:", error);
  }
};
```

## XP Award Rules

### Amount
- **1 XP per chat message** (`XPService.XP_CONSTANTS.CHAT_MESSAGE`)

### Daily Limit
- **50 XP maximum per day** from chat messages
- Limit is tracked in Redis with key: `chat_xp_daily:{userId}:{date}`
- Limit resets at midnight (24-hour TTL on Redis key)

### Metadata
Each XP transaction includes:
```typescript
{
  streamId: "stream-123",
  messageId: "msg-456",
  dailyCount: 10
}
```

## Benefits of This Approach

### ✅ Advantages

1. **Works with LiveKit's actual event system** - No relying on non-existent webhook events
2. **Real-time feedback** - User gets instant level-up notifications
3. **Resilient** - XP failures don't break chat functionality
4. **Secure** - Server-side authentication and validation
5. **Rate-limited** - Daily limits prevent abuse
6. **Trackable** - Full audit trail via XPTransaction records

### ⚠️ Considerations

1. **Client-side call** - Requires network request after each message
2. **Fire-and-forget** - No guarantee of XP award (by design for UX)
3. **Trust model** - Client initiates the XP request (but server validates)

## Alternative Approaches Considered

### 1. LiveKit Data Channel Listener (Server-Side)
**Rejected:** Would require maintaining persistent WebSocket connections server-side, which is complex and resource-intensive.

### 2. Batch Processing
**Rejected:** Delays XP awards and level-up notifications, poor UX.

### 3. Inngest Background Job
**Rejected:** Adds unnecessary latency for a simple operation.

## Testing

To test chat XP functionality:

```bash
# Send a chat message and verify XP is awarded
# Check daily limit (send 51+ messages)
# Verify level-up notification appears
# Check XP transaction records in database
```

## Future Improvements

1. **Debouncing** - Prevent spam by rate-limiting requests per user
2. **Offline queue** - Queue XP awards if API is temporarily unavailable
3. **Analytics** - Track chat engagement metrics alongside XP
4. **Variable XP** - Award different amounts based on message quality/length

## Related Files

- `/src/app/api/chat/route.ts` - Chat XP API endpoint
- `/src/features/chat/components/chat.tsx` - Chat component with XP integration
- `/src/app/api/webhooks/livekit/route.ts` - LiveKit webhook handler (does NOT handle chat XP)
- `/src/server/services/xp.service.ts` - XP service with award logic
- `/src/server/services/leaderboard.service.ts` - Leaderboard service (updated on XP changes)

## See Also

- [Gamification Implementation](../GAMIFICATION_IMPLEMENTATION_COMPLETE.md)
- [XP Service Documentation](../src/server/services/xp.service.ts)

