import { Image, StyleSheet, View, Text } from "@react-pdf/renderer"
import type { PropertyBrochureData } from "@/lib/pdf-generator"
import type { BrandConfig } from "../../../types"
import { formatCurrency, getPropertyTypeLabel } from "../../../utils/formatters"
import {
  MultiPageWrapper,
  Section,
  TwoColumn,
  LabelValue,
  BulletList,
  Paragraph,
  DataTable,
} from "../../shared"

interface PropertyBrochureTemplateProps {
  data: PropertyBrochureData
  brand: BrandConfig
}

export function PropertyBrochureTemplate({ data, brand }: PropertyBrochureTemplateProps) {
  const styles = StyleSheet.create({
    imageContainer: {
      height: 300,
      marginBottom: 20,
      backgroundColor: "#f3f4f6",
    },
    propertyImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    imagePlaceholder: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    imagePlaceholderText: {
      fontSize: 14,
      color: "#6b7280",
    },
    // Matches MandateTemplate priceBox style
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
    },
    priceAmount: {
      fontSize: 20,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    priceDetails: {
      fontSize: 10,
      color: brand.colors.text,
      marginTop: 4,
    },
    // Matches MandateTemplate partyBox style
    partyBox: {
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 4,
      padding: 10,
      marginTop: 5,
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
    partyContent: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    agentImage: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 10,
      objectFit: "cover",
      backgroundColor: "#e5e7eb",
    },
    partyInfo: {
      flex: 1,
    },
    photoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginLeft: -6,
      marginRight: -6,
      marginTop: 6,
    },
    photoCell: {
      width: "50%",
      paddingLeft: 6,
      paddingRight: 6,
      paddingBottom: 12,
    },
    photo: {
      width: "100%",
      height: 180,
      objectFit: "cover",
      backgroundColor: "#f3f4f6",
      borderRadius: 4,
    },
  })

  const featuresList = (data.features?.length ? data.features : data.property.tags) || []

  const highlightItems = (data.highlights || []).map((h) => `${h.title} — ${h.description}`)

  const amenityItems = (data.nearbyAmenities || []).map((a) => `${a.name} (${a.distance})`)

  const allPhotos = data.property.images || []
  const heroPhoto = allPhotos[0]
  const galleryPhotos = allPhotos.slice(1, 7)

  // Prepare characteristics rows for DataTable (matches Mandate style)
  const characteristicRows = [
    { label: "Surface habitable", value: `${data.property.characteristics.surface} m²` },
    { label: "Pièces / Chambres", value: `${data.property.characteristics.rooms} p / ${data.property.characteristics.bedrooms} ch` },
    { label: "Salles de bain", value: data.property.characteristics.bathrooms },
    { label: "État général", value: data.property.characteristics.condition },
    { label: "Année de construction", value: data.property.characteristics.yearBuilt },
    ...(data.energyRating ? [{ label: "DPE", value: `${data.energyRating.class} (${data.energyRating.consumption} kWh/m²/an)` }] : [])
  ];

  return (
    <MultiPageWrapper
      brand={brand}
      documentTitle={getPropertyTypeLabel(data.property.type).toUpperCase()}
      documentRef={data.property.reference}
    >
        {/* Introduction with Address */}
        <Paragraph brand={brand}>
          {data.property.address.street}, {data.property.address.postalCode} {data.property.address.city}
        </Paragraph>

        {/* Main Image */}
        <View style={styles.imageContainer}>
          {heroPhoto ? (
            <Image src={heroPhoto} style={styles.propertyImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>Photo à venir</Text>
            </View>
          )}
        </View>

        {/* Price Banner (Mandate Style) */}
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Prix de vente</Text>
          <Text style={styles.priceAmount}>{formatCurrency(data.property.price)}</Text>
          <Text style={styles.priceDetails}>
            Soit {formatCurrency(Math.round(data.property.price / data.property.characteristics.surface))} / m²
          </Text>
        </View>

        <TwoColumn
          brand={brand}
          left={
            <>
              <Section title="CARACTÉRISTIQUES" number={1} brand={brand}>
                <DataTable brand={brand} rows={characteristicRows} />
              </Section>

              <Section title="POINTS FORTS" number={2} brand={brand}>
                <BulletList items={featuresList} brand={brand} />
              </Section>
            </>
          }
          right={
            <>
              <Section title="À LA UNE" number={3} brand={brand}>
                <BulletList items={highlightItems} brand={brand} />
              </Section>

              <Section title="À PROXIMITÉ" number={4} brand={brand}>
                <BulletList items={amenityItems} brand={brand} />
              </Section>
            </>
          }
        />

        {/* Photo Gallery */}
        {galleryPhotos.length > 0 && (
          <Section title="PHOTOS" number={5} brand={brand}>
            <View style={styles.photoGrid}>
              {galleryPhotos.map((src) => (
                <View key={src} style={styles.photoCell}>
                  <Image src={src} style={styles.photo} />
                </View>
              ))}
            </View>
          </Section>
        )}

        {/* Agent Section (Mandate Style) */}
        <Section title="VOTRE CONTACT" number={6} brand={brand}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Le Mandataire</Text>
            <View style={styles.partyContent}>
              {data.agent.photo && (
                <Image src={data.agent.photo} style={styles.agentImage} />
              )}
              <View style={styles.partyInfo}>
                <LabelValue label="Nom" value={data.agent.name} brand={brand} />
                <LabelValue label="Téléphone" value={data.agent.phone} brand={brand} />
                <LabelValue label="Email" value={data.agent.email} brand={brand} />
              </View>
            </View>
          </View>
        </Section>

        {/* Custom Message */}
        {data.customMessage && (
          <Section title="MESSAGE" number={7} brand={brand}>
            <Paragraph brand={brand}>{data.customMessage}</Paragraph>
          </Section>
        )}

    </MultiPageWrapper>
  )
}
