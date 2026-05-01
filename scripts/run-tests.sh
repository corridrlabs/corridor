#!/bin/bash

# Comprehensive Test Suite Runner for Corridor

set -e

echo "🧪 Running Corridor Comprehensive Test Suite"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test_suite() {
    local suite_name=$1
    local test_path=$2
    
    echo -e "\n${YELLOW}Running $suite_name...${NC}"
    
    if cd $test_path && go test -v -cover ./...; then
        echo -e "${GREEN}✅ $suite_name PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ $suite_name FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    cd - > /dev/null
}

run_frontend_tests() {
    echo -e "\n${YELLOW}Running Frontend Tests...${NC}"
    
    if cd frontend && npm test -- --coverage --watchAll=false; then
        echo -e "${GREEN}✅ Frontend Tests PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ Frontend Tests FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    cd - > /dev/null
}

# Backend Unit Tests
echo -e "\n${YELLOW}🔧 Backend Unit Tests${NC}"
run_test_suite "Tier Management" "backend/internal/core"
run_test_suite "Payment Rails" "backend/internal/core"
run_test_suite "Split Payments" "backend/internal/core"
run_test_suite "EWA Engine" "backend/internal/core"
run_test_suite "Middleware" "backend/internal/middleware"
run_test_suite "Paystack Client" "backend/internal/paystack"

# Integration Tests
echo -e "\n${YELLOW}🔗 Integration Tests${NC}"
run_test_suite "API Integration" "backend/tests/integration"
run_test_suite "Payment Flow" "backend/tests/integration"
run_test_suite "EWA Flow" "backend/tests/integration"

# Frontend Tests
echo -e "\n${YELLOW}⚛️ Frontend Tests${NC}"
run_frontend_tests

# Test Coverage Report
echo -e "\n${YELLOW}📊 Generating Coverage Report...${NC}"
cd backend && go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html
echo "Coverage report generated: backend/coverage.html"
cd - > /dev/null

# Summary
echo -e "\n=========================================="
echo -e "${YELLOW}📋 Test Summary${NC}"
echo -e "Total Test Suites: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Coverage target: 80%+${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please review and fix.${NC}"
    exit 1
fi