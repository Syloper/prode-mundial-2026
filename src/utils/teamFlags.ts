export const TEAM_FLAGS: Record<string, string> = {
  "México": "🇲🇽", "Sudáfrica": "🇿🇦", "Corea del Sur": "🇰🇷", "Rep. Checa": "🇨🇿",
  "Canadá": "🇨🇦", "Bosnia y Herz.": "🇧🇦", "Qatar": "🇶🇦", "Suiza": "🇨🇭",
  "Brasil": "🇧🇷", "Marruecos": "🇲🇦", "Haití": "🇭🇹", "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Estados Unidos": "🇺🇸", "Paraguay": "🇵🇾", "Australia": "🇦🇺", "Turquía": "🇹🇷",
  "Alemania": "🇩🇪", "Curazao": "🇨🇼", "Costa de Marfil": "🇨🇮", "Ecuador": "🇪🇨",
  "Países Bajos": "🇳🇱", "Japón": "🇯🇵", "Suecia": "🇸🇪", "Túnez": "🇹🇳",
  "Bélgica": "🇧🇪", "Egipto": "🇪🇬", "Irán": "🇮🇷", "Nueva Zelanda": "🇳🇿",
  "España": "🇪🇸", "Cabo Verde": "🇨🇻", "Arabia Saudita": "🇸🇦", "Uruguay": "🇺🇾",
  "Francia": "🇫🇷", "Senegal": "🇸🇳", "Irak": "🇮🇶", "Noruega": "🇳🇴",
  "Argentina": "🇦🇷", "Argelia": "🇩🇿", "Austria": "🇦🇹", "Jordania": "🇯🇴",
  "Portugal": "🇵🇹", "RD Congo": "🇨🇩", "Uzbekistán": "🇺🇿", "Colombia": "🇨🇴",
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croacia": "🇭🇷", "Ghana": "🇬🇭", "Panamá": "🇵🇦",
};

// ISO codes para flagcdn.com (emoji → código)
export const FLAG_CDN_CODES: Record<string, string> = {
  "🇲🇽": "mx", "🇿🇦": "za", "🇰🇷": "kr", "🇨🇿": "cz",
  "🇨🇦": "ca", "🇧🇦": "ba", "🇶🇦": "qa", "🇨🇭": "ch",
  "🇧🇷": "br", "🇲🇦": "ma", "🇭🇹": "ht", "🏴󠁧󠁢󠁳󠁣󠁴󠁿": "gb-sct",
  "🇺🇸": "us", "🇵🇾": "py", "🇦🇺": "au", "🇹🇷": "tr",
  "🇩🇪": "de", "🇨🇼": "cw", "🇨🇮": "ci", "🇪🇨": "ec",
  "🇳🇱": "nl", "🇯🇵": "jp", "🇸🇪": "se", "🇹🇳": "tn",
  "🇧🇪": "be", "🇪🇬": "eg", "🇮🇷": "ir", "🇳🇿": "nz",
  "🇪🇸": "es", "🇨🇻": "cv", "🇸🇦": "sa", "🇺🇾": "uy",
  "🇫🇷": "fr", "🇸🇳": "sn", "🇮🇶": "iq", "🇳🇴": "no",
  "🇦🇷": "ar", "🇩🇿": "dz", "🇦🇹": "at", "🇯🇴": "jo",
  "🇵🇹": "pt", "🇨🇩": "cd", "🇺🇿": "uz", "🇨🇴": "co",
  "🏴󠁧󠁢󠁥󠁮󠁧󠁿": "gb-eng", "🇭🇷": "hr", "🇬🇭": "gh", "🇵🇦": "pa",
};

export const ALL_TEAMS = Object.keys(TEAM_FLAGS);
