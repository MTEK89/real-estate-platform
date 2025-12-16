import React from "react"
import { View, Text, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../types"

interface Signatory {
  role: string // "Le Mandant", "Le Locataire", etc.
  name: string
  showLuApprouve?: boolean
}

interface SignatureBlockProps {
  brand: BrandConfig
  signatories: Signatory[]
  location?: string
  date?: string
  copies?: number
}

export function SignatureBlock({
  brand,
  signatories,
  location,
  date,
  copies = 2,
}: SignatureBlockProps) {
  const styles = StyleSheet.create({
    container: {
      marginTop: 30,
    },
    header: {
      marginBottom: 20,
    },
    headerText: {
      fontSize: 9,
      color: brand.colors.text,
      marginBottom: 4,
    },
    signaturesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    signatureBox: {
      width: signatories.length <= 2 ? "45%" : "45%",
      marginBottom: 20,
    },
    role: {
      fontSize: 9,
      fontWeight: "bold",
      color: brand.colors.secondary,
      marginBottom: 8,
    },
    luApprouve: {
      fontSize: 7,
      fontStyle: "italic",
      color: brand.colors.muted,
      marginBottom: 40,
    },
    signatureLine: {
      borderBottomWidth: 1,
      borderBottomColor: brand.colors.text,
      marginBottom: 6,
      height: 50,
    },
    name: {
      fontSize: 9,
      color: brand.colors.text,
    },
    dateLine: {
      fontSize: 8,
      color: brand.colors.muted,
      marginTop: 10,
    },
  })

  return (
    <View style={styles.container} wrap={false}>
      {/* Location and date header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Fait à {location || "________________"}, le{" "}
          {date || "________________"}
        </Text>
        <Text style={styles.headerText}>
          En {copies} exemplaires originaux
        </Text>
      </View>

      {/* Signature boxes */}
      <View style={styles.signaturesRow}>
        {signatories.map((signatory, index) => (
          <View key={index} style={styles.signatureBox}>
            <Text style={styles.role}>{signatory.role}</Text>
            {signatory.showLuApprouve && (
              <Text style={styles.luApprouve}>
                (Signature précédée de la mention &quot;Lu et approuvé&quot;)
              </Text>
            )}
            <View style={styles.signatureLine} />
            <Text style={styles.name}>{signatory.name}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// Simple single signature variant
interface SingleSignatureProps {
  brand: BrandConfig
  role: string
  name: string
  showLuApprouve?: boolean
}

export function SingleSignature({
  brand,
  role,
  name,
  showLuApprouve = true,
}: SingleSignatureProps) {
  const styles = StyleSheet.create({
    container: {
      marginTop: 30,
      maxWidth: 250,
    },
    role: {
      fontSize: 9,
      fontWeight: "bold",
      color: brand.colors.secondary,
      marginBottom: 8,
    },
    luApprouve: {
      fontSize: 7,
      fontStyle: "italic",
      color: brand.colors.muted,
      marginBottom: 40,
    },
    signatureLine: {
      borderBottomWidth: 1,
      borderBottomColor: brand.colors.text,
      marginBottom: 6,
      height: 50,
    },
    name: {
      fontSize: 9,
      color: brand.colors.text,
    },
  })

  return (
    <View style={styles.container}>
      <Text style={styles.role}>{role}</Text>
      {showLuApprouve && (
        <Text style={styles.luApprouve}>
          (Signature précédée de la mention &quot;Lu et approuvé&quot;)
        </Text>
      )}
      <View style={styles.signatureLine} />
      <Text style={styles.name}>{name}</Text>
    </View>
  )
}
