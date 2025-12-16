# Real Estate Agent MCP Server - Complete Implementation Plan

## Vision

Real estate agents are busy. They should be able to say:
- "Here are the photos, create a listing"
- "Create a contract for this contact"
- "Stage this empty living room in Scandinavian style"
- "Generate a twilight version of this exterior photo"
- "Draft a follow-up email to Pierre about the apartment"
- "Create a professional headshot from my selfie"

The AI agent orchestrates complex workflows through natural conversation, using MCP tools to handle the heavy lifting.

---

## Complete Feature Coverage

Based on platform analysis, the MCP server must support ALL these capabilities:

### Core CRM
- **Contacts**: leads, buyers, sellers, investors with full lifecycle
- **Properties**: listings with address, characteristics, pricing, images
- **Tasks**: task management with priorities, assignments, due dates
- **Visits**: property viewings with scheduling, confirmations, feedback
- **Team**: invitations, roles, member management

### Documents & Contracts
- **Contracts**: mandate, sale_existing, sale_vefa, rental, offer, reservation
- **Inspections**: État des lieux with room-by-room photos and notes
- **Operational Documents**: état des lieux, remise des clés, photo session, surface calculation, evaluation
- **Marketing Documents**: brochures, CMA, window displays, social posts, listing presentations, property feature sheets
- **Invoices**: commission invoices with PDF generation

### AI Photo Features (FAL/Nano Banana)
- **Professional Headshots**: Generate agent headshots from selfies
- **Virtual Staging**: Stage empty rooms in 11 different styles
- **Declutter/Remove Furniture**: Remove all furniture from photos
- **Remove Personal Items**: Clean up clutter for listings
- **Day to Twilight**: Convert daylight exterior to premium twilight
- **Sky Replacement**: Replace overcast sky with blue sky
- **Furniture Restyle**: Change furniture style without moving pieces
- **Virtual Renovation**: Update finishes/materials virtually
- **Brighten & Correct**: Professional exposure/color correction
- **Straighten Perspective**: Fix tilted verticals
- **Remove Cars/People**: Clean up exterior shots
- **Enhance Landscaping**: Greener grass, healthier plants
- **Remove Power Lines**: Clean up overhead cables
- **Pool Cleanup**: Clear/clean pool water
- **Change Camera Angle**: Generate alternate viewpoints
- **2D Floor Plan to 3D**: Convert flat plans to furnished 3D renders

### AI Writing
- **Draft Email**: Generate professional emails with context
- **Follow-up Suggestions**: AI-powered follow-up recommendations

### Analytics & Intelligence
- **Lead Scoring**: A-F scoring with breakdown
- **Follow-up Engine**: Automated follow-up suggestions
- **Pipeline Summary**: Deal funnel visualization

### Gallery & Media
- **Photo Gallery**: Upload, tag, favorite, organize
- **Watermarking**: Brand watermarks on images

### System
- **Audit Logs**: Full audit trail
- **Agency Settings**: Branding, configuration

---

## Tool Architecture

### 1. HIGH-LEVEL WORKFLOW TOOLS (The Magic)

These combine multiple steps into natural agent workflows:

| Tool | Natural Language Trigger | Workflow |
|------|-------------------------|----------|
| `re_create_listing` | "Create a listing for..." | Parse description → Find/create owner → Create property → Return next steps |
| `re_prepare_contract` | "Create a contract for..." | Find property + contact → Generate contract → Create follow-up task |
| `re_schedule_visit` | "Schedule a visit with..." | Find property + contact → Parse date → Check conflicts → Create visit |
| `re_draft_email` | "Write an email to..." | Get contact context → Generate email with AI |
| `re_get_follow_up_suggestions` | "What should I follow up on?" | Analyze pipeline → Return prioritized actions |
| `re_match_buyer_to_properties` | "Find properties for this buyer" | Get criteria → Search properties → Score matches |
| `re_get_dashboard` | "What's my schedule today?" | Aggregate visits, tasks, deals → Return summary |

### 2. AI PHOTO TOOLS (Power Features)

