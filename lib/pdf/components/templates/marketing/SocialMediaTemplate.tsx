import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { SocialMediaPostData } from "@/lib/pdf-generator"
import type { BrandConfig } from "../../../types"
import { formatCurrency, getPropertyTypeLabel } from "../../../utils/formatters"
import { withAlpha } from "../../../utils/colors"

interface SocialMediaTemplateProps {
  data: SocialMediaPostData
  brand: BrandConfig
}

function platformLabel(platform: SocialMediaPostData["platform"]) {
  switch (platform) {
    case "instagram":
      return "Instagram"
    case "facebook":
      return "Facebook"
    case "linkedin":
      return "LinkedIn"
    case "twitter":
      return "X"
    default:
      return "Réseaux sociaux"
  }
}

export function SocialMediaTemplate({ data, brand }: SocialMediaTemplateProps) {
  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      backgroundColor: "#ffffff",
      padding: 40,
      fontSize: 10,
      color: brand.colors.text,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 10,
      marginBottom: 14,
      borderBottomWidth: 2,
      borderBottomColor: brand.colors.primary,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      maxWidth: "60%",
    },
    logo: {
      width: 90,
      height: 28,
      objectFit: "contain",
      marginRight: 10,
    },
    agencyName: {
      fontSize: 12,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    headerRight: {
      alignItems: "flex-end",
    },
    title: {
      fontSize: 14,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    subtitle: {
      fontSize: 8,
      color: brand.colors.muted,
      marginTop: 3,
    },
    frame: {
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 12,
    },
    image: {
      height: 360,
      backgroundColor: "#f3f4f6",
    },
    imageInner: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    overlay: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      padding: 14,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    overlayTitle: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 4,
    },
    overlaySub: {
      color: "rgba(255,255,255,0.9)",
      fontSize: 9,
    },
    body: {
      padding: 14,
      backgroundColor: "#ffffff",
    },
    pillRow: {
      flexDirection: "row",
      marginBottom: 10,
    },
    pill: {
      borderWidth: 1,
      borderColor: brand.colors.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      marginRight: 8,
      backgroundColor: brand.colors.highlight,
    },
    pillText: {
      fontSize: 8,
      color: brand.colors.text,
    },
    captionTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: brand.colors.primary,
      marginBottom: 6,
    },
    caption: {
      fontSize: 9,
      color: brand.colors.text,
      lineHeight: 1.4,
      marginBottom: 10,
    },
    hashtags: {
      fontSize: 9,
      color: brand.colors.secondary,
      marginBottom: 10,
    },
    ctaBox: {
      borderLeftWidth: 4,
      borderLeftColor: brand.colors.primary,
      backgroundColor: brand.colors.highlight,
      padding: 10,
      borderRadius: 8,
    },
    ctaText: {
      fontSize: 9,
      color: brand.colors.text,
    },
    footer: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: brand.colors.border,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerLeft: { maxWidth: "70%" },
    footerTitle: { fontSize: 9, fontWeight: "bold", color: brand.colors.text },
    footerText: { fontSize: 8, color: brand.colors.muted, marginTop: 2 },
  })

  const photoSrc = data.property.images?.[0]
  const address = `${data.property.address.city}`
  const title = `${getPropertyTypeLabel(data.property.type)} • ${data.property.characteristics?.surface || "—"} m²`
  const price = data.showPrice ? formatCurrency(data.property.price) : "Prix sur demande"

  const effectivePrimary = data.customBranding?.colors.primary || brand.colors.primary
  const effectiveSecondary = data.customBranding?.colors.secondary || brand.colors.secondary

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {brand.logo ? <Image src={brand.logo} style={styles.logo} /> : null}
            <Text style={styles.agencyName}>{brand.agencyName || data.agency.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.title}>Post {platformLabel(data.platform)}</Text>
            <Text style={styles.subtitle}>{data.postType.replaceAll("_", " ")}</Text>
          </View>
        </View>

        <View style={[styles.frame, { borderColor: brand.colors.border }]}>
          <View style={styles.image}>
            {photoSrc ? <Image src={photoSrc} style={styles.imageInner} /> : null}
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle}>{price}</Text>
              <Text style={styles.overlaySub}>
                {title} • {address}
              </Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.pillRow}>
              <View style={[styles.pill, { backgroundColor: withAlpha(effectiveSecondary, 0.08), borderColor: withAlpha(effectiveSecondary, 0.20) }]}>
                <Text style={[styles.pillText, { color: effectiveSecondary }]}>{platformLabel(data.platform)}</Text>
              </View>
              <View style={[styles.pill, { backgroundColor: withAlpha(effectivePrimary, 0.06), borderColor: withAlpha(effectivePrimary, 0.20) }]}>
                <Text style={[styles.pillText, { color: effectivePrimary }]}>{data.showAddress ? data.property.address.city : "Adresse masquée"}</Text>
              </View>
            </View>

            <Text style={styles.captionTitle}>Texte</Text>
            <Text style={styles.caption}>{data.caption}</Text>

            {data.hashtags.length > 0 ? (
              <Text style={styles.hashtags}>{data.hashtags.map((h) => `#${h}`).join(" ")}</Text>
            ) : null}

            <View style={styles.ctaBox}>
              <Text style={styles.ctaText}>
                {data.callToAction} — {data.agent.phone} {data.agent.website ? `• ${data.agent.website}` : ""}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerTitle}>{data.agent.name}</Text>
            <Text style={styles.footerText}>
              {data.agent.email} • {data.agent.phone}
            </Text>
          </View>
          <View>
            <Text style={styles.footerText}>{brand.agencyName || data.agency.name}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
