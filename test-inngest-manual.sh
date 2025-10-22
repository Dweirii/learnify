#!/bin/bash

echo "🧪 TESTING INNGEST FUNCTIONS MANUALLY"
echo "====================================="

echo ""
echo "📡 SENDING TEST EVENT TO INNGEST:"
echo ""

# Send a test event directly to Inngest
TEST_EVENT='{
  "name": "livekit/stream.started",
  "data": {
    "ingressId": "IN_bFpKPAb7MRNv",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }
}'

echo "Test event:"
echo "$TEST_EVENT" | jq .

echo ""
echo "🔍 SENDING EVENT TO INNGEST:"
echo ""

# Send the event to Inngest
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "http://localhost:8288/v1/events" \
  -H "Content-Type: application/json" \
  -d "$TEST_EVENT")

echo ""
echo "📊 INNGEST RESPONSE:"
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
echo "1. Functions tab - should show 'stream-started' function"
echo "2. Runs tab - should show the test run"
echo "3. Check if the function executed successfully"

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
    echo "✅ Event sent successfully to Inngest"
    echo "1. Check Inngest UI for function execution"
    echo "2. Check database for updates"
    echo "3. If successful, test with real streaming"
else
    echo "❌ Failed to send event to Inngest"
    echo "1. Check Inngest is running"
    echo "2. Check function registration"
    echo "3. Check for errors in Inngest logs"
fi

echo ""
echo "🎯 MANUAL VERIFICATION:"
echo ""

echo "1. Open Inngest UI: http://localhost:8288"
echo "2. Go to Functions tab"
echo "3. Look for 'stream-started' function"
echo "4. Click on it to see details"
echo "5. Check Runs tab for recent executions"
echo "6. Look for any errors or failures"

echo ""
echo "✅ Test completed!"