| Tool | Natural Language Trigger | AI Model |
|------|-------------------------|----------|
| `re_generate_headshot` | "Create a professional headshot from this selfie" | FAL Gemini |
| `re_virtual_stage` | "Stage this empty room in modern style" | FAL Gemini |
| `re_declutter_room` | "Remove all furniture from this photo" | FAL Gemini |
| `re_remove_personal_items` | "Clean up the clutter in this photo" | FAL Gemini |
| `re_day_to_twilight` | "Make this a twilight photo" | FAL Gemini |
| `re_replace_sky` | "Replace the sky with blue sky" | FAL Gemini |
| `re_restyle_furniture` | "Change to Scandinavian style" | FAL Gemini |
| `re_virtual_renovate` | "Update the kitchen with white cabinets" | FAL Gemini |
| `re_brighten_photo` | "Fix the exposure on this photo" | FAL Gemini |
| `re_straighten_photo` | "Straighten the verticals" | FAL Gemini |
| `re_remove_cars_people` | "Remove cars from this exterior" | FAL Gemini |
| `re_enhance_landscaping` | "Make the grass greener" | FAL Gemini |
| `re_remove_power_lines` | "Remove the power lines" | FAL Gemini |
| `re_clean_pool` | "Clean up the pool water" | FAL Gemini |
| `re_change_angle` | "Show this room from a different angle" | FAL Gemini |
| `re_floorplan_to_3d` | "Create a 3D render from this floor plan" | FAL Gemini |

### 3. DOCUMENT GENERATION TOOLS

| Tool | Purpose | Output |
|------|---------|--------|
| `re_generate_contract_pdf` | Create contract document | PDF (mandate, sale, rental, etc.) |
| `re_generate_listing_brochure` | Property marketing brochure | PDF with photos + details |
| `re_generate_invoice` | Commission/fee invoice | PDF invoice |
| `re_generate_inspection_report` | État des lieux report | PDF with photos |
| `re_generate_marketing_doc` | Various marketing materials | PDF (CMA, feature sheet, etc.) |

### 4. ENTITY MANAGEMENT TOOLS (Smart CRUD)

| Tool | Description | Intelligence |
|------|-------------|--------------|
| `re_find_contact` | Search contacts | Fuzzy name matching, multi-field search |
| `re_upsert_contact` | Create or update contact | Duplicate detection, merge capability |
| `re_find_property` | Search properties | Address matching, reference lookup, criteria search |
| `re_upsert_property` | Create or update property | Reference deduplication, owner linking |
| `re_list_visits` | Get visits | Date range, status, property, contact filters |
| `re_upsert_visit` | Create/update visit | Conflict checking, confirmation tracking |
| `re_list_tasks` | Get tasks | Priority sorting, overdue highlighting |
| `re_upsert_task` | Create/update task | Entity linking (contact, property, visit) |
| `re_list_contracts` | Get contracts | Status, type, property, contact filters |
| `re_upsert_contract` | Create/update contract | Auto-fill from property/contact |
| `re_list_inspections` | Get inspections | Property, tenant, status filters |
| `re_upsert_inspection` | Create/update inspection | Photo attachment support |
| `re_upload_inspection_photo` | Add photo to inspection | Room/area categorization |

### 5. GALLERY & MEDIA TOOLS

| Tool | Description |
|------|-------------|
| `re_upload_photo` | Upload photo to gallery |
| `re_list_photos` | List gallery photos with filters |
| `re_tag_photo` | Add tags to photo |
| `re_favorite_photo` | Mark photo as favorite |
| `re_link_photo_to_property` | Associate photo with property |

### 6. ANALYTICS TOOLS

| Tool | Description | Output |
|------|-------------|--------|
| `re_get_lead_score` | Calculate lead quality | Score breakdown with recommendations |
| `re_get_pipeline_summary` | Deal pipeline overview | Funnel data with counts |
| `re_get_activity_stats` | Agent activity metrics | Visits, contacts, deals metrics |

### 7. TEAM TOOLS

| Tool | Description |
|------|-------------|
| `re_list_team_members` | List agency team |
| `re_invite_team_member` | Send invitation |
| `re_update_member_role` | Change member role |

---

## Detailed Tool Specifications

### Core Workflow Tools

#### `re_create_listing`

**Purpose**: "Create a listing for a 3-bedroom apartment at 15 Rue du Commerce, €650,000, owner Pierre Lambert"

```typescript
{
  // Natural language input
  description: string;           // Full natural description

  // Optional structured hints
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  images?: string[];             // URLs or base64
  auto_publish?: boolean;
}
```

**Workflow**:
1. Parse description → extract address, type, price, rooms, etc.
2. Search for owner contact (fuzzy match)
3. If not found → create contact with type="seller"
4. Create property record
5. Upload images if provided
6. Return summary + next steps

---

#### `re_prepare_contract`

**Purpose**: "Create a mandate contract for Pierre's apartment on Rue du Commerce"

```typescript
{
  property_reference?: string;   // Property ref or search
  property_id?: string;
  contact_name?: string;         // Contact search
  contact_id?: string;
  contract_type: "mandate" | "sale_existing" | "sale_vefa" | "rental" | "offer" | "reservation";
  terms?: {
    commission_rate?: number;
    duration_months?: number;
    exclusivity?: boolean;
  };
  generate_pdf?: boolean;
}
```

