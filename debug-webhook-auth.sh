#!/bin/bash

echo "🔧 DEBUGGING WEBHOOK AUTHENTICATION"
echo "==================================="

echo ""
echo "📡 TESTING WEBHOOK WITHOUT AUTHENTICATION:"
echo ""

# Create a test webhook payload
TEST_PAYLOAD='{
  "event": "ingress_started",
  "ingressInfo": {
    "ingressId": "test-ingress-123",
    "name": "Test Stream",
    "url": "rtmp://test.example.com/live",
    "streamKey": "test-key-123"
  },
  "room": {
    "name": "test-room",
    "sid": "test-room-sid"
  },
  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
}'

echo "Test payload:"
echo "$TEST_PAYLOAD" | jq .

echo ""
echo "🔍 SENDING TEST WEBHOOK (NO AUTH):"
echo ""

# Send the webhook without authentication to see the error
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "http://localhost:3000/api/webhooks/livekit" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")

echo ""
echo "📊 WEBHOOK RESPONSE:"
echo ""

# Extract HTTP code and response body
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "HTTP Status: $HTTP_CODE"
echo "Response Body:"
echo "$RESPONSE_BODY"

echo ""
echo "🔍 CHECKING SERVER LOGS:"
echo ""

echo "Check the terminal where you're running 'npm run dev' for error messages"
echo "Look for:"
echo "- 'No authorization header'"
echo "- 'Webhook error'"
echo "- Any stack traces or error details"

echo ""
echo "🎯 AUTHENTICATION ISSUE ANALYSIS:"
echo ""

echo "The webhook is failing because:"
echo "1. LiveKit webhooks require proper signature verification"
echo "2. The 'Bearer' token approach is not correct for LiveKit"
echo "3. LiveKit uses HMAC-SHA256 signature verification"

echo ""
echo "📋 PROPER LIVEKIT WEBHOOK AUTHENTICATION:"
echo ""

echo "LiveKit webhooks use:"
echo "1. Authorization header with 'Bearer' prefix"
echo "2. JWT token signed with API secret"
echo "3. Token contains webhook payload hash"

echo ""
echo "🔧 SOLUTION:"
echo ""

echo "1. Check your LiveKit dashboard webhook configuration"
echo "2. Ensure webhook URL is: http://your-domain.com/api/webhooks/livekit"
echo "3. Verify API key and secret are correct"
echo "4. Test with real LiveKit webhook (not manual curl)"

echo ""
echo "🧪 ALTERNATIVE TEST:"
echo ""

echo "Instead of manual webhook testing:"
echo "1. Start a real stream using your app"
echo "2. Watch the server logs for webhook events"
echo "3. Check Inngest UI for function executions"
echo "4. Verify database updates in Prisma Studio"

echo ""
echo "✅ Debug completed!"
