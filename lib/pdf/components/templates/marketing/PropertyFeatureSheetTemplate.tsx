import { Image, StyleSheet, View, Text } from "@react-pdf/renderer"
import type { PropertyFeatureSheetData } from "@/lib/pdf-generator"
import type { BrandConfig } from "../../../types"
import { formatCurrency, getPropertyTypeLabel } from "../../../utils/formatters"
import {
  MultiPageWrapper,
  Section,
  TwoColumn,
  LabelValue,
  BulletList,
  DataTable,
  Paragraph,
} from "../../shared"

interface PropertyFeatureSheetTemplateProps {
  data: PropertyFeatureSheetData
  brand: BrandConfig
}

export function PropertyFeatureSheetTemplate({ data, brand }: PropertyFeatureSheetTemplateProps) {
  const styles = StyleSheet.create({
    heroImage: {
      height: 250,
      width: '100%',
      objectFit: 'cover',
      marginBottom: 20,
      backgroundColor: "#f3f4f6",
    },
    // Mandate-style Price Box
    priceBox: {
      backgroundColor: brand.colors.highlight,
      padding: 12,
      borderRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: brand.colors.primary,
      marginVertical: 10,
    },
    priceLabel: {
      fontSize: 10,
      color: brand.colors.muted,
      marginBottom: 4,
      textTransform: 'uppercase',
      fontWeight: 'bold',
    },
    priceAmount: {
      fontSize: 20,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    // Custom Table for Room Details (4 columns)
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
    cRoom: { width: "25%" },
    cSurf: { width: "15%", textAlign: 'right' },
    cDesc: { width: "35%" },
    cFeat: { width: "25%" },
    // Agent small box
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
    }
  })

  // Prepare characteristics for DataTable
  const mainSpecsRows = [
    { label: "Type", value: getPropertyTypeLabel(data.property.type) },
    { label: "Surface", value: `${data.property.characteristics.surface} m²` },
    { label: "Pièces", value: data.property.characteristics.rooms },
    { label: "Chambres", value: data.property.characteristics.bedrooms },
    { label: "Année de construction", value: data.buildingDetails?.yearBuilt },
    { label: "Chauffage", value: data.utilities.heating },
  ];

  return (
    <MultiPageWrapper
      brand={brand}
      documentTitle="FICHE TECHNIQUE"
      documentRef={data.property.reference}
    >
        <Paragraph brand={brand}>
          {data.property.address.street}, {data.property.address.postalCode} {data.property.address.city}
        </Paragraph>

        {/* Main Image */}
        {data.property.images?.[0] && (
          <Image src={data.property.images[0]} style={styles.heroImage} />
        )}

        {/* Price & Summary */}
        <Section title="RÉSUMÉ" number={1} brand={brand}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Prix de vente</Text>
            <Text style={styles.priceAmount}>{formatCurrency(data.property.price)}</Text>
          </View>
          <DataTable brand={brand} rows={mainSpecsRows} />
        </Section>

        {/* Detailed Features */}
        <Section title="CARACTÉRISTIQUES DÉTAILLÉES" number={2} brand={brand}>
          <TwoColumn
            brand={brand}
            left={
              <>
                <Text style={{ fontSize: 9, color: brand.colors.secondary, fontWeight: 'bold', marginBottom: 4 }}>Extérieur</Text>
                <BulletList items={data.exteriorFeatures} brand={brand} />

                <Text style={{ fontSize: 9, color: brand.colors.secondary, fontWeight: 'bold', marginBottom: 4, marginTop: 10 }}>Stationnement</Text>
                <LabelValue label="Type" value={data.parking.type} brand={brand} />
                <LabelValue label="Capacité" value={data.parking.capacity} brand={brand} />
              </>
            }
            right={
              <>
                <Text style={{ fontSize: 9, color: brand.colors.secondary, fontWeight: 'bold', marginBottom: 4 }}>Intérieur</Text>
                <BulletList items={data.interiorFeatures} brand={brand} />

                <Text style={{ fontSize: 9, color: brand.colors.secondary, fontWeight: 'bold', marginBottom: 4, marginTop: 10 }}>Réseaux</Text>
                <LabelValue label="Eau" value={data.utilities.water} brand={brand} />
                <LabelValue label="Élect." value={data.utilities.electricity} brand={brand} />
                <LabelValue label="Tout-à-l'égout" value={data.utilities.sewer} brand={brand} />
              </>
            }
          />
        </Section>

        {/* Room Details Table */}
        {data.roomDetails.length > 0 && (
          <Section title="DÉTAIL DES PIÈCES" number={3} brand={brand}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.cRoom]}>Pièce</Text>
                <Text style={[styles.tableHeaderText, styles.cSurf]}>Surface</Text>
                <Text style={[styles.tableHeaderText, styles.cDesc]}>Description</Text>
                <Text style={[styles.tableHeaderText, styles.cFeat]}>Atouts</Text>
              </View>
              {data.roomDetails.map((r, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.cRoom]}>{r.room}</Text>
                  <Text style={[styles.tableCell, styles.cSurf]}>{r.surface} m²</Text>
                  <Text style={[styles.tableCell, styles.cDesc]}>{r.description}</Text>
                  <Text style={[styles.tableCell, styles.cFeat]}>{r.features.join(", ")}</Text>
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Contact (Mandate Style) */}
        <Section title="CONTACT" number={4} brand={brand}>
          <View style={styles.partyBox}>
            <View style={styles.partyContent}>
              {data.agent.photo && (
                <Image src={data.agent.photo} style={styles.agentImage} />
              )}
              <View style={styles.partyInfo}>
                <LabelValue label="Nom" value={data.agent.name} brand={brand} />
                <LabelValue label="Email" value={data.agent.email} brand={brand} />
                <LabelValue label="Tél" value={data.agent.phone} brand={brand} />
              </View>
            </View>
          </View>
        </Section>

    </MultiPageWrapper>
  )
}
