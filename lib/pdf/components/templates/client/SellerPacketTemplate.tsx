import React from "react"
import { View, Text, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../../types"
import {
  MultiPageWrapper,
  Section,
  TwoColumn,
  DataTable,
  BulletList,
  Callout,
  AmountDisplay,
  SignatureBlock,
  Paragraph,
  LabelValue,
} from "../../shared"
import { formatCurrency, formatDate, getPropertyTypeLabel } from "../../../utils/formatters"

type SellerPacketData = {
  seller: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
  }
  property: {
    reference: string
    type: string
    price: number
    address: { street: string; postalCode: string; city: string }
    characteristics: {
      surface: number
      rooms: number
      bedrooms: number
      bathrooms: number
      yearBuilt?: number
      condition?: string
    }
  }
  agent: {
    name: string
    phone: string
    email: string
    experience?: string
    recentSales?: number
  }
  agency: {
    name: string
    logo?: string
    phone: string
    website: string
    address: string
    about?: string
  }
  marketAnalysis: {
    currentDemand: string
    averageSaleTime: number
    recentSales: Array<{
      address: string
      price: number
      surface: number
      saleDate: string
      daysOnMarket: number
    }>
  }
  servicesIncluded: string[]
  commission: {
    percentage: number
    estimatedAmount: number
    includes?: string
  }
}

function toSqm(surface: number): number {
  return surface >= 300 ? Math.round(surface * 0.092903) : surface
}

