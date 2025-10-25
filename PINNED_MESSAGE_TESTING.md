# Pinned Message Feature - Testing Guide

## Quick Start

### 1. Start the Development Server
```bash
pnpm dev
```

### 2. Test Scenarios

#### Scenario 1: Basic Pin/Unpin
**As Streamer:**
1. Start a stream
2. Send a few chat messages
3. Hover over any message
4. Click the pin icon
5. ✅ Verify message appears at top with gradient design
6. ✅ Verify "Only you can unpin this message" footer
7. Click the X button to unpin
8. ✅ Verify message disappears

**As Viewer (Open in Incognito):**
1. Join the same stream
2. ✅ Verify you see the pinned message
3. ✅ Verify you cannot see the unpin button
4. ✅ Verify you see "Visible to all viewers" text

#### Scenario 2: Real-time Broadcasting
**Setup:** Open two browser windows (Streamer + Viewer)

**Test Steps:**
1. **Streamer Window**: Pin a message
2. **Viewer Window**: ✅ Message appears instantly (no refresh needed)
3. **Streamer Window**: Unpin the message
4. **Viewer Window**: ✅ Message disappears instantly

#### Scenario 3: Persistence (New Viewer)
**Test Steps:**
1. **Streamer**: Pin a message
2. **New Viewer**: Open a new incognito window and join stream
3. ✅ Verify new viewer sees the pinned message immediately

#### Scenario 4: Long Messages
**Test Steps:**
1. **Streamer**: Send a message with >100 characters:
   ```
   This is a very long message that should be truncated and show an expand button. Let me add more text to make sure it exceeds 100 characters. Here we go with even more text!
   ```
2. Pin the message
3. ✅ Verify message is truncated with "..." 
4. ✅ Verify chevron down icon appears
5. Click the chevron
6. ✅ Verify full message is shown
7. Click again
8. ✅ Verify message collapses back

#### Scenario 5: UI/UX Testing
**Test Steps:**
1. Pin a message
2. ✅ Verify gradient border appears on hover
3. ✅ Verify shimmer animation is visible
4. ✅ Verify smooth transitions
5. ✅ Verify pin icon has a glow effect
6. ✅ Verify "Pinned Message" text has gradient

#### Scenario 6: Error Handling
**Test Steps:**
1. Stop Redis (if testing locally)
2. Try to pin a message
3. ✅ Verify error toast appears
4. Restart Redis
5. Try again
6. ✅ Verify success

#### Scenario 7: 24-Hour Persistence
**Note:** This requires waiting or manually testing with Redis

**Manual Redis Test:**
```bash
# Connect to Redis
redis-cli

# Check stored pinned message
GET "pinned_message:your-stream-id"

# Check TTL (should be ~86400 seconds = 24 hours)
TTL "pinned_message:your-stream-id"
```

## Visual Checklist

### Pinned Message Component
- [ ] Gradient border on hover (blue → purple → pink)
- [ ] Shimmer animation running
- [ ] Pin icon with blue glow
- [ ] "Pinned Message" text with gradient
- [ ] "Visible to all viewers" subtitle (for viewers)
- [ ] "Only you can unpin this message" footer (for host)
- [ ] Expand/collapse button (for long messages)
- [ ] Unpin button (X) with red hover state (host only)
- [ ] Smooth transitions on all interactions

### Chat Integration
- [ ] Pinned message appears at top of chat
- [ ] Proper spacing between pinned message and chat list
- [ ] Pin icon appears on message hover (host only)
- [ ] Toast notifications for all actions

## Console Logs to Watch

### Successful Pin
```
Pin attempt: { messageId: "...", streamId: "...", viewerName: "...", isHost: true }
Found message: { message: "...", from: { ... }, timestamp: ... }
Broadcasting pinned message: { type: 'message.pinned', ... }
Response status: 200
[SSE] Publishing message.pinned event: { streamId: "...", userId: "...", data: { ... } }
[SSE] Message.pinned event published successfully
```

### Event Received by Viewer
```
Stream event received: { type: 'message.pinned', streamId: "...", data: { ... } }
Pinned message data: { messageId: "...", message: "...", from: { ... }, timestamp: ... }
Pinned message set: { id: "...", message: "...", from: { ... }, timestamp: ... }
```

### Successful Unpin
```
[SSE] Handling Redis event: { type: 'message.unpinned', ... }
Message unpinned
```

## Network Tab Inspection

### Pin Action
1. **POST /api/stream-updates**
   - Status: 200 OK
   - Body: `{ type: 'message.pinned', streamId: '...', ... }`

2. **POST /api/chat/pinned**
   - Status: 200 OK
   - Body: `{ streamId: '...', messageId: '...', messageData: { ... } }`

