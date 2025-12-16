import type { BrandConfig } from "../../types"
import type { OfferLetterData } from "@/lib/pdf-generator"
import {
  MultiPageWrapper,
  Section,
  DataTable,
  SignatureBlock,
  BulletList,
  Callout,
  Paragraph,
  LabelValue,
  AmountDisplay,
  TwoColumn,
} from "../shared"
import {
  formatDate,
  formatCurrency,
  numberToWords,
  getPropertyTypeLabel,
  getFinancingTypeLabel,
} from "../../utils/formatters"

interface OfferLetterTemplateProps {
  data: OfferLetterData
  brand: BrandConfig
}

export function OfferLetterTemplate({ data, brand }: OfferLetterTemplateProps) {
  const offerDiff = data.offer.amount - data.property.price
  const offerPercent = ((data.offer.amount / data.property.price) * 100 - 100).toFixed(1)

  return (
    <MultiPageWrapper
      brand={brand}
      documentTitle="OFFRE D'ACHAT"
      documentRef={`OFFER-${data.property.reference}`}
    >
        {/* Buyer Introduction */}
        <Section brand={brand} title="L'ACQUÉREUR (OFFRANT)">
          <TwoColumn
            brand={brand}
            left={
              <>
                <LabelValue brand={brand} label="Nom" value={`${data.buyer.firstName} ${data.buyer.lastName}`} />
                <LabelValue brand={brand} label="Email" value={data.buyer.email} />
              </>
            }
            right={
              <>
                <LabelValue brand={brand} label="Téléphone" value={data.buyer.phone} />
              </>
            }
          />
        </Section>

        <Paragraph brand={brand}>
          Je soussigné(e), formule par la présente une offre d'achat ferme et définitive pour le
          bien immobilier désigné ci-après.
        </Paragraph>

        {/* Property */}
        <Section brand={brand} title="DÉSIGNATION DU BIEN">
          <DataTable
            brand={brand}
            rows={[
              { label: "Référence", value: data.property.reference },
              {
                label: "Adresse",
                value: `${data.property.address.street}, ${data.property.address.postalCode} ${data.property.address.city}`,
              },
              {
                label: "Type",
                value: getPropertyTypeLabel(data.property.type),
              },
              {
                label: "Surface",
                value: `${data.property.characteristics.surface} m²`,
              },
              {
                label: "Prix affiché",
                value: formatCurrency(data.property.price),
              },
            ]}
          />
        </Section>

        {/* Offer Amount */}
        <Section brand={brand} title="MONTANT DE L'OFFRE">
          <AmountDisplay
            brand={brand}
            amount={formatCurrency(data.offer.amount)}
            label="Prix proposé net vendeur"
            amountInWords={numberToWords(data.offer.amount)}
            large
          />

          <Callout brand={brand} type="info">
            <LabelValue
              brand={brand}
              label="Comparaison au prix affiché"
              value={`${formatCurrency(offerDiff)} (${offerPercent}%)`}
            />
          </Callout>
        </Section>

        {/* Financing */}
        <Section brand={brand} title="FINANCEMENT">
          <DataTable
            brand={brand}
            rows={[
              {
                label: "Mode de financement",
                value: getFinancingTypeLabel(data.offer.financingType),
              },
              {
                label: "Montant du crédit sollicité",
                value: data.offer.mortgageAmount
                  ? formatCurrency(data.offer.mortgageAmount)
                  : undefined,
              },
            ]}
          />
        </Section>

        {/* Conditions */}
        <Section brand={brand} title="CONDITIONS SUSPENSIVES">
          <Callout brand={brand} type="warning">
            Cette offre est soumise aux conditions suivantes:
          </Callout>
          <BulletList brand={brand} items={data.offer.conditions} />
        </Section>

        {/* Validity */}
        <Section brand={brand} title="VALIDITÉ DE L'OFFRE">
          <Callout brand={brand} type="info">
            <LabelValue brand={brand} label="Offre valable jusqu'au" value={formatDate(data.offer.validUntil)} />
            <Paragraph brand={brand}>
              Passé ce délai, sans acceptation de votre part, la présente offre sera considérée comme caduque.
            </Paragraph>
          </Callout>
        </Section>

        {/* Signature */}
        <SignatureBlock
          brand={brand}
          signatories={[
            {
              role: "L'Acquéreur",
              name: `${data.buyer.firstName} ${data.buyer.lastName}`,
              showLuApprouve: true
            }
          ]}
          location={data.property.address.city}
          date={new Date().toISOString()} // Date of generic offer letter usually is today
        />
    </MultiPageWrapper>
  )
}
