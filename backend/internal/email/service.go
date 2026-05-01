package email

import (
	"bytes"
	"context"
	"fmt"
	"html/template"
	"os"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ses"
	"github.com/aws/aws-sdk-go-v2/service/ses/types"
)

type Config struct {
	AccessKeyID     string
	SecretAccessKey string
	Region          string
	From            string
}

type Service struct {
	config *Config
	client *ses.Client
}

func NewService(cfg *Config) (*Service, error) {
	// Create AWS configuration
	awsCfg, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion(cfg.Region),
		config.WithCredentialsProvider(aws.CredentialsProviderFunc(func(ctx context.Context) (aws.Credentials, error) {
			return aws.Credentials{
				AccessKeyID:     cfg.AccessKeyID,
				SecretAccessKey: cfg.SecretAccessKey,
			}, nil
		})),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %w", err)
	}

	// Create SES client
	client := ses.NewFromConfig(awsCfg)

	return &Service{
		config: cfg,
		client: client,
	}, nil
}

// EmailType represents different email templates
type EmailType string

const (
	EmailTypeOTP             EmailType = "otp"
	EmailTypePaymentReceived EmailType = "payment_received"
	EmailTypeInviteToClaim   EmailType = "invite_claim"
	EmailTypeWithdrawal      EmailType = "withdrawal"
	EmailTypeAccountUpdate   EmailType = "account_update"
	EmailTypeSecurityAlert   EmailType = "security_alert"
	EmailTypeWelcome         EmailType = "welcome"
)

// EmailData holds the data for email templates
type EmailData struct {
	RecipientName  string
	RecipientEmail string
	Subject        string
	Data           map[string]interface{}
}

// Send sends an email using AWS SES
func (s *Service) Send(to, subject, htmlBody string) error {
	// Create the email input
	input := &ses.SendEmailInput{
		Destination: &types.Destination{
			ToAddresses: []string{to},
		},
		Message: &types.Message{
			Body: &types.Body{
				Html: &types.Content{
					Charset: aws.String("UTF-8"),
					Data:    aws.String(htmlBody),
				},
			},
			Subject: &types.Content{
				Charset: aws.String("UTF-8"),
				Data:    aws.String(subject),
			},
		},
		Source: aws.String(s.config.From),
	}

	// Send the email
	_, err := s.client.SendEmail(context.TODO(), input)
	if err != nil {
		return fmt.Errorf("failed to send email via SES: %w", err)
	}

	return nil
}

// SendOTP sends an OTP verification email
func (s *Service) SendOTP(to, name, code string) error {
	subject := "Your Corridor Verification Code"
	data := map[string]interface{}{
		"Name": name,
		"Code": code,
	}
	html, err := s.renderTemplate(EmailTypeOTP, data)
	if err != nil {
		return err
	}
	return s.Send(to, subject, html)
}

// SendPaymentNotification sends a payment received notification
func (s *Service) SendPaymentNotification(to, recipientName, senderName string, amount float64, currency string) error {
	subject := fmt.Sprintf("You received %s %.2f from %s", currency, amount, senderName)
	data := map[string]interface{}{
		"RecipientName": recipientName,
		"SenderName":    senderName,
		"Amount":        amount,
		"Currency":      currency,
	}
	html, err := s.renderTemplate(EmailTypePaymentReceived, data)
	if err != nil {
		return err
	}
	return s.Send(to, subject, html)
}

// SendInviteToClaim sends an invite email for non-users to claim funds
func (s *Service) SendInviteToClaim(to, senderName string, amount float64, currency, claimLink string) error {
	subject := fmt.Sprintf("%s sent you %s %.2f - Claim Now", senderName, currency, amount)
	data := map[string]interface{}{
		"SenderName": senderName,
		"Amount":     amount,
		"Currency":   currency,
		"ClaimLink":  claimLink,
	}
	html, err := s.renderTemplate(EmailTypeInviteToClaim, data)
	if err != nil {
		return err
	}
	return s.Send(to, subject, html)
}

