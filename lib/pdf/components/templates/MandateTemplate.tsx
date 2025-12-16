import React from "react"
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../types"
import type { MandateData } from "@/lib/pdf-generator"
import { Header } from "../shared/Header"
import { Footer } from "../shared/Footer"
import { Section } from "../shared/Section"
import { DataTable, InfoBox, TwoColumn } from "../shared/DataTable"
import { SignatureBlock } from "../shared/SignatureBlock"
import { BulletList, Callout } from "../shared/Typography"
import {
  formatDate,
  formatCurrency,
  getMandateTypeLabel,
  getPropertyTypeLabel,
  getConditionLabel,
} from "../../utils/formatters"

interface MandateTemplateProps {
  data: MandateData
  brand: BrandConfig
}

export function MandateTemplate({ data, brand }: MandateTemplateProps) {
  const mandateTypeLabel = getMandateTypeLabel(data.type)

  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      paddingTop: brand.layout.pageMargin,
      paddingBottom: brand.layout.footerHeight + 30,
      paddingHorizontal: brand.layout.pageMargin,
      color: brand.colors.text,
    },
    parties: {
      flexDirection: "row",
      marginLeft: -8,
      marginRight: -8,
      marginBottom: 15,
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
    text: {
      fontSize: 9,
      color: brand.colors.text,
      marginBottom: 6,
      lineHeight: 1.5,
    },
    priceBox: {
      backgroundColor: brand.colors.highlight,
      padding: 12,
      borderRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: brand.colors.primary,
      marginVertical: 10,
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
  })

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <Header
          brand={brand}
          documentTitle={mandateTypeLabel}
          documentRef={data.property.reference}
        />

        {/* 1. Parties */}
        <Section brand={brand} number={1} title="Les Parties">
          <View style={styles.parties}>
            {/* Seller */}
            <View style={styles.partyBox}>
              <Text style={styles.partyTitle}>Le Mandant (Vendeur)</Text>
              <Text style={styles.partyName}>
                {data.seller.firstName} {data.seller.lastName}
              </Text>
              {data.seller.email && (
                <Text style={styles.partyDetail}>
                  Email: {data.seller.email}
                </Text>
              )}
              {data.seller.phone && (
                <Text style={styles.partyDetail}>
                  Tél: {data.seller.phone}
                </Text>
              )}
            </View>

            {/* Agent */}
            <View style={styles.partyBox}>
              <Text style={styles.partyTitle}>Le Mandataire (Agent)</Text>
              <Text style={styles.partyName}>{data.agent.name}</Text>
              <Text style={styles.partyDetail}>{data.agent.agency}</Text>
              <Text style={styles.partyDetail}>
                N° Registre: {data.agent.registrationNumber}
              </Text>
              <Text style={styles.partyDetail}>{data.agent.address}</Text>
            </View>
          </View>
        </Section>

        {/* 2. Property */}
        <Section brand={brand} number={2} title="Objet du Mandat">
          <Text style={styles.text}>
            Le mandant confie au mandataire, qui accepte, le mandat de vendre le
            bien immobilier suivant:
          </Text>
          <DataTable
            brand={brand}
            rows={[
              {
                label: "Type de bien",
                value: getPropertyTypeLabel(data.property.type),
              },
              {
                label: "Adresse",
                value: `${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}`,
              },
              {
                label: "Surface",
                value: `${data.property.characteristics.surface} m²`,
              },
              {
                label: "Nombre de pièces",
                value: data.property.characteristics.rooms,
              },
              {
                label: "Chambres",
                value: data.property.characteristics.bedrooms,
              },
              {
                label: "Salles de bain",
                value: data.property.characteristics.bathrooms,
              },
              {
                label: "État",
                value: getConditionLabel(data.property.characteristics.condition),
              },
            ]}
          />
        </Section>

        {/* 3. Price and Conditions */}
        <Section brand={brand} number={3} title="Prix et Conditions">
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Prix de vente demandé</Text>
            <Text style={styles.priceAmount}>
              {formatCurrency(data.askingPrice)}
            </Text>
          </View>

          <DataTable
            brand={brand}
            rows={[
              {
                label: "Prix minimum accepté",
                value: data.minimumPrice
                  ? formatCurrency(data.minimumPrice)
                  : "Non défini",
              },
              {
                label: "Commission",
                value: `${data.commission.percentage}% à la charge ${data.commission.paidBy === "seller" ? "du vendeur" : "de l'acquéreur"}`,
              },
            ]}
          />
        </Section>

        {/* 4. Duration */}
        <Section brand={brand} number={4} title="Durée du Mandat">
          <Text style={styles.text}>
            Le présent mandat est conclu pour une durée de{" "}
            <Text style={{ fontWeight: "bold" }}>
              {data.duration.months} mois
            </Text>
            .
          </Text>
          <DataTable
            brand={brand}
            rows={[
              { label: "Date de début", value: formatDate(data.duration.startDate) },
              { label: "Date de fin", value: formatDate(data.duration.endDate) },
            ]}
          />
        </Section>

        {/* 5. Marketing Methods */}
        <Section brand={brand} number={5} title="Moyens de Commercialisation">
          <BulletList brand={brand} items={data.marketingMethods} />
        </Section>

        {/* 6. Special Clauses (if any) */}
        {data.specialClauses.length > 0 && (
          <Section brand={brand} number={6} title="Clauses Particulières" highlight>
            <BulletList brand={brand} items={data.specialClauses} />
          </Section>
        )}

        {/* Signatures */}
        <SignatureBlock
          brand={brand}
          signatories={[
            {
              role: "Le Mandant",
              name: `${data.seller.firstName} ${data.seller.lastName}`,
              showLuApprouve: true,
            },
            {
              role: "Le Mandataire",
              name: data.agent.name,
              showLuApprouve: false,
            },
          ]}
          date={formatDate(data.duration.startDate)}
        />

        {/* Footer */}
        <Footer brand={brand} />
      </Page>
    </Document>
  )
}