### Unpin Action
1. **POST /api/stream-updates**
   - Status: 200 OK
   - Body: `{ type: 'message.unpinned', streamId: '...', ... }`

2. **DELETE /api/chat/pinned**
   - Status: 200 OK
   - Body: `{ streamId: '...' }`

### Viewer Joining
1. **GET /api/chat/pinned?streamId=...**
   - Status: 200 OK
   - Body: `{ pinnedMessage: { ... }, streamId: '...' }`

2. **GET /api/stream-updates?streamId=...&userId=...**
   - Status: 200 (SSE connection established)
   - EventStream: Connected

## Redis Data Verification

### Check Stored Data
```bash
# Connect to Redis
redis-cli

# Or if using Upstash
# Use their web console

# View all pinned messages
KEYS "pinned_message:*"

# Get specific pinned message
GET "pinned_message:your-stream-id"

# Should return:
# {
#   "messageId": "...",
#   "messageData": {
#     "messageId": "...",
#     "message": "The pinned message text",
#     "from": {
#       "name": "Username",
#       "identity": "user-identity"
#     },
#     "timestamp": 1234567890
#   },
#   "timestamp": 1234567890
# }
```

## Troubleshooting

### Pinned message not showing for viewers
1. ✅ Check if SSE event listeners are registered (lines 187-188 in use-stream-updates.ts)
2. ✅ Check console for "Stream event received" logs
3. ✅ Verify Redis connection is working
4. ✅ Check network tab for SSE connection

### Pin button not working
1. ✅ Verify you're logged in as the host
2. ✅ Check console for errors
3. ✅ Verify Redis is running
4. ✅ Check network tab for failed requests

### UI not showing properly
1. ✅ Clear browser cache
2. ✅ Check for CSS conflicts
3. ✅ Verify shimmer animation keyframes are in globals.css
4. ✅ Check browser console for errors

### Redis errors
```bash
# Check Redis connection
redis-cli ping
# Should return: PONG

# Check Redis memory
redis-cli info memory

# Monitor Redis commands (useful for debugging)
redis-cli monitor
```

## Performance Testing

### Test with Multiple Viewers
1. Open 10+ browser tabs as viewers
2. Pin a message
3. ✅ Verify all tabs receive update within 1 second
4. Check server logs for any errors
5. Monitor Redis memory usage

### Test Message Size
1. Pin a very long message (1000+ characters)
2. ✅ Verify UI handles it gracefully
3. ✅ Verify expand/collapse works
4. ✅ Check for performance issues

## Accessibility Testing

### Keyboard Navigation
1. Tab through the interface
2. ✅ Verify you can reach unpin button
3. ✅ Verify you can reach expand button
4. ✅ Test Enter/Space key activation

### Screen Reader
1. Use a screen reader (VoiceOver, NVDA, JAWS)
2. ✅ Verify "Unpin message" is announced
3. ✅ Verify "Show more/less" is announced

## Mobile Testing

### Responsive Design
1. Open on mobile device or use Chrome DevTools mobile view
2. ✅ Verify pinned message is visible
3. ✅ Verify text is readable
4. ✅ Verify buttons are tappable
5. ✅ Test expand/collapse on touch

## Final Checklist

### Functionality
- [ ] Pinned messages visible to all viewers
- [ ] Real-time updates via SSE
- [ ] Redis persistence (24 hours)
- [ ] Automatic loading for new viewers
- [ ] Host can pin/unpin
- [ ] Viewers cannot unpin
- [ ] Long messages expand/collapse
- [ ] Error handling with toast notifications

### UI/UX
- [ ] Beautiful gradient design
- [ ] Smooth animations
- [ ] Hover effects working
- [ ] Responsive on all screen sizes
- [ ] Accessible with keyboard
- [ ] Clear visual hierarchy

### Performance
- [ ] No lag with multiple viewers
- [ ] SSE connections stable
- [ ] Redis queries fast
- [ ] No memory leaks
- [ ] Smooth UI updates

### Production Readiness
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] No linter warnings
- [ ] Proper error handling
- [ ] Type-safe implementation
- [ ] Production-quality code

## Success Criteria

✅ **The feature is ready for production when:**
1. All viewers see pinned messages in real-time
2. Pinned messages persist for new viewers joining
3. UI is polished and professional
4. No errors in console or logs
5. Performance is smooth with multiple viewers
6. All error cases are handled gracefully
7. Code passes all linter checks
8. Documentation is complete

---

**Happy Testing! 🎉**

For any issues or questions, check:
- `PINNED_MESSAGE_IMPLEMENTATION.md` for technical details
- Console logs for debugging information
- Network tab for API call inspection
- Redis for data persistence verification

