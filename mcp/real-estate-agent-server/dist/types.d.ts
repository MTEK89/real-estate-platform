/**
 * TypeScript interfaces for the Real Estate Agent MCP Server
 */
import type { ContactType, ContactStatus, PropertyType, PropertyStatus, TaskPriority, TaskStatus, VisitStatus, ContractType, ContractStatus, VirtualStagingStyle, HeadshotStyleId, HeadshotOutfitId, CameraAngle } from "./constants.js";
export interface Contact {
    id: string;
    agency_id: string;
    type: ContactType;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    source: string;
    status: ContactStatus;
    assigned_to: string | null;
    tags: string[];
    notes: string;
    last_contact_at: string | null;
    created_at: string;
    updated_at: string;
}
export interface Property {
    id: string;
    agency_id: string;
    reference: string;
    status: PropertyStatus;
    type: PropertyType;
    address: PropertyAddress;
    characteristics: PropertyCharacteristics;
    price: number;
    owner_id: string;
    tags: string[];
    images: string[];
    created_at: string;
    updated_at: string;
}
export interface PropertyAddress {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
}
export interface PropertyCharacteristics {
    surface?: number;
    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;
    year_built?: number;
    condition?: string;
    floor?: number;
    total_floors?: number;
    parking?: number;
    garage?: boolean;
    garden?: boolean;
    terrace?: boolean;
    balcony?: boolean;
    elevator?: boolean;
    heating?: string;
    energy_class?: string;
}
export interface Task {
    id: string;
    agency_id: string;
    title: string;
    description: string;
    assigned_to: string;
    related_to: TaskRelation | null;
    priority: TaskPriority;
    status: TaskStatus;
    due_date: string;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}
