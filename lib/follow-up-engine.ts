// Follow-up suggestion engine based on real estate best practices
// Source: Industry research on optimal follow-up timing and cadence

import type { Deal, Email, Visit, Task, Contact, Property } from "./mock-data"

export interface FollowUpSuggestion {
  id: string
  dealId: string
  type: "email" | "call" | "visit" | "task"
  priority: "urgent" | "high" | "medium" | "low"
  reason: string
  suggestedAction: string
  suggestedSubject?: string
  suggestedBody?: string
  daysSinceLastContact: number
  lastContactType?: string
  lastContactDate?: string
}

// Best practice timing rules (in days)
const FOLLOW_UP_RULES = {
  lead: {
    initialResponse: 0.003, // 5 minutes ideally
    firstFollowUp: 1,
    subsequentFollowUp: 3,
    maxDaysNoContact: 7,
  },
  visit: {
    preVisitReminder: 1,
    postVisitFollowUp: 1,
    maxDaysNoContact: 5,
  },
  offer: {
    responseTime: 1,
    negotiationFollowUp: 2,
    maxDaysNoContact: 3,
  },
  negotiation: {
    activeFollowUp: 2,
    maxDaysNoContact: 4,
  },
  contract: {
    documentFollowUp: 2,
    maxDaysNoContact: 5,
  },
  notary: {
    appointmentReminder: 3,
    maxDaysNoContact: 7,
  },
  closed: {
    thankYouEmail: 1,
    referralRequest: 14,
    anniversaryCheckIn: 365,
  },
}

