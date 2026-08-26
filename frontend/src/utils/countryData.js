export const COUNTRY_CONFIGS = [
  { code: "+91", country: "India", flag: "🇮🇳", digits: 10, placeholder: "e.g. 98765 43210" },
  { code: "+1", country: "USA / Canada", flag: "🇺🇸", digits: 10, placeholder: "e.g. 202 555 0147" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧", digits: 10, placeholder: "e.g. 7911 123456" },
  { code: "+971", country: "UAE", flag: "🇦🇪", digits: 9, placeholder: "e.g. 50 123 4567" },
  { code: "+65", country: "Singapore", flag: "🇸🇬", digits: 8, placeholder: "e.g. 8123 4567" },
  { code: "+61", country: "Australia", flag: "🇦🇺", digits: 9, placeholder: "e.g. 412 345 678" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦", digits: 9, placeholder: "e.g. 50 123 4567" },
  { code: "+49", country: "Germany", flag: "🇩🇪", digits: 10, placeholder: "e.g. 151 2345678" },
  { code: "+33", country: "France", flag: "🇫🇷", digits: 9, placeholder: "e.g. 6 12 34 56 78" },
  { code: "+81", country: "Japan", flag: "🇯🇵", digits: 10, placeholder: "e.g. 90 1234 5678" },
  { code: "+974", country: "Qatar", flag: "🇶🇦", digits: 8, placeholder: "e.g. 3312 3456" },
  { code: "+968", country: "Oman", flag: "🇴🇲", digits: 8, placeholder: "e.g. 9123 4567" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼", digits: 8, placeholder: "e.g. 9123 4567" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭", digits: 8, placeholder: "e.g. 3612 3456" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾", digits: 10, placeholder: "e.g. 12 345 6789" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿", digits: 9, placeholder: "e.g. 21 123 456" },
  { code: "+977", country: "Nepal", flag: "🇳🇵", digits: 10, placeholder: "e.g. 9841 234567" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩", digits: 10, placeholder: "e.g. 1712 345678" },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰", digits: 9, placeholder: "e.g. 71 234 5678" },
  { code: "+27", country: "South Africa", flag: "🇿🇦", digits: 9, placeholder: "e.g. 71 234 5678" }
];

export const getCountryConfig = (code) => {
  return COUNTRY_CONFIGS.find((c) => c.code === code) || COUNTRY_CONFIGS[0];
};
