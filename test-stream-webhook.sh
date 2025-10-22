#!/bin/bash

echo "🧪 TESTING STREAM DATABASE UPDATE"
echo "================================="

echo ""
echo "📡 CREATING TEST WEBHOOK CALL:"
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
echo "🔍 SENDING TEST WEBHOOK:"
echo ""

# First, we need to create a proper authorization header
# Let's use the LiveKit API key and secret to create a proper token
API_KEY="APIwNawcPwgT6wT"
API_SECRET="8JMcYHxWwTUC9SGBQob2SL1WtTNTTGkfC7FcBeeaVNoB"

# Create a simple test authorization header
AUTH_HEADER="Bearer $API_KEY"

echo "Sending webhook to: http://localhost:3000/api/webhooks/livekit"
echo "Authorization: $AUTH_HEADER"

# Send the webhook
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "http://localhost:3000/api/webhooks/livekit" \
  -H "Content-Type: application/json" \
  -H "Authorization: $AUTH_HEADER" \
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
echo "🔍 CHECKING INNGEST FUNCTIONS:"
echo ""

# Check if the function was triggered
echo "Checking Inngest UI for function runs..."
echo "Go to: http://localhost:8288"
echo "Look for 'stream-started' function runs"

echo ""
echo "🔍 CHECKING DATABASE STATE:"
echo ""

# Check if the test stream was created/updated
echo "Checking for test stream in database..."
echo "Look for ingressId: test-ingress-123"

echo ""
echo "📋 NEXT STEPS:"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Webhook was accepted (HTTP 200)"
    echo "1. Check Inngest UI for function execution"
    echo "2. Check database for stream updates"
    echo "3. If successful, test with real streaming"
else
    echo "❌ Webhook failed (HTTP $HTTP_CODE)"
    echo "1. Check webhook authentication"
    echo "2. Check LiveKit configuration"
    echo "3. Check server logs for errors"
fi

echo ""
echo "🎯 MANUAL VERIFICATION:"
echo ""

echo "1. Go to Prisma Studio: http://localhost:5555"
echo "2. Check the Stream table for:"
echo "   - ingressId: test-ingress-123"
echo "   - isLive: true (if function executed)"
echo ""
echo "3. Go to Inngest UI: http://localhost:8288"
echo "4. Check for 'stream-started' function runs"
echo "5. Look for any errors or failures"

echo ""
echo "✅ Test completed!"
