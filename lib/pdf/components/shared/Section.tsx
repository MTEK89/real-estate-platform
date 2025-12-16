import React from "react"
import { View, Text, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../types"

interface SectionProps {
  brand: BrandConfig
  number?: number | string
  title: string
  children: React.ReactNode
  highlight?: boolean
}

export function Section({
  brand,
  number,
  title,
  children,
  highlight = false,
}: SectionProps) {
  const styles = StyleSheet.create({
    section: {
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: brand.colors.primary,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: brand.colors.border,
    },
    sectionContent: {
      paddingLeft: 0,
    },
    highlightedContent: {
      backgroundColor: brand.colors.highlight,
      padding: 10,
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: brand.colors.secondary,
    },
  })

  const titleText = number ? `${number}. ${title}` : title

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{titleText}</Text>
      <View
        style={highlight ? styles.highlightedContent : styles.sectionContent}
      >
        {children}
      </View>
    </View>
  )
}

// Article variant for legal documents
interface ArticleProps {
  brand: BrandConfig
  number?: number
  title: string
  children: React.ReactNode
}

export function Article({ brand, number, title, children }: ArticleProps) {
  const styles = StyleSheet.create({
    article: {
      marginBottom: 15,
    },
    articleHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    articleNumber: {
      fontSize: 10,
      fontWeight: "bold",
      color: brand.colors.primary,
      backgroundColor: brand.colors.highlight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 3,
      marginRight: 8,
    },
    articleTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: brand.colors.secondary,
    },
    articleContent: {
      paddingLeft: 10,
    },
  })

  return (
    <View style={styles.article}>
      <View style={styles.articleHeader}>
        {number !== undefined && (
          <Text style={styles.articleNumber}>Article {number}</Text>
        )}
        <Text style={styles.articleTitle}>{title}</Text>
      </View>
      <View style={styles.articleContent}>{children}</View>
    </View>
  )
}
