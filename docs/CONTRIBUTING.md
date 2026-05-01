# Contributing to Corridor

Thank you for your interest in contributing to Corridor! This guide will help you get started with development and understand our contribution process.

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** - For development environment
- **Go 1.21+** - For backend development
- **Node.js 18+** - For frontend development
- **Git** - Version control

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/corridor.git
   cd corridor
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development environment**
   ```bash
   make dev
   # or
   docker-compose up --build
   ```

4. **Verify setup**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000
   - API Gateway: http://localhost:8080

## 📋 Development Guidelines

### Code Style

#### Go Backend
- **Formatting**: Use `gofmt` and `goimports`
- **Linting**: Run `golangci-lint run`
- **Naming**: Follow Go naming conventions
- **Error Handling**: Always handle errors explicitly
- **Testing**: Write tests for all business logic

```go
// Good
func (s *Service) ProcessPayment(ctx context.Context, req PaymentRequest) (*Payment, error) {
    if err := req.Validate(); err != nil {
        return nil, fmt.Errorf("invalid request: %w", err)
    }
    
    payment, err := s.paymentRepo.Create(ctx, req)
    if err != nil {
        return nil, fmt.Errorf("failed to create payment: %w", err)
    }
    
    return payment, nil
}
```

#### TypeScript Frontend
- **Formatting**: Use Prettier with our config
- **Linting**: ESLint with TypeScript rules
- **Types**: Prefer explicit types over `any`
- **Components**: Use functional components with hooks
- **Testing**: Jest for unit tests, React Testing Library for components

```typescript
// Good
interface PaymentFormProps {
  onSubmit: (payment: PaymentRequest) => Promise<void>;
  loading?: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, loading = false }) => {
  const [amount, setAmount] = useState<string>('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ amount: parseFloat(amount) });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form content */}
    </form>
  );
};
```

### Git Workflow

#### Branch Naming
- **Features**: `feature/payment-processing`
- **Bug fixes**: `fix/authentication-error`
- **Documentation**: `docs/api-updates`
- **Refactoring**: `refactor/database-layer`

#### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(payments): add Paystack integration
fix(auth): resolve JWT token expiration issue
docs(api): update webhook documentation
refactor(core): simplify payment processing logic
test(ewa): add unit tests for advance calculations
```

#### Pull Request Process

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat(scope): description of changes"
   ```

3. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **PR Requirements**
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes
   - Tests passing
   - Code review approval

## 🧪 Testing Requirements

### Backend Testing
```bash
# Run all tests
cd backend && go test ./...

# Run with coverage
cd backend && go test -cover ./...

# Run specific package
cd backend && go test ./internal/core/...
```

**Test Structure:**
```go
func TestPaymentService_ProcessPayment(t *testing.T) {
    tests := []struct {
        name    string
        request PaymentRequest
        want    *Payment
        wantErr bool
    }{
        {
            name: "valid payment",
            request: PaymentRequest{Amount: 100.00, Currency: "USD"},
            want: &Payment{ID: "123", Amount: 100.00},
            wantErr: false,
        },
        // more test cases
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // test implementation
        })
    }
}
```

### Frontend Testing
```bash
# Run tests
cd frontend && npm test

# Run with coverage
cd frontend && npm run test:coverage

# Run specific test
cd frontend && npm test PaymentForm
```

**Test Structure:**
```typescript
describe('PaymentForm', () => {
  it('should submit payment with valid data', async () => {
    const mockSubmit = jest.fn();
    render(<PaymentForm onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } });
    fireEvent.click(screen.getByText('Submit'));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({ amount: 100 });
    });
  });
});
```

## 📚 Documentation Standards

### Code Documentation
- **Go**: Use godoc format for public functions
- **TypeScript**: Use JSDoc for complex functions
- **README**: Update relevant README files
- **API**: Update OpenAPI spec for API changes

### Documentation Updates
When making changes that affect:
- **API endpoints**: Update `docs/api/openapi.yaml`
- **Features**: Update `docs/FEATURES.md`
- **Architecture**: Update `docs/ARCHITECTURE.md`
- **Setup process**: Update main `README.md`

## 🔍 Code Review Process

### Review Checklist

#### Functionality
- [ ] Code works as intended
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] Performance considerations addressed

#### Code Quality
- [ ] Code is readable and well-structured
- [ ] Follows established patterns
- [ ] No code duplication
- [ ] Appropriate abstractions

#### Testing
- [ ] Tests cover new functionality
- [ ] Tests are meaningful and not just for coverage
- [ ] Integration tests for API changes
- [ ] Manual testing performed

#### Security
- [ ] Input validation implemented
- [ ] Authentication/authorization checked
- [ ] No sensitive data exposed
- [ ] SQL injection prevention

#### Documentation
- [ ] Code is self-documenting
- [ ] Complex logic is commented
- [ ] API documentation updated
- [ ] README updates if needed

### Review Timeline
- **Small changes**: 1-2 business days
- **Medium changes**: 2-3 business days
- **Large changes**: 3-5 business days
- **Critical fixes**: Same day

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Release Checklist
1. **Pre-release**
   - [ ] All tests passing
   - [ ] Documentation updated
   - [ ] CHANGELOG.md updated
   - [ ] Version numbers bumped

2. **Release**
   - [ ] Create release branch
   - [ ] Deploy to staging
   - [ ] Run integration tests
   - [ ] Deploy to production
   - [ ] Create GitHub release

3. **Post-release**
   - [ ] Monitor for issues
   - [ ] Update documentation site
   - [ ] Announce to stakeholders

## 🐛 Bug Reports

### Bug Report Template
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional context**
Any other context about the problem.
```

## 💡 Feature Requests

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## 🤝 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain professional communication

### Getting Help
- **Technical questions**: GitHub Discussions
- **Bug reports**: GitHub Issues
- **Feature requests**: GitHub Issues
- **Security issues**: security@corridor.com

## 📞 Contact

- **Maintainers**: @corridor-team
- **Email**: dev@corridor.com
- **Discord**: [Corridor Community](https://discord.gg/corridor)

---

Thank you for contributing to Corridor! 🎉