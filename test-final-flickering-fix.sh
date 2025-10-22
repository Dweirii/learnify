#!/bin/bash

echo "🎯 Final Stream Flickering Fix Test"
echo "==================================="

echo ""
echo "🔍 1. Checking Inngest Functions Status..."
curl -s "http://localhost:8288/api/v1/functions" | jq '.functions[] | {id: .id, name: .name, debounce: .debounce}'

echo ""
echo "🔍 2. Testing Stream Events (should be much more stable now)..."
echo "Monitoring for rapid events..."

# Monitor stream events for 10 seconds
timeout 10s curl -s "http://localhost:3000/api/stream-updates?type=stream-list" | grep -E "(stream\.started|stream\.ended)" | head -10

echo ""
echo "🔍 3. Checking Database Connection..."
curl -s "http://localhost:3000/api/health" | jq '.services.database'

echo ""
echo "✅ Final Test Complete!"
echo ""
echo "🎯 Expected Results:"
echo "   ✅ Fewer rapid stream.started/stream.ended events"
echo "   ✅ 'recently updated, skipping' messages in logs"
echo "   ✅ Smoother homepage experience"
echo "   ✅ No more flickering when starting/stopping streams"
echo ""
echo "🔧 If Still Having Issues:"
echo "   1. Check your LiveKit webhook configuration"
echo "   2. Verify ngrok tunnel is stable"
echo "   3. Check browser console for SSE errors"
echo "   4. Monitor Inngest logs for 'skipping' messages"