// SendWithdrawalConfirmation sends a withdrawal confirmation email
func (s *Service) SendWithdrawalConfirmation(to, name, destination string, amount float64, currency string) error {
	subject := fmt.Sprintf("Withdrawal of %s %.2f to %s Confirmed", currency, amount, destination)
	data := map[string]interface{}{
		"Name":        name,
		"Amount":      amount,
		"Currency":    currency,
		"Destination": destination,
	}
	html, err := s.renderTemplate(EmailTypeWithdrawal, data)
	if err != nil {
		return err
	}
	return s.Send(to, subject, html)
}

// SendAccountUpdate sends an account update notification
func (s *Service) SendAccountUpdate(to, name, updateType string) error {
	subject := "Your Corridor Account Settings Updated"
	data := map[string]interface{}{
		"Name":       name,
		"UpdateType": updateType,
	}
	html, err := s.renderTemplate(EmailTypeAccountUpdate, data)
	if err != nil {
		return err
	}
	return s.Send(to, subject, html)
}

// SendSecurityAlert sends a security alert email
func (s *Service) SendSecurityAlert(to, name, alertType, details string) error {
	subject := fmt.Sprintf("Security Alert: %s", alertType)
	data := map[string]interface{}{
		"Name":      name,
		"AlertType": alertType,
		"Details":   details,
	}
	html, err := s.renderTemplate(EmailTypeSecurityAlert, data)
	if err != nil {
		return err
	}
	return s.Send(to, subject, html)
}

// SendWelcome sends a welcome email to new users
func (s *Service) SendWelcome(to, name string) error {
	subject := "Welcome to Corridor - Your Borderless Payment Platform"
	data := map[string]interface{}{
		"Name": name,
	}
	html, err := s.renderTemplate(EmailTypeWelcome, data)
	if err != nil {
		return err
	}
	return s.Send(to, subject, html)
}

