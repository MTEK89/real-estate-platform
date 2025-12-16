/**
 * Constants for the Real Estate Agent MCP Server
 */
export declare const CHARACTER_LIMIT = 25000;
export declare const DEFAULT_LIST_LIMIT = 50;
export declare const MAX_LIST_LIMIT = 200;
export declare const FAL_MODEL_ID: string;
export declare const FAL_MODEL_SUBPATH: string;
export declare const FAL_MODEL: string;
export declare const VIRTUAL_STAGING_STYLES: readonly ["scandinavian", "modern", "contemporary", "minimalist", "industrial", "classic", "luxury", "boho", "mid_century", "coastal", "japandi"];
export type VirtualStagingStyle = (typeof VIRTUAL_STAGING_STYLES)[number];
export declare const HEADSHOT_STYLES: readonly ["studio_grey", "studio_light", "modern_office", "outdoor_soft", "bw_dramatic"];
export type HeadshotStyleId = (typeof HEADSHOT_STYLES)[number];
export declare const HEADSHOT_OUTFITS: readonly ["agent_suit", "smart_casual", "neutral_tshirt", "custom"];
export type HeadshotOutfitId = (typeof HEADSHOT_OUTFITS)[number];
export declare const CONTACT_TYPES: readonly ["lead", "buyer", "seller", "investor"];
export type ContactType = (typeof CONTACT_TYPES)[number];
export declare const CONTACT_STATUSES: readonly ["new", "contacted", "qualified", "nurturing", "closed"];
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export declare const PROPERTY_TYPES: readonly ["house", "apartment", "office", "retail", "land"];
export type PropertyType = (typeof PROPERTY_TYPES)[number];
export declare const PROPERTY_STATUSES: readonly ["draft", "published", "under_offer", "sold", "rented", "archived"];
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];
export declare const TASK_PRIORITIES: readonly ["low", "medium", "high", "urgent"];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export declare const TASK_STATUSES: readonly ["todo", "in_progress", "completed", "cancelled"];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export declare const VISIT_STATUSES: readonly ["scheduled", "confirmed", "completed", "cancelled"];
export type VisitStatus = (typeof VISIT_STATUSES)[number];
export declare const CONTRACT_TYPES: readonly ["mandate", "sale_existing", "sale_vefa", "rental", "offer", "reservation"];
export type ContractType = (typeof CONTRACT_TYPES)[number];
export declare const CONTRACT_STATUSES: readonly ["draft", "pending_signature", "signed", "declined", "expired"];
export type ContractStatus = (typeof CONTRACT_STATUSES)[number];
export declare const PHOTO_EDIT_MODES: readonly ["declutter_remove_furniture", "remove_personal_items", "day_to_twilight", "sky_replacement", "virtual_staging", "replace_furniture_style", "virtual_renovation", "brighten_and_correct", "straighten_perspective", "remove_cars_people", "enhance_landscaping", "remove_power_lines", "pool_cleanup", "change_camera_angle", "plan_2d_to_3d_furnished"];
export type PhotoEditMode = (typeof PHOTO_EDIT_MODES)[number];
export declare const CAMERA_ANGLES: readonly ["top_down", "high_corner", "eye_level_straight", "low_angle", "three_quarter_left", "three_quarter_right"];
export type CameraAngle = (typeof CAMERA_ANGLES)[number];
export declare const MARKETING_DOC_TYPES: readonly ["notice_descriptive", "customer_pdf", "price_list", "brochure", "window_display", "cma", "open_house", "property_brochure", "property_postcard", "listing_presentation", "property_feature_sheet", "social_media_post"];
export type MarketingDocType = (typeof MARKETING_DOC_TYPES)[number];
export declare const OPERATIONAL_DOC_TYPES: readonly ["etat_des_lieux", "remise_des_cles", "photo_session", "surface_calculation", "evaluation"];
export type OperationalDocType = (typeof OPERATIONAL_DOC_TYPES)[number];
//# sourceMappingURL=constants.d.ts.map