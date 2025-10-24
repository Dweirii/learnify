#!/bin/bash

echo "🧪 TESTING INNGEST FUNCTIONS VIA WEBHOOK"
echo "========================================"

echo ""
echo "📡 SIMULATING LIVEKIT WEBHOOK:"
echo ""

# Create a test webhook payload
WEBHOOK_PAYLOAD='{
  "event": "stream.started",
  "ingressId": "IN_bFpKPAb7MRNv",
  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
  "participantIdentity": "test-user-123",
  "participantSid": "PA_test123"
}'

echo "Webhook payload:"
echo "$WEBHOOK_PAYLOAD" | jq .

echo ""
echo "🔍 SENDING WEBHOOK TO APP:"
echo ""

# Send webhook to the app
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "http://localhost:3000/api/webhooks/livekit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d "$WEBHOOK_PAYLOAD")

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
echo "🔍 CHECKING INNGEST UI:"
echo ""

echo "Go to: http://localhost:8288"
echo "Look for:"
echo "1. Functions tab - should show all 4 functions"
echo "2. Runs tab - should show the webhook-triggered run"
echo "3. Check if 'stream-started' function executed"

echo ""
echo "🔍 CHECKING DATABASE:"
echo ""

echo "Go to: http://localhost:5555 (Prisma Studio)"
echo "Look for:"
echo "1. Stream table"
echo "2. Find stream with ingressId: IN_bFpKPAb7MRNv"
echo "3. Check if isLive is true"

echo ""
echo "📋 NEXT STEPS:"
echo ""

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "202" ]; then
    echo "✅ Webhook sent successfully"
    echo "1. Check Inngest UI for function execution"
    echo "2. Check database for updates"
    echo "3. If successful, test with real streaming"
else
    echo "❌ Failed to send webhook"
    echo "1. Check webhook authentication"
    echo "2. Check function registration"
    echo "3. Check for errors in logs"
fi

echo ""
echo "🎯 MANUAL VERIFICATION:"
echo ""

echo "1. Open Inngest UI: http://localhost:8288"
echo "2. Go to Functions tab"
echo "3. Look for these functions:"
echo "   - stream-started"
echo "   - stream-ended"
echo "   - participant-joined"
echo "   - participant-left"
echo "4. Check Runs tab for recent executions"
echo "5. Look for any errors or failures"

echo ""
echo "✅ Test completed!"
