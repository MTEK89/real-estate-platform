import { View, Text, StyleSheet } from "@react-pdf/renderer"
import type { PriceListData } from "@/lib/pdf-generator"
import type { BrandConfig } from "../../types"
import { formatDate, formatCurrency } from "../../utils/formatters"
import { withAlpha } from "../../utils/colors"
import { MultiPageWrapper, Section, TwoColumn, InfoBox, LabelValue, Paragraph } from "../shared"

interface PriceListTemplateProps {
  data: PriceListData
  brand: BrandConfig
}

export function PriceListTemplate({ data, brand }: PriceListTemplateProps) {
  const styles = StyleSheet.create({
    // Table
    table: {
      marginBottom: 15,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: brand.colors.primary,
      color: "#ffffff",
      padding: 8,
    },
    tableHeaderCell: {
      color: "#ffffff",
      fontWeight: "bold",
      fontSize: 8,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#eeeeee",
      padding: 6,
      alignItems: "center",
    },
    tableRowAlt: {
      backgroundColor: "#f9f9f9",
    },
    tableCell: {
      fontSize: 8,
      color: brand.colors.text,
    },
    // Column widths
    colLot: { width: "8%" },
    colType: { width: "12%" },
    colFloor: { width: "8%" },
    colSurface: { width: "10%" },
    colOrientation: { width: "10%" },
    colPrice: { width: "15%" },
    colPriceSqm: { width: "12%" },
    colParking: { width: "10%" },
    colStatus: { width: "15%" },
    // Status badges
    statusAvailable: {
      backgroundColor: "#dcfce7",
      color: "#166534",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 3,
      fontSize: 7,
      fontWeight: "bold",
    },
    statusReserved: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 3,
      fontSize: 7,
      fontWeight: "bold",
    },
    statusSold: {
      backgroundColor: "#fee2e2",
      color: "#991b1b",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 3,
      fontSize: 7,
      fontWeight: "bold",
    },
    // Parking & Storage section
    optionsSection: {
      flexDirection: "row",
      marginBottom: 15,
    },
    optionBox: {
      flex: 1,
      marginRight: 10,
      padding: 10,
      backgroundColor: "#f8f9fa",
      borderRadius: 6,
    },
    optionTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: brand.colors.primary,
      marginBottom: 8,
    },
    optionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 4,
      borderBottomWidth: 1,
      borderBottomColor: "#eeeeee",
    },
    optionLabel: {
      fontSize: 8,
      color: brand.colors.text,
    },
    optionPrice: {
      fontSize: 8,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    // Notes
    notesSection: {
      marginTop: 15,
      padding: 10,
      backgroundColor: withAlpha(brand.colors.primary, 0.03),
      borderRadius: 6,
      borderLeftWidth: 3,
      borderLeftColor: brand.colors.secondary,
    },
    notesTitle: {
      fontSize: 9,
      fontWeight: "bold",
      color: brand.colors.text,
      marginBottom: 5,
    },
    noteItem: {
      fontSize: 8,
      color: brand.colors.muted,
      marginBottom: 3,
    },
    // Legend
    legend: {
      flexDirection: "row",
      marginTop: 10,
      marginBottom: 15,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 15,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 5,
    },
    legendText: {
      fontSize: 7,
      color: brand.colors.muted,
    },
  })

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "available":
        return styles.statusAvailable
      case "reserved":
        return styles.statusReserved
      case "sold":
        return styles.statusSold
      default:
        return styles.statusAvailable
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "DISPONIBLE"
      case "reserved":
        return "RÉSERVÉ"
      case "sold":
        return "VENDU"
      default:
        return status.toUpperCase()
    }
  }

  // Count by status
  const availableCount = data.lots.filter((l) => l.status === "available").length
  const reservedCount = data.lots.filter((l) => l.status === "reserved").length
  const soldCount = data.lots.filter((l) => l.status === "sold").length

  return (
    <MultiPageWrapper
      brand={brand}
      documentTitle="GRILLE TARIFAIRE"
      documentRef={`P-${data.program.name.substring(0, 3).toUpperCase()}`}
    >
        {/* Program Info Section */}
        <Section brand={brand} title="PROGRAMME">
          <TwoColumn
            brand={brand}
            left={
              <>
                <LabelValue brand={brand} label="Nom" value={data.program.name} />
                <LabelValue brand={brand} label="Adresse" value={data.program.address} />
                <LabelValue brand={brand} label="Promoteur" value={data.program.promoter} />
              </>
            }
            right={
              <>
                <LabelValue brand={brand} label="Livraison" value={formatDate(data.program.deliveryDate)} />
                <View style={{ backgroundColor: brand.colors.secondary, padding: 4, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 }}>
                  <Text style={{ fontSize: 8, color: '#fff', fontWeight: 'bold' }}>Valide jusqu'au {formatDate(data.validUntil)}</Text>
                </View>
              </>
            }
          />
        </Section>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#166534" }]} />
            <Text style={styles.legendText}>Disponible ({availableCount})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#92400e" }]} />
            <Text style={styles.legendText}>Réservé ({reservedCount})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#991b1b" }]} />
            <Text style={styles.legendText}>Vendu ({soldCount})</Text>
          </View>
        </View>

        {/* Main Table */}
        <Section brand={brand} title="LOTS">
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colLot]}>Lot</Text>
              <Text style={[styles.tableHeaderCell, styles.colType]}>Type</Text>
              <Text style={[styles.tableHeaderCell, styles.colFloor]}>Étage</Text>
              <Text style={[styles.tableHeaderCell, styles.colSurface]}>Surface</Text>
              <Text style={[styles.tableHeaderCell, styles.colOrientation]}>Orient.</Text>
              <Text style={[styles.tableHeaderCell, styles.colPrice]}>Prix TTC</Text>
              <Text style={[styles.tableHeaderCell, styles.colPriceSqm]}>€/m²</Text>
              <Text style={[styles.tableHeaderCell, styles.colParking]}>Parking</Text>
              <Text style={[styles.tableHeaderCell, styles.colStatus]}>Statut</Text>
            </View>

            {/* Rows */}
            {data.lots.map((lot, index) => (
              <View
                key={lot.lotNumber}
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, styles.colLot]}>{lot.lotNumber}</Text>
                <Text style={[styles.tableCell, styles.colType]}>{lot.type}</Text>
                <Text style={[styles.tableCell, styles.colFloor]}>
                  {lot.floor === 0 ? "RDC" : `${lot.floor}e`}
                </Text>
                <Text style={[styles.tableCell, styles.colSurface]}>{lot.surface} m²</Text>
                <Text style={[styles.tableCell, styles.colOrientation]}>{lot.orientation}</Text>
                <Text style={[styles.tableCell, styles.colPrice, { fontWeight: "bold" }]}>
                  {formatCurrency(lot.price)}
                </Text>
                <Text style={[styles.tableCell, styles.colPriceSqm]}>
                  {formatCurrency(lot.pricePerSqm)}
                </Text>
                <Text style={[styles.tableCell, styles.colParking]}>
                  {lot.parking ? `+${formatCurrency(lot.parking)}` : "-"}
                </Text>
                <View style={styles.colStatus}>
                  <Text style={getStatusStyle(lot.status)}>{getStatusLabel(lot.status)}</Text>
                </View>
              </View>
            ))}
          </View>
        </Section>

        {/* Parking & Storage Options */}
        <Section brand={brand} title="OPTIONS">
          <View style={styles.optionsSection}>
            {data.parkingPrices.length > 0 && (
              <View style={styles.optionBox}>
                <Text style={styles.optionTitle}>Stationnement</Text>
                {data.parkingPrices.map((parking, index) => (
                  <View key={index} style={styles.optionRow}>
                    <Text style={styles.optionLabel}>{parking.type}</Text>
                    <Text style={styles.optionPrice}>{formatCurrency(parking.price)}</Text>
                  </View>
                ))}
              </View>
            )}
            {data.storagePrices.length > 0 && (
              <View style={styles.optionBox}>
                <Text style={styles.optionTitle}>Caves / Celliers</Text>
                {data.storagePrices.map((storage, index) => (
                  <View key={index} style={styles.optionRow}>
                    <Text style={styles.optionLabel}>{storage.type}</Text>
                    <Text style={styles.optionPrice}>{formatCurrency(storage.price)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Section>

        {/* Notes */}
        {data.notes.length > 0 && (
          <Section brand={brand} title="NOTES">
            <InfoBox brand={brand} title="IMPORTANT">
              {data.notes.map((note, index) => (
                <Paragraph key={index} brand={brand}>{note}</Paragraph>
              ))}
            </InfoBox>
          </Section>
        )}
    </MultiPageWrapper>
  )
}
