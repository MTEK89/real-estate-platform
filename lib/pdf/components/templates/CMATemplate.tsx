import { Image, StyleSheet, View, Text } from "@react-pdf/renderer"
import type { CMAData } from "@/lib/pdf-generator"
import type { BrandConfig } from "../../types"
import { formatCurrency, formatDate, getPropertyTypeLabel } from "../../utils/formatters"
import {
  MultiPageWrapper,
  Section,
  TwoColumn,
  LabelValue,
  Paragraph,
  BulletList,
  Callout,
  DataTable,
} from "../shared"

interface CMATemplateProps {
  data: CMAData
  brand: BrandConfig
}

export function CMATemplate({ data, brand }: CMATemplateProps) {
  const styles = StyleSheet.create({
    // Mandate-style Price Box
    priceBox: {
      backgroundColor: brand.colors.highlight,
      padding: 12,
      borderRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: brand.colors.primary,
      marginVertical: 10,
    },
    priceTitle: {
      fontSize: 10,
      color: brand.colors.muted,
      marginBottom: 8,
      textAlign: "center",
      textTransform: "uppercase",
      fontWeight: "bold",
    },
    priceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    priceItem: {
      flex: 1,
      alignItems: "center",
    },
    priceValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: brand.colors.text,
    },
    priceValueMain: {
      fontSize: 22,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    priceLabel: {
      fontSize: 8,
      color: brand.colors.muted,
      marginTop: 4,
    },
    // Market Indicators Grid
    indicatorsGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
      marginBottom: 20,
    },
    indicatorCard: {
      width: "30%",
      backgroundColor: "#f9fafb",
      padding: 10,
      borderRadius: 4,
      alignItems: "center",
      borderWidth: 1,
      borderColor: brand.colors.border,
    },
    indicatorValue: {
      fontSize: 12,
      fontWeight: "bold",
      color: brand.colors.primary,
      marginBottom: 4,
    },
    indicatorLabel: {
      fontSize: 8,
      color: brand.colors.muted,
      textAlign: "center",
    },
    // Mandate-style Party/Agent Box
    partyBox: {
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 4,
      padding: 10,
      marginTop: 10,
    },
    partyContent: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    agentImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
      objectFit: "cover",
      backgroundColor: "#e5e7eb",
    },
    partyInfo: {
      flex: 1,
    },
    // Custom Table for Comparables (7 columns)
    table: {
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 4,
      overflow: "hidden",
      marginTop: 10,
      marginBottom: 10,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: brand.colors.primary,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    tableHeaderText: {
      color: "#ffffff",
      fontSize: 7,
      fontWeight: "bold",
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderTopWidth: 1,
      borderTopColor: brand.colors.border,
    },
    tableCell: {
      fontSize: 7,
      color: brand.colors.text,
    },
    cAddr: { width: "25%" },
    cType: { width: "12%" },
    cSurf: { width: "10%", textAlign: 'right' },
    cPrice: { width: "15%", textAlign: 'right' },
    cSqm: { width: "13%", textAlign: 'right' },
    cDate: { width: "13%", textAlign: 'right' },
    cDays: { width: "12%", textAlign: 'right' },
  })

  // Prepare property details rows
  const propertyRows = [
    { label: "Adresse", value: `${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}` },
    { label: "Type", value: `${getPropertyTypeLabel(data.property.type)} - ${data.property.characteristics.rooms} pièces` },
    { label: "Surface", value: `${data.property.characteristics.surface} m²` },
    { label: "Client", value: data.preparedFor.name },
  ];

  const getIndicatorLabel = (level: string) => {
    const labels: Record<string, string> = {
      low: "Faible", balanced: "Équilibré", high: "Élevé",
      declining: "En baisse", stable: "Stable", rising: "En hausse",
      weak: "Faible", moderate: "Modérée", strong: "Forte",
    }
    return labels[level] || level
  }

  return (
    <MultiPageWrapper
      brand={brand}
      documentTitle="ANALYSE COMPARATIVE DE MARCHÉ"
      documentRef={`CMA-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`}
    >
        <Paragraph brand={brand}>
          Généré le {formatDate(data.generatedAt)} pour votre projet immobilier.
        </Paragraph>

        {/* 1. Analysis Object */}
        <Section title="OBJET DE L'ANALYSE" number={1} brand={brand}>
          <DataTable brand={brand} rows={propertyRows} />
        </Section>

        {/* 2. Price Recommendation (Mandate Box Style) */}
        <Section title="ESTIMATION DE PRIX" number={2} brand={brand}>
          <View style={styles.priceBox}>
            <Text style={styles.priceTitle}>Prix de Vente Recommandé</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceItem}>
                <Text style={styles.priceValue}>{formatCurrency(data.suggestedPrice.low)}</Text>
                <Text style={styles.priceLabel}>Bas</Text>
              </View>
              <View style={styles.priceItem}>
                <Text style={styles.priceValueMain}>{formatCurrency(data.suggestedPrice.recommended)}</Text>
                <Text style={styles.priceLabel}>Recommandé</Text>
              </View>
              <View style={styles.priceItem}>
                <Text style={styles.priceValue}>{formatCurrency(data.suggestedPrice.high)}</Text>
                <Text style={styles.priceLabel}>Haut</Text>
              </View>
            </View>
          </View>
        </Section>

        {/* 3. Market Indicators */}
        <Section title="INDICATEURS DE MARCHÉ" number={3} brand={brand}>
          <View style={styles.indicatorsGrid}>
            <View style={styles.indicatorCard}>
              <Text style={styles.indicatorValue}>{formatCurrency(data.marketAnalysis.averagePricePerSqm)}</Text>
              <Text style={styles.indicatorLabel}>Prix moyen / m²</Text>
            </View>
            <View style={styles.indicatorCard}>
              <Text style={styles.indicatorValue}>{data.marketAnalysis.averageDaysOnMarket} j</Text>
              <Text style={styles.indicatorLabel}>Délai moyen</Text>
            </View>
            <View style={styles.indicatorCard}>
              <Text style={styles.indicatorValue}>{getIndicatorLabel(data.marketAnalysis.marketTrend)}</Text>
              <Text style={styles.indicatorLabel}>Tendance</Text>
            </View>
          </View>
          <TwoColumn
            brand={brand}
            left={<LabelValue label="Stock disponible" value={getIndicatorLabel(data.marketAnalysis.inventoryLevel)} brand={brand} />}
            right={<LabelValue label="Niveau de demande" value={getIndicatorLabel(data.marketAnalysis.demandLevel)} brand={brand} />}
          />
        </Section>

        {/* 4. Comparables Table */}
        <Section title="BIENS COMPARABLES VENDUS" number={4} brand={brand}>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.cAddr]}>Adresse</Text>
              <Text style={[styles.tableHeaderText, styles.cType]}>Type</Text>
              <Text style={[styles.tableHeaderText, styles.cSurf]}>Surf.</Text>
              <Text style={[styles.tableHeaderText, styles.cPrice]}>Prix</Text>
              <Text style={[styles.tableHeaderText, styles.cSqm]}>€/m²</Text>
              <Text style={[styles.tableHeaderText, styles.cDate]}>Date</Text>
              <Text style={[styles.tableHeaderText, styles.cDays]}>Délai</Text>
            </View>
            {data.comparables.map((comp, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.cAddr]}>{comp.address}</Text>
                <Text style={[styles.tableCell, styles.cType]}>{comp.type}</Text>
                <Text style={[styles.tableCell, styles.cSurf]}>{comp.surface} m²</Text>
                <Text style={[styles.tableCell, styles.cPrice]}>{formatCurrency(comp.soldPrice)}</Text>
                <Text style={[styles.tableCell, styles.cSqm]}>{formatCurrency(comp.pricePerSqm)}</Text>
                <Text style={[styles.tableCell, styles.cDate]}>{formatDate(comp.soldDate)}</Text>
                <Text style={[styles.tableCell, styles.cDays]}>{comp.daysOnMarket}j</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* 5. Analysis Details */}
        <Section title="ANALYSE DÉTAILLÉE" number={5} brand={brand}>
          <TwoColumn
            brand={brand}
            left={
              <>
                <Text style={{ fontSize: 10, color: '#22c55e', fontWeight: 'bold', marginBottom: 4 }}>Points Forts (+)</Text>
                <BulletList items={data.strengths} brand={brand} />
              </>
            }
            right={
              <>
                <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: 'bold', marginBottom: 4 }}>Axes d'amélioration</Text>
                <BulletList items={data.improvements} brand={brand} />
              </>
            }
          />
        </Section>

        {/* 6. Recommendations */}
        <Section title="RECOMMANDATIONS" number={6} brand={brand}>
          <BulletList items={data.marketingRecommendations} brand={brand} />
        </Section>

        {/* 7. Agent (Mandate Style) */}
        <Section title="PRÉPARÉ PAR" number={7} brand={brand}>
          <View style={styles.partyBox}>
            <View style={styles.partyContent}>
              {data.preparedBy.photo && (
                <Image src={data.preparedBy.photo} style={styles.agentImage} />
              )}
              <View style={styles.partyInfo}>
                <LabelValue label="Nom" value={data.preparedBy.name} brand={brand} />
                <LabelValue label="Titre" value={data.preparedBy.title} brand={brand} />
                <LabelValue label="Email" value={data.preparedBy.email} brand={brand} />
                <LabelValue label="Tél" value={data.preparedBy.phone} brand={brand} />
              </View>
            </View>
          </View>
        </Section>

    </MultiPageWrapper>
  )
}
