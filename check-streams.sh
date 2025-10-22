#!/bin/bash

echo "🔍 Database Stream Check"
echo "======================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}Checking your database for streams...${NC}"

# Check if there are any streams
echo -e "\n${YELLOW}1. Open Prisma Studio:${NC}"
echo "   http://localhost:5555"
echo "   → Click on 'Stream' table"
echo "   → Check if you have any streams"

echo -e "\n${YELLOW}2. If you have NO streams:${NC}"
echo -e "${RED}❌ This is why database updates aren't working!${NC}"
echo ""
echo -e "${BLUE}To create a stream:${NC}"
echo "1. Go to your app: http://localhost:3000"
echo "2. Sign in to your account"
echo "3. Go to your dashboard"
echo "4. Create a new stream"
echo "5. Start streaming with LiveKit"

echo -e "\n${YELLOW}3. If you HAVE streams:${NC}"
echo -e "${GREEN}✅ Good! Now test the updates:${NC}"
echo ""
echo -e "${BLUE}Test stream updates:${NC}"
echo "1. Start your LiveKit stream"
echo "2. Watch Prisma Studio for isLive = true"
echo "3. Join as a viewer"
echo "4. Watch viewerCount increment"
echo "5. Leave as viewer"
echo "6. Watch viewerCount decrement"
echo "7. Stop stream"
echo "8. Watch isLive = false, viewerCount = 0"

echo -e "\n${YELLOW}4. Common Issues:${NC}"
echo "• No streams created yet"
echo "• LiveKit not configured"
echo "• Webhook URL not set in LiveKit"
echo "• Inngest keys missing (we already checked this)"

echo -e "\n${GREEN}🎯 Next Steps:${NC}"
echo "1. Check Prisma Studio for streams"
echo "2. If no streams → Create one first"
echo "3. If streams exist → Test LiveKit events"
echo "4. Watch database updates in real-time"

echo -e "\n${BLUE}Prisma Studio: http://localhost:5555${NC}"
echo "======================="
