import type { KeyHandoverData } from "@/lib/pdf-generator"
import type { BrandConfig } from "../../types"
import {
  MultiPageWrapper,
  Section,
  Article,
  TwoColumn,
  DataTable,
  SignatureBlock,
  Paragraph,
  LabelValue,
  BulletList,
  Callout,
  CheckboxList,
} from "../shared"
import { formatDate, getPropertyTypeLabel } from "../../utils/formatters"

interface KeyHandoverTemplateProps {
  data: KeyHandoverData
  brand: BrandConfig
}

export function KeyHandoverTemplate({ data, brand }: KeyHandoverTemplateProps) {
  const documentRef = `RDC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`

  // Keys table data
  const keysTableData = data.keys.map((key) => ({
    label: key.type,
    value: `${key.quantity} - ${key.description || "-"}`
  }))

  const rawKeysTable = data.keys.map(k => [k.type, k.quantity.toString(), k.description || "-"])

  // Remote controls table data
  const remotesTableData = data.remoteControls.map((remote) => [
    remote.type,
    remote.quantity.toString(),
  ])

  return (
    <MultiPageWrapper
      brand={brand}
      documentTitle="PROCÈS-VERBAL DE REMISE DES CLÉS"
      documentRef={documentRef}
    >
        {/* En-tête */}
        <Callout type="info" brand={brand}>
          Procès-verbal établi en deux exemplaires originaux, un pour chaque partie,
          à l'occasion de la remise des clés du bien immobilier désigné ci-après.
        </Callout>

        {/* Article 1 - Bien Concerné */}
        <Section brand={brand} title="BIEN CONCERNÉ" number={1}>
          <TwoColumn
            brand={brand}
            left={
              <>
                <LabelValue brand={brand} label="Type de bien" value={getPropertyTypeLabel(data.property.type)} />
                <LabelValue brand={brand} label="Référence" value={data.property.reference} />
                <LabelValue brand={brand} label="Surface" value={`${data.property.characteristics.surface} m²`} />
              </>
            }
            right={
              <>
                <LabelValue
                  brand={brand}
                  label="Adresse"
                  value={`${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}`}
                />
              </>
            }
          />
        </Section>

        {/* Article 2 - Les Parties */}
        <Section brand={brand} title="LES PARTIES" number={2}>
          <Article brand={brand} title="Partie remettante (ancien occupant)">
            <TwoColumn
              brand={brand}
              left={
                <>
                  <LabelValue brand={brand} label="Nom" value={`${data.previousOccupant.firstName} ${data.previousOccupant.lastName}`} />
                  <LabelValue brand={brand} label="Téléphone" value={data.previousOccupant.phone} />
                </>
              }
              right={
                <>
                  <LabelValue brand={brand} label="Email" value={data.previousOccupant.email} />
                </>
              }
            />
          </Article>

          <Article brand={brand} title="Partie recevante (nouvel occupant)">
            <TwoColumn
              brand={brand}
              left={
                <>
                  <LabelValue brand={brand} label="Nom" value={`${data.newOccupant.firstName} ${data.newOccupant.lastName}`} />
                  <LabelValue brand={brand} label="Téléphone" value={data.newOccupant.phone} />
                </>
              }
              right={
                <>
                  <LabelValue brand={brand} label="Email" value={data.newOccupant.email} />
                </>
              }
            />
          </Article>

          {data.agent && (
            <Article brand={brand} title="En présence de">
              <LabelValue brand={brand} label="Agent immobilier" value={`${data.agent.name} - ${data.agent.agency}`} />
            </Article>
          )}
        </Section>

        {/* Article 3 - Date et Heure */}
        <Section brand={brand} title="DATE ET HEURE DE LA REMISE" number={3}>
          <TwoColumn
            brand={brand}
            left={<LabelValue brand={brand} label="Date" value={formatDate(data.date)} />}
            right={<LabelValue brand={brand} label="Heure" value={data.time} />}
          />
        </Section>

        {/* Article 4 - Clés Remises */}
        <Section brand={brand} title="CLÉS REMISES" number={4}>
          {keysTableData.length > 0 ? (
            <DataTable
              brand={brand}
              rows={keysTableData}
            />
          ) : (
            <Callout brand={brand} type="warning">Aucune clé listée</Callout>
          )}
        </Section>

        {/* Article 5 - Télécommandes et Badges */}
        {remotesTableData.length > 0 && (
          <Section brand={brand} title="TÉLÉCOMMANDES ET BADGES" number={5}>
            <DataTable
              brand={brand}
              rows={data.remoteControls.map(r => ({ label: r.type, value: r.quantity.toString() }))}
            />
          </Section>
        )}

        {/* Article 6 - Codes d'Accès */}
        {data.accessCodes.length > 0 && (
          <Section brand={brand} title="CODES D'ACCÈS" number={6}>
            <Callout brand={brand} type="warning">
              Ces informations sont confidentielles et ne doivent pas être divulguées à des tiers.
            </Callout>
            <DataTable
              brand={brand}
              rows={data.accessCodes.map((code) => ({ label: code.location, value: code.code }))}
            />
          </Section>
        )}

        {/* Article 7 - Relevés de Compteurs */}
        <Section brand={brand} title="RELEVÉS DE COMPTEURS" number={7}>
          <DataTable
            brand={brand}
            rows={[
              { label: "Électricité", value: `${data.meterReadings.electricity.reading} kWh (PDL: ${data.meterReadings.electricity.pdl || "-"})` },
              ...(data.meterReadings.gas ? [{ label: "Gaz", value: `${data.meterReadings.gas.reading} m³ (PCE: ${data.meterReadings.gas.pce || "-"})` }] : []),
              { label: "Eau", value: `${data.meterReadings.water.reading} m³ (Ref: ${data.meterReadings.water.meter || "-"})` },
            ]}
          />
          <Paragraph brand={brand}>
            Le nouvel occupant s'engage à effectuer les démarches nécessaires auprès des fournisseurs
            d'énergie pour le transfert des contrats à son nom.
          </Paragraph>
        </Section>

        {/* Article 8 - Documents Remis */}
        {data.documents.length > 0 && (
          <Section brand={brand} title="DOCUMENTS REMIS" number={8}>
            <CheckboxList brand={brand} items={data.documents.map(d => ({ text: d, checked: true }))} />
          </Section>
        )}

        {/* Article 9 - Observations */}
        {data.observations && (
          <Section brand={brand} title="OBSERVATIONS" number={9}>
            <Paragraph brand={brand}>{data.observations}</Paragraph>
          </Section>
        )}

        {/* Article 10 - Déclarations */}
        <Section brand={brand} title="DÉCLARATIONS DES PARTIES" number={10}>
          <Paragraph brand={brand}>
            Les parties déclarent que la remise des clés a été effectuée de manière contradictoire
            et qu'elles n'ont aucune réclamation à formuler concernant les éléments inventoriés ci-dessus.
          </Paragraph>
          <Paragraph brand={brand}>
            L'ancien occupant déclare avoir vidé entièrement les lieux de tous ses effets personnels
            et avoir remis l'ensemble des clés et moyens d'accès en sa possession.
          </Paragraph>
          <Paragraph brand={brand}>
            Le nouvel occupant reconnaît avoir reçu les clés et moyens d'accès listés ci-dessus
            et en devient responsable à compter de ce jour.
          </Paragraph>
        </Section>

        {/* Signatures */}
        <SignatureBlock
          brand={brand}
          signatories={[
            {
              role: "Partie remettante",
              name: `${data.previousOccupant.firstName} ${data.previousOccupant.lastName}`,
              showLuApprouve: true
            },
            {
              role: "Partie recevante",
              name: `${data.newOccupant.firstName} ${data.newOccupant.lastName}`,
              showLuApprouve: true
            },
            ...(data.agent
              ? [
                {
                  role: "Agent immobilier",
                  name: data.agent.name,
                  showLuApprouve: true
                },
              ]
              : []),
          ]}
          date={formatDate(data.date)}
        />
    </MultiPageWrapper>
  )
}
