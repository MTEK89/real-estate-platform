import React from "react"
import { View, Text, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../types"
import type { EtatDesLieuxData } from "@/lib/pdf-generator"
import { MultiPageWrapper } from "../shared"
import { Section } from "../shared/Section"
import { DataTable, TwoColumn, InfoBox } from "../shared/DataTable"
import { SignatureBlock } from "../shared/SignatureBlock"
import { LabelValue } from "../shared/Typography"
import { formatDate } from "../../utils/formatters"

interface EtatDesLieuxTemplateProps {
  data: EtatDesLieuxData
  brand: BrandConfig
}

export function EtatDesLieuxTemplate({ data, brand }: EtatDesLieuxTemplateProps) {
  const isMoveIn = data.type === "move_in"
  const documentTitle = `ÉTAT DES LIEUX ${isMoveIn ? "D'ENTRÉE" : "DE SORTIE"}`

  const styles = StyleSheet.create({
    // Mandate-style Party/Agent Box
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
      textTransform: "uppercase",
      borderBottomWidth: 1,
      borderBottomColor: brand.colors.border,
      paddingBottom: 4
    },
    // Meter Box styled like PriceBox
    meterBox: {
      backgroundColor: brand.colors.highlight,
      padding: 15,
      borderRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: brand.colors.secondary,
      marginTop: 5,
      marginBottom: 10
    },
    meterTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: brand.colors.secondary,
      marginBottom: 10,
      textTransform: "uppercase"
    },
    meterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4
    },
    meterLabel: { fontSize: 9, color: brand.colors.muted },
    meterValue: { fontSize: 10, fontWeight: 'bold', color: brand.colors.text },

    // Room Section
    roomTable: {
      marginTop: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 4,
      overflow: 'hidden'
    },
    roomHeader: {
      backgroundColor: brand.colors.primary,
      padding: 5,
      flexDirection: 'row'
    },
    roomHeaderCell: {
      fontSize: 8,
      color: 'white',
      fontWeight: 'bold',
      paddingHorizontal: 4
    },
    roomRow: {
      flexDirection: 'row',
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderBottomColor: brand.colors.border
    },
    roomCell: {
      fontSize: 8,
      color: brand.colors.text,
      paddingHorizontal: 4
    },

    // Keys Grid
    keysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 5
    },
    keyItem: {
      width: '30%',
      marginRight: '3%',
      marginBottom: 6,
      backgroundColor: brand.colors.highlight,
      padding: 6,
      borderRadius: 4
    }
  })

  // Parties Content
  const Landlord = () => (
    <View style={styles.partyBox}>
      <Text style={styles.partyTitle}>Le Bailleur</Text>
      <LabelValue label="Nom" value={`${data.landlord.firstName} ${data.landlord.lastName}`} brand={brand} />
      {data.landlord.email && <LabelValue label="Email" value={data.landlord.email} brand={brand} />}
      {data.landlord.phone && <LabelValue label="Tél" value={data.landlord.phone} brand={brand} />}
    </View>
  )
  const Tenant = () => (
    <View style={styles.partyBox}>
      <Text style={styles.partyTitle}>Le Locataire</Text>
      <LabelValue label="Nom" value={`${data.tenant.firstName} ${data.tenant.lastName}`} brand={brand} />
      {data.tenant.email && <LabelValue label="Email" value={data.tenant.email} brand={brand} />}
      {data.tenant.phone && <LabelValue label="Tél" value={data.tenant.phone} brand={brand} />}
    </View>
  )

  return (
    <MultiPageWrapper
      brand={brand}
      documentTitle={documentTitle}
      documentRef={`EDL-${formatDate(data.date)}`}
    >
        <Section brand={brand} title="INFORMATIONS GÉNÉRALES">
          <TwoColumn
            brand={brand}
            left={<LabelValue label="Date d'effet" value={formatDate(data.date)} brand={brand} />}
            right={<LabelValue label="Adresse" value={`${data.property.address.street}, ${data.property.address.city}`} brand={brand} />}
          />
        </Section>

        <Section brand={brand} title="LES PARTIES" number={1}>
          <TwoColumn brand={brand} left={<Landlord />} right={<Tenant />} />
        </Section>

        <Section brand={brand} title="RELEVÉS DES COMPTEURS" number={2}>
          <View style={styles.meterBox}>
            <Text style={styles.meterTitle}>Relevés à ce jour</Text>
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>Électricité</Text>
              <Text style={styles.meterValue}>{data.meterReadings.electricity} kWh</Text>
            </View>
            {data.meterReadings.gas !== undefined && (
              <View style={styles.meterRow}>
                <Text style={styles.meterLabel}>Gaz</Text>
                <Text style={styles.meterValue}>{data.meterReadings.gas} m³</Text>
              </View>
            )}
            <View style={styles.meterRow}>
              <Text style={styles.meterLabel}>Eau</Text>
              <Text style={styles.meterValue}>{data.meterReadings.water} m³</Text>
            </View>
          </View>
        </Section>

        <Section brand={brand} title="ÉTAT DES PIÈCES" number={3}>
          {data.rooms.map((room, idx) => (
            <View key={idx} break={idx > 2}>
              <InfoBox brand={brand} title={room.name}>
                <View style={styles.roomTable}>
                  {/* Header */}
                  <View style={styles.roomHeader}>
                    <Text style={[styles.roomHeaderCell, { width: '25%' }]}>Élément</Text>
                    <Text style={[styles.roomHeaderCell, { width: '25%' }]}>État</Text>
                    <Text style={[styles.roomHeaderCell, { width: '50%' }]}>Notes</Text>
                  </View>
                  {/* Walls */}
                  <View style={styles.roomRow}>
                    <Text style={[styles.roomCell, { width: '25%', fontWeight: 'bold' }]}>Murs</Text>
                    <Text style={[styles.roomCell, { width: '25%' }]}>{room.walls.condition}</Text>
                    <Text style={[styles.roomCell, { width: '50%', color: brand.colors.muted }]}>{room.walls.notes}</Text>
                  </View>
                  <View style={styles.roomRow}>
                    <Text style={[styles.roomCell, { width: '25%', fontWeight: 'bold' }]}>Sol</Text>
                    <Text style={[styles.roomCell, { width: '25%' }]}>{room.floor.condition}</Text>
                    <Text style={[styles.roomCell, { width: '50%', color: brand.colors.muted }]}>{room.floor.notes}</Text>
                  </View>
                  <View style={styles.roomRow}>
                    <Text style={[styles.roomCell, { width: '25%', fontWeight: 'bold' }]}>Plafond</Text>
                    <Text style={[styles.roomCell, { width: '25%' }]}>{room.ceiling.condition}</Text>
                    <Text style={[styles.roomCell, { width: '50%', color: brand.colors.muted }]}>{room.ceiling.notes}</Text>
                  </View>
                  <View style={styles.roomRow}>
                    <Text style={[styles.roomCell, { width: '25%', fontWeight: 'bold' }]}>Fenêtres</Text>
                    <Text style={[styles.roomCell, { width: '25%' }]}>{room.windows.condition}</Text>
                    <Text style={[styles.roomCell, { width: '50%', color: brand.colors.muted }]}>{room.windows.notes}</Text>
                  </View>
                  {/* Fixtures */}
                  {room.fixtures.map((fixture, fIdx) => (
                    <View key={fIdx} style={[styles.roomRow, fIdx === room.fixtures.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                      <Text style={[styles.roomCell, { width: '25%', fontWeight: 'bold' }]}>{fixture.item}</Text>
                      <Text style={[styles.roomCell, { width: '25%' }]}>{fixture.condition}</Text>
                      <Text style={[styles.roomCell, { width: '50%', color: brand.colors.muted }]}>{fixture.notes}</Text>
                    </View>
                  ))}
                </View>
              </InfoBox>
            </View>
          ))}
        </Section>

        <Section brand={brand} title="REMISE DES CLÉS" number={4}>
          <View style={styles.keysGrid}>
            {data.keysProvided.map((key, index) => (
              <View key={index} style={styles.keyItem}>
                <LabelValue label={key.type} value={`${key.quantity} exemplaires`} brand={brand} />
              </View>
            ))}
          </View>
        </Section>

        {data.generalComments && (
          <Section brand={brand} title="OBSERVATIONS GÉNÉRALES" number={5}>
            <InfoBox brand={brand} title="Notes">
              <Text style={{ fontSize: 9, color: brand.colors.text }}>{data.generalComments}</Text>
            </InfoBox>
          </Section>
        )}

        <Section brand={brand} title="SIGNATURES" number={6}>
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
            date={formatDate(data.date)}
          />
        </Section>

    </MultiPageWrapper>
  )
}
