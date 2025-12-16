import React from "react"
import { View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../types"

interface HeaderProps {
  brand: BrandConfig
  documentTitle: string
  documentRef?: string
}

export function Header({ brand, documentTitle, documentRef }: HeaderProps) {
  const logo = typeof brand.logo === "string" ? brand.logo.trim() : ""
  const canRenderLogo =
    Boolean(logo) && (logo.startsWith("data:image/") || logo.startsWith("http://") || logo.startsWith("https://"))
  const displayAgencyName = (typeof brand.agencyName === "string" ? brand.agencyName.trim() : "") || "Your Agency"

  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingBottom: 10,
      borderBottomWidth: 2,
      borderBottomColor: brand.colors.primary,
      marginBottom: 20,
    },
    logoSection: {
      width: "30%",
    },
    logo: {
      maxWidth: 120,
      maxHeight: 40,
    },
    agencyName: {
      fontSize: 12,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    centerSection: {
      width: "40%",
      alignItems: "center",
    },
    documentTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: brand.colors.primary,
      textAlign: "center",
      textTransform: "uppercase",
    },
    documentRef: {
      fontSize: 8,
      color: brand.colors.muted,
      marginTop: 4,
    },
    rightSection: {
      width: "30%",
      alignItems: "flex-end",
    },
    contactText: {
      fontSize: 7,
      color: brand.colors.muted,
      textAlign: "right",
    },
  })

  return (
    <View style={styles.header} fixed>
      {/* Left: Logo or Agency Name */}
      <View style={styles.logoSection}>
        {canRenderLogo ? (
          <Image style={styles.logo} src={logo} />
        ) : (
          <Text style={styles.agencyName}>{displayAgencyName}</Text>
        )}
      </View>

      {/* Center: Document Title */}
      <View style={styles.centerSection}>
        <Text style={styles.documentTitle}>{documentTitle}</Text>
        {documentRef && (
          <Text style={styles.documentRef}>Réf: {documentRef}</Text>
        )}
      </View>

      {/* Right: Contact Info */}
      <View style={styles.rightSection}>
        {brand.phone && <Text style={styles.contactText}>{brand.phone}</Text>}
        {brand.email && <Text style={styles.contactText}>{brand.email}</Text>}
        {brand.website && (
          <Text style={styles.contactText}>{brand.website}</Text>
        )}
      </View>
    </View>
  )
}