export function SellerPacketTemplate({ data, brand }: { data: SellerPacketData; brand: BrandConfig }) {
  const property = data.property
  const surfaceSqm = toSqm(property.characteristics.surface)

  const styles = StyleSheet.create({
    partiesRow: {
      flexDirection: "row",
      marginLeft: -8,
      marginRight: -8,
      marginBottom: 10,
    },
    partyBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 4,
      marginLeft: 8,
      marginRight: 8,
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
    partyName: {
      fontSize: 10,
      fontWeight: "bold",
      color: brand.colors.text,
      marginBottom: 4,
    },
    partyDetail: {
      fontSize: 9,
      color: brand.colors.text,
      marginBottom: 3,
    },
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
    chipRow: {
      flexDirection: "row",
      marginTop: 8,
    },
    chip: {
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: brand.colors.border,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 999,
      marginRight: 6,
    },
    chipText: {
      fontSize: 8,
      color: brand.colors.secondary,
      fontWeight: "bold",
    },
    timelineItem: {
      flexDirection: "row",
      marginBottom: 6,
    },
    timelineStep: {
      width: 72,
      fontSize: 9,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    timelineText: {
      flex: 1,
      fontSize: 9,
      color: brand.colors.text,
    },
  })

  const propertyRows = [
    { label: "Référence", value: property.reference },
    { label: "Type de bien", value: getPropertyTypeLabel(property.type) },
    {
      label: "Adresse",
      value: `${property.address.street}, ${property.address.postalCode} ${property.address.city}`,
    },
    { label: "Surface", value: `${surfaceSqm} m²` },
    { label: "Pièces", value: property.characteristics.rooms },
    { label: "Chambres", value: property.characteristics.bedrooms },
    { label: "Salles de bain", value: property.characteristics.bathrooms },
    { label: "Année", value: property.characteristics.yearBuilt },
    { label: "État", value: property.characteristics.condition },
  ]

  const recentSalesItems = (data.marketAnalysis.recentSales || []).slice(0, 6).map((s) => {
    const sqm = toSqm(s.surface)
    return `${s.address} • ${sqm} m² • ${formatCurrency(s.price)} • Vendu le ${formatDate(s.saleDate)}`
  })

  const servicesItems = data.servicesIncluded || []

  const marketingItems = [
    "Mise en valeur du bien (photos, description, points forts)",
    "Diffusion multi-portails (atHome.lu, IMMOTOP.LU, Wortimmo.lu)",
    "Réseaux sociaux & base acquéreurs",
    "Qualification des acquéreurs et organisation des visites",
    "Négociation et sécurisation du dossier",
    "Accompagnement notaire jusqu'à la signature",
  ]

  const timeline = [
    { step: "J0", text: "Validation du dossier et planification des contenus (photos, annonce)." },
    { step: "J+2", text: "Publication et lancement du plan marketing (portails + réseaux sociaux)." },
    { step: "S1–S2", text: "Visites qualifiées et retours structurés." },
    { step: "S3+", text: "Négociation, offre, compromis, suivi notaire." },
  ]

  const faqs = [
    "Comment se déroulent les visites ? Nous coordonnons avec vous et qualifions les acquéreurs en amont.",
    "Que faire en cas de plusieurs offres ? Nous vous présentons chaque offre et vous conseillons selon prix/délais/garanties.",
    "Quels documents préparer ? Nous vous guidons (titre, taxe foncière, copropriété, diagnostics…).",
    "Quel est le rôle du notaire ? Sécuriser juridiquement la vente et rédiger l’acte authentique.",
  ]

  return (
    <MultiPageWrapper
      brand={brand}
      documentTitle="DOSSIER DE VENTE"
      documentRef={`SELL-${property.reference}`}
    >
      <Section brand={brand} title="Introduction" highlight>
        <Paragraph brand={brand}>
          Cher/Chère {data.seller.firstName}, merci de nous confier la vente de votre bien. Ce dossier présente
          notre approche, les étapes de commercialisation et les éléments clés pour réussir la vente.
        </Paragraph>
      </Section>

      <Section brand={brand} number={1} title="Les Interlocuteurs">
        <View style={styles.partiesRow}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Le Propriétaire</Text>
            <Text style={styles.partyName}>
              {data.seller.firstName} {data.seller.lastName}
            </Text>
            {data.seller.email && <Text style={styles.partyDetail}>Email: {data.seller.email}</Text>}
            {data.seller.phone && <Text style={styles.partyDetail}>Tél: {data.seller.phone}</Text>}
          </View>

          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Le Conseiller</Text>
            <Text style={styles.partyName}>{data.agent.name}</Text>
            <Text style={styles.partyDetail}>Tél: {data.agent.phone}</Text>
            <Text style={styles.partyDetail}>Email: {data.agent.email}</Text>
            {data.agent.experience && <Text style={styles.partyDetail}>Expérience: {data.agent.experience}</Text>}
            {typeof data.agent.recentSales === "number" && (
              <Text style={styles.partyDetail}>Ventes récentes: {data.agent.recentSales}</Text>
            )}
          </View>
        </View>
      </Section>

      <Section brand={brand} number={2} title="Le Bien">
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Prix de vente</Text>
          <Text style={styles.priceAmount}>{formatCurrency(property.price)}</Text>
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {surfaceSqm} m² • {property.characteristics.rooms} pièces
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {property.characteristics.bedrooms} ch • {property.characteristics.bathrooms} sdb
              </Text>
            </View>
          </View>
        </View>

        <DataTable brand={brand} rows={propertyRows} />
      </Section>

      <Section brand={brand} number={3} title="Analyse du Marché">
        <TwoColumn
          brand={brand}
          left={
            <>
              <LabelValue brand={brand} label="Demande actuelle" value={data.marketAnalysis.currentDemand} />
              <LabelValue brand={brand} label="Temps moyen de vente" value={`${data.marketAnalysis.averageSaleTime} jours`} />
            </>
          }
          right={
            <>
              <LabelValue brand={brand} label="Références comparables" value={data.marketAnalysis.recentSales.length} />
              <LabelValue brand={brand} label="Objectif" value="Maximiser le prix net vendeur et sécuriser la vente" />
            </>
          }
        />

        {recentSalesItems.length > 0 ? (
          <>
            <Paragraph brand={brand}>Exemples de ventes récentes dans le secteur:</Paragraph>
            <BulletList brand={brand} items={recentSalesItems} />
          </>
        ) : (
          <Callout brand={brand} type="info">
            Les références comparables seront ajustées après validation des caractéristiques du bien.
          </Callout>
        )}
      </Section>

      <Section brand={brand} number={4} title="Stratégie Marketing">
        <Paragraph brand={brand}>
          Notre approche combine visibilité maximale, qualification des acquéreurs et suivi rigoureux des retours.
        </Paragraph>
        <BulletList brand={brand} items={marketingItems} />
      </Section>

      <Section brand={brand} number={5} title="Services Inclus">
        <BulletList brand={brand} items={servicesItems.length ? servicesItems : marketingItems} />
        {data.commission.includes && (
          <Callout brand={brand} type="info">
            {data.commission.includes}
          </Callout>
        )}
      </Section>

      <Section brand={brand} number={6} title="Honoraires">
        <AmountDisplay
          brand={brand}
          label="Honoraires d'agence"
          amount={`${data.commission.percentage}%`}
        />
        <Paragraph brand={brand}>
          Montant estimé: {formatCurrency(data.commission.estimatedAmount)} (estimation indicative).
        </Paragraph>
      </Section>

      <Section brand={brand} number={7} title="Calendrier Prévisionnel">
        {timeline.map((t, idx) => (
          <View key={idx} style={styles.timelineItem}>
            <Text style={styles.timelineStep}>{t.step}</Text>
            <Text style={styles.timelineText}>{t.text}</Text>
          </View>
        ))}
      </Section>

      <Section brand={brand} number={8} title="À Propos de l'Agence">
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

      <Section brand={brand} number={9} title="Questions Fréquentes">
        <BulletList brand={brand} items={faqs} />
      </Section>

      <SignatureBlock
        brand={brand}
        signatories={[
          {
            role: "Le Vendeur",
            name: `${data.seller.firstName} ${data.seller.lastName}`,
            showLuApprouve: true,
          },
          {
            role: "Le Conseiller",
            name: data.agent.name,
            showLuApprouve: false,
          },
        ]}
        location={property.address.city}
        date={new Date().toISOString()}
      />
    </MultiPageWrapper>
  )
}
