import React from "react"
import { View, Text, StyleSheet } from "@react-pdf/renderer"
import type { BuyerWelcomeKitData } from "@/lib/pdf-generator"
import type { BrandConfig } from "../../../types"
import {
  MultiPageWrapper,
  Section,
  TwoColumn,
  DataTable,
  BulletList,
  Callout,
  Paragraph,
  LabelValue,
  SignatureBlock,
} from "../../../shared"
import { formatCurrency, formatDate } from "../../../../utils/formatters"

interface BuyerWelcomeKitTemplateProps {
  data: BuyerWelcomeKitData
  brand: BrandConfig
}

export function BuyerWelcomeKitTemplate({ data, brand }: BuyerWelcomeKitTemplateProps) {
  const styles = StyleSheet.create({
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
    chipRow: {
      flexDirection: "row",
      marginTop: 6,
      flexWrap: "wrap",
    },
    chip: {
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 999,
      paddingVertical: 3,
      paddingHorizontal: 8,
      marginRight: 6,
      marginBottom: 4,
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
      width: 80,
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

  const preferenceRows = [
    { label: "Types de biens", value: data.preferences.propertyTypes.join(", ") },
    { label: "Zones recherchées", value: data.preferences.locations.join(", ") },
    {
      label: "Budget",
      value: `${formatCurrency(data.preferences.priceRange.min)} – ${formatCurrency(data.preferences.priceRange.max)}`,
    },
  ]

  const timelineSteps = [
    { step: "Étape 1", text: "Définition du projet, critères indispensables et budget." },
    { step: "Étape 2", text: "Pré-qualification financière / accord de principe bancaire." },
    { step: "Étape 3", text: "Visites ciblées et compte-rendu après chaque rendez-vous." },
    { step: "Étape 4", text: "Offre d'achat et négociation encadrée." },
    { step: "Étape 5", text: "Compromis de vente et suivi notaire." },
    { step: "Étape 6", text: "Financement définitif et signature de l'acte authentique." },
  ]

  const checklist = [
    "Pièce d'identité en cours de validité",
    "Justificatif de domicile (moins de 3 mois)",
    "3 derniers bulletins de salaire",
    "Avis d'imposition",
    "Relevés bancaires récents",
    "Accord de principe bancaire (si disponible)",
  ]

  const financingRows = [
    { label: "Financement", value: data.timeline.financingType },
    { label: "Apport disponible", value: data.preferences.priceRange.min ? formatCurrency(data.preferences.priceRange.min * 0.1) : "À préciser" },
    { label: "Date d'emménagement souhaitée", value: formatDate(data.timeline.desiredMoveDate) },
  ]

  return (
    <MultiPageWrapper
      brand={brand}
      documentTitle="KIT D'ACHAT IMMOBILIER"
      documentRef={`BUY-${data.buyer.firstName}-${data.buyer.lastName}`}
    >
      <Section brand={brand} title="Introduction" highlight>
        <Paragraph brand={brand}>
          Cher {data.buyer.firstName}, ce kit récapitule les informations essentielles pour concrétiser votre projet.
          Vous y trouverez notre méthodologie, votre feuille de route et les documents à préparer.
        </Paragraph>
      </Section>

      <Section brand={brand} number={1} title="Vos Interlocuteurs">
        <TwoColumn
          brand={brand}
          left={
            <View style={styles.partyBox}>
              <Text style={styles.partyTitle}>L'Acquéreur</Text>
              <Paragraph brand={brand}>
                {data.buyer.firstName} {data.buyer.lastName}
              </Paragraph>
              {data.buyer.email && <Paragraph brand={brand}>{data.buyer.email}</Paragraph>}
              {data.buyer.phone && <Paragraph brand={brand}>{data.buyer.phone}</Paragraph>}
            </View>
          }
          right={
            <View style={styles.partyBox}>
              <Text style={styles.partyTitle}>Le Conseiller</Text>
              <Paragraph brand={brand}>{data.agent.name}</Paragraph>
              <Paragraph brand={brand}>{data.agent.phone}</Paragraph>
              <Paragraph brand={brand}>{data.agent.email}</Paragraph>
            </View>
          }
        />
      </Section>

      <Section brand={brand} number={2} title="Profil & Préférences">
        <DataTable brand={brand} rows={preferenceRows} />
        <View style={styles.chipRow}>
          {data.preferences.propertyTypes.map((type) => (
            <View key={type} style={styles.chip}>
              <Text style={styles.chipText}>{type}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section brand={brand} number={3} title="Votre Feuille de Route">
        {timelineSteps.map((step, idx) => (
          <View key={idx} style={styles.timelineItem}>
            <Text style={styles.timelineStep}>{step.step}</Text>
            <Text style={styles.timelineText}>{step.text}</Text>
          </View>
        ))}
      </Section>

      <Section brand={brand} number={4} title="Check-list Documents">
        <BulletList brand={brand} items={checklist} />
        <Callout brand={brand} type="info">
          Fournir ces éléments à votre conseiller permet de sécuriser et accélérer la négociation.
        </Callout>
      </Section>

      <Section brand={brand} number={5} title="Financement">
        <DataTable brand={brand} rows={financingRows} />
      </Section>

      <Section brand={brand} title="Engagements & Suivi" highlight>
        <Paragraph brand={brand}>
          Nous vous tenons informé(e) à chaque étape, avec des comptes-rendus réguliers. Vous recevez les retours
          de visites, les ajustements stratégiques et les prochaines actions à mener.
        </Paragraph>
      </Section>

      <SignatureBlock
        brand={brand}
        signatories={[
          { role: "L'Acquéreur", name: `${data.buyer.firstName} ${data.buyer.lastName}`, showLuApprouve: true },
          { role: "Le Conseiller", name: data.agent.name, showLuApprouve: false },
        ]}
      />
    </MultiPageWrapper>
  )
}
