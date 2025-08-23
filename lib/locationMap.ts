export const locationMap: Record<string, string> = {
    NMR: "Minervastrasse 14, 8090 Zürich",
    fNMR: "Freiestrasse 56, 8032 Zürich",
    TH: "Minervastrasse 14, 8090 Zürich",
    Aussen: "Minervastrasse 14, 8090 Zürich",
    OeNMR: "Therese-Giehse-Strasse 6, 8050 Zürich",
    FluNMR: "Zürichbergstrasse 196, 8044 Zürich",
    PolyNMR: "Leonhardstrasse 34, 8092 Zürich",
    "": "BZZ",
  };
  
  const prefixKeyMap: Record<string, keyof typeof locationMap> = {
    f: "fNMR",
    oe: "OeNMR",
    flu: "FluNMR",
    poly: "PolyNMR",
  };
  
  const PREFIX_PATTERN = /^(f|oe|flu|poly)\d+$/i;
  const TH_PATTERN = /^th[a-z]+$/i;
  const DIGITS_PATTERN = /^\d+$/;
  
  const locationMapInstance = new Map(Object.entries(locationMap));
  const prefixMap = new Map(Object.entries(prefixKeyMap));
  
  export function resolveLocation(code: string): string | undefined {
    const c = code.trim();
  
    if (!c) {
      return locationMapInstance.get("");
    }
  
    if (locationMapInstance.has(c)) {
      return locationMapInstance.get(c);
    }
  
    const prefixMatch = c.match(PREFIX_PATTERN);
    if (prefixMatch) {
      const key = prefixMap.get(prefixMatch[1].toLowerCase());
      return key ? locationMapInstance.get(key) : undefined;
    }
  
    if (TH_PATTERN.test(c)) {
      return locationMapInstance.get("TH");
    }
  
    if (DIGITS_PATTERN.test(c)) {
      return locationMapInstance.get("NMR");
    }
  
    return undefined;
  }
  