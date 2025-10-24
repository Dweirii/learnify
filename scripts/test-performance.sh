#!/bin/bash

echo "🚀 Learnify Performance Test Suite"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo -e "\n${YELLOW}1. Testing System Health...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    echo -e "${GREEN}✅ All services healthy${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo "$HEALTH_RESPONSE"
fi

# Test 2: Homepage Load Time
echo -e "\n${YELLOW}2. Testing Homepage Performance...${NC}"
HOMEPAGE_TIME=$(curl -w "%{time_total}" -o /dev/null -s http://localhost:3000)
echo -e "${GREEN}✅ Homepage loaded in ${HOMEPAGE_TIME}s${NC}"

# Test 3: Inngest Functions
echo -e "\n${YELLOW}3. Testing Inngest Functions...${NC}"
INGEST_RESPONSE=$(curl -s http://localhost:3000/api/inngest)
if echo "$INGEST_RESPONSE" | grep -q '"function_count":4'; then
    echo -e "${GREEN}✅ All 4 Inngest functions registered${NC}"
else
    echo -e "${RED}❌ Inngest functions issue${NC}"
    echo "$INGEST_RESPONSE"
fi

# Test 4: Database Connection
echo -e "\n${YELLOW}4. Testing Database Performance...${NC}"
DB_TIME=$(curl -w "%{time_total}" -o /dev/null -s "http://localhost:3000/api/health" | grep -o '"responseTime":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}✅ Database response time: ${DB_TIME}ms${NC}"

# Test 5: Redis Connection
echo -e "\n${YELLOW}5. Testing Redis Performance...${NC}"
REDIS_TIME=$(curl -s http://localhost:3000/api/health | grep -o '"redis":{"status":"[^"]*","responseTime":[0-9]*' | grep -o '[0-9]*$')
echo -e "${GREEN}✅ Redis response time: ${REDIS_TIME}ms${NC}"

echo -e "\n${GREEN}🎉 Performance test complete!${NC}"
echo "=================================="
