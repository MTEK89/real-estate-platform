import type { SaleContractVEFAData } from "@/lib/pdf-generator"
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
  AmountDisplay,
} from "../shared"
import { formatDate, formatCurrency, numberToWords, getPropertyTypeLabel } from "../../utils/formatters"

interface SaleContractVEFATemplateProps {
  data: SaleContractVEFAData
  brand: BrandConfig
}

export function SaleContractVEFATemplate({ data, brand }: SaleContractVEFATemplateProps) {
  const documentRef = `VEFA-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`

  // Calculate total with options
  const totalWithOptions = data.price.totalPrice + (data.price.parkingPrice || 0) + (data.price.storagePrice || 0)

  // Property details for table
  const lotDetails = [
    { label: "Programme", value: data.program.name },
    { label: "N° de lot", value: data.program.lotNumber },
    { label: "Bâtiment", value: data.program.building },
    { label: "Étage", value: data.program.floor === 0 ? "Rez-de-chaussée" : `${data.program.floor}ème étage` },
    { label: "Type de bien", value: getPropertyTypeLabel(data.property.type) },
    { label: "Surface habitable", value: `${data.property.characteristics.surface} m²` },
    { label: "Permis de construire", value: `N° ${data.program.permitNumber} du ${formatDate(data.program.permitDate)}` },
  ]

  return (
    <MultiPageWrapper
      brand={brand}
      documentTitle="CONTRAT DE RÉSERVATION VEFA"
      documentRef={documentRef}
    >
        {/* Introduction */}
        <Callout brand={brand} type="info">
	          Contrat préliminaire de réservation d'un logement vendu en l'état futur d'achèvement,
	          conformément à la législation applicable.
        </Callout>

        {/* Article 1 - Le Vendeur (Promoteur) */}
        <Section brand={brand} title="LE VENDEUR" number={1}>
          <TwoColumn
            brand={brand}
            left={
              <>
                <LabelValue brand={brand} label="Société" value={data.seller.company} />
	                <LabelValue brand={brand} label="RCS" value={data.seller.siret} />
                <LabelValue brand={brand} label="Adresse" value={data.seller.address} />
              </>
            }
            right={
              <>
                <LabelValue brand={brand} label="Représentée par" value={data.seller.representative} />
                <LabelValue brand={brand} label="Garant" value={data.seller.guarantor} />
              </>
            }
          />
        </Section>

        {/* Article 2 - L'Acquéreur */}
        <Section brand={brand} title="L'ACQUÉREUR (RÉSERVATAIRE)" number={2}>
          <TwoColumn
            brand={brand}
            left={
              <>
                <LabelValue brand={brand} label="Nom" value={`${data.buyer.firstName} ${data.buyer.lastName}`} />
                {/* Contact usually doesn't have address, handle safely if missing or add if needed */}
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

        {/* Article 3 - Désignation du Bien */}
        <Section brand={brand} title="DÉSIGNATION DU BIEN RÉSERVÉ" number={3}>
          <DataTable brand={brand} rows={lotDetails} />

          <Article brand={brand} title="Description du lot">
            <Paragraph brand={brand}>{data.program.description}</Paragraph>
          </Article>

          <Article brand={brand} title="Localisation">
            <Paragraph brand={brand}>
              Situé {data.property.address.street}, {data.property.address.postalCode} {data.property.address.city}
            </Paragraph>
          </Article>
        </Section>

        {/* Article 4 - Prix */}
        <Section brand={brand} title="PRIX" number={4}>
          <AmountDisplay
            brand={brand}
            amount={formatCurrency(data.price.totalPrice)}
            label="Prix du logement TTC"
          />

          <TwoColumn
            brand={brand}
            left={
              <>
                <LabelValue brand={brand} label="Prix au m²" value={formatCurrency(data.price.pricePerSqm)} />
                <LabelValue brand={brand} label="TVA" value={`${data.price.vatRate}%`} />
              </>
            }
            right={
              <>
                {data.price.parkingPrice && (
                  <LabelValue brand={brand} label="Parking" value={formatCurrency(data.price.parkingPrice)} />
                )}
                {data.price.storagePrice && (
                  <LabelValue brand={brand} label="Cave/Cellier" value={formatCurrency(data.price.storagePrice)} />
                )}
              </>
            }
          />

          <Callout brand={brand} type="info">
            <LabelValue
              brand={brand}
              label="PRIX TOTAL TTC"
              value={`${formatCurrency(totalWithOptions)} (${numberToWords(totalWithOptions)})`}
            />
          </Callout>
        </Section>

        {/* Article 5 - Dépôt de Garantie */}
        <Section brand={brand} title="DÉPÔT DE GARANTIE" number={5}>
          <Paragraph brand={brand}>
            Un dépôt de garantie de {formatCurrency(data.payments.reservationDeposit)} est versé par le Réservataire
            à la signature du présent contrat, soit {((data.payments.reservationDeposit / data.price.totalPrice) * 100).toFixed(1)}%
            du prix de vente.
          </Paragraph>
          <Callout brand={brand} type="warning">
            Ce dépôt sera restitué, sans retenue ni pénalité, si le Réservataire exerce son droit de rétractation
            dans un délai de 10 jours à compter de la notification du présent contrat.
          </Callout>
        </Section>

        {/* Article 6 - Échéancier de Paiement */}
        <Section brand={brand} title="ÉCHÉANCIER DE PAIEMENT" number={6}>
          <Paragraph brand={brand}>
            Conformément à l'article R261-14 du Code de la construction et de l'habitation,
            les paiements seront échelonnés comme suit :
          </Paragraph>
          <DataTable
            brand={brand}
            rows={data.payments.schedule.map((payment) => ({
              label: payment.stage,
              value: `${payment.percentage}% - ${formatCurrency(payment.amount)} (Date: ${payment.dueDate ? formatDate(payment.dueDate) : "À définir"})`
            }))}
          />
        </Section>

        {/* Article 7 - Livraison */}
        <Section brand={brand} title="LIVRAISON" number={7}>
          <TwoColumn
            brand={brand}
            left={
              <>
                <LabelValue brand={brand} label="Date prévisionnelle" value={formatDate(data.delivery.estimatedDate)} />
                <LabelValue brand={brand} label="Tolérance" value={`± ${data.delivery.toleranceMonths} mois`} />
              </>
            }
            right={
              <>
                {data.delivery.penaltyPerDay && (
                  <LabelValue brand={brand} label="Pénalités de retard" value={`${formatCurrency(data.delivery.penaltyPerDay)}/jour`} />
                )}
              </>
            }
          />
          <Paragraph brand={brand}>
            La livraison sera constatée par procès-verbal contradictoire établi lors de la remise des clés.
            Le Réservataire disposera d'un délai d'un mois à compter de la prise de possession pour signaler
            les défauts de conformité apparents.
          </Paragraph>
        </Section>

        {/* Article 8 - Garanties */}
        <Section brand={brand} title="GARANTIES" number={8}>
          <Article brand={brand} title="Garantie financière d'achèvement">
            <Paragraph brand={brand}>{data.guarantees.completionGuarantee}</Paragraph>
          </Article>
          <Article brand={brand} title="Assurance décennale">
            <Paragraph brand={brand}>{data.guarantees.decennialInsurance}</Paragraph>
          </Article>
          <Article brand={brand} title="Assurance dommages-ouvrage">
            <Paragraph brand={brand}>{data.guarantees.damageInsurance}</Paragraph>
          </Article>
        </Section>

        {/* Article 9 - Droit de Rétractation */}
        <Section brand={brand} title="DROIT DE RÉTRACTATION" number={9}>
          <Callout brand={brand} type="warning">
            L'acquéreur non professionnel peut se rétracter dans un délai de dix jours à compter
            du lendemain de la première présentation de la lettre lui notifiant le présent contrat.
          </Callout>
          <Paragraph brand={brand}>
            La rétractation doit être notifiée au vendeur par lettre recommandée avec accusé de réception.
            Le dépôt de garantie sera alors restitué dans un délai de vingt et un jours.
          </Paragraph>
        </Section>

        {/* Article 10 - Clauses Particulières */}
        {data.specialClauses.length > 0 && (
          <Section brand={brand} title="CLAUSES PARTICULIÈRES" number={10}>
            <BulletList brand={brand} items={data.specialClauses} />
          </Section>
        )}

        {/* Article 11 - Documents Annexes */}
        <Section brand={brand} title="DOCUMENTS ANNEXÉS" number={11}>
          <BulletList
            brand={brand}
            items={[
              "Plan du lot avec cotes",
              "Notice descriptive",
              "Plans des parties communes",
              "Règlement de copropriété",
              "État descriptif de division",
              "Attestation de garantie financière d'achèvement",
            ]}
          />
        </Section>

        {/* Signatures */}
        <SignatureBlock
          brand={brand}
          signatories={[
            {
              role: "Le Vendeur (Promoteur)",
              name: `${data.seller.representative} (${data.seller.company})`,
              showLuApprouve: true
            },
            {
              role: "L'Acquéreur (Réservataire)",
              name: `${data.buyer.firstName} ${data.buyer.lastName}`,
              showLuApprouve: true,
            },
          ]}
          location={data.property.address.city}
          date={new Date().toISOString()} // Date is typically today for generated doc
        />
    </MultiPageWrapper>
  )
}
