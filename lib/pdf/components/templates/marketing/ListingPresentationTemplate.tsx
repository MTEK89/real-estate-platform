import React from "react"
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { ListingPresentationData } from "@/lib/pdf-generator"
import type { BrandConfig } from "../../../types"
import { Header, Footer, Section, TwoColumn, DataTable, BulletList, CheckboxList, Callout, SignatureBlock, Paragraph, LabelValue } from "../../shared"
import { formatCurrency, formatDate, getPropertyTypeLabel } from "../../../utils/formatters"

interface ListingPresentationTemplateProps {
  data: ListingPresentationData
  brand: BrandConfig
}

function toSqm(surface: number): number {
  return surface >= 300 ? Math.round(surface * 0.092903) : surface
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export function ListingPresentationTemplate({ data, brand }: ListingPresentationTemplateProps) {
  const documentRef = `REF-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`
  const subjectSurface = toSqm(data.property.characteristics.surface)
  const comparables = data.comparativeAnalysis.selectedProperties || []
  const comparablePages = chunk(comparables, 8)

  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      paddingTop: brand.layout.pageMargin,
      paddingBottom: brand.layout.footerHeight + 30,
      paddingHorizontal: brand.layout.pageMargin,
      color: brand.colors.text,
    },
    hero: {
      flexDirection: "row",
      marginBottom: 20,
      backgroundColor: brand.colors.highlight,
      borderRadius: 4,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: brand.colors.border,
    },
    heroImage: {
      width: "42%",
      height: 160,
      objectFit: "cover",
      backgroundColor: "#f3f4f6",
    },
    heroContent: {
      flex: 1,
      padding: 14,
      justifyContent: "center",
    },
    heroTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: brand.colors.primary,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    heroSubtitle: {
      fontSize: 9,
      color: brand.colors.muted,
      marginBottom: 8,
    },
    // Mandate-style Party Box
    partyBox: {
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 4,
      padding: 10,
    },
    partyTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: brand.colors.primary,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: brand.colors.border,
      textTransform: "uppercase",
    },
    partyRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    agentImage: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 10,
      objectFit: "cover",
      backgroundColor: "#e5e7eb",
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
      fontSize: 8,
      color: brand.colors.muted,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    priceAmount: {
      fontSize: 18,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    // Simple table in Mandate palette
    table: {
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 4,
      overflow: "hidden",
      marginTop: 8,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: brand.colors.primary,
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    th: {
      color: "#fff",
      fontSize: 8,
      fontWeight: "bold",
    },
    tr: {
      flexDirection: "row",
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderTopWidth: 1,
      borderTopColor: brand.colors.border,
    },
    td: {
      fontSize: 8,
      color: brand.colors.text,
    },
    cAddr: { width: "46%" },
    cSurf: { width: "16%", textAlign: "right" },
    cPrice: { width: "24%", textAlign: "right" },
    cDom: { width: "14%", textAlign: "right" },
    photoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginLeft: -6,
      marginRight: -6,
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
      borderRadius: 4,
      objectFit: "cover",
      backgroundColor: "#f3f4f6",
    },
    timelineItem: {
      flexDirection: "row",
      marginBottom: 5,
    },
    timelineDate: {
      width: 110,
      fontSize: 9,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    timelineTask: {
      flex: 1,
      fontSize: 9,
      color: brand.colors.text,
    },
  })

  const marketingChecklist = [
    { text: "Photographie professionnelle", checked: data.marketingPlan.professionalPhotography },
    { text: "Visite virtuelle 360°", checked: data.marketingPlan.virtualTour },
    { text: "Journée Portes Ouvertes", checked: data.marketingPlan.openHouse },
    { text: "Campagne Réseaux Sociaux", checked: data.marketingPlan.socialMedia },
    { text: "Marketing Email", checked: data.marketingPlan.emailCampaign },
    { text: "Publicité Imprimée", checked: data.marketingPlan.printAdvertising },
  ]

  const propertyRows = [
    { label: "Référence", value: data.property.reference },
    { label: "Type de bien", value: getPropertyTypeLabel(data.property.type) },
    { label: "Adresse", value: `${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}` },
    { label: "Surface", value: `${subjectSurface} m²` },
    { label: "Pièces", value: data.property.characteristics.rooms },
    { label: "Chambres", value: data.property.characteristics.bedrooms },
    { label: "Salles de bain", value: data.property.characteristics.bathrooms },
    { label: "Année", value: data.property.characteristics.yearBuilt },
    { label: "État", value: data.property.characteristics.condition },
  ]

  const photoUrls = data.property.images || []

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <Header brand={brand} documentTitle="PRÉSENTATION DE VENTE" documentRef={documentRef} />

        <Paragraph brand={brand}>
          Préparé spécialement pour {data.seller.firstName} {data.seller.lastName} concernant la vente de votre bien.
        </Paragraph>

        <View style={styles.hero}>
          {data.property.images?.[0] ? (
            <Image src={data.property.images[0]} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, { alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ fontSize: 9, color: brand.colors.muted }}>Photo à venir</Text>
            </View>
          )}
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>
              {getPropertyTypeLabel(data.property.type)} - {subjectSurface} m²
            </Text>
            <Text style={styles.heroSubtitle}>
              {data.property.address.street}, {data.property.address.postalCode} {data.property.address.city}
            </Text>
            <LabelValue
              brand={brand}
              label="Estimation"
              value={formatCurrency(data.comparativeAnalysis.priceRecommendation.recommended)}
            />
          </View>
        </View>

        <Section title="VOS INTERLOCUTEURS" number={1} brand={brand}>
          <TwoColumn
            brand={brand}
            left={
              <View style={styles.partyBox}>
                <Text style={styles.partyTitle}>Le Propriétaire</Text>
                <LabelValue brand={brand} label="Nom" value={`${data.seller.firstName} ${data.seller.lastName}`} />
                <LabelValue brand={brand} label="Email" value={data.seller.email} />
                <LabelValue brand={brand} label="Tél" value={data.seller.phone} />
              </View>
            }
            right={
              <View style={styles.partyBox}>
                <Text style={styles.partyTitle}>Le Conseiller</Text>
                <View style={styles.partyRow}>
                  {data.agent.photo ? <Image src={data.agent.photo} style={styles.agentImage} /> : <View style={styles.agentImage} />}
                  <View style={{ flex: 1 }}>
                    <LabelValue brand={brand} label="Nom" value={data.agent.name} />
                    <LabelValue brand={brand} label="Email" value={data.agent.email} />
                  </View>
                </View>
                <LabelValue brand={brand} label="Tél" value={data.agent.phone} />
                <LabelValue brand={brand} label="Expérience" value={data.agent.experience} />
                <LabelValue brand={brand} label="Ventes récentes" value={data.agent.recentSales} />
              </View>
            }
          />
        </Section>

        <Section title="PRÉSENTATION DU BIEN" number={2} brand={brand}>
          <DataTable brand={brand} rows={propertyRows} />
        </Section>

        {photoUrls.length > 1 && (
          <Section title="SÉLECTION DE PHOTOS" number={3} brand={brand}>
            <View style={styles.photoGrid}>
              {photoUrls.slice(1, 9).map((src) => (
                <View key={src} style={styles.photoCell}>
                  <Image src={src} style={styles.photo} />
                </View>
              ))}
            </View>
            {photoUrls.length > 9 && (
              <Callout brand={brand} type="info">
                D'autres photos sont disponibles et peuvent être ajoutées dans la version finale.
              </Callout>
            )}
          </Section>
        )}

        <Section title="ANALYSE DU MARCHÉ" number={4} brand={brand}>
          <Paragraph brand={brand}>
            Analyse comparative basée sur les biens similaires vendus ou en vente dans votre secteur.
          </Paragraph>

          <TwoColumn
            brand={brand}
            left={<LabelValue brand={brand} label="Prix moyen/m²" value={formatCurrency(data.comparativeAnalysis.averagePricePerSqm)} />}
            right={<LabelValue brand={brand} label="Positionnement" value={data.comparativeAnalysis.marketPosition} />}
          />

          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Recommandation de prix</Text>
            <Text style={styles.priceAmount}>
              {formatCurrency(data.comparativeAnalysis.priceRecommendation.minimum)} – {formatCurrency(data.comparativeAnalysis.priceRecommendation.maximum)}
            </Text>
          </View>

          {comparablePages[0] && (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, styles.cAddr]}>Adresse</Text>
                <Text style={[styles.th, styles.cSurf]}>Surface</Text>
                <Text style={[styles.th, styles.cPrice]}>Prix</Text>
                <Text style={[styles.th, styles.cDom]}>Délai</Text>
              </View>
              {comparablePages[0].map((p, idx) => (
                <View key={`${p.address}-${idx}`} style={styles.tr}>
                  <Text style={[styles.td, styles.cAddr]}>{p.address}</Text>
                  <Text style={[styles.td, styles.cSurf]}>{p.surface} m²</Text>
                  <Text style={[styles.td, styles.cPrice]}>{formatCurrency(p.price)}</Text>
                  <Text style={[styles.td, styles.cDom]}>{p.daysOnMarket} j</Text>
                </View>
              ))}
            </View>
          )}
        </Section>

        {comparablePages.slice(1).map((rows, i) => (
          <Section key={i} title="BIENS COMPARABLES (SUITE)" number={`4.${i + 1}`} brand={brand}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, styles.cAddr]}>Adresse</Text>
                <Text style={[styles.th, styles.cSurf]}>Surface</Text>
                <Text style={[styles.th, styles.cPrice]}>Prix</Text>
                <Text style={[styles.th, styles.cDom]}>Délai</Text>
              </View>
              {rows.map((p, idx) => (
                <View key={`${p.address}-${idx}`} style={styles.tr}>
                  <Text style={[styles.td, styles.cAddr]}>{p.address}</Text>
                  <Text style={[styles.td, styles.cSurf]}>{p.surface} m²</Text>
                  <Text style={[styles.td, styles.cPrice]}>{formatCurrency(p.price)}</Text>
                  <Text style={[styles.td, styles.cDom]}>{p.daysOnMarket} j</Text>
                </View>
              ))}
            </View>
          </Section>
        ))}

        <Section title="PLAN MARKETING" number={5} brand={brand}>
          <Paragraph brand={brand}>
            Une stratégie complète pour maximiser la visibilité de votre bien.
          </Paragraph>
          <CheckboxList brand={brand} items={marketingChecklist} />
          {data.marketingPlan.onlinePortals.length > 0 && (
            <LabelValue brand={brand} label="Diffusion sur" value={data.marketingPlan.onlinePortals.join(", ")} />
          )}
        </Section>

        <Section title="CALENDRIER PRÉVISIONNEL" number={6} brand={brand}>
          {data.timeline.keyMilestones.map((milestone, index) => (
            <View key={index} style={styles.timelineItem}>
              <Text style={styles.timelineDate}>{formatDate(milestone.date)}</Text>
              <Text style={styles.timelineTask}>{milestone.task}</Text>
            </View>
          ))}
        </Section>

        <Section title="PROPOSITION FINANCIÈRE" number={7} brand={brand}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Honoraires d'agence</Text>
            <Text style={styles.priceAmount}>{data.commission.percentage}%</Text>
            <Text style={{ fontSize: 9, color: brand.colors.muted, marginTop: 4 }}>
              Estimation: {formatCurrency(data.commission.estimatedAmount)}
            </Text>
          </View>
          <Paragraph brand={brand}>
            Ce taux inclut l'ensemble des services présentés ci-dessus :
          </Paragraph>
          <BulletList brand={brand} items={data.commission.includes} />
        </Section>

        <Section title="NOTRE AGENCE" number={8} brand={brand}>
          <Callout brand={brand} type="info">
            {data.agency.about || "Une agence orientée résultats, avec un accompagnement de bout en bout."}
          </Callout>
          <TwoColumn
            brand={brand}
            left={
              <>
                <LabelValue brand={brand} label="Agence" value={data.agency.name} />
                <LabelValue brand={brand} label="Adresse" value={data.agency.address} />
              </>
            }
            right={
              <>
                <LabelValue brand={brand} label="Téléphone" value={data.agency.phone} />
                <LabelValue brand={brand} label="Site" value={data.agency.website} />
              </>
            }
          />
        </Section>

        <SignatureBlock
          brand={brand}
          signatories={[
            {
              role: "Le Propriétaire",
              name: `${data.seller.firstName} ${data.seller.lastName}`,
              showLuApprouve: true,
            },
            {
              role: "Le Conseiller",
              name: data.agent.name,
              showLuApprouve: false,
            },
          ]}
          location={data.property.address.city}
          date={new Date().toISOString()}
        />

        <Footer brand={brand} />
      </Page>
    </Document>
  )
}
