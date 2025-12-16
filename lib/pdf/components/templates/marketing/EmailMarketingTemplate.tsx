import { Document, Page, View, Text, Image, StyleSheet, Link } from "@react-pdf/renderer"
import type { EmailMarketingData } from "@/lib/pdf-generator"
import type { BrandConfig } from "../../../types"
import { formatCurrency, getPropertyTypeLabel } from "../../../utils/formatters"

interface EmailMarketingTemplateProps {
  data: EmailMarketingData
  brand: BrandConfig
}

export function EmailMarketingTemplate({ data, brand }: EmailMarketingTemplateProps) {
  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      backgroundColor: "#ffffff",
      padding: 40,
      fontSize: 10,
      color: brand.colors.text,
    },
    frame: {
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 12,
      overflow: "hidden",
    },
    top: {
      backgroundColor: brand.colors.primary,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    logo: { width: 90, height: 28, objectFit: "contain" },
    agencyName: { fontSize: 12, fontWeight: "bold", color: "#ffffff" },
    preheader: {
      backgroundColor: brand.colors.highlight,
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: brand.colors.border,
    },
    preheaderText: {
      fontSize: 9,
      color: brand.colors.muted,
    },
    body: {
      padding: 16,
    },
    headline: {
      fontSize: 18,
      fontWeight: "bold",
      color: brand.colors.text,
      marginBottom: 10,
    },
    sectionText: {
      fontSize: 10,
      color: brand.colors.text,
      lineHeight: 1.45,
      marginBottom: 10,
    },
    heroImage: {
      height: 180,
      backgroundColor: "#f3f4f6",
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 12,
    },
    heroImageInner: { width: "100%", height: "100%", objectFit: "cover" },
    propertyCard: {
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 10,
    },
    propertyBody: { padding: 12 },
    propertyTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 3 },
    propertySub: { fontSize: 9, color: brand.colors.muted, marginBottom: 8 },
    propertyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    pricePill: { backgroundColor: brand.colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    priceText: { color: "#ffffff", fontSize: 10, fontWeight: "bold" },
    cta: {
      marginTop: 8,
      backgroundColor: brand.colors.secondary,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
    },
    ctaText: { color: "#ffffff", fontSize: 11, fontWeight: "bold" },
    footer: {
      padding: 14,
      borderTopWidth: 1,
      borderTopColor: brand.colors.border,
      backgroundColor: "#ffffff",
    },
    fineprint: { fontSize: 8, color: brand.colors.muted, lineHeight: 1.35 },
    link: { color: brand.colors.primary, textDecoration: "none" },
  })

  const heroProperty = data.properties?.[0]
  const heroPhoto = heroProperty?.images?.[0]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.top}>
            {brand.logo ? <Image src={brand.logo} style={styles.logo} /> : <Text style={styles.agencyName}>{brand.agencyName || data.agency.name}</Text>}
            <Text style={styles.agencyName}>{brand.agencyName || data.agency.name}</Text>
          </View>

          <View style={styles.preheader}>
            <Text style={styles.preheaderText}>{data.preheader}</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.headline}>{data.headline}</Text>

            {heroPhoto ? (
              <View style={styles.heroImage}>
                <Image src={heroPhoto} style={styles.heroImageInner} />
              </View>
            ) : null}

            {data.body.sections.map((section, idx) => {
              if (section.type === "text") {
                return (
                  <Text key={idx} style={styles.sectionText}>
                    {section.content}
                  </Text>
                )
              }

              if (section.type === "property") {
                const props = (section.properties || data.properties || []).slice(0, 2)
                if (props.length === 0) return null

                return (
                  <View key={idx}>
                    {props.map((p) => (
                      <View key={p.id} style={styles.propertyCard}>
                        <View style={styles.propertyBody}>
                          <Text style={styles.propertyTitle}>
                            {getPropertyTypeLabel(p.type)} • {p.characteristics?.surface || "—"} m²
                          </Text>
                          <Text style={styles.propertySub}>
                            {p.address.street}, {p.address.city}
                          </Text>
                          <View style={styles.propertyRow}>
                            <Text style={{ fontSize: 9, color: brand.colors.text }}>
                              {p.characteristics?.bedrooms || "—"} ch • {p.characteristics?.rooms || "—"} pièces
                            </Text>
                            <View style={styles.pricePill}>
                              <Text style={styles.priceText}>{formatCurrency(p.price)}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )
              }

              if (section.type === "button") {
                return (
                  <View key={idx} style={styles.cta}>
                    <Text style={styles.ctaText}>{section.content}</Text>
                  </View>
                )
              }

              return null
            })}

            <View style={[styles.cta, { backgroundColor: brand.colors.primary }]}>
              <Text style={styles.ctaText}>{data.callToAction.text}</Text>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 8, marginTop: 3 }}>
                {data.callToAction.link}
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.fineprint}>
              Envoyé par {data.sender.name} • {data.sender.email} • {data.sender.phone}
            </Text>
            <Text style={styles.fineprint}>
              {data.footer.companyAddress} •{" "}
              <Link style={styles.link} src={data.footer.unsubscribeLink}>
                Se désinscrire
              </Link>{" "}
              •{" "}
              <Link style={styles.link} src={data.footer.privacyPolicy}>
                Politique de confidentialité
              </Link>
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