// Email templates based on stage and situation
const EMAIL_TEMPLATES = {
  lead: {
    noContact: {
      subject: "Votre recherche immobilière - Suivi",
      body: `Bonjour {contactName},

J'espère que vous allez bien. Je me permets de revenir vers vous concernant votre projet immobilier.

Avez-vous eu l'occasion de réfléchir à vos critères de recherche ? Je serais ravi(e) de vous présenter quelques biens qui pourraient correspondre à vos attentes.

N'hésitez pas à me contacter pour organiser un rendez-vous à votre convenance.

Bien cordialement,
{agentName}`,
    },
    newLead: {
      subject: "Bienvenue - Votre projet immobilier",
      body: `Bonjour {contactName},

Merci de l'intérêt que vous portez à nos services. Je suis {agentName} et je serai votre interlocuteur(trice) privilégié(e) pour votre projet immobilier.

Je serais ravi(e) d'échanger avec vous pour mieux comprendre vos besoins et vous accompagner dans votre recherche.

Quand seriez-vous disponible pour un premier échange téléphonique ?

Bien cordialement,
{agentName}`,
    },
  },
  visit: {
    preVisit: {
      subject: "Rappel - Visite demain à {time}",
      body: `Bonjour {contactName},

Je vous confirme notre rendez-vous de demain pour la visite du bien situé au {propertyAddress}.

Détails de la visite :
- Date : {visitDate}
- Heure : {time}
- Adresse : {propertyAddress}

N'hésitez pas à me contacter si vous avez des questions ou si vous souhaitez modifier ce rendez-vous.

À demain !

Bien cordialement,
{agentName}`,
    },
    postVisit: {
      subject: "Suite à notre visite - {propertyAddress}",
      body: `Bonjour {contactName},

Je vous remercie pour votre visite du bien situé au {propertyAddress}.

J'espère que cette visite vous a permis de mieux vous projeter. Qu'avez-vous pensé du bien ? Y a-t-il des points que vous aimeriez approfondir ?

Je reste à votre disposition pour toute question ou pour organiser une seconde visite si vous le souhaitez.

Bien cordialement,
{agentName}`,
    },
    scheduleVisit: {
      subject: "Proposition de visite - {propertyAddress}",
      body: `Bonjour {contactName},

Suite à notre échange, je vous propose de visiter le bien situé au {propertyAddress}.

Ce bien correspond à vos critères :
- Surface : {propertySize} m²
- Prix : {propertyPrice} €
- {propertyFeatures}

Seriez-vous disponible cette semaine pour une visite ?

Bien cordialement,
{agentName}`,
    },
  },
  offer: {
    received: {
      subject: "Confirmation de réception de votre offre",
      body: `Bonjour {contactName},

Je vous confirme la bonne réception de votre offre d'achat pour le bien situé au {propertyAddress}.

Je transmets votre proposition au vendeur et reviendrai vers vous dans les plus brefs délais avec sa réponse.

Bien cordialement,
{agentName}`,
    },
    followUp: {
      subject: "Point sur votre offre - {propertyAddress}",
      body: `Bonjour {contactName},

Je reviens vers vous concernant votre offre pour le bien situé au {propertyAddress}.

{statusUpdate}

Je reste à votre disposition pour toute question.

Bien cordialement,
{agentName}`,
    },
  },
  negotiation: {
    update: {
      subject: "Avancement des négociations - {propertyAddress}",
      body: `Bonjour {contactName},

Je souhaitais faire un point avec vous sur l'avancement des négociations pour le bien situé au {propertyAddress}.

{negotiationUpdate}

Pouvons-nous échanger pour discuter des prochaines étapes ?

Bien cordialement,
{agentName}`,
    },
  },
  contract: {
    preparation: {
      subject: "Préparation du compromis - {propertyAddress}",
      body: `Bonjour {contactName},

Excellente nouvelle ! Nous avançons dans la préparation du compromis de vente pour le bien situé au {propertyAddress}.

Pour finaliser les documents, j'aurais besoin des éléments suivants :
- Pièce d'identité
- Justificatif de domicile
- Attestation de financement (si applicable)

Pouvez-vous me les transmettre à votre convenance ?

Bien cordialement,
{agentName}`,
    },
    reminder: {
      subject: "Rappel - Documents pour le compromis",
      body: `Bonjour {contactName},

Je me permets de revenir vers vous concernant les documents nécessaires pour le compromis de vente.

Avez-vous pu rassembler les éléments demandés ? Je reste à votre disposition si vous avez besoin d'aide.

Bien cordialement,
{agentName}`,
    },
  },
  notary: {
    appointment: {
      subject: "Rendez-vous chez le notaire - {propertyAddress}",
      body: `Bonjour {contactName},

Je vous confirme le rendez-vous chez le notaire pour la signature de l'acte authentique :

- Date : {appointmentDate}
- Heure : {appointmentTime}
- Lieu : {notaryAddress}

Pensez à apporter :
- Votre pièce d'identité
- Votre RIB
- Le financement (chèque de banque ou virement)

N'hésitez pas à me contacter si vous avez des questions.

Bien cordialement,
{agentName}`,
    },
  },
  closed: {
    thankYou: {
      subject: "Félicitations pour votre acquisition !",
      body: `Bonjour {contactName},

Toutes mes félicitations pour l'acquisition de votre nouveau bien au {propertyAddress} !

Ce fut un plaisir de vous accompagner dans ce projet. J'espère que vous vous plairez dans votre nouveau chez-vous.

N'hésitez pas à me contacter si vous avez besoin de quoi que ce soit à l'avenir, ou si vous connaissez des personnes ayant un projet immobilier.

Bien cordialement,
{agentName}`,
    },
    referral: {
      subject: "Un petit mot de votre agent immobilier",
      body: `Bonjour {contactName},

J'espère que vous êtes bien installé(e) dans votre nouveau logement au {propertyAddress}.

Je me permets de vous contacter car la recommandation est très importante dans notre métier. Si vous connaissez des personnes ayant un projet immobilier (achat, vente ou location), je serais ravi(e) de les accompagner avec le même soin.

Merci encore pour votre confiance !

Bien cordialement,
{agentName}`,
    },
  },
}

