#!/bin/bash

# VocalClerk .NET 8 API 测试脚本
# 此脚本测试主要的 API 端点以确保功能正常

API_URL="http://localhost:5000"
echo "Testing VocalClerk API at $API_URL"
echo "========================================"

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
PASSED=0
FAILED=0

# 测试函数
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    local headers=$6
    
    echo -e "\n${YELLOW}Testing: $name${NC}"
    echo "Endpoint: $method $endpoint"
    
    if [ -z "$data" ]; then
        if [ -z "$headers" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" -H "$headers")
        fi
    else
        if [ -z "$headers" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "$headers" \
                -d "$data")
        fi
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Status: $status_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
        FAILED=$((FAILED + 1))
    fi
}

# 1. 测试注册
echo -e "\n${YELLOW}=== 测试用户注册 ===${NC}"
REGISTER_DATA='{
  "username": "testuser_'$(date +%s)'",
  "email": "test_'$(date +%s)'@example.com",
  "password": "Test123456"
}'
test_endpoint "用户注册" "POST" "/auth/register" "$REGISTER_DATA" 201

# 2. 测试登录
echo -e "\n${YELLOW}=== 测试用户登录 ===${NC}"
LOGIN_DATA='{
  "username": "testuser",
  "password": "password123"
}'
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}注意: 无法获取令牌，可能需要先创建测试用户${NC}"
    echo "创建测试用户..."
    REGISTER_TEST_DATA='{
      "username": "testuser",
      "email": "testuser@example.com",
      "password": "password123"
    }'
    curl -s -X POST "$API_URL/auth/register" \
        -H "Content-Type: application/json" \
        -d "$REGISTER_TEST_DATA" > /dev/null
    
    # 重新登录
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "$LOGIN_DATA")
    TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

if [ ! -z "$TOKEN" ]; then
    echo -e "${GREEN}✓ 登录成功，获取到令牌${NC}"
    echo "Token (前20字符): ${TOKEN:0:20}..."
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}✗ 登录失败，无法获取令牌${NC}"
    FAILED=$((FAILED + 1))
    echo "Response: $LOGIN_RESPONSE"
fi

# 3. 测试获取任务列表（需要认证）
echo -e "\n${YELLOW}=== 测试获取任务列表 ===${NC}"
if [ ! -z "$TOKEN" ]; then
    test_endpoint "获取任务列表" "GET" "/tasks" "" 200 "Authorization: Bearer $TOKEN"
else
    echo -e "${RED}跳过：没有有效的令牌${NC}"
    FAILED=$((FAILED + 1))
fi

# 4. 测试创建任务（需要认证）
echo -e "\n${YELLOW}=== 测试创建任务 ===${NC}"
if [ ! -z "$TOKEN" ]; then
    CREATE_TASK_DATA='{
      "title": "测试任务 - '$(date +%Y-%m-%d\ %H:%M:%S)'",
      "description": "这是一个测试任务",
      "priority": "HIGH",
      "dueDate": "'$(date -u -d "+1 day" +%Y-%m-%dT%H:%M:%S)'"
    }'
    test_endpoint "创建任务" "POST" "/tasks" "$CREATE_TASK_DATA" 201 "Authorization: Bearer $TOKEN"
else
    echo -e "${RED}跳过：没有有效的令牌${NC}"
    FAILED=$((FAILED + 1))
fi

# 5. 测试获取今日任务（需要认证）
echo -e "\n${YELLOW}=== 测试获取今日任务 ===${NC}"
if [ ! -z "$TOKEN" ]; then
    test_endpoint "获取今日任务" "GET" "/tasks/today" "" 200 "Authorization: Bearer $TOKEN"
else
    echo -e "${RED}跳过：没有有效的令牌${NC}"
    FAILED=$((FAILED + 1))
fi

# 6. 测试 Swagger 文档
echo -e "\n${YELLOW}=== 测试 Swagger 文档 ===${NC}"
test_endpoint "Swagger UI" "GET" "/swagger/index.html" "" 200

# 总结
echo -e "\n========================================"
echo -e "${YELLOW}测试总结${NC}"
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo -e "总计: $((PASSED + FAILED))"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ 所有测试通过！${NC}"
    exit 0
else
    echo -e "\n${RED}✗ 有测试失败${NC}"
    exit 1
fi
