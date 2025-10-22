#!/bin/bash

echo "🔍 DEBUGGING STREAM DATABASE UPDATES"
echo "===================================="

echo ""
echo "📊 CHECKING CURRENT DATABASE STATE:"
echo ""

# Check if we can connect to the database
echo "Testing database connection..."
DB_STATUS=$(curl -s "http://localhost:3000/api/health" | jq -r '.services.database.status // "unknown"')
if [ "$DB_STATUS" = "healthy" ]; then
    echo "✅ Database connection: HEALTHY"
else
    echo "❌ Database connection: UNHEALTHY"
    exit 1
fi

echo ""
echo "🔍 CHECKING STREAMS IN DATABASE:"
echo ""

# Check streams using Prisma CLI
echo "Querying streams from database..."
npx prisma db execute --stdin <<< "SELECT id, name, \"isLive\", \"ingressId\", \"userId\", \"createdAt\", \"updatedAt\" FROM \"Stream\" ORDER BY \"createdAt\" DESC LIMIT 5;" 2>/dev/null || echo "Could not query database directly"

echo ""
echo "🔧 CHECKING INNGEST FUNCTIONS:"
echo ""

# Check if Inngest is running
echo "Checking Inngest process..."
if pgrep -f "inngest-cli" > /dev/null; then
    echo "✅ Inngest is running"
else
    echo "❌ Inngest is not running"
fi

echo ""
echo "📡 CHECKING WEBHOOK CONFIGURATION:"
echo ""

# Check if webhook endpoint is accessible
echo "Testing webhook endpoint..."
WEBHOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/webhooks/livekit")
if [ "$WEBHOOK_STATUS" = "405" ]; then
    echo "✅ Webhook endpoint accessible (405 = Method Not Allowed, expected for GET)"
else
    echo "❌ Webhook endpoint issue: HTTP $WEBHOOK_STATUS"
fi

echo ""
echo "🔍 CHECKING ENVIRONMENT VARIABLES:"
echo ""

# Check critical environment variables
echo "Checking LiveKit configuration..."
if [ -n "$LIVEKIT_API_KEY" ]; then
    echo "✅ LIVEKIT_API_KEY: Set"
else
    echo "❌ LIVEKIT_API_KEY: Not set"
fi

if [ -n "$LIVEKIT_API_SECRET" ]; then
    echo "✅ LIVEKIT_API_SECRET: Set"
else
    echo "❌ LIVEKIT_API_SECRET: Not set"
fi

if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL: Set"
else
    echo "❌ DATABASE_URL: Not set"
fi

echo ""
echo "🧪 TESTING STREAM CREATION FLOW:"
echo ""

echo "1. User signs up → Stream created (via Clerk webhook)"
echo "2. User creates ingress → ingressId set in stream"
echo "3. User starts streaming → LiveKit sends webhook"
echo "4. Webhook triggers Inngest → Stream marked as isLive: true"

echo ""
echo "🔍 DEBUGGING STEPS:"
echo ""

echo "1. Check if stream exists for your user:"
echo "   - Go to Prisma Studio: http://localhost:5555"
echo "   - Look for your user in the User table"
echo "   - Check if they have a corresponding Stream record"

echo ""
echo "2. Check if ingressId is set:"
echo "   - In Prisma Studio, check the Stream table"
echo "   - Look for your stream's ingressId field"
echo "   - It should not be null if you've created an ingress"

echo ""
echo "3. Check LiveKit webhook logs:"
echo "   - Start streaming and watch the terminal"
echo "   - Look for 'Webhook body received' messages"
echo "   - Check for 'Sending stream.started event to Inngest'"

echo ""
echo "4. Check Inngest function execution:"
echo "   - Go to Inngest UI: http://localhost:8288"
echo "   - Look for 'stream-started' function runs"
echo "   - Check for any errors or failures"

echo ""
echo "5. Manual test:"
echo "   - Create a test webhook call:"
echo "   curl -X POST http://localhost:3000/api/webhooks/livekit \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     -d '{\"event\":\"ingress_started\",\"ingressInfo\":{\"ingressId\":\"test-123\"}}'"

echo ""
echo "🎯 COMMON ISSUES TO CHECK:"
echo ""

echo "❌ Stream not created:"
echo "   - Check Clerk webhook is working"
echo "   - Verify user creation process"

echo ""
echo "❌ ingressId not set:"
echo "   - Check ingress creation process"
echo "   - Verify createIngress function"

echo ""
echo "❌ Webhook not received:"
echo "   - Check LiveKit configuration"
echo "   - Verify webhook URL in LiveKit dashboard"
echo "   - Check network connectivity"

echo ""
echo "❌ Inngest function not triggered:"
echo "   - Check Inngest is running"
echo "   - Verify function registration"
echo "   - Check for errors in Inngest UI"

echo ""
echo "❌ Database update fails:"
echo "   - Check database connection"
echo "   - Verify transaction timeouts"
echo "   - Check for constraint violations"

echo ""
echo "✅ Run this script after each step to track progress!"