export function generateFollowUpSuggestions(
  deals: Deal[],
  emails: Email[],
  visits: Visit[],
  tasks: Task[],
  contacts: Contact[],
  properties: Property[],
): FollowUpSuggestion[] {
  const suggestions: FollowUpSuggestion[] = []
  const now = new Date()

  deals.forEach((deal) => {
    const contact = contacts.find((c) => c.id === deal.buyerId)
    const property = properties.find((p) => p.id === deal.propertyId)
    if (!contact || !property) return

    // Get all communications for this deal/contact
    const dealEmails = emails.filter(
      (e) =>
        (e.relatedTo?.type === "deal" && e.relatedTo.id === deal.id) ||
        (e.relatedTo?.type === "contact" && e.relatedTo.id === contact.id) ||
        e.from.email === contact.email ||
        e.to.some((t) => t.email === contact.email),
    )

    const dealVisits = visits.filter((v) => v.contactId === contact.id && v.propertyId === property.id)

    const dealTasks = tasks.filter((t) => t.relatedTo?.type === "deal" && t.relatedTo.id === deal.id)

    // Find last contact date
    const lastEmailDate =
      dealEmails.length > 0 ? new Date(Math.max(...dealEmails.map((e) => new Date(e.date).getTime()))) : null

    const lastVisitDate =
      dealVisits.length > 0 ? new Date(Math.max(...dealVisits.map((v) => new Date(v.date).getTime()))) : null

    const lastContactDate =
      lastEmailDate && lastVisitDate
        ? new Date(Math.max(lastEmailDate.getTime(), lastVisitDate.getTime()))
        : lastEmailDate || lastVisitDate

    const daysSinceLastContact = lastContactDate
      ? Math.floor((now.getTime() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    const lastContactType = lastContactDate
      ? lastEmailDate && lastEmailDate >= (lastVisitDate || new Date(0))
        ? "email"
        : "visit"
      : undefined

    const rules = FOLLOW_UP_RULES[deal.status as keyof typeof FOLLOW_UP_RULES] || FOLLOW_UP_RULES.lead
    const maxDays = "maxDaysNoContact" in rules ? rules.maxDaysNoContact : 7

    // Generate suggestions based on stage and timing
    if (daysSinceLastContact >= maxDays) {
      const template = getTemplateForStage(deal.status, "noContact")
      const priority = daysSinceLastContact >= maxDays * 2 ? "urgent" : "high"

      suggestions.push({
        id: `sug-${deal.id}-followup`,
        dealId: deal.id,
        type: "email",
        priority,
        reason: `Aucun contact depuis ${daysSinceLastContact} jours`,
        suggestedAction: `Relancer ${contact.firstName} ${contact.lastName}`,
        suggestedSubject: fillTemplate(template?.subject || "", contact, property, deal),
        suggestedBody: fillTemplate(template?.body || "", contact, property, deal),
        daysSinceLastContact,
        lastContactType,
        lastContactDate: lastContactDate?.toISOString(),
      })
    }

    // Stage-specific suggestions
    if (deal.status === "visit") {
      // Check for upcoming visits needing reminder
      const upcomingVisits = dealVisits.filter((v) => {
        const visitDate = new Date(v.date)
        const daysUntil = Math.floor((visitDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return daysUntil === 1 && v.status === "scheduled"
      })

      if (upcomingVisits.length > 0) {
        const visit = upcomingVisits[0]
        const template = EMAIL_TEMPLATES.visit.preVisit

        suggestions.push({
          id: `sug-${deal.id}-previsit`,
          dealId: deal.id,
          type: "email",
          priority: "high",
          reason: "Visite prévue demain",
          suggestedAction: `Envoyer un rappel à ${contact.firstName}`,
          suggestedSubject: fillTemplate(template.subject, contact, property, deal, visit),
          suggestedBody: fillTemplate(template.body, contact, property, deal, visit),
          daysSinceLastContact,
          lastContactType,
          lastContactDate: lastContactDate?.toISOString(),
        })
      }

      // Check for completed visits needing follow-up
      const recentCompletedVisits = dealVisits.filter((v) => {
        const visitDate = new Date(v.date)
        const daysSince = Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24))
        return daysSince >= 1 && daysSince <= 2 && v.status === "completed"
      })

      // Check if no post-visit email was sent
      const hasPostVisitEmail = dealEmails.some((e) => {
        const emailDate = new Date(e.date)
        return recentCompletedVisits.some((v) => {
          const visitDate = new Date(v.date)
          return emailDate > visitDate && e.subject?.toLowerCase().includes("visite")
        })
      })

      if (recentCompletedVisits.length > 0 && !hasPostVisitEmail) {
        const template = EMAIL_TEMPLATES.visit.postVisit

        suggestions.push({
          id: `sug-${deal.id}-postvisit`,
          dealId: deal.id,
          type: "email",
          priority: "high",
          reason: "Visite effectuée - suivi nécessaire",
          suggestedAction: `Demander les impressions de ${contact.firstName}`,
          suggestedSubject: fillTemplate(template.subject, contact, property, deal),
          suggestedBody: fillTemplate(template.body, contact, property, deal),
          daysSinceLastContact,
          lastContactType,
          lastContactDate: lastContactDate?.toISOString(),
        })
      }

      // Suggest scheduling a visit if none planned
      if (dealVisits.filter((v) => v.status === "scheduled" || v.status === "confirmed").length === 0) {
        const template = EMAIL_TEMPLATES.visit.scheduleVisit

        suggestions.push({
          id: `sug-${deal.id}-schedulevisit`,
          dealId: deal.id,
          type: "visit",
          priority: daysSinceLastContact > 5 ? "urgent" : "medium",
          reason: "Aucune visite programmée",
          suggestedAction: `Proposer une visite à ${contact.firstName}`,
          suggestedSubject: fillTemplate(template.subject, contact, property, deal),
          suggestedBody: fillTemplate(template.body, contact, property, deal),
          daysSinceLastContact,
          lastContactType,
          lastContactDate: lastContactDate?.toISOString(),
        })
      }
    }

    if (deal.status === "offer" && daysSinceLastContact >= 2) {
      const template = EMAIL_TEMPLATES.offer.followUp

      suggestions.push({
        id: `sug-${deal.id}-offerfollowup`,
        dealId: deal.id,
        type: "email",
        priority: "urgent",
        reason: "Offre en attente - suivi urgent",
        suggestedAction: `Faire un point sur l'offre avec ${contact.firstName}`,
        suggestedSubject: fillTemplate(template.subject, contact, property, deal),
        suggestedBody: fillTemplate(template.body, contact, property, deal).replace(
          "{statusUpdate}",
          "Je suis en attente de la réponse du vendeur et vous tiendrai informé(e) dès que possible.",
        ),
        daysSinceLastContact,
        lastContactType,
        lastContactDate: lastContactDate?.toISOString(),
      })
    }

    if (deal.status === "contract" && daysSinceLastContact >= 3) {
      const template = EMAIL_TEMPLATES.contract.reminder

      suggestions.push({
        id: `sug-${deal.id}-contractreminder`,
        dealId: deal.id,
        type: "email",
        priority: "high",
        reason: "Documents de compromis en attente",
        suggestedAction: `Relancer pour les documents`,
        suggestedSubject: fillTemplate(template.subject, contact, property, deal),
        suggestedBody: fillTemplate(template.body, contact, property, deal),
        daysSinceLastContact,
        lastContactType,
        lastContactDate: lastContactDate?.toISOString(),
      })
    }

    if (deal.status === "closed") {
      // Thank you email if closed within last 2 days and no thank you sent
      const dealClosedRecently = new Date(deal.createdAt).getTime() > now.getTime() - 2 * 24 * 60 * 60 * 1000
      const hasThankYouEmail = dealEmails.some(
        (e) =>
          e.subject?.toLowerCase().includes("félicitations") || e.subject?.toLowerCase().includes("congratulations"),
      )

      if (dealClosedRecently && !hasThankYouEmail) {
        const template = EMAIL_TEMPLATES.closed.thankYou

        suggestions.push({
          id: `sug-${deal.id}-thankyou`,
          dealId: deal.id,
          type: "email",
          priority: "medium",
          reason: "Vente conclue - remerciements",
          suggestedAction: `Féliciter ${contact.firstName}`,
          suggestedSubject: fillTemplate(template.subject, contact, property, deal),
          suggestedBody: fillTemplate(template.body, contact, property, deal),
          daysSinceLastContact,
          lastContactType,
          lastContactDate: lastContactDate?.toISOString(),
        })
      }
    }
  })

  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
  return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
}

function getTemplateForStage(stage: string, situation: string) {
  const stageTemplates = EMAIL_TEMPLATES[stage as keyof typeof EMAIL_TEMPLATES]
  if (!stageTemplates) return EMAIL_TEMPLATES.lead.noContact
  return (
    (stageTemplates as Record<string, { subject: string; body: string }>)[situation] || EMAIL_TEMPLATES.lead.noContact
  )
}

function fillTemplate(template: string, contact: Contact, property: Property, deal: Deal, visit?: Visit): string {
  return template
    .replace(/{contactName}/g, `${contact.firstName} ${contact.lastName}`)
    .replace(/{agentName}/g, "Votre agent")
    .replace(/{propertyAddress}/g, property.address.street)
    .replace(/{propertySize}/g, property.size.toString())
    .replace(/{propertyPrice}/g, new Intl.NumberFormat("fr-FR").format(property.price))
    .replace(/{propertyFeatures}/g, property.features?.slice(0, 3).join(", ") || "")
    .replace(/{visitDate}/g, visit?.date || "")
    .replace(/{time}/g, visit?.startTime || "")
}
