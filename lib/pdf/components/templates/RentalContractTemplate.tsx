import React from "react"
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../types"
import type { RentalContractData } from "@/lib/pdf-generator"
import { Header } from "../shared/Header"
import { Footer } from "../shared/Footer"
import { Section } from "../shared/Section"
import { DataTable, InfoBox, TwoColumn } from "../shared/DataTable"
import { SignatureBlock } from "../shared/SignatureBlock"
import { BulletList, Callout } from "../shared/Typography"
import {
  formatDate,
  formatCurrency,
  getPropertyTypeLabel,
  getConditionLabel,
} from "../../utils/formatters"

interface RentalContractTemplateProps {
  data: RentalContractData
  brand: BrandConfig
}

export function RentalContractTemplate({
  data,
  brand,
}: RentalContractTemplateProps) {
  const isFurnished = data.duration.type === "furnished"
  const documentTitle = `CONTRAT DE LOCATION ${isFurnished ? "MEUBLÉ" : "NON MEUBLÉ"}`
  const documentRef = `LOCATION-${data.property.reference}-${new Date().getFullYear()}`
  const totalMonthly = data.rent.monthly + data.rent.charges

  const styles = StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: 10,
      paddingTop: brand.layout.pageMargin,
      paddingBottom: brand.layout.footerHeight + 30,
      paddingHorizontal: brand.layout.pageMargin,
      color: brand.colors.text,
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
  })

  return (
    <Document>
      {/* PAGE 1: Cover & Summary */}
      <Page size="A4" style={styles.page}>
        <Header
          brand={brand}
          documentTitle={documentTitle}
          documentRef={documentRef}
          showLogo={false}
        />

        <View style={{ alignItems: "center", marginBottom: 40 }}>
          <Text style={styles.coverPage}>{documentTitle}</Text>
          <Text style={styles.coverSubtitle}>Présentation complète du contrat de location</Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>VOTRE LOGEMENT</Text>
          <DataTable
            brand={brand}
            rows={[
              { label: "Type", value: getPropertyTypeLabel(data.property.type) },
              { label: "Adresse", value: `${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}` },
              { label: "Surface", value: `${data.property.characteristics.surface} m²` },
              { label: "Pièces", value: `${data.property.characteristics.rooms} pièces` },
              { label: "Meublé", value: isFurnished ? "Oui" : "Non" },
            ]}
          />
        </View>

        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Loyer mensuel charges comprises</Text>
          <Text style={styles.priceAmount}>{formatCurrency(totalMonthly)}</Text>
          <Text style={{ fontSize: 10, marginTop: 4, color: brand.colors.muted }}>
            Dont {formatCurrency(data.rent.monthly)} de loyer + {formatCurrency(data.rent.charges)} de provisions pour charges
          </Text>
        </View>

        <InfoBox brand={brand} title="DÉPÔT DE GARANTIE">
          <Text style={{ fontSize: 9 }}>
            {formatCurrency(data.rent.deposit)} (équivalent à {Math.round(data.rent.deposit / data.rent.monthly)} mois de loyer)
          </Text>
          <Text style={{ fontSize: 9, marginTop: 3 }}>
            Date de paiement: Le {data.rent.paymentDay} de chaque mois
          </Text>
        </InfoBox>

        <Footer brand={brand} />
      </Page>

      {/* PAGE 2: Parties & Property Details */}
      <Page size="A4" style={styles.page}>
        <Header
          brand={brand}
          documentTitle={documentTitle}
          documentRef={documentRef}
        />

        <Section brand={brand} number={1} title="Les Parties">
          <View style={styles.parties}>
            {/* Landlord */}
            <View style={styles.partyBox}>
              <Text style={styles.partyTitle}>Le Bailleur</Text>
              <Text style={styles.partyName}>
                {data.landlord.firstName} {data.landlord.lastName}
              </Text>
              {data.landlord.email && (
                <Text style={styles.partyDetail}>Email: {data.landlord.email}</Text>
              )}
              {data.landlord.phone && (
                <Text style={styles.partyDetail}>Tél: {data.landlord.phone}</Text>
              )}
              {data.landlord.address && (
                <Text style={styles.partyDetail}>Adresse: {data.landlord.address}</Text>
              )}
            </View>

            {/* Tenant */}
            <View style={styles.partyBox}>
              <Text style={styles.partyTitle}>Le Locataire</Text>
              <Text style={styles.partyName}>
                {data.tenant.firstName} {data.tenant.lastName}
              </Text>
              {data.tenant.email && (
                <Text style={styles.partyDetail}>Email: {data.tenant.email}</Text>
              )}
              {data.tenant.phone && (
                <Text style={styles.partyDetail}>Tél: {data.tenant.phone}</Text>
              )}
            </View>
          </View>
        </Section>

        <Section brand={brand} number={2} title="Description du Logement">
          <DataTable
            brand={brand}
            rows={[
              { label: "Type de bien", value: getPropertyTypeLabel(data.property.type) },
              { label: "Adresse complète", value: `${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}` },
              { label: "Surface habitable", value: `${data.property.characteristics.surface} m²` },
              { label: "Nombre de pièces", value: `${data.property.characteristics.rooms} pièces` },
              { label: "Nombre de chambres", value: data.property.characteristics.bedrooms },
              { label: "Salles de bain", value: data.property.characteristics.bathrooms },
              { label: "Étage", value: data.property.characteristics.floor ? `${data.property.characteristics.floor}ème` : "RDC" },
              { label: "Statut du bien", value: isFurnished ? "Meublé" : "Non meublé" },
              { label: "Année de construction", value: data.property.characteristics.yearBuilt?.toString() || "Non renseignée" },
              { label: "État général", value: getConditionLabel(data.property.characteristics.condition) },
              { label: "Ascenseur", value: data.property.characteristics.hasElevator ? "Oui" : "Non" },
              { label: "Parking/Garage", value: data.property.characteristics.parking ? "Oui" : "Non" },
              { label: "Balcon/Terrasse", value: data.property.characteristics.balcony ? "Oui" : "Non" },
              { label: "Cave", value: data.property.characteristics.cellar ? "Oui" : "Non" },
            ]}
          />
        </Section>

        <Section brand={brand} number={3} title="Destination du Logement">
          <Text style={styles.text}>
            Le logement est loué à titre de résidence principale. Le locataire s'engage à n'en faire ni commerce, ni artisanat,
            ni profession de quelque nature que ce soit.
          </Text>
          <Text style={styles.text}>
            Le logement doit être occupé par le locataire et sa famille, à l'exclusion de toute autre personne,
            sauf accord préalable écrit du bailleur.
          </Text>
        </Section>

        <Footer brand={brand} />
      </Page>

      {/* PAGE 3: Financial Details & Obligations */}
      <Page size="A4" style={styles.page}>
        <Header
          brand={brand}
          documentTitle={documentTitle}
          documentRef={documentRef}
        />

        <Section brand={brand} number={4} title="Conditions Financières">
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Loyer mensuel charges comprises</Text>
            <Text style={styles.priceAmount}>{formatCurrency(totalMonthly)}</Text>
            <Text style={{ fontSize: 10, marginTop: 4, color: brand.colors.muted }}>
              Dont {formatCurrency(data.rent.monthly)} hors charges
            </Text>
          </View>

          <DataTable
            brand={brand}
            rows={[
              { label: "Loyer hors charges", value: formatCurrency(data.rent.monthly) },
              { label: "Provisions pour charges", value: formatCurrency(data.rent.charges) },
              { label: "Date de paiement", value: `Le ${data.rent.paymentDay} de chaque mois` },
              { label: "Mode de paiement", value: "Virement bancaire" },
              { label: "Dépôt de garantie", value: formatCurrency(data.rent.deposit) },
              { label: "État des lieux", value: "Obligatoire (entrée et sortie)" },
              { label: "Assurance locataire", value: "Obligatoire (risques locatifs)" },
            ]}
          />
        </Section>

        <Section brand={brand} number={5} title="Durée du Bail">
          <Text style={styles.text}>
            Le présent bail est conclu pour une durée de{" "}
            <Text style={{ fontWeight: "bold" }}>
              {isFurnished ? "1 an" : "3 ans"}
            </Text>{" "}
            à compter du {formatDate(data.duration.startDate)}.
          </Text>
          <Text style={styles.text}>
            Le bail se renouvelle automatiquement par tacite reconduction pour une même durée,
            sauf préavis de part et d'autre.
          </Text>
          {isFurnished && (
            <Text style={styles.text}>
              Pour un bail meublé, le préavis est de 1 mois pour le locataire et de 3 mois pour le bailleur.
            </Text>
          )}
        </Section>

        <Section brand={brand} number={6} title="Réparations et Entretien">
          <Callout brand={brand} type="info">
            <Text style={{ fontSize: 9, fontWeight: "bold", marginBottom: 3 }}>
              RÉPARTITION DES CHARGES
            </Text>
            <Text style={{ fontSize: 9 }}>
              Le locataire prend à sa charge les réparations locatives et l'entretien courant du logement.
              Le bailleur prend à sa charge les grosses réparations.
            </Text>
          </Callout>
          <Text style={{ ...styles.text, marginTop: 10 }}>
            Sont considérées comme réparations locatives notamment :
          </Text>
          <BulletList
            brand={brand}
            items={[
              "L'entretien des installations de chauffage et d'eau chaude",
              "Le remplacement des joints et des pièces d'usure",
              "Le débouchage des canalisations",
              "La réparation des vitrages",
              "L'entretien des serrures",
            ]}
          />
        </Section>

        <Footer brand={brand} />
      </Page>

      {/* PAGE 4: Special Clauses & Signatures */}
      <Page size="A4" style={styles.page}>
        <Header
          brand={brand}
          documentTitle={documentTitle}
          documentRef={documentRef}
        />

        <Section brand={brand} number={7} title="Obligations du Locataire">
          <BulletList
            brand={brand}
            items={[
              "Payer le loyer et les charges aux échéances convenues",
              "Souscrire une assurance couvrant les risques locatifs",
              "User paisiblement du logement et en faire bon usage",
              "Assurer l'entretien courant et les réparations locatives",
              "Permettre au bailleur l'accès au logement pour visites et réparations",
              "Ne pas transformer le logement sans accord écrit",
              "Maintenir le logement en bon état de propreté",
            ]}
          />
        </Section>

        <Section brand={brand} number={8} title="Obligations du Bailleur">
          <BulletList
            brand={brand}
            items={[
              "Assurer au locatif la jouissance paisible du logement",
              "Faire les grosses réparations nécessaires au maintien en état",
              "Ne pas s'opposer aux aménagements locatifs justifiés",
              "Fournir les équipements mentionnés dans le contrat",
              "Assurer le bon fonctionnement des parties communes",
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
            Fait à {data.property.address.city}, le {formatDate(new Date().toISOString())}
          </Text>

          <SignatureBlock
            brand={brand}
            signatories={[
              {
                role: "Le Bailleur",
                name: `${data.landlord.firstName} ${data.landlord.lastName}`,
                showLuApprouve: true,
              },
              {
                role: "Le Locataire",
                name: `${data.tenant.firstName} ${data.tenant.lastName}`,
                showLuApprouve: true,
              },
            ]}
            location={data.property.address.city}
            date={formatDate(new Date().toISOString())}
          />
        </Section>

        <Footer brand={brand} />
      </Page>
    </Document>
  )
}