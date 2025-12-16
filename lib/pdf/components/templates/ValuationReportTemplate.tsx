import React from "react"
import { View, Text, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../types"
import type { ValuationReportData } from "@/lib/pdf-generator"
import { PageWrapper } from "../shared/PageWrapper"
import { Section } from "../shared/Section"
import { DataTable, TwoColumn, InfoBox } from "../shared/DataTable"
import { BulletList } from "../shared/Typography"
import { formatCurrency, formatDate, formatNumber } from "../../utils/formatters"

interface ValuationReportTemplateProps {
  data: ValuationReportData
  brand: BrandConfig
}

export function ValuationReportTemplate({ data, brand }: ValuationReportTemplateProps) {
  const styles = StyleSheet.create({
    // Using Mandate-style 'PriceBox' for the main valuation summary
    summaryBox: {
      backgroundColor: brand.colors.highlight,
      padding: 15,
      borderRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: brand.colors.primary,
      marginBottom: 20,
    },
    summaryLabel: {
      fontSize: 10,
      fontWeight: 'bold',
      color: brand.colors.secondary,
      marginBottom: 6,
      textTransform: "uppercase",
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: brand.colors.primary,
      marginBottom: 4,
    },
    summarySub: {
      fontSize: 10,
      color: brand.colors.text,
      fontStyle: 'italic',
    },
    // Context box simpler
    contextBox: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: brand.colors.border,
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 8,
    },
    chip: {
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: "white",
      marginRight: 6,
      marginBottom: 6,
    },
    chipText: {
      fontSize: 8,
      color: brand.colors.text,
    },
    breakdownRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: brand.colors.border,
      paddingVertical: 6,
    },
    breakdownRowLast: {
      flexDirection: "row",
      paddingVertical: 6,
    },
    breakdownLabel: {
      flex: 1,
      fontSize: 9,
      color: brand.colors.text,
    },
    breakdownValue: {
      width: 140,
      textAlign: "right",
      fontSize: 9,
      color: brand.colors.text,
    },
    positive: {
      color: "#16a34a",
    },
    negative: {
      color: "#ea580c",
    },
    smallNote: {
      fontSize: 8,
      color: brand.colors.muted,
      marginTop: 6,
      lineHeight: 1.4,
    },
  })

  // Prepare input tables
  const inputsLeft = [
    { label: "Region", value: data.inputs.region },
    { label: "District", value: data.inputs.district },
    { label: "Propriété", value: data.inputs.propertyType },
    { label: "Surface", value: `${data.inputs.surface} m²` },
    { label: "Chambres/SDB", value: `${data.inputs.bedrooms} / ${data.inputs.bathrooms}` },
  ];
  const inputsRight = [
    { label: "Année de constr.", value: data.inputs.yearBuilt },
    { label: "État", value: data.inputs.condition },
    { label: "DPE", value: data.inputs.energyClass },
    { label: "Date", value: formatDate(data.generatedAt) },
  ];

  const featureRows = Object.entries(data.breakdown.featureAdjustments)
    .filter(([, v]) => v !== 0)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))

  return (
    <PageWrapper
      brand={brand}
      documentTitle={data.reportTitle}
      documentRef={`VAL-${formatDate(data.generatedAt)}`}
    >

        {/* Main Valuation Summary - Mandate Style */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Valeur Estimée</Text>
          <Text style={styles.summaryValue}>{formatCurrency(data.valuation.estimatedValue)}</Text>
          <Text style={styles.summarySub}>
            Fourchette: {formatCurrency(data.valuation.lowEstimate)} – {formatCurrency(data.valuation.highEstimate)}
          </Text>

          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{formatNumber(data.valuation.pricePerM2)} €/m²</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>DPE {data.valuation.energyClass}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                Tendance {data.valuation.regionTrend >= 0 ? "+" : ""}
                {data.valuation.regionTrend}%
              </Text>
            </View>
          </View>
        </View>

        <Section brand={brand} title="DÉTAILS DU BIEN">
          <TwoColumn
            brand={brand}
            left={<DataTable brand={brand} rows={inputsLeft} />}
            right={<DataTable brand={brand} rows={inputsRight} />}
          />

          <InfoBox brand={brand} title="Caractéristiques principales">
            <View>
              {Object.entries(data.inputs.features)
                .filter(([, v]) => v && v !== "none" && v !== "no" && v !== "standard")
                .slice(0, 10)
                .map(([k, v]) => (
                  <Text key={k} style={styles.smallNote}>
                    • {k}: {v}
                  </Text>
                ))}
            </View>
          </InfoBox>
        </Section>

        <Section brand={brand} title="DÉTAIL DU CALCUL">
          <View>
            {[
              ["Valeur de base", data.breakdown.baseValue],
              ["Ajustement DPE", data.breakdown.energyAdjustment],
              ["Caractéristiques", data.breakdown.totalFeatureValue],
              ["Chambres", data.breakdown.bedroomAdjustment],
            ].map(([label, value], idx, arr) => {
              const n = Number(value)
              const isLast = idx === arr.length - 1
              const signClass = n >= 0 ? styles.positive : styles.negative
              return (
                <View key={label} style={isLast ? styles.breakdownRowLast : styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>{label}</Text>
                  <Text style={[styles.breakdownValue, signClass]}>
                    {n >= 0 ? "+" : ""}
                    {formatCurrency(n)}
                  </Text>
                </View>
              )
            })}
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Multiplicateur (Type)</Text>
              <Text style={styles.breakdownValue}>×{data.breakdown.typeMultiplier.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Multiplicateur (État)</Text>
              <Text style={styles.breakdownValue}>×{data.breakdown.conditionMultiplier.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRowLast}>
              <Text style={styles.breakdownLabel}>Dépréciation (Âge)</Text>
              <Text style={styles.breakdownValue}>-{(data.breakdown.ageDepreciation * 100).toFixed(1)}%</Text>
            </View>
          </View>
        </Section>

        {featureRows.length > 0 && (
          <Section brand={brand} title="Ajustements Spécifiques">
            <InfoBox brand={brand} title="Impact des caractéristiques">
              <View>
                {featureRows.slice(0, 10).map(([k, v]) => (
                  <Text key={k} style={styles.smallNote}>
                    • {k}: {v >= 0 ? "+" : ""}
                    {formatCurrency(v)}
                  </Text>
                ))}
              </View>
            </InfoBox>
          </Section>
        )}

    </PageWrapper>
  )
}