export interface TaskRelation {
    type: "contact" | "property" | "deal" | "visit" | "contract";
    id: string;
}
export interface Visit {
    id: string;
    agency_id: string;
    property_id: string;
    contact_id: string;
    agent_id: string;
    date: string;
    start_time: string;
    end_time: string;
    status: VisitStatus;
    confirmation_status: "pending" | "confirmed" | "declined";
    notes: string;
    feedback: VisitFeedback | null;
    created_at: string;
    updated_at: string;
}
export interface VisitFeedback {
    interest_level: number;
    comments: string;
}
export interface Contract {
    id: string;
    agency_id: string;
    property_id: string;
    contact_id: string;
    deal_id: string | null;
    type: ContractType;
    property_category: PropertyType;
    status: ContractStatus;
    signature_method: "electronic" | "scanned" | "manual";
    auto_filled: boolean;
    signed_at: string | null;
    expires_at: string | null;
    data: Record<string, unknown>;
    file_url: string | null;
    generated_at: string | null;
    created_at: string;
    updated_at: string;
}
export interface Inspection {
    id: string;
    agency_id: string;
    type: "entry" | "exit";
    status: "draft" | "scheduled" | "in_progress" | "completed" | "signed";
    property_id: string;
    landlord_id: string;
    tenant_id: string;
    scheduled_date: string | null;
    started_at: string | null;
    completed_at: string | null;
    payload: InspectionPayload;
    created_at: string;
    updated_at: string;
}
export interface InspectionPayload {
    rooms: InspectionRoom[];
    general_notes?: string;
    meter_readings?: MeterReadings;
}
export interface InspectionRoom {
    name: string;
    condition: string;
    notes: string;
    photos: InspectionPhoto[];
}
export interface InspectionPhoto {
    url: string;
    caption?: string;
    taken_at?: string;
}
export interface MeterReadings {
    electricity?: number;
    gas?: number;
    water?: number;
}
export interface GalleryPhoto {
    id: string;
    agency_id: string;
    property_id: string | null;
    filename: string;
    path: string;
    content_type: string;
    size: number;
    width: number | null;
    height: number | null;
    taken_at: string | null;
    tags: string[];
    note: string | null;
    favorite: boolean;
    created_by: string;
    created_at: string;
}
export interface Agency {
    id: string;
    name: string;
    logo_url: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    vat_number: string | null;
    rcs_number: string | null;
    iban: string | null;
    bic: string | null;
}
export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: "agent" | "manager" | "admin" | "owner";
    avatar: string | null;
}
export interface AIPhotoRequest {
    prompt: string;
    image_urls: string[];
    num_images?: number;
    output_format?: "png" | "jpeg" | "webp";
}
export interface AIPhotoResult {
    request_id: string;
    status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";
    images?: AIPhotoImage[];
    queue_position?: number;
    error?: string;
}
export interface AIPhotoImage {
    url: string;
    content_type?: string;
    file_name?: string;
    file_size?: number;
    width?: number;
    height?: number;
}
export interface HeadshotRequest {
    selfie_url: string;
    style: HeadshotStyleId;
    outfit: HeadshotOutfitId;
    custom_outfit?: string;
    mode: "full_headshot" | "clothes_only";
    include_pose_reference?: boolean;
    pose_reference_url?: string;
}
export interface VirtualStagingRequest {
    image_url: string;
    style: VirtualStagingStyle;
    room_type?: string;
    occupancy?: "empty" | "partly_furnished";
}
export interface PhotoEditRequest {
    image_url: string;
    renovation_request?: string;
    target_angle?: CameraAngle;
    style?: VirtualStagingStyle;
    room_type?: string;
}
export type ResponseFormat = "markdown" | "json";
export interface PaginatedResponse<T> {
    total: number;
    count: number;
    offset: number;
    items: T[];
    has_more: boolean;
    next_offset?: number;
}
export interface DashboardData {
    date: string;
    visits: DashboardVisit[];
    urgent_tasks: DashboardTask[];
    overdue_tasks: DashboardTask[];
    pipeline_summary: PipelineSummary;
    recent_contacts: Contact[];
}
export interface DashboardVisit {
    id: string;
    time: string;
    property_reference: string;
    property_address: string;
    contact_name: string;
    status: VisitStatus;
    confirmation_status: string;
}
export interface DashboardTask {
    id: string;
    title: string;
    due_date: string;
    priority: TaskPriority;
    related_to?: {
        type: string;
        name: string;
    };
    is_overdue: boolean;
}
export interface PipelineSummary {
    new_leads: number;
    contacted: number;
    qualified: number;
    nurturing: number;
    closed: number;
}
export interface LeadScore {
    contact_id: string;
    contact_name: string;
    overall_grade: "A" | "B" | "C" | "D" | "F";
    overall_score: number;
    breakdown: {
        engagement: number;
        budget_match: number;
        response_rate: number;
        activity_level: number;
        recency: number;
    };
    recommendations: string[];
}
export interface FollowUpSuggestion {
    contact_id: string;
    contact_name: string;
    priority: "high" | "medium" | "low";
    reason: string;
    suggested_action: string;
    template?: string;
    days_since_contact: number;
}
export interface CreateListingInput {
    description: string;
    owner_name?: string;
    owner_email?: string;
    owner_phone?: string;
    images?: string[];
    auto_publish?: boolean;
}
export interface CreateListingResult {
    property_id: string;
    property_reference: string;
    owner_contact_id: string;
    owner_name: string;
    status: PropertyStatus;
    parsed_data: {
        address?: PropertyAddress;
        type?: PropertyType;
        price?: number;
        characteristics?: Partial<PropertyCharacteristics>;
    };
    next_steps: string[];
}
export interface PrepareContractInput {
    property_reference?: string;
    property_id?: string;
    contact_name?: string;
    contact_id?: string;
    contract_type: ContractType;
    terms?: {
        commission_rate?: number;
        duration_months?: number;
        exclusivity?: boolean;
    };
    generate_pdf?: boolean;
}
export interface PrepareContractResult {
    contract_id: string;
    contract_type: ContractType;
    property_reference: string;
    contact_name: string;
    status: ContractStatus;
    pdf_url?: string;
    follow_up_task_id?: string;
    next_steps: string[];
}
export interface ScheduleVisitInput {
    property_reference?: string;
    property_id?: string;
    contact_name?: string;
    contact_id?: string;
    date: string;
    time?: string;
    duration_minutes?: number;
    notes?: string;
    send_confirmation?: boolean;
}
export interface ScheduleVisitResult {
    visit_id: string;
    property_reference: string;
    contact_name: string;
    date: string;
    time: string;
    status: VisitStatus;
    confirmation_sent: boolean;
    conflicts?: string[];
}
export interface DraftEmailInput {
    contact_name?: string;
    contact_id?: string;
    property_reference?: string;
    context: string;
    tone?: "professional" | "friendly" | "formal";
    include_property_details?: boolean;
    original_email?: string;
}
export interface DraftEmailResult {
    draft: string;
    contact_name: string;
    subject_suggestion?: string;
}
//# sourceMappingURL=types.d.ts.map