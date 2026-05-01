# Social Payments Feature Documentation

## Overview

The Social Payments feature transforms Corridor into the most intuitive group payment experience possible, enabling seamless crowdfunding, bill splitting, and collaborative purchasing.

## Core Features

### 1. Enhanced Social Goals

**Multi-Currency Support**
- Support for USD, KES, and USDC
- Automatic currency conversion at contribution time
- Real-time exchange rate integration

**Visibility Controls**
- Private goals (visible only to creator)
- Public goals (discoverable by all users)
- Shareable links for both types

**Goal Templates**
- Pre-built templates for common use cases
- Birthday gifts, group gifts, emergency funds
- Business startups, education, travel

**Real-Time Updates**
- Webhook notifications for contributions
- Live progress tracking
- Contributor notifications

### 2. Split Payments

**Group Purchase Management**
- Create split requests with item details
- Automatic participant amount calculation
- Email/SMS invite system with unique tokens

**Payment Tracking**
- Real-time status updates for each participant
- Visual indicators for paid/pending status
- Automatic purchase trigger when fully funded

**Smart Refund Logic**
- Automatic refunds if goal fails
- Partial refund support
- Transparent refund processing

## API Endpoints

### Social Goals

```http
POST /api/social/goals
GET /api/social/goals?public=true
GET /api/social/goals/{id}
POST /api/social/goals/{id}/contribute
```

### Split Payments

```http
POST /api/split-payments
GET /api/split-payments
GET /api/split-payments/{id}
POST /api/split-payments/pay
```

## Use Cases

### 1. Birthday Gift Collection
**Scenario**: Friends want to pool money for a surprise birthday gift

**Flow**:
1. Create goal using "Birthday Gift" template
2. Set target amount and make it private
3. Share link with close friends via WhatsApp
4. Track contributions in real-time
5. Purchase gift when target is reached

**Benefits**:
- No awkward money conversations
- Transparent contribution tracking
- Automatic purchase when funded

### 2. Group Dinner Split
**Scenario**: Split restaurant bill among friends

**Flow**:
1. Create split payment for dinner total
2. Add participants' email addresses
3. System sends payment links to each person
4. Track who has paid their share
5. Automatic completion when all paid

**Benefits**:
- No manual calculation needed
- Clear payment status for everyone
- Eliminates the "who owes what" confusion

### 3. Emergency Fundraising
**Scenario**: Raise funds quickly for medical emergency

**Flow**:
1. Use "Emergency Fund" template
2. Make goal public for maximum reach
3. Share across social media platforms
4. Accept multiple currencies with auto-conversion
5. Real-time updates to supporters

**Benefits**:
- Rapid fund collection
- Multi-currency support
- Transparent progress tracking

### 4. Group Gift for Colleague
**Scenario**: Office colleagues pooling for farewell gift

**Flow**:
1. Create private group gift goal
2. Share link in team chat
3. Set suggested contribution amounts
4. Auto-purchase when target reached
5. Send thank you to all contributors

**Benefits**:
- Professional and organized
- Optional anonymity for contributors
- Automated gift purchasing

### 5. Startup Crowdfunding
**Scenario**: Entrepreneur raising seed funding

**Flow**:
1. Use "Business Startup" template
2. Add detailed business plan
3. Make goal public for discovery
4. Offer rewards/equity to contributors
5. Regular progress updates

**Benefits**:
- Professional presentation
- Built-in reward system
- Investor communication tools

### 6. Study Abroad Funding
**Scenario**: Student raising money for education

**Flow**:
1. Create education fund goal
2. Share academic achievements
3. Explain impact of education
4. Accept micro-contributions
5. Thank supporters with updates

**Benefits**:
- Emotional connection with supporters
- Easy sharing across networks
- Progress celebration features

## Technical Implementation

### Backend Architecture

**Enhanced Social Goals Handler**
- Multi-currency support with real-time conversion
- Template system for quick goal creation
- Webhook integration for real-time updates
- Privacy controls for goal visibility

**Split Payments Core Service**
- Participant management with invite tokens
- Payment status tracking
- Auto-purchase logic when fully funded
- Smart refund processing

**Database Schema Updates**
```sql
-- Add visibility and template support
ALTER TABLE social_goals ADD COLUMN is_public BOOLEAN DEFAULT true;
ALTER TABLE social_goals ADD COLUMN template_id VARCHAR(50);

-- Split payments tables
CREATE TABLE split_requests (
    id UUID PRIMARY KEY,
    creator_id UUID REFERENCES accounts(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    item_link TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE split_participants (
    id UUID PRIMARY KEY,
    split_id UUID REFERENCES split_requests(id),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'INVITED',
    invite_token VARCHAR(50) UNIQUE,
    paid_at TIMESTAMP
);
```

### Frontend Components

**Enhanced Goals Page**
- Template selection interface
- Public/private goal discovery
- Multi-currency support
- Real-time progress updates

**Split Payment Interface**
- Intuitive participant management
- Visual payment status tracking
- One-click sharing capabilities
- Mobile-optimized design

**Share Goal Component**
- Native social media integration
- WhatsApp, Twitter, Email sharing
- Copy-to-clipboard functionality
- Custom message templates

## Security & Compliance

**Payment Security**
- PCI DSS compliant payment processing
- Encrypted payment data storage
- Secure invite token generation
- Fraud detection and prevention

**Privacy Controls**
- Granular visibility settings
- Anonymous contribution options
- GDPR compliant data handling
- User consent management

**Financial Compliance**
- Multi-jurisdiction regulatory compliance
- AML/KYC integration for large amounts
- Transaction monitoring and reporting
- Audit trail maintenance

## Performance Optimizations

**Real-Time Updates**
- WebSocket connections for live progress
- Efficient database queries with indexing
- Caching for frequently accessed goals
- CDN integration for static assets

**Mobile Optimization**
- Progressive Web App (PWA) support
- Offline capability for viewing goals
- Touch-optimized interface design
- Fast loading with lazy loading

## Analytics & Insights

**Goal Performance Metrics**
- Contribution velocity tracking
- Conversion rate optimization
- Popular template analysis
- Geographic contribution patterns

**User Engagement Analytics**
- Share-to-contribution ratios
- Template usage statistics
- Payment method preferences
- Time-to-completion analysis

## Future Enhancements

**Advanced Features**
- AI-powered goal optimization suggestions
- Smart notification timing
- Predictive funding success rates
- Automated thank you messages

**Integration Opportunities**
- Social media platform integration
- E-commerce platform connections
- Calendar integration for event-based goals
- CRM integration for business users

## Success Metrics

**User Experience**
- Goal completion rate: >85%
- Average time to first contribution: <2 minutes
- User satisfaction score: >4.5/5
- Share-to-contribution conversion: >15%

**Business Impact**
- Transaction volume growth: >200% monthly
- User retention improvement: >40%
- Average goal size increase: >150%
- Platform fee revenue growth: >300%

This social payments feature positions Corridor as the definitive platform for group financial coordination, combining the simplicity of Venmo with the power of Kickstarter in a seamless, intuitive experience.