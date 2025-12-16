import React from "react"
import { View, Text } from "@react-pdf/renderer"
import type { NoticeDescriptiveData } from "@/lib/pdf-generator"
import type { BrandConfig } from "../../types"
import {
  MultiPageWrapper,
  Section,
  Article,
  TwoColumn,
  DataTable,
  Paragraph,
  LabelValue,
  BulletList,
  Callout,
} from "../shared"

interface NoticeDescriptiveTemplateProps {
  data: NoticeDescriptiveData
  brand: BrandConfig
}

export function NoticeDescriptiveTemplate({ data, brand }: NoticeDescriptiveTemplateProps) {
  const documentRef = `ND-${new Date().getFullYear()}-${data.lot.number}`

  return (
    <MultiPageWrapper
      brand={brand}
      documentTitle="NOTICE DESCRIPTIVE"
      documentRef={documentRef}
    >
        {/* En-tête */}
        <Callout type="info" brand={brand}>
          Notice descriptive établie conformément à l'article R261-13 du Code de la construction
          et de l'habitation, annexée au contrat de réservation.
        </Callout>

        {/* Article 1 - Le Programme */}
        <Section brand={brand} title="LE PROGRAMME IMMOBILIER" number={1}>
          <TwoColumn
            brand={brand}
            left={
              <>
                <LabelValue brand={brand} label="Nom du programme" value={data.program.name} />
                <LabelValue brand={brand} label="Adresse" value={data.program.address} />
              </>
            }
            right={
              <>
                <LabelValue brand={brand} label="Promoteur" value={data.program.promoter} />
                <LabelValue brand={brand} label="Architecte" value={data.program.architect} />
              </>
            }
          />
        </Section>

        {/* Article 2 - Le Lot */}
        <Section brand={brand} title="DÉSIGNATION DU LOT" number={2}>
          <TwoColumn
            brand={brand}
            left={
              <>
                <LabelValue brand={brand} label="N° de lot" value={data.lot.number} />
                <LabelValue brand={brand} label="Type" value={data.lot.type} />
                <LabelValue brand={brand} label="Étage" value={data.lot.floor === 0 ? "Rez-de-chaussée" : `${data.lot.floor}ème étage`} />
              </>
            }
            right={
              <>
                <LabelValue brand={brand} label="Orientation" value={data.lot.orientation} />
                <LabelValue brand={brand} label="Surface habitable" value={`${data.lot.surface} m²`} />
              </>
            }
          />

          {data.lot.annexSurfaces.length > 0 && (
            <Article brand={brand} title="Surfaces annexes">
              <DataTable
                brand={brand}
                rows={data.lot.annexSurfaces.map((s) => ({ label: s.type, value: `${s.surface} m²` }))}
              />
            </Article>
          )}
        </Section>

        {/* Article 3 - Caractéristiques Techniques */}
        <Section brand={brand} title="CARACTÉRISTIQUES TECHNIQUES" number={3}>
          <Article brand={brand} title="Structure">
            <Paragraph brand={brand}>{data.description.structure}</Paragraph>
          </Article>

          <Article brand={brand} title="Façades">
            <Paragraph brand={brand}>{data.description.facade}</Paragraph>
          </Article>

          <Article brand={brand} title="Toiture / Couverture">
            <Paragraph brand={brand}>{data.description.roofing}</Paragraph>
          </Article>

          <Article brand={brand} title="Isolation">
            <Paragraph brand={brand}>{data.description.insulation}</Paragraph>
          </Article>
        </Section>

        {/* Article 4 - Équipements Techniques */}
        <Section brand={brand} title="ÉQUIPEMENTS TECHNIQUES" number={4}>
          <Article brand={brand} title="Chauffage">
            <Paragraph brand={brand}>{data.description.heating}</Paragraph>
          </Article>

          <Article brand={brand} title="Ventilation">
            <Paragraph brand={brand}>{data.description.ventilation}</Paragraph>
          </Article>

          <Article brand={brand} title="Plomberie / Sanitaires">
            <Paragraph brand={brand}>{data.description.plumbing}</Paragraph>
          </Article>

          <Article brand={brand} title="Électricité">
            <Paragraph brand={brand}>{data.description.electricity}</Paragraph>
          </Article>
        </Section>

        {/* Article 5 - Finitions Intérieures */}
        <Section brand={brand} title="FINITIONS INTÉRIEURES" number={5}>
          <Article brand={brand} title="Revêtements de sol">
            <DataTable
              brand={brand}
              rows={data.description.flooring.map((f) => ({ label: f.room, value: f.material }))}
            />
          </Article>

          <Article brand={brand} title="Revêtements muraux">
            <DataTable
              brand={brand}
              rows={data.description.walls.map((w) => ({ label: w.room, value: w.finish }))}
            />
          </Article>

          <Article brand={brand} title="Menuiseries et équipements par pièce">
            {data.description.fixtures.map((fixture, index) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 9, fontWeight: "bold", color: brand.colors.primary, marginBottom: 4 }}>
                  {fixture.room}
                </Text>
                <BulletList brand={brand} items={fixture.items} />
              </View>
            ))}
          </Article>
        </Section>

        {/* Article 6 - Équipements */}
        <Section brand={brand} title="ÉQUIPEMENTS FOURNIS" number={6}>
          <Article brand={brand} title="Cuisine">
            <BulletList brand={brand} items={data.equipment.kitchen} />
          </Article>

          <Article brand={brand} title="Salle de bains / Salle d'eau">
            <BulletList brand={brand} items={data.equipment.bathroom} />
          </Article>

          {data.equipment.other.length > 0 && (
            <Article brand={brand} title="Autres équipements">
              <BulletList brand={brand} items={data.equipment.other} />
            </Article>
          )}
        </Section>

        {/* Article 7 - Extérieurs Privatifs */}
        {data.description.exterior.length > 0 && (
          <Section brand={brand} title="EXTÉRIEURS PRIVATIFS" number={7}>
            <BulletList brand={brand} items={data.description.exterior} />
          </Section>
        )}

        {/* Article 8 - Parties Communes */}
        <Section brand={brand} title="PARTIES COMMUNES" number={8}>
          <BulletList brand={brand} items={data.commonAreas} />
        </Section>

        {/* Article 9 - Parking */}
        {data.parkingDetails && (
          <Section brand={brand} title="STATIONNEMENT" number={9}>
            <Paragraph brand={brand}>{data.parkingDetails}</Paragraph>
          </Section>
        )}

        {/* Article 10 - Cave/Cellier */}
        {data.storageDetails && (
          <Section brand={brand} title="CAVE / CELLIER" number={10}>
            <Paragraph brand={brand}>{data.storageDetails}</Paragraph>
          </Section>
        )}

        {/* Mentions légales */}
        <Section brand={brand} title="MENTIONS LÉGALES" number={11}>
          <Callout type="warning" brand={brand}>
            La présente notice descriptive est établie en conformité avec les dispositions du
            Code de la construction et de l'habitation. Elle fait partie intégrante du contrat
            de réservation et de l'acte de vente.
          </Callout>
          <Paragraph brand={brand}>
            Les matériaux et équipements décrits ci-dessus pourront être remplacés par des
            matériaux et équipements de qualité équivalente, en cas d'indisponibilité ou de
            modification technique justifiée.
          </Paragraph>
          <Paragraph brand={brand}>
            Les plans, surfaces et descriptions sont donnés à titre indicatif. Les surfaces
            définitives seront celles mesurées par un géomètre-expert après achèvement.
          </Paragraph>
        </Section>
    </MultiPageWrapper>
  )
}
