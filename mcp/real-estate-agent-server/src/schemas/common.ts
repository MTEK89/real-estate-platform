/**
 * Common Zod schemas shared across tools
 */

import { z } from "zod";
import {
  CONTACT_TYPES,
  CONTACT_STATUSES,
  PROPERTY_TYPES,
  PROPERTY_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  VISIT_STATUSES,
  CONTRACT_TYPES,
  CONTRACT_STATUSES,
  VIRTUAL_STAGING_STYLES,
  HEADSHOT_STYLES,
  HEADSHOT_OUTFITS,
  CAMERA_ANGLES,
} from "../constants.js";

// Response format enum
export const ResponseFormatSchema = z.enum(["markdown", "json"]).default("markdown")
  .describe("Output format: 'markdown' for human-readable or 'json' for machine-readable");

// Pagination schemas
export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(200).default(50)
    .describe("Maximum number of results to return"),
  offset: z.number().int().min(0).default(0)
    .describe("Number of results to skip for pagination"),
});

// Agency ID schema (defaults to env or "a1")
export const AgencyIdSchema = z.string().min(1).default("a1")
  .describe("Agency ID (defaults to configured agency)");

// Entity type enums
export const ContactTypeSchema = z.enum(CONTACT_TYPES);
export const ContactStatusSchema = z.enum(CONTACT_STATUSES);
export const PropertyTypeSchema = z.enum(PROPERTY_TYPES);
export const PropertyStatusSchema = z.enum(PROPERTY_STATUSES);
export const TaskPrioritySchema = z.enum(TASK_PRIORITIES);
export const TaskStatusSchema = z.enum(TASK_STATUSES);
export const VisitStatusSchema = z.enum(VISIT_STATUSES);
export const ContractTypeSchema = z.enum(CONTRACT_TYPES);
export const ContractStatusSchema = z.enum(CONTRACT_STATUSES);

// AI Photo enums
export const VirtualStagingStyleSchema = z.enum(VIRTUAL_STAGING_STYLES);
export const HeadshotStyleSchema = z.enum(HEADSHOT_STYLES);
export const HeadshotOutfitSchema = z.enum(HEADSHOT_OUTFITS);
export const CameraAngleSchema = z.enum(CAMERA_ANGLES);

// Address schema
export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
}).strict();

// Property characteristics schema
export const CharacteristicsSchema = z.object({
  surface: z.number().positive().optional(),
  rooms: z.number().int().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  year_built: z.number().int().min(1800).max(2030).optional(),
  condition: z.string().optional(),
  floor: z.number().int().optional(),
  total_floors: z.number().int().positive().optional(),
  parking: z.number().int().min(0).optional(),
  garage: z.boolean().optional(),
  garden: z.boolean().optional(),
  terrace: z.boolean().optional(),
  balcony: z.boolean().optional(),
  elevator: z.boolean().optional(),
  heating: z.string().optional(),
  energy_class: z.string().optional(),
}).strict();

// Task relation schema
export const TaskRelationSchema = z.object({
  type: z.enum(["contact", "property", "deal", "visit", "contract"]),
  id: z.string().min(1),
}).strict();

// Visit feedback schema
export const VisitFeedbackSchema = z.object({
  interest_level: z.number().int().min(1).max(5),
  comments: z.string().optional(),
}).strict();

// Contract terms schema
export const ContractTermsSchema = z.object({
  commission_rate: z.number().min(0).max(100).optional(),
  duration_months: z.number().int().positive().optional(),
  exclusivity: z.boolean().optional(),
}).strict();

// Image URL validation
export const ImageUrlSchema = z.string().url()
  .describe("URL of the image (http/https)");

// Email tone schema
export const EmailToneSchema = z.enum(["professional", "friendly", "formal"]).default("professional")
  .describe("Tone of the email");

// Detail level schema
export const DetailLevelSchema = z.enum(["concise", "detailed"]).default("concise")
  .describe("Level of detail in the response");
