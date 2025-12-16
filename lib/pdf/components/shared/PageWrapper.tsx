import React from "react"
import { Document, Page, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../types"
import { Header } from "./Header"
import { Footer } from "./Footer"

interface PageWrapperProps {
  brand: BrandConfig
  documentTitle: string
  documentRef?: string
  children: React.ReactNode
}

export function PageWrapper({
  brand,
  documentTitle,
  documentRef,
  children,
}: PageWrapperProps) {
  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      paddingTop: brand.layout.pageMargin,
      paddingBottom: brand.layout.footerHeight + 30,
      paddingHorizontal: brand.layout.pageMargin,
      color: brand.colors.text,
    },
    content: {
      flex: 1,
    },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header
          brand={brand}
          documentTitle={documentTitle}
          documentRef={documentRef}
        />
        {children}
        <Footer brand={brand} />
      </Page>
    </Document>
  )
}

// Multi-page variant for longer documents
interface MultiPageWrapperProps {
  brand: BrandConfig
  documentTitle: string
  documentRef?: string
  children: React.ReactNode
}

export function MultiPageWrapper({
  brand,
  documentTitle,
  documentRef,
  children,
}: MultiPageWrapperProps) {
  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      paddingTop: brand.layout.pageMargin,
      paddingBottom: brand.layout.footerHeight + 30,
      paddingHorizontal: brand.layout.pageMargin,
      color: brand.colors.text,
    },
  })

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Header
          brand={brand}
          documentTitle={documentTitle}
          documentRef={documentRef}
        />
        {children}
        <Footer brand={brand} />
      </Page>
    </Document>
  )
}
