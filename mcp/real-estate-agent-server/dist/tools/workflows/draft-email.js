/**
 * Draft email workflow tool - AI-powered email drafting for real estate communications
 */
import { z } from "zod";
import { EmailToneSchema, AgencyIdSchema } from "../../schemas/common.js";
import { getSupabaseClient } from "../../services/supabase.js";
import { resolveContact, resolveProperty } from "../../services/fuzzy-search.js";
import { formatPrice, formatAddressShort } from "../../services/formatters.js";
import { createErrorResponse, createSuccessResponse, getContactNotFoundMessage, getPropertyNotFoundMessage } from "../../utils/errors.js";
import { formatDisplayDate } from "../../services/date-parser.js";
/**
 * Register draft email workflow tools
 */
export function registerDraftEmailTools(server) {
    server.tool("re_draft_email", `Draft a professional email for real estate communications.

Supports various email types:
- property_presentation: Introduce a property to a potential buyer
- visit_confirmation: Confirm a scheduled visit
- visit_followup: Follow up after a visit
- offer_received: Notify about an offer
- contract_ready: Contract is ready for signature
- general: Custom email

Examples:
- "Draft an email to John presenting property APT-001"
- "Write a visit confirmation email for Marie's viewing tomorrow"
- "Send a follow-up email after the visit with Jean"`, {
        email_type: z.enum([
            "property_presentation",
            "visit_confirmation",
            "visit_followup",
            "offer_received",
            "contract_ready",
            "general",
        ]).describe("Type of email to draft"),
        contact_query: z.string().describe("Recipient contact ID or name"),
        property_query: z.string().optional().describe("Property ID or reference (if applicable)"),
        visit_id: z.string().optional().describe("Visit ID (for visit-related emails)"),
        // Customization
        tone: EmailToneSchema.describe("Email tone"),
        custom_subject: z.string().optional().describe("Custom subject line"),
        custom_message: z.string().optional().describe("Additional message or specific points to include"),
        include_price: z.boolean().default(true).describe("Include property price"),
        include_characteristics: z.boolean().default(true).describe("Include property details"),
        language: z.enum(["en", "fr", "de"]).default("en").describe("Email language"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            // Resolve contact
            const contactResult = await resolveContact(args.contact_query, args.agency_id);
            if (!contactResult.contact) {
                return createErrorResponse(getContactNotFoundMessage(args.contact_query, contactResult.suggestions));
            }
            const contact = contactResult.contact;
            // Resolve property if needed
            let property = null;
            if (args.property_query) {
                const propResult = await resolveProperty(args.property_query, args.agency_id);
                if (!propResult.property) {
                    return createErrorResponse(getPropertyNotFoundMessage(args.property_query, propResult.suggestions));
                }
                property = propResult.property;
            }
            // Resolve visit if needed
            let visit = null;
            if (args.visit_id) {
                const supabase = getSupabaseClient();
                const { data, error } = await supabase
                    .from("visits")
                    .select("*, properties(*)")
                    .eq("id", args.visit_id)
                    .single();
                if (!error && data) {
                    visit = data;
                    if (!property && data.properties) {
                        property = data.properties;
                    }
                }
            }
            // Generate email based on type
            const email = generateEmail({
                type: args.email_type,
                contact,
                property,
                visit,
                tone: args.tone,
                customSubject: args.custom_subject,
                customMessage: args.custom_message,
                includePrice: args.include_price,
                includeCharacteristics: args.include_characteristics,
                language: args.language,
            });
            const lines = [
                "# Email Draft",
                "",
                `**To**: ${contact.first_name} ${contact.last_name} <${contact.email || "no email on file"}>`,
                `**Subject**: ${email.subject}`,
                "",
                "---",
                "",
                email.body,
                "",
                "---",
                "",
                "💡 Copy and customize this email, or use your email client to send.",
            ];
            if (!contact.email) {
                lines.push("");
                lines.push("⚠️ **Note**: This contact doesn't have an email address on file. Use `re_upsert_contact` to add one.");
            }
            return createSuccessResponse(lines.join("\n"));
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Quick property presentation email
    server.tool("re_email_property", `Quick shortcut to draft a property presentation email.

Examples:
- "Email John about property APT-001"
- "Send Marie the details of HSE-XYZ"`, {
        contact_query: z.string().describe("Recipient contact"),
        property_query: z.string().describe("Property to present"),
        tone: EmailToneSchema,
        language: z.enum(["en", "fr", "de"]).default("en"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const contactResult = await resolveContact(args.contact_query, args.agency_id);
            if (!contactResult.contact) {
                return createErrorResponse(getContactNotFoundMessage(args.contact_query, contactResult.suggestions));
            }
            const propResult = await resolveProperty(args.property_query, args.agency_id);
            if (!propResult.property) {
                return createErrorResponse(getPropertyNotFoundMessage(args.property_query, propResult.suggestions));
            }
            const contact = contactResult.contact;
            const property = propResult.property;
            const email = generateEmail({
                type: "property_presentation",
                contact,
                property,
                visit: null,
                tone: args.tone,
                includePrice: true,
                includeCharacteristics: true,
                language: args.language,
            });
            return createSuccessResponse(`# Property Presentation Email\n\n` +
                `**To**: ${contact.first_name} ${contact.last_name}\n` +
                `**Subject**: ${email.subject}\n\n` +
                `---\n\n${email.body}`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Visit confirmation email
    server.tool("re_email_visit_confirmation", `Draft a visit confirmation email.

Examples:
- "Confirm the visit with Marie for tomorrow"
- "Send confirmation for visit [id]"`, {
        visit_id: z.string().describe("Visit ID"),
        tone: EmailToneSchema,
        language: z.enum(["en", "fr", "de"]).default("en"),
        agency_id: AgencyIdSchema,
    }, async (args) => {
        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from("visits")
                .select("*, properties(*), contacts(*)")
                .eq("id", args.visit_id)
                .single();
            if (error || !data) {
                return createErrorResponse(`Visit not found: ${args.visit_id}`);
            }
            const visit = data;
            const property = data.properties;
            const contact = data.contacts;
            const email = generateEmail({
                type: "visit_confirmation",
                contact,
                property,
                visit,
                tone: args.tone,
                includePrice: true,
                includeCharacteristics: false,
                language: args.language,
            });
            return createSuccessResponse(`# Visit Confirmation Email\n\n` +
                `**To**: ${contact.first_name} ${contact.last_name}\n` +
                `**Subject**: ${email.subject}\n\n` +
                `---\n\n${email.body}`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
}
function generateEmail(options) {
    const { type, contact, property, visit, tone = "professional", language = "en" } = options;
    const greeting = getGreeting(contact, tone, language);
    const closing = getClosing(tone, language);
    switch (type) {
        case "property_presentation":
            return generatePropertyPresentationEmail(options, greeting, closing);
        case "visit_confirmation":
            return generateVisitConfirmationEmail(options, greeting, closing);
        case "visit_followup":
            return generateVisitFollowupEmail(options, greeting, closing);
        case "offer_received":
            return generateOfferReceivedEmail(options, greeting, closing);
        case "contract_ready":
            return generateContractReadyEmail(options, greeting, closing);
        default:
            return generateGeneralEmail(options, greeting, closing);
    }
}
function getGreeting(contact, tone, language) {
    const name = contact.first_name;
    const greetings = {
        en: {
            professional: `Dear ${name},`,
            friendly: `Hi ${name}!`,
            formal: `Dear Mr./Ms. ${contact.last_name},`,
        },
        fr: {
            professional: `Bonjour ${name},`,
            friendly: `Salut ${name} !`,
            formal: `Cher(e) M./Mme ${contact.last_name},`,
        },
        de: {
            professional: `Guten Tag ${name},`,
            friendly: `Hallo ${name}!`,
            formal: `Sehr geehrte(r) Herr/Frau ${contact.last_name},`,
        },
    };
    return greetings[language]?.[tone] || greetings.en.professional;
}
function getClosing(tone, language) {
    const closings = {
        en: {
            professional: "Best regards,",
            friendly: "Cheers,",
            formal: "Yours sincerely,",
        },
        fr: {
            professional: "Cordialement,",
            friendly: "À bientôt,",
            formal: "Veuillez agréer mes salutations distinguées,",
        },
        de: {
            professional: "Mit freundlichen Grüßen,",
            friendly: "Viele Grüße,",
            formal: "Hochachtungsvoll,",
        },
    };
    return closings[language]?.[tone] || closings.en.professional;
}
function generatePropertyPresentationEmail(options, greeting, closing) {
    const { property, includePrice, includeCharacteristics, language } = options;
    if (!property) {
        return { subject: "Property Information", body: `${greeting}\n\n[Property details would go here]\n\n${closing}` };
    }
    const subjects = {
        en: `Property Opportunity: ${property.type} in ${property.address?.city || "Great Location"}`,
        fr: `Opportunité Immobilière: ${property.type} à ${property.address?.city || "Excellent Emplacement"}`,
        de: `Immobilienangebot: ${property.type} in ${property.address?.city || "Top Lage"}`,
    };
    const intros = {
        en: "I am pleased to present you with a property that matches your criteria:",
        fr: "J'ai le plaisir de vous présenter un bien correspondant à vos critères :",
        de: "Ich freue mich, Ihnen eine Immobilie vorzustellen, die Ihren Kriterien entspricht:",
    };
    let details = `\n**${property.reference}**\n${formatAddressShort(property.address)}\n`;
    if (includePrice) {
        details += `\n**Price**: ${formatPrice(property.price)}\n`;
    }
    if (includeCharacteristics && property.characteristics) {
        const chars = property.characteristics;
        const features = [];
        if (chars.surface)
            features.push(`${chars.surface} m²`);
        if (chars.bedrooms)
            features.push(`${chars.bedrooms} bedrooms`);
        if (chars.bathrooms)
            features.push(`${chars.bathrooms} bathrooms`);
        if (features.length > 0) {
            details += `\n**Features**: ${features.join(" | ")}\n`;
        }
    }
    const ctas = {
        en: "Would you like to schedule a viewing? I am available at your convenience.",
        fr: "Souhaitez-vous organiser une visite ? Je suis disponible selon vos convenances.",
        de: "Möchten Sie eine Besichtigung vereinbaren? Ich stehe Ihnen gerne zur Verfügung.",
    };
    return {
        subject: subjects[language || "en"],
        body: `${greeting}\n\n${intros[language || "en"]}\n${details}\n${ctas[language || "en"]}\n\n${closing}`,
    };
}
function generateVisitConfirmationEmail(options, greeting, closing) {
    const { property, visit, language } = options;
    const subjects = {
        en: `Visit Confirmation: ${property?.reference || "Property"} on ${visit?.date || "[Date]"}`,
        fr: `Confirmation de Visite: ${property?.reference || "Bien"} le ${visit?.date || "[Date]"}`,
        de: `Besichtigungsbestätigung: ${property?.reference || "Immobilie"} am ${visit?.date || "[Datum]"}`,
    };
    const bodies = {
        en: `I am writing to confirm your property viewing:\n\n` +
            `**Date**: ${visit?.date ? formatDisplayDate(visit.date) : "[Date]"}\n` +
            `**Time**: ${visit?.start_time || "[Time]"}\n` +
            `**Property**: ${property?.reference || "[Reference]"}\n` +
            `**Address**: ${property ? formatAddressShort(property.address) : "[Address]"}\n\n` +
            `Please let me know if you need to reschedule or if you have any questions.`,
        fr: `Je vous écris pour confirmer votre visite :\n\n` +
            `**Date**: ${visit?.date ? formatDisplayDate(visit.date) : "[Date]"}\n` +
            `**Heure**: ${visit?.start_time || "[Heure]"}\n` +
            `**Bien**: ${property?.reference || "[Référence]"}\n` +
            `**Adresse**: ${property ? formatAddressShort(property.address) : "[Adresse]"}\n\n` +
            `N'hésitez pas à me contacter si vous avez besoin de reporter ou si vous avez des questions.`,
        de: `Hiermit bestätige ich Ihren Besichtigungstermin:\n\n` +
            `**Datum**: ${visit?.date ? formatDisplayDate(visit.date) : "[Datum]"}\n` +
            `**Uhrzeit**: ${visit?.start_time || "[Zeit]"}\n` +
            `**Immobilie**: ${property?.reference || "[Referenz]"}\n` +
            `**Adresse**: ${property ? formatAddressShort(property.address) : "[Adresse]"}\n\n` +
            `Bitte lassen Sie mich wissen, falls Sie umplanen müssen oder Fragen haben.`,
    };
    return {
        subject: subjects[language || "en"],
        body: `${greeting}\n\n${bodies[language || "en"]}\n\n${closing}`,
    };
}
function generateVisitFollowupEmail(options, greeting, closing) {
    const { property, language } = options;
    const subjects = {
        en: `Following up on your visit to ${property?.reference || "the property"}`,
        fr: `Suite à votre visite de ${property?.reference || "la propriété"}`,
        de: `Nachverfolgung Ihrer Besichtigung von ${property?.reference || "der Immobilie"}`,
    };
    const bodies = {
        en: `Thank you for taking the time to visit ${property?.reference || "the property"} yesterday.\n\n` +
            `I would love to hear your thoughts. Did the property meet your expectations?\n\n` +
            `If you have any questions or would like to discuss further, I am at your disposal.`,
        fr: `Merci d'avoir pris le temps de visiter ${property?.reference || "le bien"} hier.\n\n` +
            `J'aimerais connaître vos impressions. Le bien correspondait-il à vos attentes ?\n\n` +
            `Si vous avez des questions ou souhaitez en discuter, je reste à votre disposition.`,
        de: `Vielen Dank, dass Sie sich die Zeit genommen haben, ${property?.reference || "die Immobilie"} gestern zu besichtigen.\n\n` +
            `Ich würde gerne Ihre Meinung hören. Hat die Immobilie Ihren Erwartungen entsprochen?\n\n` +
            `Wenn Sie Fragen haben oder weitere Informationen wünschen, stehe ich Ihnen gerne zur Verfügung.`,
    };
    return {
        subject: subjects[language || "en"],
        body: `${greeting}\n\n${bodies[language || "en"]}\n\n${closing}`,
    };
}
function generateOfferReceivedEmail(options, greeting, closing) {
    const { property, language, customMessage } = options;
    const subjects = {
        en: `Offer Received for ${property?.reference || "Your Property"}`,
        fr: `Offre Reçue pour ${property?.reference || "Votre Bien"}`,
        de: `Angebot erhalten für ${property?.reference || "Ihre Immobilie"}`,
    };
    const bodies = {
        en: `I am pleased to inform you that we have received an offer for your property.\n\n` +
            `${customMessage || "[Offer details]"}\n\n` +
            `I would like to discuss this offer with you at your earliest convenience.`,
        fr: `J'ai le plaisir de vous informer que nous avons reçu une offre pour votre bien.\n\n` +
            `${customMessage || "[Détails de l'offre]"}\n\n` +
            `Je souhaiterais discuter de cette offre avec vous dès que possible.`,
        de: `Ich freue mich, Ihnen mitteilen zu können, dass wir ein Angebot für Ihre Immobilie erhalten haben.\n\n` +
            `${customMessage || "[Angebotsdetails]"}\n\n` +
            `Ich würde dieses Angebot gerne bei nächster Gelegenheit mit Ihnen besprechen.`,
    };
    return {
        subject: subjects[language || "en"],
        body: `${greeting}\n\n${bodies[language || "en"]}\n\n${closing}`,
    };
}
function generateContractReadyEmail(options, greeting, closing) {
    const { property, language } = options;
    const subjects = {
        en: `Contract Ready for Signature - ${property?.reference || "Property"}`,
        fr: `Contrat Prêt à Signer - ${property?.reference || "Bien"}`,
        de: `Vertrag zur Unterzeichnung bereit - ${property?.reference || "Immobilie"}`,
    };
    const bodies = {
        en: `I am pleased to inform you that the contract for ${property?.reference || "the property"} is now ready for signature.\n\n` +
            `Please review the attached documents and let me know a convenient time to proceed with the signing.`,
        fr: `J'ai le plaisir de vous informer que le contrat pour ${property?.reference || "le bien"} est maintenant prêt à être signé.\n\n` +
            `Veuillez examiner les documents ci-joints et me faire savoir quand vous seriez disponible pour la signature.`,
        de: `Ich freue mich, Ihnen mitteilen zu können, dass der Vertrag für ${property?.reference || "die Immobilie"} nun zur Unterzeichnung bereit ist.\n\n` +
            `Bitte prüfen Sie die beigefügten Unterlagen und teilen Sie mir einen passenden Termin für die Unterschrift mit.`,
    };
    return {
        subject: subjects[language || "en"],
        body: `${greeting}\n\n${bodies[language || "en"]}\n\n${closing}`,
    };
}
function generateGeneralEmail(options, greeting, closing) {
    const { customSubject, customMessage } = options;
    return {
        subject: customSubject || "Regarding Your Real Estate Inquiry",
        body: `${greeting}\n\n${customMessage || "[Your message here]"}\n\n${closing}`,
    };
}
//# sourceMappingURL=draft-email.js.map