#!/bin/bash

echo "🧪 Database Update Test Suite"
echo "============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}🔧 Fixing Common Issues...${NC}"

# Check if INNGEST_EVENT_KEY is set
echo -e "\n${YELLOW}1. Checking Inngest Event Key...${NC}"
if [ -z "$INNGEST_EVENT_KEY" ] || [ "$INNGEST_EVENT_KEY" = "your_event_key_here" ]; then
    echo -e "${RED}❌ INNGEST_EVENT_KEY is not set!${NC}"
    echo -e "${YELLOW}📝 To fix this:${NC}"
    echo "1. Go to your Inngest dashboard"
    echo "2. Copy your Event Key (starts with 'key_')"
    echo "3. Update your .env file:"
    echo "   INNGEST_EVENT_KEY=key_your_actual_key_here"
    echo ""
    echo -e "${YELLOW}⚠️  Without the Event Key, Inngest cannot send events!${NC}"
else
    echo -e "${GREEN}✅ INNGEST_EVENT_KEY is set${NC}"
fi

# Check if INNGEST_SIGNING_KEY is set
echo -e "\n${YELLOW}2. Checking Inngest Signing Key...${NC}"
if [ -z "$INNGEST_SIGNING_KEY" ] || [ "$INNGEST_SIGNING_KEY" = "signkey_your_key_here" ]; then
    echo -e "${RED}❌ INNGEST_SIGNING_KEY is not set!${NC}"
    echo -e "${YELLOW}📝 To fix this:${NC}"
    echo "1. Go to your Inngest dashboard"
    echo "2. Copy your Signing Key (starts with 'signkey_')"
    echo "3. Update your .env file:"
    echo "   INNGEST_SIGNING_KEY=signkey_your_actual_key_here"
else
    echo -e "${GREEN}✅ INNGEST_SIGNING_KEY is set${NC}"
fi

echo -e "\n${YELLOW}3. Testing System Components...${NC}"

# Test database
DB_STATUS=$(curl -s http://localhost:3000/api/health | jq -r '.services.database.status')
if [ "$DB_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ Database: Healthy${NC}"
else
    echo -e "${RED}❌ Database: Unhealthy${NC}"
fi

# Test Redis
REDIS_STATUS=$(curl -s http://localhost:3000/api/health | jq -r '.services.redis.status')
if [ "$REDIS_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ Redis: Healthy${NC}"
else
    echo -e "${RED}❌ Redis: Unhealthy${NC}"
fi

# Test Inngest
INGEST_STATUS=$(curl -s http://localhost:3000/api/health | jq -r '.services.inngest.status')
if [ "$INGEST_STATUS" = "healthy" ]; then
    echo -e "${GREEN}✅ Inngest: Healthy${NC}"
else
    echo -e "${RED}❌ Inngest: Unhealthy${NC}"
fi

echo -e "\n${YELLOW}4. Testing Inngest Functions...${NC}"
FUNCTION_COUNT=$(curl -s http://localhost:3000/api/inngest | jq -r '.function_count')
if [ "$FUNCTION_COUNT" = "4" ]; then
    echo -e "${GREEN}✅ All 4 Inngest functions registered${NC}"
else
    echo -e "${RED}❌ Only $FUNCTION_COUNT functions registered (expected 4)${NC}"
fi

echo -e "\n${YELLOW}5. Manual Testing Steps...${NC}"
echo -e "${BLUE}To test database updates:${NC}"
echo "1. Start a LiveKit stream"
echo "2. Check Prisma Studio: http://localhost:5555"
echo "3. Look for isLive = true in Stream table"
echo "4. Join stream as viewer"
echo "5. Check viewerCount increment"
echo "6. Leave stream"
echo "7. Check viewerCount decrement"
echo "8. Stop stream"
echo "9. Check isLive = false and viewerCount = 0"

echo -e "\n${YELLOW}6. Debugging Commands...${NC}"
echo -e "${BLUE}Check logs:${NC}"
echo "tail -f your-terminal-output"
echo ""
echo -e "${BLUE}Test webhook:${NC}"
echo "curl -X POST http://localhost:3000/api/webhooks/livekit \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer your-livekit-token' \\"
echo "  -d '{\"event\":\"ingress_started\",\"ingressInfo\":{\"ingressId\":\"test-123\"}}'"

echo -e "\n${GREEN}🎯 Test complete!${NC}"
echo "============================="
