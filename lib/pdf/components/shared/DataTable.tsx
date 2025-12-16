import React from "react"
import { View, Text, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../types"

interface DataTableRow {
  label: string
  value: string | number | undefined | null
}

interface DataTableProps {
  brand: BrandConfig
  rows: DataTableRow[]
  title?: string
}

export function DataTable({ brand, rows, title }: DataTableProps) {
  const styles = StyleSheet.create({
    container: {
      marginBottom: 10,
    },
    title: {
      fontSize: 10,
      fontWeight: "bold",
      color: brand.colors.secondary,
      marginBottom: 6,
    },
    table: {
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 4,
    },
    row: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: brand.colors.border,
    },
    lastRow: {
      flexDirection: "row",
      borderBottomWidth: 0,
    },
    labelCell: {
      width: "35%",
      padding: 6,
      backgroundColor: brand.colors.highlight,
    },
    valueCell: {
      width: "65%",
      padding: 6,
    },
    labelText: {
      fontSize: 9,
      fontWeight: "bold",
      color: brand.colors.secondary,
    },
    valueText: {
      fontSize: 9,
      color: brand.colors.text,
    },
  })

  // Filter out rows with empty values
  const validRows = rows.filter(
    (row) => row.value !== undefined && row.value !== null && row.value !== ""
  )

  if (validRows.length === 0) return null

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.table}>
        {validRows.map((row, index) => (
          <View
            key={index}
            style={index === validRows.length - 1 ? styles.lastRow : styles.row}
          >
            <View style={styles.labelCell}>
              <Text style={styles.labelText}>{row.label}</Text>
            </View>
            <View style={styles.valueCell}>
              <Text style={styles.valueText}>{String(row.value)}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

// Horizontal layout variant (side by side boxes)
interface InfoBoxProps {
  brand: BrandConfig
  title: string
  children: React.ReactNode
}

export function InfoBox({ brand, title, children }: InfoBoxProps) {
  const styles = StyleSheet.create({
    box: {
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 4,
      padding: 10,
      marginBottom: 10,
    },
    title: {
      fontSize: 10,
      fontWeight: "bold",
      color: brand.colors.primary,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: brand.colors.border,
    },
    content: {},
  })

  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.content}>{children}</View>
    </View>
  )
}

// Two column layout for parties
interface TwoColumnProps {
  brand: BrandConfig
  left: React.ReactNode
  right: React.ReactNode
}

export function TwoColumn({ brand, left, right }: TwoColumnProps) {
  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      marginLeft: -8,
      marginRight: -8,
      marginBottom: 10,
    },
    column: {
      flex: 1,
      paddingLeft: 8,
      paddingRight: 8,
    },
  })

  return (
    <View style={styles.container}>
      <View style={styles.column}>{left}</View>
      <View style={styles.column}>{right}</View>
    </View>
  )
}
