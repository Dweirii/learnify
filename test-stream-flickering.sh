#!/bin/bash

echo "🧪 Testing Stream Flickering Fix"
echo "================================"

echo ""
echo "🔍 1. Checking Inngest Functions Status..."
curl -s "http://localhost:8288/api/v1/functions" | jq '.functions[] | {id: .id, name: .name, debounce: .debounce}'

echo ""
echo "🔍 2. Testing Stream Events (should be debounced)..."
echo "Making multiple rapid requests to simulate webhook spam..."

for i in {1..5}; do
  echo "Request $i:"
  curl -s -X POST "http://localhost:3000/api/webhooks/livekit" \
    -H "Content-Type: application/json" \
    -d '{
      "event": "room.finished",
      "room": {
        "sid": "test-room-'$i'",
        "name": "test-stream-'$i'"
      },
      "participant": {
        "sid": "test-participant-'$i'",
        "identity": "test-user-'$i'"
      }
    }' | jq '.success // "No response"'
  sleep 0.5
done

echo ""
echo "🔍 3. Checking Stream List Updates..."
curl -s "http://localhost:3000/api/stream-updates?type=stream-list" | head -20

echo ""
echo "🔍 4. Monitoring Logs for Debouncing..."
echo "Look for 'debounce' and 'skipping update' messages in your terminal"
echo "The rapid stream.started/stream.ended loop should be reduced"

echo ""
echo "✅ Test Complete!"
echo "If you see fewer rapid events in your logs, the debouncing is working!"
