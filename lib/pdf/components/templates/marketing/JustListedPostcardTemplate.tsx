import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { PropertyPostcardData } from "@/lib/pdf-generator"
import type { BrandConfig } from "../../../types"
import { formatCurrency, getPropertyTypeLabel } from "../../../utils/formatters"

interface JustListedPostcardTemplateProps {
  data: PropertyPostcardData
  brand: BrandConfig
}

export function JustListedPostcardTemplate({ data, brand }: JustListedPostcardTemplateProps) {
  const isLandscape = data.orientation === "landscape"
  const sizeScale = data.size === "A6" ? 0.72 : data.size === "DL" ? 0.78 : 0.9
  const pad = Math.round(22 * sizeScale)
  const padLg = Math.round(26 * sizeScale)
  const chipFont = Math.round(11 * sizeScale)
  const baseMuted = "#6b7280"

  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      backgroundColor: "#ffffff",
    },
    // Main container
    container: {
      flex: 1,
      flexDirection: isLandscape ? "row" : "column",
    },
    // Left/Top Section - Property Image
    imageSection: {
      flex: isLandscape ? 1.1 : 1.05,
      backgroundColor: "#f3f4f6",
      position: "relative",
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
    imageOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.3)",
      justifyContent: "flex-end",
      padding: pad,
    },
    badge: {
      backgroundColor: brand.colors.secondary,
      color: "#ffffff",
      paddingHorizontal: Math.round(14 * sizeScale),
      paddingVertical: Math.round(6 * sizeScale),
      borderRadius: 4,
      alignSelf: "flex-start",
      marginBottom: Math.round(10 * sizeScale),
      fontSize: Math.round(12 * sizeScale),
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    // Right/Bottom Section - Property Info
    infoSection: {
      flex: 1,
      padding: padLg,
      justifyContent: "flex-start",
    },
    content: {
      flex: 1,
    },
    // Header
    header: {
      marginBottom: Math.round(14 * sizeScale),
    },
    agencyName: {
      fontSize: Math.round((isLandscape ? 16 : 18) * sizeScale),
      fontWeight: "bold",
      color: brand.colors.primary,
      marginBottom: Math.round(4 * sizeScale),
    },
    headline: {
      fontSize: Math.round((isLandscape ? 16 : 18) * sizeScale),
      fontWeight: "bold",
      color: "#1f2937",
      lineHeight: Math.round((isLandscape ? 20 : 22) * sizeScale),
      marginBottom: Math.round(8 * sizeScale),
    },
    // Property Details
    propertyTitle: {
      fontSize: Math.round(14 * sizeScale),
      fontWeight: "bold",
      marginBottom: Math.round(4 * sizeScale),
    },
    propertyAddress: {
      fontSize: Math.round(11 * sizeScale),
      color: baseMuted,
      marginBottom: Math.round(10 * sizeScale),
    },
    // Features
    features: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: Math.round(10 * sizeScale),
    },
    feature: {
      backgroundColor: "#f3f4f6",
      paddingHorizontal: Math.round(10 * sizeScale),
      paddingVertical: Math.round(5 * sizeScale),
      borderRadius: 15,
      fontSize: chipFont,
      color: "#4b5563",
      marginRight: Math.round(8 * sizeScale),
      marginBottom: Math.round(8 * sizeScale),
    },
    // Price
    priceSection: {
      backgroundColor: brand.colors.primary,
      color: "#ffffff",
      padding: Math.round(12 * sizeScale),
      borderRadius: 8,
      alignItems: "center",
      marginBottom: Math.round(12 * sizeScale),
    },
    priceText: {
      fontSize: Math.round(10 * sizeScale),
      opacity: 0.9,
    },
    price: {
      fontSize: Math.round((isLandscape ? 20 : 22) * sizeScale),
      fontWeight: "bold",
    },
    // Open House
    openHouse: {
      backgroundColor: "#fef3c7",
      borderWidth: 1,
      borderColor: "#f59e0b",
      padding: Math.round(10 * sizeScale),
      borderRadius: 8,
      marginBottom: Math.round(12 * sizeScale),
    },
    openHouseTitle: {
      fontSize: Math.round(11 * sizeScale),
      fontWeight: "bold",
      color: "#d97706",
      marginBottom: 5,
    },
    openHouseTime: {
      fontSize: Math.round(10 * sizeScale),
      color: "#92400e",
    },
    // Agent Info
    agentSection: {
      borderTopWidth: 1,
      borderTopColor: "#e5e7eb",
      paddingTop: Math.round(10 * sizeScale),
    },
    agentName: {
      fontSize: Math.round(12 * sizeScale),
      fontWeight: "bold",
      marginBottom: Math.round(4 * sizeScale),
    },
    agentContact: {
      fontSize: Math.round(10 * sizeScale),
      color: baseMuted,
      marginBottom: 2,
    },
    // QR Code
    qrSection: {
      marginTop: Math.round(8 * sizeScale),
    },
    qrText: {
      fontSize: Math.round(9 * sizeScale),
      color: baseMuted,
    },
    // Neighborhood Highlight
    neighborhood: {
      backgroundColor: "#eff6ff",
      borderWidth: 1,
      borderColor: "#3b82f6",
      padding: Math.round(10 * sizeScale),
      borderRadius: 8,
      marginBottom: Math.round(12 * sizeScale),
    },
    neighborhoodTitle: {
      fontSize: Math.round(11 * sizeScale),
      fontWeight: "bold",
      color: "#1e40af",
      marginBottom: 5,
    },
    neighborhoodDesc: {
      fontSize: Math.round(10 * sizeScale),
      color: "#1e3a8a",
    },
    // Custom Message
    customMessage: {
      backgroundColor: "#f9fafb",
      padding: Math.round(10 * sizeScale),
      borderRadius: 8,
      marginBottom: Math.round(12 * sizeScale),
    },
    customMessageText: {
      fontSize: Math.round(10 * sizeScale),
      color: "#4b5563",
      fontStyle: "italic",
    },
  })

  const getTypeText = () => {
    switch (data.type) {
      case "just_listed":
        return "Vient d'être mis en vente"
      case "just_sold":
        return "Vendu"
      case "price_reduced":
        return "Prix réduit"
      case "open_house":
        return "Visite portes ouvertes"
      case "coming_soon":
        return "Bientôt disponible"
      default:
        return "Disponible"
    }
  }

  const getPageSize = (size: "A6" | "A5" | "DL") => {
    if (size === "DL") {
      return isLandscape ? [623.6, 311.8] : [311.8, 623.6]
    }
    return size
  }

  return (
    <Document>
      <Page size={getPageSize(data.size)} orientation={data.orientation} style={styles.page}>
        <View style={styles.container}>
          {/* Property Image Section */}
          <View style={styles.imageSection}>
            {data.mainImage || data.property.images?.[0] ? (
              <Image
                src={data.mainImage || data.property.images?.[0]}
                style={styles.propertyImage}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={{ fontSize: Math.round(10 * sizeScale), color: "rgba(0,0,0,0.45)" }}>Photo</Text>
              </View>
            )}
            <View style={styles.imageOverlay}>
              <Text style={styles.badge}>{getTypeText()}</Text>
            </View>
          </View>

          {/* Property Info Section */}
          <View style={styles.infoSection}>
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.agencyName}>{data.agency.name}</Text>
                <Text style={styles.headline}>{data.headline}</Text>
              </View>

              {/* Property Details */}
              <Text style={styles.propertyTitle}>
                {getPropertyTypeLabel(data.property.type)} • {data.property.characteristics?.surface ?? "—"} m²
              </Text>
              <Text style={styles.propertyAddress}>
                {data.property.address.street}, {data.property.address.postalCode} {data.property.address.city}
              </Text>

              {/* Features */}
              <View style={styles.features}>
                {data.features.slice(0, 6).map((feature, index) => (
                  <Text key={index} style={styles.feature}>{feature}</Text>
                ))}
              </View>

              {/* Price */}
              <View style={styles.priceSection}>
                {data.priceText && <Text style={styles.priceText}>{data.priceText}</Text>}
                <Text style={styles.price}>{formatCurrency(data.price || data.property.price)}</Text>
              </View>

              {/* Open House Info */}
              {data.openHouseInfo && (
                <View style={styles.openHouse}>
                  <Text style={styles.openHouseTitle}>Visite portes ouvertes</Text>
                  <Text style={styles.openHouseTime}>
                    {data.openHouseInfo.date} • {data.openHouseInfo.startTime} - {data.openHouseInfo.endTime}
                  </Text>
                </View>
              )}

              {/* Neighborhood Highlight */}
              {data.neighborhoodHighlight && (
                <View style={styles.neighborhood}>
                  <Text style={styles.neighborhoodTitle}>{data.neighborhoodHighlight.name}</Text>
                  <Text style={styles.neighborhoodDesc}>{data.neighborhoodHighlight.description}</Text>
                </View>
              )}

              {/* Custom Message */}
              {data.customMessage && (
                <View style={styles.customMessage}>
                  <Text style={styles.customMessageText}>{data.customMessage}</Text>
                </View>
              )}

              {/* Agent Info */}
              <View style={styles.agentSection}>
                <Text style={styles.agentName}>{data.agent.name}</Text>
                <Text style={styles.agentContact}>{data.agent.phone} • {data.agent.email}</Text>
                {data.agent.license && <Text style={styles.agentContact}>N° {data.agent.license}</Text>}
                <Text style={[styles.agentContact, { marginTop: Math.round(4 * sizeScale) }]}>
                  {data.agency.phone} • {data.agency.website}
                </Text>
                {data.qrCodeUrl && (
                  <View style={styles.qrSection}>
                    <Text style={styles.qrText}>{data.qrCodeUrl}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
