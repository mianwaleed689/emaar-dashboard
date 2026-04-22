const fs = require('fs');
let c = fs.readFileSync('src/i18n.js', 'utf8');
const newLang = export const LANGUAGES = [
  { code: "en", name: "English",    nativeName: "English",    flag: "🇬🇧", dir: "ltr" },
  { code: "ar", name: "Arabic",     nativeName: "العربية",    flag: "🇦🇪", dir: "ltr" },
  { code: "ur", name: "Urdu",       nativeName: "اردو",       flag: "🇵🇰", dir: "ltr" },
  { code: "hi", name: "Hindi",      nativeName: "हिन्दी",    flag: "🇮🇳", dir: "ltr" },
  { code: "zh", name: "Chinese",    nativeName: "中文",       flag: "🇨🇳", dir: "ltr" },
  { code: "ru", name: "Russian",    nativeName: "Русский",   flag: "🇷🇺", dir: "ltr" },
  { code: "fr", name: "French",     nativeName: "Français",  flag: "🇫🇷", dir: "ltr" },
  { code: "es", name: "Spanish",    nativeName: "Español",   flag: "🇪🇸", dir: "ltr" },
  { code: "de", name: "German",     nativeName: "Deutsch",   flag: "🇩🇪", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", dir: "ltr" },
  { code: "ja", name: "Japanese",   nativeName: "日本語",     flag: "🇯🇵", dir: "ltr" },
  { code: "ko", name: "Korean",     nativeName: "한국어",     flag: "🇰🇷", dir: "ltr" },
  { code: "tr", name: "Turkish",    nativeName: "Türkçe",    flag: "🇹🇷", dir: "ltr" },
  { code: "it", name: "Italian",    nativeName: "Italiano",  flag: "🇮🇹", dir: "ltr" },
  { code: "nl", name: "Dutch",      nativeName: "Nederlands",flag: "🇳🇱", dir: "ltr" },
  { code: "fa", name: "Persian",    nativeName: "فارسی",     flag: "🇮🇷", dir: "ltr" },
  { code: "th", name: "Thai",       nativeName: "ไทย",       flag: "🇹🇭", dir: "ltr" },
  { code: "tl", name: "Filipino",   nativeName: "Filipino",  flag: "🇵🇭", dir: "ltr" },
  { code: "bn", name: "Bengali",    nativeName: "বাংলা",     flag: "🇧🇩", dir: "ltr" },
  { code: "sw", name: "Swahili",    nativeName: "Kiswahili", flag: "🇰🇪", dir: "ltr" },
  { code: "sv", name: "Swedish",    nativeName: "Svenska",   flag: "🇸🇪", dir: "ltr" },
  { code: "pl", name: "Polish",     nativeName: "Polski",    flag: "🇵🇱", dir: "ltr" },
  { code: "ro", name: "Romanian",   nativeName: "Română",    flag: "🇷🇴", dir: "ltr" },
  { code: "el", name: "Greek",      nativeName: "Ελληνικά",  flag: "🇬🇷", dir: "ltr" },
  { code: "ha", name: "Hausa",      nativeName: "Hausa",     flag: "🇳🇬", dir: "ltr" },
  { code: "af", name: "Afrikaans",  nativeName: "Afrikaans", flag: "🇿🇦", dir: "ltr" },
  { code: "uk", name: "Ukrainian",  nativeName: "Українська",flag: "🇺🇦", dir: "ltr" },
];\;
c = c.replace(/export const LANGUAGES = \[[\s\S]*?\];/, newLang);
fs.writeFileSync('src/i18n.js', c, 'utf8');
console.log('Done');
