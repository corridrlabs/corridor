package core

import "strings"

var CurrencyAliases = map[string]CurrencyCode{
	"USD":  CurrencyUSD,
	"USDC": CurrencyUSDC,
	"SOL":  CurrencySOL,
	"KES":  CurrencyKES,
	"KSH":  CurrencyKES,
	"KSHS": CurrencyKES,
	"NGN":  CurrencyNGN,
	"GHS":  CurrencyCode("GHS"),
	"KWD":  CurrencyCode("KWD"),
}

func NormalizeCurrencyCode(raw string) CurrencyCode {
	cleaned := strings.ToUpper(strings.TrimSpace(raw))
	if cleaned == "" {
		return CurrencyUSDC
	}
	if code, ok := CurrencyAliases[cleaned]; ok {
		return code
	}
	return CurrencyCode(cleaned)
}

func SupportedCurrencyCodes() []CurrencyCode {
	return []CurrencyCode{CurrencyUSD, CurrencyUSDC, CurrencySOL, CurrencyKES, CurrencyNGN, CurrencyCode("GHS"), CurrencyCode("KWD")}
}

func SettlementCurrency(from, to string) CurrencyCode {
	source := NormalizeCurrencyCode(from)
	target := NormalizeCurrencyCode(to)
	if target == CurrencyUSD {
		return CurrencyUSDC
	}
	if target == CurrencyUSDC {
		return CurrencyUSDC
	}
	if source == CurrencyKES && target == CurrencyUSD {
		return CurrencyUSDC
	}
	return target
}

func BillingWalletCurrency(raw string) CurrencyCode {
	code := NormalizeCurrencyCode(raw)
	if code == CurrencyUSD || code == CurrencyUSDC {
		return CurrencyUSDC
	}
	return code
}