---

#### `re_schedule_visit`

**Purpose**: "Schedule a visit with Marie for the Rue du Commerce apartment, tomorrow at 2pm"

```typescript
{
  property_reference?: string;
  property_id?: string;
  contact_name?: string;
  contact_id?: string;
  date: string;                  // ISO or natural language "tomorrow"
  time?: string;                 // Natural language "2pm"
  duration_minutes?: number;
  notes?: string;
  send_confirmation?: boolean;
}
```

---

#### `re_draft_email`

**Purpose**: "Write a follow-up email to Pierre about his apartment viewing"

```typescript
{
  contact_name?: string;
  contact_id?: string;
  property_reference?: string;
  context: string;               // What the email is about
  tone?: "professional" | "friendly" | "formal";
  include_property_details?: boolean;
  original_email?: string;       // For replies
}
```

---

#### `re_get_dashboard`

**Purpose**: "What's my schedule today?"

```typescript
{
  date?: string;                 // Default: today
  include_overdue?: boolean;
  detail_level?: "concise" | "detailed";
}
```

**Output**:
```markdown
# Dashboard - Monday, December 16, 2024

## Today's Visits (3)
| Time | Property | Client | Status |
|------|----------|--------|--------|
| 10:00 | LUX-2024-0042 Rue du Commerce | Marie Dubois | Confirmed |
| 14:30 | LUX-2024-0038 Av. de la Liberté | Jean Martin | Pending |

## Urgent Tasks (2)
- ⚠️ **OVERDUE**: Follow up with Pierre Lambert
- 🔴 Get mandate signature - Marie Dubois (due today)

## Pipeline Summary
- 🔵 New Leads: 5
- 🟡 In Negotiation: 3
- 🟢 Under Offer: 2
```

---

### AI Photo Tools

#### `re_virtual_stage`

**Purpose**: "Stage this empty living room in modern Scandinavian style"

```typescript
{
  image_url: string;             // Source image URL
  style: "scandinavian" | "modern" | "contemporary" | "minimalist" |
         "industrial" | "classic" | "luxury" | "boho" |
         "mid_century" | "coastal" | "japandi";
  room_type?: string;            // "living room", "bedroom", etc.
  occupancy?: "empty" | "partly_furnished";
}
```

---

#### `re_generate_headshot`

**Purpose**: "Create a professional headshot from my selfie"

```typescript
{
  selfie_url: string;            // Source selfie
  style: "studio_grey" | "studio_light" | "modern_office" | "outdoor_soft" | "bw_dramatic";
  outfit?: "agent_suit" | "smart_casual" | "neutral_tshirt" | "custom";
  custom_outfit?: string;        // If outfit="custom"
  mode?: "full_headshot" | "clothes_only";
}
```

---

#### `re_day_to_twilight`

**Purpose**: "Convert this exterior to a twilight photo"

```typescript
{
  image_url: string;
}
```

---

#### `re_declutter_room`

**Purpose**: "Remove all furniture from this room"

```typescript
{
  image_url: string;
}
```

---

#### `re_virtual_renovate`

**Purpose**: "Update this kitchen with white cabinets and marble counters"

```typescript
{
  image_url: string;
  renovation_request: string;    // Natural language description
}
```

---

## File Structure

