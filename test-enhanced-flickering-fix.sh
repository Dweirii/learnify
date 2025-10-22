#!/bin/bash

echo "🧪 Testing Enhanced Stream Flickering Fix"
echo "========================================"

echo ""
echo "🔍 1. Checking Inngest Functions with Enhanced Debouncing..."
curl -s "http://localhost:8288/api/v1/functions" | jq '.functions[] | {id: .id, name: .name, debounce: .debounce}'

echo ""
echo "🔍 2. Testing Redis Cooldown Mechanism..."
echo "Checking if cooldown keys exist..."
redis-cli keys "stream-cooldown:*" | head -5

echo ""
echo "🔍 3. Monitoring Stream Events (should be much less frequent now)..."
echo "The rapid stream.started/stream.ended loop should be significantly reduced"
echo "Look for 'cooldown period' and 'skipping update' messages in your terminal"

echo ""
echo "🔍 4. Testing Frontend Debouncing..."
echo "Opening homepage to test UI debouncing..."
curl -s "http://localhost:3000/api/stream-updates?type=stream-list" | head -10

echo ""
echo "✅ Enhanced Test Complete!"
echo ""
echo "🎯 What to Look For:"
echo "   - Fewer rapid stream.started/stream.ended events"
echo "   - 'cooldown period' messages in logs"
echo "   - 'skipping update' messages for duplicate events"
echo "   - Smoother homepage experience without flickering"
echo ""
echo "🔧 If Still Flickering:"
echo "   - Check Redis connection: redis-cli ping"
echo "   - Increase cooldown period in functions"
echo "   - Check LiveKit webhook configuration"
