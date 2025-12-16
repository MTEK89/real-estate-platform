/**
 * Common Zod schemas shared across tools
 */
import { z } from "zod";
export declare const ResponseFormatSchema: z.ZodDefault<z.ZodEnum<["markdown", "json"]>>;
export declare const PaginationSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
}, {
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const AgencyIdSchema: z.ZodDefault<z.ZodString>;
export declare const ContactTypeSchema: z.ZodEnum<["lead", "buyer", "seller", "investor"]>;
export declare const ContactStatusSchema: z.ZodEnum<["new", "contacted", "qualified", "nurturing", "closed"]>;
export declare const PropertyTypeSchema: z.ZodEnum<["house", "apartment", "office", "retail", "land"]>;
export declare const PropertyStatusSchema: z.ZodEnum<["draft", "published", "under_offer", "sold", "rented", "archived"]>;
export declare const TaskPrioritySchema: z.ZodEnum<["low", "medium", "high", "urgent"]>;
export declare const TaskStatusSchema: z.ZodEnum<["todo", "in_progress", "completed", "cancelled"]>;
export declare const VisitStatusSchema: z.ZodEnum<["scheduled", "confirmed", "completed", "cancelled"]>;
export declare const ContractTypeSchema: z.ZodEnum<["mandate", "sale_existing", "sale_vefa", "rental", "offer", "reservation"]>;
export declare const ContractStatusSchema: z.ZodEnum<["draft", "pending_signature", "signed", "declined", "expired"]>;
export declare const VirtualStagingStyleSchema: z.ZodEnum<["scandinavian", "modern", "contemporary", "minimalist", "industrial", "classic", "luxury", "boho", "mid_century", "coastal", "japandi"]>;
export declare const HeadshotStyleSchema: z.ZodEnum<["studio_grey", "studio_light", "modern_office", "outdoor_soft", "bw_dramatic"]>;
export declare const HeadshotOutfitSchema: z.ZodEnum<["agent_suit", "smart_casual", "neutral_tshirt", "custom"]>;
export declare const CameraAngleSchema: z.ZodEnum<["top_down", "high_corner", "eye_level_straight", "low_angle", "three_quarter_left", "three_quarter_right"]>;
export declare const AddressSchema: z.ZodObject<{
    street: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    postal_code: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    street?: string | undefined;
    city?: string | undefined;
    postal_code?: string | undefined;
    country?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
}, {
    street?: string | undefined;
    city?: string | undefined;
    postal_code?: string | undefined;
    country?: string | undefined;
    latitude?: number | undefined;
    longitude?: number | undefined;
}>;
export declare const CharacteristicsSchema: z.ZodObject<{
    surface: z.ZodOptional<z.ZodNumber>;
    rooms: z.ZodOptional<z.ZodNumber>;
    bedrooms: z.ZodOptional<z.ZodNumber>;
    bathrooms: z.ZodOptional<z.ZodNumber>;
    year_built: z.ZodOptional<z.ZodNumber>;
    condition: z.ZodOptional<z.ZodString>;
    floor: z.ZodOptional<z.ZodNumber>;
    total_floors: z.ZodOptional<z.ZodNumber>;
    parking: z.ZodOptional<z.ZodNumber>;
    garage: z.ZodOptional<z.ZodBoolean>;
    garden: z.ZodOptional<z.ZodBoolean>;
    terrace: z.ZodOptional<z.ZodBoolean>;
    balcony: z.ZodOptional<z.ZodBoolean>;
    elevator: z.ZodOptional<z.ZodBoolean>;
    heating: z.ZodOptional<z.ZodString>;
    energy_class: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    surface?: number | undefined;
    rooms?: number | undefined;
    bedrooms?: number | undefined;
    bathrooms?: number | undefined;
    year_built?: number | undefined;
    condition?: string | undefined;
    floor?: number | undefined;
    total_floors?: number | undefined;
    parking?: number | undefined;
    garage?: boolean | undefined;
    garden?: boolean | undefined;
    terrace?: boolean | undefined;
    balcony?: boolean | undefined;
    elevator?: boolean | undefined;
    heating?: string | undefined;
    energy_class?: string | undefined;
}, {
    surface?: number | undefined;
    rooms?: number | undefined;
    bedrooms?: number | undefined;
    bathrooms?: number | undefined;
    year_built?: number | undefined;
    condition?: string | undefined;
    floor?: number | undefined;
    total_floors?: number | undefined;
    parking?: number | undefined;
    garage?: boolean | undefined;
    garden?: boolean | undefined;
    terrace?: boolean | undefined;
    balcony?: boolean | undefined;
    elevator?: boolean | undefined;
    heating?: string | undefined;
    energy_class?: string | undefined;
}>;
export declare const TaskRelationSchema: z.ZodObject<{
    type: z.ZodEnum<["contact", "property", "deal", "visit", "contract"]>;
    id: z.ZodString;
}, "strict", z.ZodTypeAny, {
    type: "contact" | "property" | "deal" | "visit" | "contract";
    id: string;
}, {
    type: "contact" | "property" | "deal" | "visit" | "contract";
    id: string;
}>;
export declare const VisitFeedbackSchema: z.ZodObject<{
    interest_level: z.ZodNumber;
    comments: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    interest_level: number;
    comments?: string | undefined;
}, {
    interest_level: number;
    comments?: string | undefined;
}>;
export declare const ContractTermsSchema: z.ZodObject<{
    commission_rate: z.ZodOptional<z.ZodNumber>;
    duration_months: z.ZodOptional<z.ZodNumber>;
    exclusivity: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    commission_rate?: number | undefined;
    duration_months?: number | undefined;
    exclusivity?: boolean | undefined;
}, {
    commission_rate?: number | undefined;
    duration_months?: number | undefined;
    exclusivity?: boolean | undefined;
}>;
export declare const ImageUrlSchema: z.ZodString;
export declare const EmailToneSchema: z.ZodDefault<z.ZodEnum<["professional", "friendly", "formal"]>>;
export declare const DetailLevelSchema: z.ZodDefault<z.ZodEnum<["concise", "detailed"]>>;
//# sourceMappingURL=common.d.ts.map