// renderTemplate renders an email template with the given data
func (s *Service) renderTemplate(emailType EmailType, data map[string]interface{}) (string, error) {
	tmpl, err := template.New(string(emailType)).Parse(getTemplate(emailType))
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

// getTemplate returns the HTML template for the given email type
func getTemplate(emailType EmailType) string {
	appBaseURL := resolveAppBaseURL()
	dashboardURL := appBaseURL + "/dashboard"
	transactionsURL := appBaseURL + "/transactions"
	settingsURL := appBaseURL + "/settings"
	securityURL := appBaseURL + "/security"

	baseStyle := `
		<style>
			body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
			.container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
			.header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; }
			.header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
			.content { padding: 40px 30px; }
			.button { display: inline-block; background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
			.footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
			.code-box { background: #f3f4f6; border: 2px dashed #2563eb; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1f2937; margin: 20px 0; }
			.amount { font-size: 36px; font-weight: 700; color: #2563eb; margin: 20px 0; }
		</style>
	`

	templates := map[EmailType]string{
		EmailTypeOTP: baseStyle + `
			<div class="container">
				<div class="header"><h1>🔐 Corridor</h1></div>
				<div class="content">
					<h2>Hi {{.Name}},</h2>
					<p>Your verification code is:</p>
					<div class="code-box">{{.Code}}</div>
					<p>This code will expire in 10 minutes. Never share this code with anyone.</p>
					<p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
				</div>
				<div class="footer">
					<p>© 2026 Corridor. Borderless payments made simple.</p>
				</div>
			</div>
		`,
		EmailTypePaymentReceived: baseStyle + `
			<div class="container">
				<div class="header"><h1>💸 Payment Received</h1></div>
				<div class="content">
					<h2>Hi {{.RecipientName}},</h2>
					<p>Great news! You've received a payment:</p>
					<div class="amount">{{.Currency}} {{.Amount}}</div>
					<p><strong>From:</strong> {{.SenderName}}</p>
					<p>The funds are now available in your Corridor wallet.</p>
					<a href="` + dashboardURL + `" class="button">View Dashboard</a>
				</div>
				<div class="footer">
					<p>© 2026 Corridor. Borderless payments made simple.</p>
				</div>
			</div>
		`,
		EmailTypeInviteToClaim: baseStyle + `
			<div class="container">
				<div class="header"><h1>🎁 You've Got Money!</h1></div>
				<div class="content">
					<h2>Someone sent you money!</h2>
					<p><strong>{{.SenderName}}</strong> sent you:</p>
					<div class="amount">{{.Currency}} {{.Amount}}</div>
					<p>Claim your funds instantly with Corridor - the fastest way to send and receive money globally.</p>
					<a href="{{.ClaimLink}}" class="button">Claim Your Funds</a>
					<p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
						✨ <strong>Why Corridor?</strong><br>
						• Instant transfers<br>
						• Zero hidden fees<br>
						• Withdraw to local currency (M-Pesa, Bank, Mobile Money)
					</p>
				</div>
				<div class="footer">
					<p>© 2026 Corridor. Borderless payments made simple.</p>
				</div>
			</div>
		`,
		EmailTypeWithdrawal: baseStyle + `
			<div class="container">
				<div class="header"><h1>✅ Withdrawal Confirmed</h1></div>
				<div class="content">
					<h2>Hi {{.Name}},</h2>
					<p>Your withdrawal has been processed successfully:</p>
					<div class="amount">{{.Currency}} {{.Amount}}</div>
					<p><strong>Destination:</strong> {{.Destination}}</p>
					<p>Funds should arrive within a few minutes. You'll receive a confirmation once the transfer is complete.</p>
					<a href="` + transactionsURL + `" class="button">View Transactions</a>
				</div>
				<div class="footer">
					<p>© 2026 Corridor. Borderless payments made simple.</p>
				</div>
			</div>
		`,
		EmailTypeAccountUpdate: baseStyle + `
			<div class="container">
				<div class="header"><h1>⚙️ Account Updated</h1></div>
				<div class="content">
					<h2>Hi {{.Name}},</h2>
					<p>Your account settings have been updated:</p>
					<p><strong>Change:</strong> {{.UpdateType}}</p>
					<p>If you didn't make this change, please contact support immediately at people@corridormoney.net</p>
					<a href="` + settingsURL + `" class="button">Review Settings</a>
				</div>
				<div class="footer">
					<p>© 2026 Corridor. Borderless payments made simple.</p>
				</div>
			</div>
		`,
		EmailTypeSecurityAlert: baseStyle + `
			<div class="container">
				<div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);"><h1>🔒 Security Alert</h1></div>
				<div class="content">
					<h2>Hi {{.Name}},</h2>
					<p><strong>Alert Type:</strong> {{.AlertType}}</p>
					<p>{{.Details}}</p>
					<p style="color: #dc2626; font-weight: 600;">If this wasn't you, secure your account immediately:</p>
					<a href="` + securityURL + `" class="button" style="background: #dc2626;">Secure My Account</a>
				</div>
				<div class="footer">
					<p>© 2026 Corridor. Borderless payments made simple.</p>
				</div>
			</div>
		`,
		EmailTypeWelcome: baseStyle + `
			<div class="container">
				<div class="header"><h1>🚀 Welcome to Corridor!</h1></div>
				<div class="content">
					<h2>Hi {{.Name}},</h2>
					<p>Welcome to the future of borderless payments! We're thrilled to have you on board.</p>
					<p><strong>What you can do with Corridor:</strong></p>
					<ul style="line-height: 1.8;">
						<li>💸 Send money globally in seconds</li>
						<li>🌍 Convert between currencies instantly</li>
						<li>📱 Withdraw to M-Pesa, bank accounts, or mobile money</li>
						<li>🔒 Secured by blockchain technology</li>
					</ul>
					<a href="` + dashboardURL + `" class="button">Get Started</a>
				</div>
				<div class="footer">
					<p>Need help? Contact us at people@corridormoney.net</p>
					<p>© 2026 Corridor. Borderless payments made simple.</p>
				</div>
			</div>
		`,
	}

	return templates[emailType]
}

func resolveAppBaseURL() string {
	if v := strings.TrimRight(strings.TrimSpace(os.Getenv("PUBLIC_APP_URL")), "/"); v != "" {
		return v
	}
	if v := strings.TrimRight(strings.TrimSpace(os.Getenv("FRONTEND_BASE_URL")), "/"); v != "" {
		return v
	}
	if v := strings.TrimRight(strings.TrimSpace(os.Getenv("PUBLIC_BASE_URL")), "/"); v != "" {
		return v
	}
	return "https://corridormoney.net"
}
