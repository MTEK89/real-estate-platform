import React from "react"
import { View, Text, StyleSheet } from "@react-pdf/renderer"
import type { BrandConfig } from "../../types"
import type { VisitReportData } from "@/lib/pdf-generator"
import { PageWrapper } from "../shared/PageWrapper"
import { Section } from "../shared/Section"
import { DataTable, TwoColumn, InfoBox } from "../shared/DataTable"
import { BulletList, CheckboxList } from "../shared/Typography"
import {
  formatDate,
  formatCurrency,
  getPropertyTypeLabel,
} from "../../utils/formatters"

interface VisitReportTemplateProps {
  data: VisitReportData
  brand: BrandConfig
}

export function VisitReportTemplate({ data, brand }: VisitReportTemplateProps) {
  const styles = StyleSheet.create({
    // Interest Section (Mandate Style)
    interestBox: {
      backgroundColor: brand.colors.highlight,
      padding: 15,
      borderRadius: 4,
      marginTop: 10,
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: brand.colors.secondary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    interestTitle: {
      fontSize: 10,
      fontWeight: "bold",
      color: brand.colors.secondary,
      textTransform: 'uppercase'
    },
    interestDots: {
      flexDirection: "row",
      alignItems: "center",
    },
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      marginRight: 6,
    },
    dotFilled: {
      backgroundColor: "#22c55e",
    },
    dotEmpty: {
      backgroundColor: "#e2e8f0",
    },
    interestLabel: {
      fontSize: 10,
      fontWeight: 'bold',
      color: brand.colors.text,
      marginLeft: 10,
    },
    commentsText: {
      fontSize: 9,
      color: brand.colors.text,
      lineHeight: 1.4,
      fontStyle: 'italic'
    },
    // Custom Room Table
    roomTable: {
      marginTop: 10,
      borderWidth: 1,
      borderColor: brand.colors.border,
      borderRadius: 4
    },
    roomRow: {
      flexDirection: 'row',
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: brand.colors.border
    },
    roomHeader: {
      backgroundColor: brand.colors.primary,
      borderBottomWidth: 0
    },
    roomCell: {
      flex: 1,
      fontSize: 8,
      color: brand.colors.text
    },
    roomHeaderCell: {
      color: 'white',
      fontWeight: 'bold'
    }
  })

  // Prepare DataTables
  const visitInfoRows = [
    { label: "Date", value: formatDate(data.visit.date) },
    { label: "Heure", value: `${data.visit.startTime} - ${data.visit.endTime}` },
    { label: "Agent", value: data.agent.name },
  ];

  const visitorRows = [
    { label: "Visiteur", value: `${data.contact.firstName} ${data.contact.lastName}` },
    { label: "Email", value: data.contact.email },
    { label: "Tél", value: data.contact.phone },
  ];

  const propertyRows = [
    { label: "Référence", value: data.property.reference },
    { label: "Type", value: getPropertyTypeLabel(data.property.type) },
    { label: "Prix", value: formatCurrency(data.property.price) },
    { label: "Adresse", value: `${data.property.address.street}, ${data.property.address.city}` },
  ];

  const conditionLabels: Record<string, string> = {
    excellent: "Excellent", good: "Bon", fair: "Correct", poor: "Mauvais",
  }

  return (
    <PageWrapper
      brand={brand}
      documentTitle="COMPTE-RENDU DE VISITE"
      documentRef={`VISIT-${formatDate(data.visit.date)}`}
    >

        {/* Top Info */}
        <Section brand={brand} title="RÉSUMÉ DE LA VISITE">
          <TwoColumn
            brand={brand}
            left={<DataTable brand={brand} rows={visitInfoRows} />}
            right={<DataTable brand={brand} rows={visitorRows} />}
          />
        </Section>

        {/* Property */}
        <Section brand={brand} title="BIEN CONCERNÉ">
          <DataTable brand={brand} rows={propertyRows} />
        </Section>

        {/* Observations */}
        <Section brand={brand} title="OBSERVATIONS">
          <DataTable
            brand={brand}
            rows={[{ label: "État Général", value: conditionLabels[data.observations.generalCondition] || data.observations.generalCondition }]}
          />

          {/* Rooms Table */}
          {data.observations.rooms.length > 0 && (
            <View style={styles.roomTable}>
              <View style={[styles.roomRow, styles.roomHeader]}>
                <Text style={[styles.roomCell, styles.roomHeaderCell]}>Pièce</Text>
                <Text style={[styles.roomCell, styles.roomHeaderCell]}>État</Text>
                <Text style={[styles.roomCell, styles.roomHeaderCell, { flex: 2 }]}>Notes</Text>
              </View>
              {data.observations.rooms.map((room, idx) => (
                <View key={idx} style={[styles.roomRow, idx === data.observations.rooms.length - 1 ? { borderBottomWidth: 0 } : {}]}>
                  <Text style={styles.roomCell}>{room.name}</Text>
                  <Text style={styles.roomCell}>{room.condition}</Text>
                  <Text style={[styles.roomCell, { flex: 2 }]}>{room.notes}</Text>
                </View>
              ))}
            </View>
          )}
        </Section>

        {/* Interest Level */}
        <Section brand={brand} title="INTÉRÊT DU VISITEUR">
          <View style={styles.interestBox}>
            <Text style={styles.interestTitle}>Niveau d'intérêt global</Text>
            <View style={styles.interestDots}>
              {[1, 2, 3, 4, 5].map((level) => (
                <View
                  key={level}
                  style={[
                    styles.dot,
                    level <= data.interestLevel ? styles.dotFilled : styles.dotEmpty,
                  ]}
                />
              ))}
              <Text style={styles.interestLabel}>{data.interestLevel}/5</Text>
            </View>
          </View>
        </Section>

        {/* Comments */}
        <Section brand={brand} title="COMMENTAIRES">
          <InfoBox brand={brand} title="Notes de l'agent">
            <Text style={styles.commentsText}>{data.comments || "Aucun commentaire particulier."}</Text>
          </InfoBox>
        </Section>

        {/* Follow Up */}
        <Section brand={brand} title="ACTIONS À SUIVRE">
          <CheckboxList
            brand={brand}
            items={data.followUpActions.map((action) => ({ text: action, checked: false }))}
          />
        </Section>

    </PageWrapper>
  )
}
