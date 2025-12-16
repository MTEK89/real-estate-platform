import type { BrandConfig } from "../types"

// Default brand configuration - neutral professional styling
export const defaultBrandConfig: BrandConfig = {
  // Identity
  agencyId: "default",
  agencyName: "Votre Agence Immobilière",
  logo: "", // Empty = no logo, placeholder text used
  registrationNumber: "",

  // Contact
  address: "",
  phone: "",
  email: "",
  website: "",

  // Professional color palette
  colors: {
    primary: "#0f172a",    // Slate 900 - Headers, titles
    secondary: "#334155",  // Slate 700 - Subheadings
    text: "#1e293b",       // Slate 800 - Body text
    muted: "#64748b",      // Slate 500 - Secondary text
    border: "#e2e8f0",     // Slate 200 - Borders
    highlight: "#f8fafc",  // Slate 50 - Highlighted sections
  },

  // Legal information (all optional for flexibility)
  legal: {
    companyType: "",
    capitalAmount: "",
    rcs: "",
    vatNumber: "",
    establishmentPermit: "",
    insuranceNumber: "",
  },

  // Layout defaults
  layout: {
    pageMargin: 40,         // ~0.55 inches
    headerHeight: 60,
    footerHeight: 40,
    showPageNumbers: true,
    pageNumberFormat: "Page X sur Y",
  },
}

// Merge partial config with defaults
export function mergeBrandConfig(partial?: Partial<BrandConfig>): BrandConfig {
  if (!partial) return defaultBrandConfig

  return {
    ...defaultBrandConfig,
    ...partial,
    colors: {
      ...defaultBrandConfig.colors,
      ...partial.colors,
    },
    legal: {
      ...defaultBrandConfig.legal,
      ...partial.legal,
    },
    layout: {
      ...defaultBrandConfig.layout,
      ...partial.layout,
    },
  }
}

// Predefined brand themes for quick setup
export const brandThemes = {
  professional: {
    colors: {
      primary: "#0f172a",
      secondary: "#334155",
      text: "#1e293b",
      muted: "#64748b",
      border: "#e2e8f0",
      highlight: "#f8fafc",
    },
  },
  modern: {
    colors: {
      primary: "#1e40af",    // Blue 800
      secondary: "#3b82f6",  // Blue 500
      text: "#1f2937",       // Gray 800
      muted: "#6b7280",      // Gray 500
      border: "#d1d5db",     // Gray 300
      highlight: "#eff6ff",  // Blue 50
    },
  },
  luxury: {
    colors: {
      primary: "#78350f",    // Amber 900
      secondary: "#b45309",  // Amber 700
      text: "#1c1917",       // Stone 900
      muted: "#57534e",      // Stone 600
      border: "#d6d3d1",     // Stone 300
      highlight: "#fef3c7",  // Amber 100
    },
  },
  eco: {
    colors: {
      primary: "#14532d",    // Green 900
      secondary: "#15803d",  // Green 700
      text: "#1e293b",       // Slate 800
      muted: "#64748b",      // Slate 500
      border: "#d1fae5",     // Emerald 100
      highlight: "#f0fdf4",  // Green 50
    },
  },
} as const

export type BrandTheme = keyof typeof brandThemes
