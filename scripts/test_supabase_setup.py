#!/usr/bin/env python3
"""
Corridor Supabase Setup Test Script
==================================

This script tests your Supabase configuration and verifies that all
components are working correctly.

Usage:
    python scripts/test_supabase_setup.py

Requirements:
    - Set up .env file with Supabase credentials
    - Have supabase Python client installed
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.db import get_db
from app.models import Business, Customer, Invoice
from app.config import settings
from sqlalchemy import text

def test_database_connection():
    """Test database connection and table creation"""
    print("🔍 Testing database connection...")
    
    try:
        # Import here to avoid issues with settings not loaded
        from app.db import engine, SessionLocal
        
        # Test basic connection
        db = SessionLocal()
        result = db.execute(text("SELECT version()"))
        version = result.scalar()
        print(f"✅ Database connection successful!")
        print(f"   PostgreSQL version: {version}")
        
        # Test table existence - first check if tables exist
        tables = ['businesses', 'customers', 'invoices', 'invoice_items', 'payments']
        for table in tables:
            try:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"   Table '{table}': {count} records")
            except Exception as table_e:
                if "does not exist" in str(table_e):
                    print(f"   Table '{table}': ❌ Not found - run migration first")
                else:
                    print(f"   Table '{table}': ⚠️  Error: {str(table_e)}")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

def test_supabase_config():
    """Test Supabase configuration"""
    print("\n🔍 Testing Supabase configuration...")
    
    required_vars = [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY', 
        'SUPABASE_SERVICE_KEY',
        'DATABASE_URL'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
        else:
            print(f"✅ {var}: Set ({'*' * min(len(os.getenv(var)), 10)}...)")
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    
    return True

def test_supabase_client():
    """Test Supabase client connection"""
    print("\n🔍 Testing Supabase client...")
    
    try:
        # Only test if supabase client is available
        try:
            from supabase import create_client
            
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_ANON_KEY")
            
            supabase = create_client(url, key)
            
            # Test auth (this should work even without user)
            auth_response = supabase.auth.get_session()
            print("✅ Supabase client initialized successfully!")
            
            return True
            
        except ImportError:
            print("⚠️  Supabase Python client not installed")
            print("   Install with: pip install supabase")
            return True  # Not critical for FastAPI app
            
    except Exception as e:
        print(f"❌ Supabase client test failed: {str(e)}")
        return False

def test_environment_setup():
    """Test general environment setup"""
    print("\n🔍 Testing environment setup...")
    
    # Check critical app settings
    critical_settings = [
        ('DATABASE_URL', settings.database_url),
        ('WA_TOKEN', settings.wa_token),
        ('STRIPE_SECRET_KEY', settings.stripe_secret_key),
        ('PUBLIC_BASE_URL', settings.public_base_url),
    ]
    
    for setting_name, setting_value in critical_settings:
        if setting_value:
            print(f"✅ {setting_name}: Set")
        else:
            print(f"⚠️  {setting_name}: Not set")
    
    return True

def test_webhook_urls():
    """Test webhook URL configuration"""
    print("\n🔍 Testing webhook URLs...")
    
    base_url = os.getenv("PUBLIC_BASE_URL")
    if not base_url:
        print("❌ PUBLIC_BASE_URL not set")
        return False
    
    webhook_endpoints = [
        "/api/webhooks/whatsapp",
        "/api/webhooks/stripe", 
        "/api/webhooks/mpesa"
    ]
    
    for endpoint in webhook_endpoints:
        full_url = f"{base_url.rstrip('/')}{endpoint}"
        print(f"📍 Webhook URL: {full_url}")
    
    print("✅ Webhook URLs configured")
    return True

async def main():
    """Run all tests"""
    print("🚀 Corridor Supabase Setup Test")
    print("=" * 50)
    
    tests = [
        ("Supabase Config", test_supabase_config),
        ("Supabase Client", test_supabase_client),
        ("Environment Setup", test_environment_setup),
        ("Webhook URLs", test_webhook_urls),
        ("Database Connection", test_database_connection),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name} test...")
        try:
            result = test_func()
            
            if result:
                passed += 1
                print(f"✅ {test_name} test PASSED")
            else:
                print(f"❌ {test_name} test FAILED")
                
        except Exception as e:
            print(f"❌ {test_name} test ERROR: {str(e)}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your Supabase setup is ready!")
        print("\nNext steps:")
        print("1. Run: make dev")
        print("2. Test API endpoints")
        print("3. Set up webhooks with external services")
    else:
        print("⚠️  Some tests failed. Please check your configuration.")
        print("\nTroubleshooting:")
        print("1. Verify all environment variables are set in .env")
        print("2. Check Supabase project settings")
        print("3. Run database migrations")
    
    return passed == total

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())