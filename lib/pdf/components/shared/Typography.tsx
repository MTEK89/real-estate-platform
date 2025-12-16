import React from "react"
import { Text, View, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../types"

// Paragraph text
interface ParagraphProps {
  brand: BrandConfig
  children: React.ReactNode
}

export function Paragraph({ brand, children }: ParagraphProps) {
  const styles = StyleSheet.create({
    paragraph: {
      fontSize: 9,
      color: brand.colors.text,
      marginBottom: 8,
      lineHeight: 1.5,
      textAlign: "justify",
    },
  })

  return <Text style={styles.paragraph}>{children}</Text>
}

// Label-value pair (inline)
interface LabelValueProps {
  brand: BrandConfig
  label: string
  value: string | number | undefined | null
}

export function LabelValue({ brand, label, value }: LabelValueProps) {
  if (value === undefined || value === null || value === "") return null

  const styles = StyleSheet.create({
    container: { marginBottom: 4 },
    line: { fontSize: 9, lineHeight: 11 },
    label: {
      fontWeight: "bold",
      color: brand.colors.secondary,
    },
    value: {
      color: brand.colors.text,
    },
  })

  return (
    <View style={styles.container}>
      <Text style={styles.line}>
        <Text style={styles.label}>{label}:</Text>
        <Text style={styles.value}> {String(value)}</Text>
      </Text>
    </View>
  )
}

// Bullet list
interface BulletListProps {
  brand: BrandConfig
  items: string[]
}

export function BulletList({ brand, items }: BulletListProps) {
  const styles = StyleSheet.create({
    list: {
      marginBottom: 8,
    },
    listItem: {
      flexDirection: "row",
      marginBottom: 4,
    },
    bullet: {
      fontSize: 9,
      color: brand.colors.secondary,
      marginRight: 6,
    },
    text: {
      fontSize: 9,
      color: brand.colors.text,
      flex: 1,
    },
  })

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.text}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

// Checkbox list
interface CheckboxListProps {
  brand: BrandConfig
  items: Array<{ text: string; checked?: boolean }>
}

export function CheckboxList({ brand, items }: CheckboxListProps) {
  const styles = StyleSheet.create({
    list: {
      marginBottom: 8,
    },
    listItem: {
      flexDirection: "row",
      marginBottom: 4,
      alignItems: "center",
    },
    checkbox: {
      fontSize: 9,
      color: brand.colors.secondary,
      marginRight: 6,
    },
    text: {
      fontSize: 9,
      color: brand.colors.text,
      flex: 1,
    },
  })

  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={index} style={styles.listItem}>
          <Text style={styles.checkbox}>{item.checked ? "☑" : "☐"}</Text>
          <Text style={styles.text}>{item.text}</Text>
        </View>
      ))}
    </View>
  )
}

// Highlighted text box (callout)
interface CalloutProps {
  brand: BrandConfig
  children: React.ReactNode
  type?: "info" | "warning" | "success"
}

export function Callout({ brand, children, type = "info" }: CalloutProps) {
  const borderColors = {
    info: brand.colors.secondary,
    warning: "#f59e0b",
    success: "#22c55e",
  }

  const bgColors = {
    info: brand.colors.highlight,
    warning: "#fef3c7",
    success: "#dcfce7",
  }

  const styles = StyleSheet.create({
    callout: {
      backgroundColor: bgColors[type],
      borderLeftWidth: 4,
      borderLeftColor: borderColors[type],
      padding: 10,
      marginBottom: 10,
      borderRadius: 4,
    },
    text: {
      fontSize: 9,
      color: brand.colors.text,
    },
  })

  return (
    <View style={styles.callout}>
      <Text style={styles.text}>{children}</Text>
    </View>
  )
}

// Amount display (for prices, currencies)
interface AmountDisplayProps {
  brand: BrandConfig
  label: string
  amount: string
  amountInWords?: string
  large?: boolean
}

export function AmountDisplay({
  brand,
  label,
  amount,
  amountInWords,
  large = false,
}: AmountDisplayProps) {
  const styles = StyleSheet.create({
    container: {
      backgroundColor: brand.colors.highlight,
      padding: large ? 15 : 10,
      borderRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: brand.colors.primary,
      marginBottom: 10,
      alignItems: large ? "center" : "flex-start",
    },
    label: {
      fontSize: 8,
      color: brand.colors.muted,
      marginBottom: 4,
    },
    amount: {
      fontSize: large ? 18 : 12,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    inWords: {
      fontSize: 8,
      fontStyle: "italic",
      color: brand.colors.muted,
      marginTop: 4,
    },
  })

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.amount}>{amount}</Text>
      {amountInWords && (
        <Text style={styles.inWords}>({amountInWords} euros)</Text>
      )}
    </View>
  )
}
