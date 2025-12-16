/**
 * Constants for the Real Estate Agent MCP Server
 */
// Response limits
export const CHARACTER_LIMIT = 25000;
export const DEFAULT_LIST_LIMIT = 50;
export const MAX_LIST_LIMIT = 200;
// FAL AI Configuration
export const FAL_MODEL_ID = process.env.FAL_NANO_BANANA_MODEL_ID || "fal-ai/gemini-25-flash-image";
export const FAL_MODEL_SUBPATH = process.env.FAL_NANO_BANANA_SUBPATH || "edit";
export const FAL_MODEL = `${FAL_MODEL_ID}/${FAL_MODEL_SUBPATH}`;
// Virtual Staging Styles
export const VIRTUAL_STAGING_STYLES = [
    "scandinavian",
    "modern",
    "contemporary",
    "minimalist",
    "industrial",
    "classic",
    "luxury",
    "boho",
    "mid_century",
    "coastal",
    "japandi",
];
// Headshot Styles
export const HEADSHOT_STYLES = [
    "studio_grey",
    "studio_light",
    "modern_office",
    "outdoor_soft",
    "bw_dramatic",
];
// Headshot Outfits
export const HEADSHOT_OUTFITS = [
    "agent_suit",
    "smart_casual",
    "neutral_tshirt",
    "custom",
];
// Entity Types
export const CONTACT_TYPES = ["lead", "buyer", "seller", "investor"];
export const CONTACT_STATUSES = ["new", "contacted", "qualified", "nurturing", "closed"];
export const PROPERTY_TYPES = ["house", "apartment", "office", "retail", "land"];
export const PROPERTY_STATUSES = ["draft", "published", "under_offer", "sold", "rented", "archived"];
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"];
export const TASK_STATUSES = ["todo", "in_progress", "completed", "cancelled"];
export const VISIT_STATUSES = ["scheduled", "confirmed", "completed", "cancelled"];
export const CONTRACT_TYPES = ["mandate", "sale_existing", "sale_vefa", "rental", "offer", "reservation"];
export const CONTRACT_STATUSES = ["draft", "pending_signature", "signed", "declined", "expired"];
// Photo Edit Modes
export const PHOTO_EDIT_MODES = [
    "declutter_remove_furniture",
    "remove_personal_items",
    "day_to_twilight",
    "sky_replacement",
    "virtual_staging",
    "replace_furniture_style",
    "virtual_renovation",
    "brighten_and_correct",
    "straighten_perspective",
    "remove_cars_people",
    "enhance_landscaping",
    "remove_power_lines",
    "pool_cleanup",
    "change_camera_angle",
    "plan_2d_to_3d_furnished",
];
// Camera Angles for photo angle change
export const CAMERA_ANGLES = [
    "top_down",
    "high_corner",
    "eye_level_straight",
    "low_angle",
    "three_quarter_left",
    "three_quarter_right",
];
// Marketing Document Types
export const MARKETING_DOC_TYPES = [
    "notice_descriptive",
    "customer_pdf",
    "price_list",
    "brochure",
    "window_display",
    "cma",
    "open_house",
    "property_brochure",
    "property_postcard",
    "listing_presentation",
    "property_feature_sheet",
    "social_media_post",
];
// Operational Document Types
export const OPERATIONAL_DOC_TYPES = [
    "etat_des_lieux",
    "remise_des_cles",
    "photo_session",
    "surface_calculation",
    "evaluation",
];
//# sourceMappingURL=constants.js.map