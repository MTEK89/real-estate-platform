import React from "react"
import { View, Text, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../../types"
import {
  MultiPageWrapper,
  Section,
  TwoColumn,
  CheckboxList,
  Paragraph,
  SignatureBlock,
} from "../../shared"

type ClientIntakeType = "buyer" | "seller"

interface ClientIntakeFormData {
  type: ClientIntakeType
  agency: {
    name: string
    address: string
    phone: string
    website: string
  }
  agent: {
    name: string
    phone: string
    email: string
  }
}

interface ClientIntakeFormTemplateProps {
  data: ClientIntakeFormData
  brand: BrandConfig
}

export function ClientIntakeFormTemplate({ data, brand }: ClientIntakeFormTemplateProps) {
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
    fieldGroup: { marginBottom: 10 },
    label: {
      fontSize: 8,
      color: brand.colors.muted,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    fieldBox: {
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 4,
      backgroundColor: brand.colors.highlight,
      paddingVertical: 8,
      paddingHorizontal: 8,
      minHeight: 26,
    },
    fieldBoxTall: { minHeight: 70 },
    instructions: {
      backgroundColor: brand.colors.highlight,
      borderLeftWidth: 4,
      borderLeftColor: brand.colors.secondary,
      padding: 10,
      borderRadius: 4,
      marginBottom: 10,
    },
    instructionTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: brand.colors.secondary,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    instructionText: { fontSize: 9, color: brand.colors.text, lineHeight: 1.4 },
  })

  const Field = ({ label, tall = false }: { label: string; tall?: boolean }) => (
    <View style={styles.fieldGroup} wrap={false}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.fieldBox, tall ? styles.fieldBoxTall : null]} />
    </View>
  )

  const Instructions = ({ text }: { text: string }) => (
    <View style={styles.instructions} wrap={false}>
      <Text style={styles.instructionTitle}>Instructions</Text>
      <Text style={styles.instructionText}>{text}</Text>
    </View>
  )

  const AgencyAndAgent = () => (
    <Section brand={brand} title="Agence & Conseiller">
      <TwoColumn
        brand={brand}
        left={
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Agence</Text>
            <Paragraph brand={brand}>{data.agency.name}</Paragraph>
            <Paragraph brand={brand}>{data.agency.address}</Paragraph>
            <Paragraph brand={brand}>{data.agency.phone}</Paragraph>
            <Paragraph brand={brand}>{data.agency.website}</Paragraph>
          </View>
        }
        right={
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>Conseiller</Text>
            <Paragraph brand={brand}>{data.agent.name}</Paragraph>
            <Paragraph brand={brand}>{data.agent.phone}</Paragraph>
            <Paragraph brand={brand}>{data.agent.email}</Paragraph>
          </View>
        }
      />
    </Section>
  )

  const BuyerForm = () => (
    <>
      <Instructions text="Merci de remplir ce formulaire avec le plus grand soin. Les informations recueillies nous aideront à mieux comprendre votre projet et à vous proposer les biens les plus adaptés." />

      <Section brand={brand} number={1} title="Informations Personnelles">
        <TwoColumn
          brand={brand}
          left={
            <>
              <Field label="Nom *" />
              <Field label="Date de naissance *" />
              <Field label="Nationalité *" />
              <Field label="Profession *" />
            </>
          }
          right={
            <>
              <Field label="Prénom *" />
              <Field label="Lieu de naissance *" />
              <Field label="Situation familiale *" />
              <Field label="Employeur" />
            </>
          }
        />
      </Section>

      <Section brand={brand} number={2} title="Coordonnées">
        <TwoColumn
          brand={brand}
          left={
            <>
              <Field label="Adresse *" tall />
              <Field label="Ville *" />
              <Field label="Email *" />
            </>
          }
          right={
            <>
              <Field label="Code postal *" />
              <Field label="Téléphone *" />
              <Field label="Contact urgence (nom + téléphone)" />
            </>
          }
        />
      </Section>

      <Section brand={brand} number={3} title="Votre Projet">
        <Field label="Type de bien recherché *" />
        <CheckboxList
          brand={brand}
          items={[
            { text: "Appartement" },
            { text: "Maison" },
            { text: "Studio" },
            { text: "Villa" },
            { text: "Terrain" },
            { text: "Local commercial" },
          ]}
        />
        <TwoColumn
          brand={brand}
          left={
            <>
              <Field label="Surface minimale (m²) *" />
              <Field label="Budget maximum *" />
              <Field label="Zones recherchées (villes/arrondissements) *" tall />
            </>
          }
          right={
            <>
              <Field label="Nombre de pièces min. *" />
              <Field label="Apport personnel *" />
              <Field label="Critères importants (transports, écoles, etc.)" tall />
            </>
          }
        />
        <Field label="Date souhaitée d'emménagement *" />
      </Section>

      <Section brand={brand} number={4} title="Situation Financière">
        <TwoColumn
          brand={brand}
          left={
            <>
              <Field label="Revenus mensuels nets *" />
              <Field label="Charges mensuelles *" />
              <Field label="Crédits en cours (montants / mensualités)" tall />
            </>
          }
          right={
            <>
              <Field label="Autres revenus" />
              <Field label="Type de financement *" />
              <CheckboxList brand={brand} items={[{ text: "Prêt bancaire" }, { text: "Comptant" }, { text: "Mixte" }]} />
              <Field label="Accord de principe ?" />
              <CheckboxList brand={brand} items={[{ text: "Oui" }, { text: "Non" }]} />
            </>
          }
        />
        <Field label="Commentaires / informations complémentaires" tall />
      </Section>
    </>
  )

  const SellerForm = () => (
    <>
      <Instructions text="Merci de remplir ce formulaire avec le plus grand soin. Ces informations nous permettront de préparer au mieux la mise en vente de votre bien et d'établir une estimation précise." />

      <Section brand={brand} number={1} title="Informations Personnelles">
        <TwoColumn
          brand={brand}
          left={
            <>
              <Field label="Nom *" />
              <Field label="Date de naissance *" />
              <Field label="Nationalité *" />
              <Field label="Profession *" />
            </>
          }
          right={
            <>
              <Field label="Prénom *" />
              <Field label="Lieu de naissance *" />
              <Field label="Situation familiale *" />
              <Field label="Téléphone *" />
            </>
          }
        />
        <Field label="Email *" />
        <Field label="Adresse actuelle *" tall />
      </Section>

      <Section brand={brand} number={2} title="Informations sur le Bien à Vendre">
        <TwoColumn
          brand={brand}
          left={
            <>
              <Field label="Type de bien *" />
              <Field label="Nombre de pièces *" />
              <Field label="Adresse du bien *" tall />
              <Field label="Ville *" />
            </>
          }
          right={
            <>
              <Field label="Surface habitable (m²) *" />
              <Field label="Nombre de chambres *" />
              <Field label="Code postal *" />
              <Field label="Année de construction" />
            </>
          }
        />
        <Field label="Travaux récents / à prévoir" tall />
      </Section>

      <Section brand={brand} number={3} title="Situation Juridique et Financière">
        <Field label="Bien en copropriété ?" />
        <CheckboxList brand={brand} items={[{ text: "Oui" }, { text: "Non" }]} />
        <TwoColumn
          brand={brand}
          left={
            <>
              <Field label="Charges de copropriété (mensuelles)" />
              <Field label="Taxe foncière (annuelle)" />
            </>
          }
          right={
            <>
              <Field label="Crédit en cours sur le bien ?" />
              <CheckboxList brand={brand} items={[{ text: "Oui" }, { text: "Non" }]} />
            </>
          }
        />
        <TwoColumn
          brand={brand}
          left={<Field label="Motif de la vente *" />}
          right={<Field label="Prix de vente souhaité *" />}
        />
        <Field label="Commentaires / informations complémentaires" tall />
      </Section>
    </>
  )

  return (
    <MultiPageWrapper
      brand={brand}
      documentTitle="FORMULAIRE D'INFORMATION"
      documentRef={`INTAKE-${data.type.toUpperCase()}`}
    >
      <AgencyAndAgent />

      <Section brand={brand} title="Objet" highlight>
        <Paragraph brand={brand}>
          {data.type === "buyer"
            ? "Fiche de renseignement pour projet d'achat (acquéreur)."
            : "Fiche de renseignement pour mise en vente (vendeur)."}
        </Paragraph>
      </Section>

      {data.type === "buyer" ? <BuyerForm /> : <SellerForm />}

      <Section brand={brand} title="Documents à fournir" number={data.type === "buyer" ? 5 : 4}>
        <CheckboxList
          brand={brand}
          items={
            data.type === "buyer"
              ? [
                  { text: "Pièce d'identité" },
                  { text: "Justificatif de domicile" },
                  { text: "Derniers bulletins de salaire" },
                  { text: "Avis d'imposition" },
                  { text: "Accord de principe bancaire (si disponible)" },
                ]
              : [
                  { text: "Titre de propriété" },
                  { text: "Taxe foncière" },
                  { text: "Diagnostics (si disponibles)" },
                  { text: "Règlement de copropriété (si applicable)" },
                  { text: "Dernier PV d'AG (si applicable)" },
                ]
          }
        />
      </Section>

      <Section brand={brand} title="RGPD & Confidentialité" highlight>
        <Paragraph brand={brand}>
          Les informations recueillies sont strictement confidentielles et utilisées uniquement dans le cadre
          de votre projet immobilier. Conformément au RGPD, vous pouvez demander l'accès, la rectification
          ou la suppression de vos données.
        </Paragraph>
      </Section>

      <SignatureBlock
        brand={brand}
        signatories={[
          { role: "Le Client", name: "________________", showLuApprouve: true },
          { role: "Le Conseiller", name: "________________", showLuApprouve: false },
        ]}
      />
    </MultiPageWrapper>
  )
}
