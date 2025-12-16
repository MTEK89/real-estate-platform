import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { OpenHouseData } from "@/lib/pdf-generator"
import type { BrandConfig } from "../../types"
import { formatCurrency, getPropertyTypeLabel } from "../../utils/formatters"
import { withAlpha } from "../../utils/colors"

interface OpenHouseTemplateProps {
  data: OpenHouseData
  brand: BrandConfig
}

export function OpenHouseTemplate({ data, brand }: OpenHouseTemplateProps) {
  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      backgroundColor: "#ffffff",
      position: "relative",
    },
    // Hero section with image
    hero: {
      height: "45%",
      backgroundColor: "#e5e7eb",
      position: "relative",
    },
    heroImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    heroOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    // Event banner
    eventBanner: {
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      marginTop: -40,
      backgroundColor: brand.colors.secondary,
      paddingVertical: 15,
      alignItems: "center",
    },
    eventTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#ffffff",
      textTransform: "uppercase",
      letterSpacing: 3,
    },
    eventSubtitle: {
      fontSize: 12,
      color: "rgba(255,255,255,0.9)",
      marginTop: 4,
    },
    // Agency logo
    logoContainer: {
      position: "absolute",
      top: 20,
      right: 20,
      backgroundColor: "rgba(255,255,255,0.95)",
      padding: 10,
      borderRadius: 6,
    },
    logo: {
      width: 80,
      height: 30,
      objectFit: "contain",
    },
    // Date/Time badge
    dateBadge: {
      position: "absolute",
      top: 20,
      left: 20,
      backgroundColor: brand.colors.primary,
      padding: 15,
      borderRadius: 8,
      alignItems: "center",
      minWidth: 80,
    },
    dateDay: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#ffffff",
    },
    dateMonth: {
      fontSize: 10,
      color: "rgba(255,255,255,0.9)",
      textTransform: "uppercase",
      marginTop: 2,
    },
    // Content
    content: {
      padding: 30,
      paddingTop: 50,
    },
    // Time section
    timeSection: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 25,
    },
    timeBox: {
      alignItems: "center",
      backgroundColor: "#f3f4f6",
      paddingHorizontal: 25,
      paddingVertical: 15,
      borderRadius: 8,
      marginHorizontal: 12,
    },
    timeLabel: {
      fontSize: 9,
      color: brand.colors.muted,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    timeValue: {
      fontSize: 22,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    // Property info
    propertySection: {
      marginBottom: 20,
    },
    propertyType: {
      fontSize: 20,
      fontWeight: "bold",
      color: brand.colors.text,
      textAlign: "center",
    },
    propertyAddress: {
      fontSize: 12,
      color: brand.colors.muted,
      textAlign: "center",
      marginTop: 5,
    },
    // Price
    priceTag: {
      backgroundColor: brand.colors.primary,
      alignSelf: "center",
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 25,
      marginVertical: 15,
    },
    priceText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#ffffff",
    },
    // Features
    featuresRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginBottom: 20,
      paddingVertical: 15,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: "#e5e7eb",
    },
    feature: {
      alignItems: "center",
      marginHorizontal: 12,
    },
    featureValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    featureLabel: {
      fontSize: 9,
      color: brand.colors.muted,
      marginTop: 2,
    },
    // Highlights
    highlightsSection: {
      marginBottom: 20,
    },
    highlightsTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: brand.colors.text,
      marginBottom: 10,
      textAlign: "center",
    },
    highlightsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
    },
    highlightTag: {
      backgroundColor: withAlpha(brand.colors.primary, 0.06),
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      marginHorizontal: 4,
      marginVertical: 4,
    },
    highlightText: {
      fontSize: 9,
      color: brand.colors.primary,
    },
    // Agent card
    agentCard: {
      flexDirection: "row",
      backgroundColor: "#f8f9fa",
      padding: 15,
      borderRadius: 8,
      marginTop: 15,
    },
    agentPhoto: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: brand.colors.primary,
      marginRight: 15,
    },
    agentInfo: {
      flex: 1,
      justifyContent: "center",
    },
    agentName: {
      fontSize: 12,
      fontWeight: "bold",
      color: brand.colors.text,
    },
    agentPhone: {
      fontSize: 14,
      fontWeight: "bold",
      color: brand.colors.primary,
      marginTop: 4,
    },
    // RSVP
    rsvpSection: {
      marginTop: 15,
      padding: 12,
      backgroundColor: withAlpha(brand.colors.secondary, 0.10),
      borderRadius: 6,
      borderLeftWidth: 4,
      borderLeftColor: brand.colors.secondary,
    },
    rsvpText: {
      fontSize: 10,
      color: brand.colors.text,
    },
    // Instructions
    instructionsSection: {
      marginTop: 15,
      padding: 12,
      backgroundColor: "#f9fafb",
      borderRadius: 6,
    },
    instructionsTitle: {
      fontSize: 9,
      fontWeight: "bold",
      color: brand.colors.text,
      marginBottom: 4,
    },
    instructionsText: {
      fontSize: 9,
      color: brand.colors.muted,
    },
    // Footer
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: brand.colors.text,
      paddingVertical: 12,
      paddingHorizontal: 30,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerText: {
      color: "#ffffff",
      fontSize: 9,
    },
    footerWebsite: {
      color: "#ffffff",
      fontSize: 10,
      fontWeight: "bold",
    },
    // QR Code
    qrSection: {
      position: "absolute",
      bottom: 80,
      right: 30,
      backgroundColor: "#ffffff",
      padding: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#e5e7eb",
      alignItems: "center",
    },
    qrPlaceholder: {
      width: 50,
      height: 50,
      backgroundColor: "#f3f4f6",
      justifyContent: "center",
      alignItems: "center",
    },
    qrText: {
      fontSize: 7,
      color: brand.colors.muted,
      marginTop: 4,
    },
  })

  // Parse date
  const eventDate = new Date(data.event.date)
  const day = eventDate.getDate()
  const month = eventDate.toLocaleDateString("fr-FR", { month: "short" }).toUpperCase()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Hero Image */}
        <View style={styles.hero}>
          {data.mainPhoto ? (
            <Image src={data.mainPhoto} style={styles.heroImage} />
          ) : data.property.images?.[0] ? (
            <Image src={data.property.images[0]} style={styles.heroImage} />
          ) : (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f3f4f6" }}>
              <Text style={{ color: "#9ca3af", fontSize: 18 }}>Photo du bien</Text>
            </View>
          )}
          <View style={styles.heroOverlay} />

          {/* Date Badge */}
          <View style={styles.dateBadge}>
            <Text style={styles.dateDay}>{day}</Text>
            <Text style={styles.dateMonth}>{month}</Text>
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            {brand.logo ? (
              <Image src={brand.logo} style={styles.logo} />
            ) : (
              <Text style={{ fontSize: 10, fontWeight: "bold", color: brand.colors.primary }}>
                {data.agency.name}
              </Text>
            )}
          </View>
        </View>

        {/* Event Banner */}
        <View style={styles.eventBanner}>
          <Text style={styles.eventTitle}>PORTES OUVERTES</Text>
          <Text style={styles.eventSubtitle}>Visite libre sans rendez-vous</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Time */}
          <View style={styles.timeSection}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>De</Text>
              <Text style={styles.timeValue}>{data.event.startTime}</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>À</Text>
              <Text style={styles.timeValue}>{data.event.endTime}</Text>
            </View>
          </View>

          {/* Property Info */}
          <View style={styles.propertySection}>
            <Text style={styles.propertyType}>
              {getPropertyTypeLabel(data.property.type)} {data.property.characteristics.rooms} pièces
            </Text>
            <Text style={styles.propertyAddress}>{data.event.address}</Text>
          </View>

          {/* Price */}
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>{formatCurrency(data.property.price)}</Text>
          </View>

          {/* Features */}
          <View style={styles.featuresRow}>
            <View style={styles.feature}>
              <Text style={styles.featureValue}>{data.property.characteristics.surface}</Text>
              <Text style={styles.featureLabel}>m²</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureValue}>{data.property.characteristics.rooms}</Text>
              <Text style={styles.featureLabel}>pièces</Text>
            </View>
            {data.property.characteristics.bedrooms && (
              <View style={styles.feature}>
                <Text style={styles.featureValue}>{data.property.characteristics.bedrooms}</Text>
                <Text style={styles.featureLabel}>chambres</Text>
              </View>
            )}
            {data.property.characteristics.bathrooms && (
              <View style={styles.feature}>
                <Text style={styles.featureValue}>{data.property.characteristics.bathrooms}</Text>
                <Text style={styles.featureLabel}>SDB</Text>
              </View>
            )}
          </View>

          {/* Highlights */}
          {data.highlights.length > 0 && (
            <View style={styles.highlightsSection}>
              <Text style={styles.highlightsTitle}>Points forts</Text>
              <View style={styles.highlightsGrid}>
                {data.highlights.slice(0, 6).map((highlight, index) => (
                  <View key={index} style={styles.highlightTag}>
                    <Text style={styles.highlightText}>{highlight}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Agent */}
          <View style={styles.agentCard}>
            <View style={styles.agentPhoto}>
              {data.agent.photo ? (
                <Image src={data.agent.photo} style={{ width: 50, height: 50, borderRadius: 25 }} />
              ) : (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ color: "#fff", fontSize: 16 }}>
                    {data.agent.name.split(" ").map((n) => n[0]).join("")}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.agentInfo}>
              <Text style={styles.agentName}>{data.agent.name}</Text>
              <Text style={styles.agentPhone}>{data.agent.phone}</Text>
            </View>
          </View>

          {/* RSVP if required */}
          {data.rsvpRequired && data.rsvpContact && (
            <View style={styles.rsvpSection}>
              <Text style={styles.rsvpText}>
                Inscription recommandée : {data.rsvpContact}
              </Text>
            </View>
          )}

          {/* Instructions */}
          {data.event.instructions && (
            <View style={styles.instructionsSection}>
              <Text style={styles.instructionsTitle}>Accès / Instructions</Text>
              <Text style={styles.instructionsText}>{data.event.instructions}</Text>
            </View>
          )}

          {/* QR Code */}
          {data.qrCodeUrl && (
            <View style={styles.qrSection}>
              <View style={styles.qrPlaceholder}>
                <Text style={{ fontSize: 8, color: "#9ca3af" }}>QR</Text>
              </View>
              <Text style={styles.qrText}>Plus d'infos</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{data.agency.phone}</Text>
          <Text style={styles.footerWebsite}>{data.agency.website}</Text>
        </View>
      </Page>
    </Document>
  )
}
