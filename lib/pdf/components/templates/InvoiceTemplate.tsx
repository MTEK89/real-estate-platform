import { View, Text, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../types"
import type { InvoiceData } from "@/lib/pdf-generator"
import { MultiPageWrapper, Section, DataTable, Paragraph, TwoColumn } from "../shared"
import { formatCurrency, formatDate } from "../../utils/formatters"

interface InvoiceTemplateProps {
  data: InvoiceData
  brand: BrandConfig
}

export function InvoiceTemplate({ data, brand }: InvoiceTemplateProps) {
  const invoice = data.invoice

  const styles = StyleSheet.create({
    parties: {
      flexDirection: "row",
      marginLeft: -8,
      marginRight: -8,
      marginBottom: 6,
    },
    partyBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 4,
      marginLeft: 8,
      marginRight: 8,
      padding: 10,
    },
    partyTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: brand.colors.primary,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: brand.colors.border,
    },
    partyName: {
      fontSize: 10,
      fontWeight: "bold",
      color: brand.colors.text,
      marginBottom: 4,
    },
    partyDetail: {
      fontSize: 8,
      color: brand.colors.muted,
      marginBottom: 2,
    },
    priceBox: {
      backgroundColor: brand.colors.highlight,
      padding: 12,
      borderRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: brand.colors.primary,
      marginTop: 8,
      marginBottom: 6,
    },
    priceLabel: {
      fontSize: 8,
      color: brand.colors.muted,
      marginBottom: 4,
    },
    priceAmount: {
      fontSize: 16,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    table: {
      marginTop: 6,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 4,
      overflow: "hidden",
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: brand.colors.primary,
      paddingVertical: 7,
      paddingHorizontal: 8,
    },
    tableHeaderCell: {
      color: "#ffffff",
      fontWeight: "bold",
      fontSize: 8,
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: brand.colors.border,
      alignItems: "flex-start",
    },
    tableRowAlt: {
      backgroundColor: "#f9fafb",
    },
    tableCell: {
      fontSize: 8,
      color: brand.colors.text,
    },
    colDesc: { width: "52%" },
    colQty: { width: "8%", textAlign: "right" },
    colUnit: { width: "13%", textAlign: "right" },
    colVat: { width: "10%", textAlign: "right" },
    colTotal: { width: "17%", textAlign: "right" },
    totalsGrid: {
      marginTop: 4,
    },
  })

  const documentRef = invoice.invoiceNumber || data.property?.reference

  return (
    <MultiPageWrapper brand={brand} documentTitle="FACTURE" documentRef={documentRef}>
      <Section brand={brand} number={1} title="Émetteur & Client">
        <View style={styles.parties}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Émetteur</Text>
            <Text style={styles.partyName}>{invoice.supplier.name}</Text>
            {invoice.supplier.address ? <Text style={styles.partyDetail}>{invoice.supplier.address}</Text> : null}
            {invoice.supplier.vatNumber ? <Text style={styles.partyDetail}>TVA: {invoice.supplier.vatNumber}</Text> : null}
            {invoice.supplier.rcsNumber ? <Text style={styles.partyDetail}>RCS: {invoice.supplier.rcsNumber}</Text> : null}
            {invoice.supplier.email ? <Text style={styles.partyDetail}>Email: {invoice.supplier.email}</Text> : null}
            {invoice.supplier.phone ? <Text style={styles.partyDetail}>Tél: {invoice.supplier.phone}</Text> : null}
          </View>

          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Client</Text>
            <Text style={styles.partyName}>{invoice.customer.name}</Text>
            {invoice.customer.email ? <Text style={styles.partyDetail}>Email: {invoice.customer.email}</Text> : null}
            {invoice.customer.phone ? <Text style={styles.partyDetail}>Tél: {invoice.customer.phone}</Text> : null}
          </View>
        </View>
      </Section>

      <Section brand={brand} number={2} title="Détails de la facture">
        <TwoColumn
          brand={brand}
          left={
            <DataTable
              brand={brand}
              rows={[
                { label: "N° facture", value: invoice.invoiceNumber },
                { label: "Date d'émission", value: formatDate(invoice.issueDate) },
                { label: "Échéance", value: formatDate(invoice.dueDate) },
              ]}
            />
          }
          right={
            <DataTable
              brand={brand}
              rows={[
                { label: "Bien (réf.)", value: data.property?.reference || "—" },
                { label: "Adresse", value: data.property ? `${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}` : "—" },
                { label: "Conditions", value: invoice.payment.terms || "—" },
              ]}
            />
          }
        />
      </Section>

      <Section brand={brand} number={3} title="Prestations">
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qté</Text>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>PU HT</Text>
            <Text style={[styles.tableHeaderCell, styles.colVat]}>TVA</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total TTC</Text>
          </View>

          {invoice.items.map((item, index) => {
            const lineExcl = item.quantity * item.unitPrice
            const lineVat = lineExcl * (item.vatRate / 100)
            const lineIncl = lineExcl + lineVat
            return (
              <View key={`${index}-${item.description}`} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colUnit]}>{formatCurrency(item.unitPrice)}</Text>
                <Text style={[styles.tableCell, styles.colVat]}>{item.vatRate}%</Text>
                <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(lineIncl)}</Text>
              </View>
            )
          })}
        </View>
      </Section>

      <Section brand={brand} number={4} title="Totaux">
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Total à payer (TTC)</Text>
          <Text style={styles.priceAmount}>{formatCurrency(invoice.totals.totalInclVat)}</Text>
        </View>

        <View style={styles.totalsGrid}>
          <DataTable
            brand={brand}
            rows={[
              { label: "Sous-total (HT)", value: formatCurrency(invoice.totals.subtotalExclVat) },
              { label: "TVA", value: formatCurrency(invoice.totals.vatTotal) },
              { label: "Total (TTC)", value: formatCurrency(invoice.totals.totalInclVat) },
            ]}
          />
        </View>
      </Section>

      <Section brand={brand} number={5} title="Paiement">
        <DataTable
          brand={brand}
          rows={[
            { label: "Référence", value: invoice.payment.reference || invoice.invoiceNumber },
            { label: "IBAN", value: invoice.payment.iban || "—" },
            { label: "BIC", value: invoice.payment.bic || "—" },
            { label: "Conditions", value: invoice.payment.terms || "—" },
          ]}
        />
      </Section>

      {invoice.notes ? (
        <Section brand={brand} number={6} title="Notes" highlight>
          <Paragraph brand={brand}>{invoice.notes}</Paragraph>
        </Section>
      ) : null}
    </MultiPageWrapper>
  )
}

