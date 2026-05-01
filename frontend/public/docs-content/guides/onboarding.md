# Onboarding Guide: Personalization Logic

## Overview

Corridor's onboarding system personalizes the user experience based on their intended use case, ensuring users see only relevant features and get started quickly without confusion.

## User Intent Types

### 1. EWA Only (`ewa_only`)
**Target Users**: Companies wanting to provide Earned Wage Access to employees

**Enabled Features**:
- Employee management
- Advance requests
- Payroll integration
- EWA dashboard

**Dashboard Layout**: EWA-focused with employee list, advance requests, and payroll summary widgets

**Onboarding Flow**: Welcome → Use Case → Business Info → Payment Setup → Complete

### 2. Social Payments (`social_only`)
**Target Users**: Individuals or groups wanting social payment features

**Enabled Features**:
- Crowdfunding goals
- Split payments
- Social feed
- Group payments

**Dashboard Layout**: Social-focused with active goals, recent splits, and social activity widgets

**Onboarding Flow**: Welcome → Use Case → Payment Setup → Complete

### 3. Full Platform (`full_platform`)
**Target Users**: Businesses wanting comprehensive financial operations

**Enabled Features**:
- All EWA features
- All social features
- Invoicing
- Treasury management
- Analytics

**Dashboard Layout**: Full platform with balance overview, transactions, and quick actions

**Onboarding Flow**: Welcome → Use Case → Business Info → Payment Setup → Complete

### 4. API Partner (`api_partner`)
**Target Users**: Developers building on Corridor infrastructure

**Enabled Features**:
- API key management
- Webhook configuration
- Developer documentation
- Usage analytics

**Dashboard Layout**: Developer-focused with API usage, webhook logs, and rate limits

**Onboarding Flow**: Welcome → Use Case → Business Info → Payment Setup → Complete

## Personalization Logic

### Backend Implementation

1. **Intent Detection**: Captured during registration or onboarding
2. **Feature Mapping**: Each intent maps to specific enabled features
3. **Dashboard Configuration**: Layout and widgets determined by intent
4. **Progressive Disclosure**: Additional features suggested over time

### Frontend Implementation

1. **Dynamic Routing**: Different onboarding paths based on selections
2. **Conditional Rendering**: Show/hide features based on access
3. **Feature Discovery**: Gradual introduction of additional capabilities
4. **Contextual Help**: Intent-specific guidance and documentation

## Database Schema

```sql
CREATE TABLE onboarding_profiles (
    user_id INTEGER PRIMARY KEY,
    intent VARCHAR(50) NOT NULL,
    current_step VARCHAR(50) NOT NULL,
    completed_steps JSONB DEFAULT '[]',
    preferences JSONB NOT NULL,
    business_info JSONB DEFAULT '{}',
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

- `POST /api/auth/register` - Create account with optional intent
- `GET /api/onboarding/profile` - Get user's onboarding profile
- `POST /api/onboarding/step` - Update onboarding progress
- `GET /api/dashboard/config` - Get personalized dashboard configuration
- `GET /api/dashboard/features` - Get user's feature access

## Feature Discovery

The system gradually introduces additional features through:

1. **Usage Patterns**: Suggest features based on user behavior
2. **Time-Based**: Show new features after user is established
3. **Contextual**: Recommend features relevant to current actions
4. **Progressive**: Introduce complexity gradually

## Best Practices

### Clear Value Proposition
- Each intent has a clear, focused value proposition
- Features are explained in terms of user benefits
- No overwhelming feature lists

### Non-Confusing Flow
- Linear progression through onboarding
- Clear next steps at each stage
- Ability to skip optional steps

### Tailored Experience
- Dashboard shows only relevant features initially
- Navigation adapts to user's intent
- Help content is contextual

### Growth Path
- Easy to discover and enable additional features
- Smooth transition between intent types
- No feature lock-in or restrictions

## Testing Strategy

1. **Intent-Based Testing**: Test each onboarding path separately
2. **Feature Access**: Verify correct features are enabled/disabled
3. **Dashboard Rendering**: Ensure layouts match intent
4. **Progressive Disclosure**: Test feature discovery timing and relevance

## Metrics & Analytics

Track onboarding effectiveness through:

- Completion rates by intent type
- Time to first value by user type
- Feature adoption rates
- User satisfaction scores
- Support ticket volume by intent

## Future Enhancements

1. **Machine Learning**: Predict optimal feature suggestions
2. **A/B Testing**: Optimize onboarding flows
3. **Industry Templates**: Pre-configured setups for specific industries
4. **Team Onboarding**: Multi-user onboarding for organizations