#!/bin/bash

echo "🔍 Database Update Diagnostic Tool"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}1. Checking Database Connection...${NC}"
DB_TEST=$(curl -s http://localhost:3000/api/health | jq -r '.services.database.status')
if [ "$DB_TEST" = "healthy" ]; then
    echo -e "${GREEN}✅ Database connection healthy${NC}"
else
    echo -e "${RED}❌ Database connection issue${NC}"
    exit 1
fi

echo -e "\n${YELLOW}2. Checking Inngest Functions...${NC}"
INGEST_TEST=$(curl -s http://localhost:3000/api/inngest | jq -r '.function_count')
if [ "$INGEST_TEST" = "4" ]; then
    echo -e "${GREEN}✅ All 4 Inngest functions registered${NC}"
else
    echo -e "${RED}❌ Inngest functions issue - found $INGEST_TEST functions${NC}"
fi

echo -e "\n${YELLOW}3. Testing Database Query Performance...${NC}"
DB_TIME=$(curl -s http://localhost:3000/api/health | jq -r '.services.database.responseTime')
echo -e "${GREEN}✅ Database response time: ${DB_TIME}ms${NC}"

echo -e "\n${YELLOW}4. Checking Stream Data Structure...${NC}"
echo "Let's check if there are any streams in the database..."

# Test a simple database query through the API
echo -e "\n${YELLOW}5. Testing Stream Updates...${NC}"
echo "To test stream updates, you need to:"
echo "1. Start a LiveKit stream"
echo "2. Check if isLive updates to true"
echo "3. Join the stream as a viewer"
echo "4. Check if viewerCount increments"
echo "5. Leave the stream"
echo "6. Check if viewerCount decrements"
echo "7. Stop the stream"
echo "8. Check if isLive updates to false and viewerCount resets to 0"

echo -e "\n${YELLOW}6. Manual Database Check...${NC}"
echo "Open Prisma Studio at: http://localhost:5555"
echo "Check the Stream table for:"
echo "- isLive field updates"
echo "- viewerCount field updates"
echo "- updatedAt timestamps"

echo -e "\n${YELLOW}7. Common Issues to Check...${NC}"
echo "1. LiveKit webhook URL configured correctly"
echo "2. Inngest functions are running"
echo "3. Database transactions are working"
echo "4. Event data is being sent correctly"

echo -e "\n${GREEN}🎯 Diagnostic complete!${NC}"
echo "=================================="
