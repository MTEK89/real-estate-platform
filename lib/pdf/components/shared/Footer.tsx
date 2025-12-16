import React from "react"
import { View, Text, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../types"
import { formatShortDate } from "../../utils/formatters"

interface FooterProps {
  brand: BrandConfig
  generatedDate?: Date
}

export function Footer({ brand, generatedDate = new Date() }: FooterProps) {
  const styles = StyleSheet.create({
    footer: {
      position: "absolute",
      bottom: 20,
      left: brand.layout.pageMargin,
      right: brand.layout.pageMargin,
      borderTopWidth: 1,
      borderTopColor: brand.colors.border,
      paddingTop: 8,
    },
    footerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    legalText: {
      fontSize: 6,
      color: brand.colors.muted,
      maxWidth: "40%",
    },
    pageNumber: {
      fontSize: 8,
      color: brand.colors.text,
    },
    dateText: {
      fontSize: 6,
      color: brand.colors.muted,
    },
  })

  // Build legal info string
  const legalParts: string[] = []
  if (brand.agencyName) legalParts.push(brand.agencyName)
  if (brand.legal.companyType) legalParts.push(brand.legal.companyType)
  if (brand.legal.rcs) legalParts.push(`RCS: ${brand.legal.rcs}`)
  if (brand.legal.vatNumber) legalParts.push(`TVA: ${brand.legal.vatNumber}`)

  const legalString = legalParts.join(" - ")

  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerRow}>
        {/* Left: Legal mentions */}
        <Text style={styles.legalText}>{legalString}</Text>

        {/* Center: Page number */}
        {brand.layout.showPageNumbers && (
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => {
              if (brand.layout.pageNumberFormat === "Page X sur Y") {
                return `Page ${pageNumber} sur ${totalPages}`
              } else if (brand.layout.pageNumberFormat === "X/Y") {
                return `${pageNumber}/${totalPages}`
              }
              return `${pageNumber}`
            }}
          />
        )}

        {/* Right: Generated date */}
        <Text style={styles.dateText}>
          Généré le {formatShortDate(generatedDate)}
        </Text>
      </View>
    </View>
  )
}
