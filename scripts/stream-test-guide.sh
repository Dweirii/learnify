#!/bin/bash

echo "🎯 REAL STREAMING TEST GUIDE"
echo "============================"

echo ""
echo "📋 STEP-BY-STEP TESTING PROCESS:"
echo ""

echo "1. 🔍 PRE-TEST VERIFICATION:"
echo "   ✅ Database connection: HEALTHY"
echo "   ✅ Inngest functions: REGISTERED"
echo "   ✅ Webhook endpoint: ACCESSIBLE"
echo "   ✅ Environment variables: SET"

echo ""
echo "2. 🧪 TESTING YOUR STREAM:"
echo ""

echo "   a) Open your app in browser: http://localhost:3000"
echo "   b) Sign in to your account"
echo "   c) Go to your dashboard: http://localhost:3000/u/YOUR_USERNAME"
echo "   d) Click 'Generate Keys' to create an ingress"
echo "   e) Copy the stream key and server URL"
echo "   f) Use OBS or similar software to start streaming"

echo ""
echo "3. 📡 MONITORING THE PROCESS:"
echo ""

echo "   While streaming, watch for these logs in your terminal:"
echo ""
echo "   🔍 WEBHOOK RECEIVED:"
echo "   - 'Webhook body received'"
echo "   - 'Sending stream.started event to Inngest'"
echo "   - 'Sent stream.started event to Inngest'"

echo ""
echo "   🔍 INNGEST FUNCTION EXECUTION:"
echo "   - '[Inngest] Processing stream started for ingress: ...'"
echo "   - '[Inngest] Successfully updated stream ... to live'"
echo "   - '[Inngest] Stream ... is now live'"

echo ""
echo "4. 🗄️ DATABASE VERIFICATION:"
echo ""

echo "   a) Open Prisma Studio: http://localhost:5555"
echo "   b) Go to the Stream table"
echo "   c) Find your stream (look for your username)"
echo "   d) Check these fields:"
echo "      - ingressId: Should be set (not null)"
echo "      - isLive: Should be true"
echo "      - updatedAt: Should be recent timestamp"

echo ""
echo "5. 🎮 INNGEST UI VERIFICATION:"
echo ""

echo "   a) Open Inngest UI: http://localhost:8288"
echo "   b) Go to 'Functions' tab"
echo "   c) Look for 'stream-started' function"
echo "   d) Check 'Runs' tab for recent executions"
echo "   e) Look for successful runs (green status)"

echo ""
echo "6. 🚨 TROUBLESHOOTING COMMON ISSUES:"
echo ""

echo "   ❌ No webhook received:"
echo "   - Check LiveKit dashboard webhook configuration"
echo "   - Verify webhook URL is correct"
echo "   - Check if you're using ngrok or similar tunneling"

echo ""
echo "   ❌ Webhook received but function not triggered:"
echo "   - Check Inngest is running"
echo "   - Verify function registration"
echo "   - Check for errors in Inngest UI"

echo ""
echo "   ❌ Function triggered but database not updated:"
echo "   - Check database connection"
echo "   - Verify ingressId exists in database"
echo "   - Check for transaction errors"

echo ""
echo "   ❌ Database updated but isLive still false:"
echo "   - Check transaction rollback"
echo "   - Verify update query syntax"
echo "   - Check for constraint violations"

echo ""
echo "7. 🔧 DEBUGGING COMMANDS:"
echo ""

echo "   Check current streams:"
echo "   npx prisma studio --port 5555"

echo ""
echo "   Check Inngest functions:"
echo "   curl -s http://localhost:8288/v1/functions"

echo ""
echo "   Check server health:"
echo "   curl -s http://localhost:3000/api/health | jq"

echo ""
echo "8. 📊 SUCCESS INDICATORS:"
echo ""

echo "   ✅ Webhook logs appear in terminal"
echo "   ✅ Inngest function shows successful run"
echo "   ✅ Database shows isLive: true"
echo "   ✅ Stream appears on homepage"
echo "   ✅ Real-time updates work"

echo ""
echo "🎯 READY TO TEST!"
echo ""
echo "Start streaming and watch the logs. If you see any errors,"
echo "run this script again and follow the troubleshooting steps."
