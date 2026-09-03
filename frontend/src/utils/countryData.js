export const COUNTRY_CONFIGS = [
  { code: "+91", country: "India", flag: "🇮🇳", digits: 10, placeholder: "10-digit mobile number" },
  { code: "+1", country: "USA / Canada", flag: "🇺🇸", digits: 10, placeholder: "10-digit mobile number" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧", digits: 10, placeholder: "Mobile number" },
  { code: "+971", country: "UAE", flag: "🇦🇪", digits: 9, placeholder: "Mobile number" },
  { code: "+65", country: "Singapore", flag: "🇸🇬", digits: 8, placeholder: "Mobile number" },
  { code: "+61", country: "Australia", flag: "🇦🇺", digits: 9, placeholder: "Mobile number" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", digits: 9, placeholder: "Mobile number" },
  { code: "+49", country: "Germany", flag: "🇩🇪", digits: 10, placeholder: "Mobile number" },
  { code: "+33", country: "France", flag: "🇫🇷", digits: 9, placeholder: "Mobile number" },
  { code: "+81", country: "Japan", flag: "🇯🇵", digits: 10, placeholder: "Mobile number" },
  { code: "+974", country: "Qatar", flag: "🇶🇦", digits: 8, placeholder: "Mobile number" },
  { code: "+968", country: "Oman", flag: "🇴🇲", digits: 8, placeholder: "Mobile number" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼", digits: 8, placeholder: "Mobile number" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭", digits: 8, placeholder: "Mobile number" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾", digits: 10, placeholder: "Mobile number" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿", digits: 9, placeholder: "Mobile number" },
  { code: "+977", country: "Nepal", flag: "🇳🇵", digits: 10, placeholder: "Mobile number" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩", digits: 10, placeholder: "Mobile number" },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰", digits: 9, placeholder: "Mobile number" },
  { code: "+27", country: "South Africa", flag: "🇿🇦", digits: 9, placeholder: "Mobile number" }
];

export const getCountryConfig = (code) => {
  return COUNTRY_CONFIGS.find((c) => c.code === code) || COUNTRY_CONFIGS[0];
};
