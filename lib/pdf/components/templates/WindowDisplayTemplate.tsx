import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { WindowDisplayData } from "@/lib/pdf-generator"
import type { BrandConfig } from "../../types"
import { formatCurrency, getPropertyTypeLabel } from "../../utils/formatters"

interface WindowDisplayTemplateProps {
  data: WindowDisplayData
  brand: BrandConfig
}

export function WindowDisplayTemplate({ data, brand }: WindowDisplayTemplateProps) {
  const isA3 = data.displaySize === "A3"

  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      backgroundColor: "#ffffff",
      position: "relative",
    },
    // Full background image area
    imageContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: isA3 ? "65%" : "60%",
      backgroundColor: "#e5e7eb",
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
      backgroundColor: "#f3f4f6",
    },
    // Badge overlay
    badge: {
      position: "absolute",
      top: 20,
      left: 20,
      backgroundColor: brand.colors.secondary,
      paddingHorizontal: isA3 ? 20 : 15,
      paddingVertical: isA3 ? 10 : 8,
      borderRadius: 4,
    },
    badgeText: {
      color: "#ffffff",
      fontSize: isA3 ? 16 : 12,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    // Agency logo overlay
    logoOverlay: {
      position: "absolute",
      top: 20,
      right: 20,
      backgroundColor: "rgba(255,255,255,0.95)",
      padding: isA3 ? 12 : 8,
      borderRadius: 6,
    },
    logo: {
      width: isA3 ? 100 : 70,
      height: isA3 ? 35 : 25,
      objectFit: "contain",
    },
    // Content section
    content: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: isA3 ? "35%" : "40%",
      backgroundColor: "#ffffff",
      padding: isA3 ? 30 : 20,
    },
    // Price banner
    priceBanner: {
      backgroundColor: brand.colors.primary,
      marginHorizontal: isA3 ? -30 : -20,
      marginTop: isA3 ? -30 : -20,
      paddingVertical: isA3 ? 15 : 12,
      paddingHorizontal: isA3 ? 30 : 20,
      marginBottom: isA3 ? 20 : 15,
    },
    priceText: {
      color: "#ffffff",
      fontSize: isA3 ? 36 : 28,
      fontWeight: "bold",
      textAlign: "center",
    },
    priceLabel: {
      color: "rgba(255,255,255,0.8)",
      fontSize: isA3 ? 12 : 10,
      textAlign: "center",
      marginTop: 4,
    },
    // Property details
    propertyType: {
      fontSize: isA3 ? 24 : 18,
      fontWeight: "bold",
      color: brand.colors.text,
      marginBottom: isA3 ? 8 : 5,
    },
    location: {
      fontSize: isA3 ? 14 : 11,
      color: brand.colors.muted,
      marginBottom: isA3 ? 15 : 10,
    },
    // Features row
    featuresRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      paddingTop: isA3 ? 15 : 10,
      marginTop: isA3 ? 10 : 8,
    },
    feature: {
      alignItems: "center",
    },
    featureValue: {
      fontSize: isA3 ? 28 : 20,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    featureLabel: {
      fontSize: isA3 ? 10 : 8,
      color: brand.colors.muted,
      marginTop: 2,
      textTransform: "uppercase",
    },
    // Footer
    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: brand.colors.text,
      paddingVertical: isA3 ? 12 : 8,
      paddingHorizontal: isA3 ? 30 : 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerText: {
      color: "#ffffff",
      fontSize: isA3 ? 12 : 9,
    },
    footerPhone: {
      color: "#ffffff",
      fontSize: isA3 ? 16 : 12,
      fontWeight: "bold",
    },
    // QR Code area
    qrSection: {
      position: "absolute",
      bottom: isA3 ? 70 : 50,
      right: isA3 ? 30 : 20,
      backgroundColor: "#ffffff",
      padding: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#e5e7eb",
      alignItems: "center",
    },
    qrPlaceholder: {
      width: isA3 ? 60 : 45,
      height: isA3 ? 60 : 45,
      backgroundColor: "#f3f4f6",
      justifyContent: "center",
      alignItems: "center",
    },
    qrText: {
      fontSize: isA3 ? 7 : 6,
      color: brand.colors.muted,
      marginTop: 4,
    },
    // Reference
    reference: {
      position: "absolute",
      top: isA3 ? "67%" : "62%",
      right: isA3 ? 30 : 20,
      backgroundColor: "rgba(0,0,0,0.7)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 3,
    },
    referenceText: {
      color: "#ffffff",
      fontSize: isA3 ? 10 : 8,
    },
  })

  const getPriceDisplay = () => {
    switch (data.priceDisplay) {
      case "full":
        return formatCurrency(data.property.price)
      case "from":
        return `À partir de ${formatCurrency(data.property.price)}`
      case "hidden":
        return "Prix sur demande"
      default:
        return formatCurrency(data.property.price)
    }
  }

  return (
    <Document>
      <Page size={isA3 ? "A3" : "A4"} style={styles.page}>
        {/* Property Image */}
        <View style={styles.imageContainer}>
          {data.property.images?.[0] ? (
            <Image src={data.property.images[0]} style={styles.propertyImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={{ color: "#9ca3af", fontSize: isA3 ? 24 : 18 }}>Photo du bien</Text>
            </View>
          )}
        </View>

        {/* Badge */}
        {data.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{data.badge}</Text>
          </View>
        )}

        {/* Agency Logo */}
        <View style={styles.logoOverlay}>
          {brand.logo ? (
            <Image src={brand.logo} style={styles.logo} />
          ) : (
            <Text style={{ fontSize: isA3 ? 14 : 10, fontWeight: "bold", color: brand.colors.primary }}>
              {data.agency.name}
            </Text>
          )}
        </View>

        {/* Reference */}
        <View style={styles.reference}>
          <Text style={styles.referenceText}>Réf. {data.property.reference}</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Price Banner */}
          <View style={styles.priceBanner}>
            <Text style={styles.priceText}>{getPriceDisplay()}</Text>
          </View>

          {/* Property Type & Location */}
          <Text style={styles.propertyType}>
            {getPropertyTypeLabel(data.property.type)} - {data.property.characteristics.rooms} pièces
          </Text>
          <Text style={styles.location}>
            {data.property.address.city} {data.property.address.postalCode}
          </Text>

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

          {/* QR Code */}
          {data.qrCodeUrl && (
            <View style={styles.qrSection}>
              <View style={styles.qrPlaceholder}>
                <Text style={{ fontSize: 6, color: "#9ca3af" }}>QR</Text>
              </View>
              <Text style={styles.qrText}>Scanner pour plus</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{data.agency.website}</Text>
          <Text style={styles.footerPhone}>{data.agency.phone}</Text>
        </View>
      </Page>
    </Document>
  )
}

function getEnergyColor(energyClass: string): string {
  const colors: Record<string, string> = {
    A: "#059669",
    B: "#10b981",
    C: "#84cc16",
    D: "#eab308",
    E: "#f97316",
    F: "#ef4444",
    G: "#dc2626",
  }
  return colors[energyClass] || "#6b7280"
}
