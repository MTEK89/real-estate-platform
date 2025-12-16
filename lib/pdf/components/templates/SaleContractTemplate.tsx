import React from "react"
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../types"
import type { SaleContractData } from "@/lib/pdf-generator"
import { Header } from "../shared/Header"
import { Footer } from "../shared/Footer"
import { Section } from "../shared/Section"
import { DataTable, InfoBox, TwoColumn } from "../shared/DataTable"
import { SignatureBlock } from "../shared/SignatureBlock"
import { BulletList, Callout } from "../shared/Typography"
import {
  formatDate,
  formatCurrency,
  numberToWords,
  getPropertyTypeLabel,
  getConditionLabel,
} from "../../utils/formatters"

interface SaleContractTemplateProps {
  data: SaleContractData
  brand: BrandConfig
}

export function SaleContractTemplate({ data, brand }: SaleContractTemplateProps) {
  const documentRef = `VENTE-${data.property.reference}-${new Date().getFullYear()}`
  const totalPrice = data.price.salePrice + (data.price.feesPayableBy === "buyer" ? data.price.agencyFees : 0)

  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      paddingTop: brand.layout.pageMargin,
      paddingBottom: brand.layout.footerHeight + 30,
      paddingHorizontal: brand.layout.pageMargin,
      color: brand.colors.text,
    },
    pageBreak: {
      break: "before",
    },
    coverPage: {
      fontSize: 28,
      fontWeight: "bold",
      color: brand.colors.primary,
      textAlign: "center",
      marginBottom: 40,
    },
    coverSubtitle: {
      fontSize: 14,
      color: brand.colors.muted,
      textAlign: "center",
      marginBottom: 40,
    },
    parties: {
      flexDirection: "row",
      marginLeft: -8,
      marginRight: -8,
      marginBottom: 15,
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
    },
    partyName: {
      fontSize: 10,
      fontWeight: "bold",
      color: brand.colors.text,
      marginBottom: 4,
    },
    partyDetail: {
      fontSize: 8,
      color: brand.colors.muted,
      marginBottom: 2,
    },
    text: {
      fontSize: 9,
      color: brand.colors.text,
      marginBottom: 6,
      lineHeight: 1.5,
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
    },
    priceAmount: {
      fontSize: 16,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    summaryBox: {
      backgroundColor: "#f8f9fa",
      padding: 15,
      borderRadius: 4,
      marginVertical: 10,
      border: 1,
      borderColor: brand.colors.border,
    },
    summaryTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: brand.colors.primary,
      marginBottom: 10,
    },
    timelineItem: {
      flexDirection: "row",
      marginBottom: 8,
    },
    timelineDate: {
      width: 80,
      fontSize: 8,
      fontWeight: "bold",
      color: brand.colors.primary,
    },
    timelineText: {
      flex: 1,
      fontSize: 8,
      marginLeft: 10,
    },
  })

  // Diagnostic details
  const diagnosticItems = []
  if (data.diagnostics.dpe) diagnosticItems.push(`DPE: Classe ${data.diagnostics.dpe}`)
  if (data.diagnostics.asbestos !== undefined) diagnosticItems.push(`Amiante: ${data.diagnostics.asbestos ? "Présence détectée" : "Absence"}`)
  if (data.diagnostics.leadPaint !== undefined) diagnosticItems.push(`Plomb: ${data.diagnostics.leadPaint ? "Présence détectée" : "Absence"}`)
  if (data.diagnostics.termites !== undefined) diagnosticItems.push(`Termites: ${data.diagnostics.termites ? "Zone à risque" : "Hors zone"}`)
  if (data.diagnostics.electricalReport) diagnosticItems.push("Diagnostic électrique: Réalisé")
  if (data.diagnostics.gasReport) diagnosticItems.push("Diagnostic gaz: Réalisé")
  if (data.diagnostics.naturalRisks) diagnosticItems.push("État des risques naturels: Fourni")

  return (
    <Document>
      {/* PAGE 1: Cover & Summary */}
      <Page size="A4" style={styles.page}>
        <Header
          brand={brand}
          documentTitle="DOSSIER DE VENTE"
          documentRef={documentRef}
          showLogo={false}
        />

        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Text style={styles.coverPage}>DOSSIER DE VENTE</Text>
          <Text style={styles.coverSubtitle}>Présentation complète du projet de vente</Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>VOTRE BIEN IMMOBILIER</Text>
          <DataTable
            brand={brand}
            rows={[
              { label: "Type", value: getPropertyTypeLabel(data.property.type) },
              { label: "Adresse", value: `${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}` },
              { label: "Surface", value: `${data.property.characteristics.surface} m²` },
              { label: "Pièces", value: `${data.property.characteristics.rooms} pièces` },
              { label: "Chambres", value: data.property.characteristics.bedrooms },
              { label: "État général", value: getConditionLabel(data.property.characteristics.condition) },
            ]}
          />
        </View>

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Prix de vente net vendeur</Text>
          <Text style={styles.priceAmount}>{formatCurrency(data.price.salePrice)}</Text>
          <Text style={{ fontSize: 10, marginTop: 4, color: brand.colors.muted }}>
            Soit en lettres: {numberToWords(data.price.salePrice)}
          </Text>
        </View>

        <InfoBox brand={brand} title="HONORAIRES D'AGENCE">
          <Text style={{ fontSize: 9 }}>
            {formatCurrency(data.price.agencyFees)} ({data.price.feesPayableBy === "seller" ? "à la charge du vendeur" : "à la charge de l'acheteur"})
          </Text>
          <Text style={{ fontSize: 9, marginTop: 3 }}>
            Prix total FAI: {formatCurrency(totalPrice)}
          </Text>
        </InfoBox>

        <Footer brand={brand} />
      </Page>

      {/* PAGE 2: Parties & Property Details */}
      <Page size="A4" style={styles.page}>
        <Header
          brand={brand}
          documentTitle="DOSSIER DE VENTE"
          documentRef={documentRef}
        />

        <Section brand={brand} number={1} title="Les Parties">
          <View style={styles.parties}>
            {/* Seller */}
            <View style={styles.partyBox}>
              <Text style={styles.partyTitle}>Le Vendeur</Text>
              <Text style={styles.partyName}>
                {data.seller.firstName} {data.seller.lastName}
              </Text>
              {data.seller.email && (
                <Text style={styles.partyDetail}>Email: {data.seller.email}</Text>
              )}
              {data.seller.phone && (
                <Text style={styles.partyDetail}>Tél: {data.seller.phone}</Text>
              )}
              {data.seller.address && (
                <Text style={styles.partyDetail}>Adresse: {data.seller.address}</Text>
              )}
            </View>

            {/* Buyer */}
            <View style={styles.partyBox}>
              <Text style={styles.partyTitle}>L'Acquéreur</Text>
              <Text style={styles.partyName}>
                {data.buyer.firstName} {data.buyer.lastName}
              </Text>
              {data.buyer.email && (
                <Text style={styles.partyDetail}>Email: {data.buyer.email}</Text>
              )}
              {data.buyer.phone && (
                <Text style={styles.partyDetail}>Tél: {data.buyer.phone}</Text>
              )}
            </View>
          </View>
        </Section>

        <Section brand={brand} number={2} title="Description Complète du Bien">
          <DataTable
            brand={brand}
            rows={[
              { label: "Type de bien", value: getPropertyTypeLabel(data.property.type) },
              { label: "Adresse complète", value: `${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}` },
              { label: "Référence cadastrale", value: data.property.reference || "À compléter" },
              { label: "Surface habitable", value: `${data.property.characteristics.surface} m²` },
              { label: "Nombre de pièces", value: `${data.property.characteristics.rooms} pièces` },
              { label: "Nombre de chambres", value: data.property.characteristics.bedrooms },
              { label: "Salles de bain", value: data.property.characteristics.bathrooms },
              { label: "Année de construction", value: data.property.characteristics.yearBuilt?.toString() || "Non renseignée" },
              { label: "État général", value: getConditionLabel(data.property.characteristics.condition) },
              { label: "Étage", value: data.property.characteristics.floor ? `${data.property.characteristics.floor}ème` : "RDC" },
              { label: "Ascenseur", value: data.property.characteristics.hasElevator ? "Oui" : "Non" },
              { label: "Parking/Garage", value: data.property.characteristics.parking ? "Oui" : "Non" },
              { label: "Balcon/Terrasse", value: data.property.characteristics.balcony ? "Oui" : "Non" },
              { label: "Cave", value: data.property.characteristics.cellar ? "Oui" : "Non" },
            ]}
          />
        </Section>

        <Section brand={brand} number={3} title="Diagnostics Techniques Obligatoires">
          <Text style={styles.text}>
            Conformément à la réglementation en vigueur, les diagnostics suivants ont été réalisés :
          </Text>
          {diagnosticItems.length > 0 ? (
            <BulletList brand={brand} items={diagnosticItems} />
          ) : (
            <Callout brand={brand} type="warning">
              Les diagnostics techniques seront fournis avant la signature définitive.
            </Callout>
          )}
        </Section>

        <Footer brand={brand} />
      </Page>

      {/* PAGE 3: Financial Details & Timeline */}
      <Page size="A4" style={styles.page}>
        <Header
          brand={brand}
          documentTitle="DOSSIER DE VENTE"
          documentRef={documentRef}
        />

        <Section brand={brand} number={4} title="Détails Financiers">
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Prix de vente net vendeur</Text>
            <Text style={styles.priceAmount}>{formatCurrency(data.price.salePrice)}</Text>
            <Text style={{ fontSize: 10, marginTop: 4, color: brand.colors.muted }}>
              {numberToWords(data.price.salePrice)}
            </Text>
          </View>

          <DataTable
            brand={brand}
            rows={[
              {
                label: "Honoraires d'agence",
                value: `${formatCurrency(data.price.agencyFees)} (${data.price.feesPayableBy === "seller" ? "à votre charge" : "à la charge de l'acheteur"})`,
              },
              {
                label: "Prix total FAI",
                value: formatCurrency(totalPrice),
              },
              {
                label: "Dépôt de garantie",
                value: `${formatCurrency(data.price.depositAmount)} (${((data.price.depositAmount / data.price.salePrice) * 100).toFixed(1)}% du prix)`,
              },
              {
                label: "Date limite dépôt",
                value: formatDate(data.price.depositDueDate),
              },
            ]}
          />

          {data.conditions.mortgageCondition && (
            <Callout brand={brand} type="info">
              <Text style={{ fontSize: 9, fontWeight: "bold", marginBottom: 3 }}>
                CONDITION SUSPENSIVE DE PRÊT
              </Text>
              <Text style={{ fontSize: 9 }}>
                La vente est subordonnée à l'obtention d'un prêt par l'acquéreur d'un montant de {formatCurrency(data.conditions.mortgageAmount || 0)}.
              </Text>
            </Callout>
          )}
        </Section>

        <Section brand={brand} number={5} title="Calendrier Prévisionnel">
          <View style={styles.timelineItem}>
            <Text style={styles.timelineDate}>Aujourd'hui</Text>
            <Text style={styles.timelineText}>Signature du compromis de vente</Text>
          </View>
          <View style={styles.timelineItem}>
            <Text style={styles.timelineDate}>{formatDate(data.price.depositDueDate)}</Text>
            <Text style={styles.timelineText}>Versement du dépôt de garantie</Text>
          </View>
          <View style={styles.timelineItem}>
            <Text style={styles.timelineDate}>10 jours après</Text>
            <Text style={styles.timelineText}>Fin du délai de rétractation pour l'acquéreur</Text>
          </View>
          <View style={styles.timelineItem}>
            <Text style={styles.timelineDate}>45 jours max</Text>
            <Text style={styles.timelineText}>Obtention du prêt (si condition suspensive)</Text>
          </View>
          <View style={styles.timelineItem}>
            <Text style={styles.timelineDate}>{formatDate(data.dates.completionDeadline)}</Text>
            <Text style={styles.timelineText}>Signature de l'acte authentique chez le notaire</Text>
          </View>
          <View style={styles.timelineItem}>
            <Text style={styles.timelineDate}>{formatDate(data.dates.possessionDate)}</Text>
            <Text style={styles.timelineText}>Remise des clés et entrée en jouissance</Text>
          </View>
        </Section>

        <Section brand={brand} number={6} title="Professionnels Intervenant">
          <DataTable
            brand={brand}
            rows={[
              { label: "Notaire désigné", value: data.notary.name },
              { label: "Adresse du notaire", value: data.notary.address },
              { label: "Agence immobilière", value: data.agent.agency },
              { label: "Agent en charge", value: data.agent.name },
              { label: "N° Carte professionnelle", value: data.agent.registrationNumber },
            ]}
          />
        </Section>

        <Footer brand={brand} />
      </Page>

      {/* PAGE 4: Terms & Signatures */}
      <Page size="A4" style={styles.page}>
        <Header
          brand={brand}
          documentTitle="DOSSIER DE VENTE"
          documentRef={documentRef}
        />

        <Section brand={brand} number={7} title="Conditions Générales de Vente">
          <Text style={styles.text}>
            Le vendeur déclare sur l'honneur :
          </Text>
          <BulletList
            brand={brand}
            items={[
              "Être propriétaire du bien et libre de toute occupation",
              "Le bien est libre de toute hypothèque, privilège ou servitude non déclarée",
              "Les charges de copropriété sont à jour",
              "Les diagnostics techniques fournis sont conformes à la réglementation",
              "Les permis et autorisations nécessaires sont en règle",
            ]}
          />
        </Section>

        <Section brand={brand} number={8} title="Obligations des Parties">
          <Text style={styles.text}>
            Obligations du Vendeur :
          </Text>
          <BulletList
            brand={brand}
            items={[
              "Garantir la jouissance paisible du bien",
              "Fournir tous les documents obligatoires",
              "Assurer la livraison du bien dans l'état décrit",
              "Payer sa part des honoraires d'agence le jour de la signature",
            ]}
          />

          <Text style={{ ...styles.text, marginTop: 10 }}>
            Obligations de l'Acquéreur :
          </Text>
          <BulletList
            brand={brand}
            items={[
              "Verser le dépôt de garantie dans les délais convenus",
              "Obtenir le financement nécessaire si condition suspensive",
              "Payer le solde du prix le jour de la signature chez le notaire",
              "Payer sa part des frais de notaire et d'enregistrement",
            ]}
          />
        </Section>

        {data.specialClauses.length > 0 && (
          <Section brand={brand} number={9} title="Clauses Particulières" highlight>
            <BulletList brand={brand} items={data.specialClauses} />
          </Section>
        )}

        <Section brand={brand} number={10} title="Signatures">
          <Text style={{ ...styles.text, fontWeight: "bold", marginBottom: 20 }}>
            Fait à {data.property.address.city}, le {formatDate(data.dates.signatureDate)}
          </Text>

          <SignatureBlock
            brand={brand}
            signatories={[
              {
                role: "Le Vendeur",
                name: `${data.seller.firstName} ${data.seller.lastName}`,
                showLuApprouve: true,
              },
              {
                role: "L'Acquéreur",
                name: `${data.buyer.firstName} ${data.buyer.lastName}`,
                showLuApprouve: true,
              },
              {
                role: "L'Agence",
                name: data.agent.name,
                showLuApprouve: false,
              },
            ]}
            location={data.property.address.city}
            date={formatDate(data.dates.signatureDate)}
          />
        </Section>

        <Footer brand={brand} />
      </Page>
    </Document>
  )
}