```
mcp/
├── real-estate-agent-server/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                    # Main entry point
│   │   ├── constants.ts                # API URLs, limits, model IDs
│   │   ├── types.ts                    # TypeScript interfaces
│   │   │
│   │   ├── schemas/                    # Zod validation schemas
│   │   │   ├── common.ts               # Shared schemas
│   │   │   ├── contact.ts
│   │   │   ├── property.ts
│   │   │   ├── visit.ts
│   │   │   ├── contract.ts
│   │   │   ├── inspection.ts
│   │   │   ├── document.ts
│   │   │   ├── photo.ts
│   │   │   └── ai-photo.ts
│   │   │
│   │   ├── services/                   # Shared utilities
│   │   │   ├── supabase.ts             # Supabase client
│   │   │   ├── fal.ts                  # FAL AI client
│   │   │   ├── fuzzy-search.ts         # Name/address matching
│   │   │   ├── date-parser.ts          # Natural language dates
│   │   │   ├── description-parser.ts   # Parse property descriptions
│   │   │   └── formatters.ts           # Output formatting
│   │   │
│   │   ├── tools/                      # Tool implementations
│   │   │   ├── workflows/              # High-level workflow tools
│   │   │   │   ├── create-listing.ts
│   │   │   │   ├── prepare-contract.ts
│   │   │   │   ├── schedule-visit.ts
│   │   │   │   ├── draft-email.ts
│   │   │   │   ├── dashboard.ts
│   │   │   │   └── match-buyer.ts
│   │   │   │
│   │   │   ├── ai-photo/               # AI photo editing tools
│   │   │   │   ├── headshot.ts
│   │   │   │   ├── virtual-staging.ts
│   │   │   │   ├── declutter.ts
│   │   │   │   ├── twilight.ts
│   │   │   │   ├── sky-replacement.ts
│   │   │   │   ├── renovation.ts
│   │   │   │   └── enhancement.ts
│   │   │   │
│   │   │   ├── entities/               # CRUD tools
│   │   │   │   ├── contacts.ts
│   │   │   │   ├── properties.ts
│   │   │   │   ├── visits.ts
│   │   │   │   ├── tasks.ts
│   │   │   │   ├── contracts.ts
│   │   │   │   └── inspections.ts
│   │   │   │
│   │   │   ├── documents/              # Document generation
│   │   │   │   ├── contract-pdf.ts
│   │   │   │   ├── brochure.ts
│   │   │   │   ├── invoice.ts
│   │   │   │   └── inspection-report.ts
│   │   │   │
│   │   │   ├── gallery/                # Photo management
│   │   │   │   ├── upload.ts
│   │   │   │   ├── list.ts
│   │   │   │   └── manage.ts
│   │   │   │
│   │   │   ├── analytics/              # Analytics tools
│   │   │   │   ├── lead-score.ts
│   │   │   │   ├── pipeline.ts
│   │   │   │   └── follow-ups.ts
│   │   │   │
│   │   │   └── team/                   # Team management
│   │   │       ├── members.ts
│   │   │       └── invitations.ts
│   │   │
│   │   └── utils/
│   │       ├── errors.ts               # Error handling
│   │       ├── response.ts             # Response formatting
│   │       └── prompts.ts              # AI prompt templates
│   │
│   └── dist/                           # Built output
│
└── real-estate-agent.mcp.json          # MCP configuration
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Day 1)
- Project setup with TypeScript
- Supabase client with service role
- Error handling framework
- Response formatters (markdown + JSON)
- Date parser for natural language

### Phase 2: Entity Tools (Day 2)
- `re_find_contact` with fuzzy search
- `re_upsert_contact` with deduplication
- `re_find_property` with multi-criteria search
- `re_upsert_property`
- `re_list_visits`, `re_upsert_visit`
- `re_list_tasks`, `re_upsert_task`

### Phase 3: Workflow Tools (Day 3)
- `re_get_dashboard`
- `re_create_listing`
- `re_prepare_contract`
- `re_schedule_visit`
- `re_draft_email`

### Phase 4: AI Photo Tools (Day 4)
- FAL client integration
- `re_virtual_stage`
- `re_generate_headshot`
- `re_day_to_twilight`
- `re_declutter_room`
- `re_virtual_renovate`
- `re_brighten_photo`
- All other photo tools

### Phase 5: Documents & Advanced (Day 5)
- Contract tools
- Inspection tools
- Document generation tools
- Gallery tools
- Analytics tools
- Team tools

### Phase 6: Testing & Evaluation
- Create 10+ evaluation scenarios
- Test all tools end-to-end
- Documentation

---

## MCP Configuration

```json
{
  "mcpServers": {
    "real-estate-agent": {
      "command": "node",
      "args": ["mcp/real-estate-agent-server/dist/index.js"],
      "cwd": "/path/to/real-estate-platform-3",
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}",
        "FAL_KEY": "${FAL_KEY}",
        "OPENAI_API_KEY": "${OPENAI_API_KEY}"
      }
    }
  }
}
```

---

## Success Criteria

1. **Natural Language**: Agent can handle natural language inputs like "schedule a visit tomorrow at 2pm"
2. **Workflow Completion**: Single tool calls complete full workflows (create listing from description)
3. **AI Photo Magic**: All 16 photo editing modes work seamlessly
4. **Smart Search**: Fuzzy matching finds contacts/properties with partial info
5. **Document Generation**: PDFs generate correctly for all contract types
6. **Actionable Errors**: Errors guide users to fix issues
7. **Performance**: Most operations complete in < 2 seconds (AI photo < 30s)

---

## Tool Count Summary

| Category | Tool Count |
|----------|------------|
| Workflow Tools | 7 |
| AI Photo Tools | 16 |
| Entity Tools | 14 |
| Document Tools | 5 |
| Gallery Tools | 5 |
| Analytics Tools | 3 |
| Team Tools | 3 |
| **Total** | **53** |

This MCP server will be a comprehensive agent that handles the FULL real estate workflow through natural conversation.
