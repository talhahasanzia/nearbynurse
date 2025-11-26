#!/bin/bash
# Test script for Keycloak authentication

set -e

echo "🧪 Keycloak Authentication Test Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are running
echo "📋 Checking services..."
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${RED}❌ Services not running. Start with: docker-compose up -d${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Services are running${NC}"
echo ""

# Wait for Keycloak
echo "⏳ Waiting for Keycloak to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:8080/realms/master/.well-known/openid-configuration > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Keycloak is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Keycloak did not start in time${NC}"
        exit 1
    fi
    echo -n "."
    sleep 2
done
echo ""

# Test public endpoint
echo "🌐 Testing public endpoint (GET /)..."
RESPONSE=$(curl -s http://localhost:3000/)
if [[ "$RESPONSE" == *"Hello"* ]]; then
    echo -e "${GREEN}✅ Public endpoint works: $RESPONSE${NC}"
else
    echo -e "${RED}❌ Public endpoint failed${NC}"
    exit 1
fi
echo ""

# Test protected endpoint without token (should fail)
echo "🔒 Testing protected endpoint without token (should fail)..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/me)
if [ "$STATUS" == "401" ]; then
    echo -e "${GREEN}✅ Protected endpoint correctly returns 401${NC}"
else
    echo -e "${RED}❌ Expected 401, got $STATUS${NC}"
fi
echo ""

# Check if test user exists
echo "👤 Checking for test user..."
echo -e "${YELLOW}ℹ️  If you haven't created a test user yet, follow KEYCLOAK-SETUP.md${NC}"
echo ""

# Try to get token (will fail if user doesn't exist)
echo "🎫 Attempting to get access token..."
echo "   Username: testuser"
echo "   Password: password123"
echo ""

TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testuser" \
  -d "password=password123" \
  -d "grant_type=password" \
  -d "client_id=nearbynurse-backend" 2>&1)

if echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
    TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo -e "${GREEN}✅ Successfully obtained access token${NC}"
    echo ""

    # Test protected endpoint with token
    echo "🔓 Testing protected endpoint with token..."
    RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/me)
    if echo "$RESPONSE" | grep -q "user"; then
        echo -e "${GREEN}✅ Protected endpoint works with token${NC}"
        echo "Response: $RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    else
        echo -e "${RED}❌ Protected endpoint failed with token${NC}"
        echo "Response: $RESPONSE"
    fi
    echo ""

    # Test demo protected endpoint
    echo "🎯 Testing /demo/protected..."
    DEMO_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/demo/protected)
    if echo "$DEMO_RESPONSE" | grep -q "ok"; then
        echo -e "${GREEN}✅ Demo protected endpoint works${NC}"
        echo "Response: $DEMO_RESPONSE"
    else
        echo -e "${RED}❌ Demo protected endpoint failed${NC}"
    fi
    echo ""

    # Test admin endpoint (might fail if no admin role)
    echo "👑 Testing /demo/admin-only..."
    ADMIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" http://localhost:3000/demo/admin-only)
    if [ "$ADMIN_STATUS" == "200" ]; then
        echo -e "${GREEN}✅ Admin endpoint works (user has admin role)${NC}"
    elif [ "$ADMIN_STATUS" == "403" ]; then
        echo -e "${YELLOW}⚠️  Admin endpoint returned 403 (user doesn't have admin role)${NC}"
        echo -e "${YELLOW}   To fix: Assign 'admin' role to testuser in Keycloak${NC}"
    else
        echo -e "${RED}❌ Admin endpoint returned unexpected status: $ADMIN_STATUS${NC}"
    fi
    echo ""

else
    echo -e "${YELLOW}⚠️  Could not get access token${NC}"
    echo "Error: $TOKEN_RESPONSE" | head -5
    echo ""
    echo -e "${YELLOW}📝 Setup Required:${NC}"
    echo "1. Open http://localhost:8080"
    echo "2. Login with admin:admin"
    echo "3. Create a test user (see KEYCLOAK-SETUP.md)"
    echo "4. Run this script again"
    exit 0
fi

echo ""
echo "======================================"
echo -e "${GREEN}🎉 All tests completed!${NC}"
echo ""
echo "📚 Next steps:"
echo "   - Read KEYCLOAK-SETUP.md for detailed setup"
echo "   - Create more users and roles in Keycloak"
echo "   - Integrate Keycloak JS client in frontend"
echo ""

