# User Flows

## 1. Visitor: Browse → Profile → Lead

```mermaid
sequenceDiagram
    actor V as Visitor
    participant BP as Browse Page
    participant API as /api/operators
    participant PP as Profile Page
    participant DB as PostgreSQL

    V->>BP: Opens /browse
    BP->>API: GET /api/operators?category=&search=&lat=&lng=&radius=
    API->>DB: SELECT with full-text & geospatial filters
    DB-->>API: operator rows
    API-->>BP: JSON array
    BP-->>V: Renders operator cards grid

    V->>BP: Clicks on operator card
    BP->>PP: Navigate to /op/[slug]
    PP->>API: GET /api/operators/[slug]
    API->>DB: SELECT by slug
    DB-->>API: operator row
    API-->>PP: JSON object
    PP-->>V: Renders full profile

    V->>PP: Clicks "Contact via WhatsApp"
    PP-->>V: Opens whatsapp://send?phone=... (deep link)

    V->>PP: Fills lead form (name, message)
    PP->>API: POST /api/leads { operator_id, session_id, source }
    API->>DB: INSERT into leads
    DB-->>API: success
    API-->>PP: 201 Created
    PP-->>V: Success toast/alert
```

## 2. Operator: Join

```mermaid
sequenceDiagram
    actor O as Operator
    participant JP as Join Page
    participant API as /api/operators
    participant DB as PostgreSQL

    O->>JP: Opens /join
    JP-->>O: Registration form (name, phone, category, etc.)

    O->>JP: Fills and submits form
    JP->>API: POST /api/operators { name, whatsapp, category, ... }
    API->>DB: INSERT new operator (status='pending')
    DB-->>API: success
    API-->>JP: 201 { operator }
    JP-->>O: "Registration submitted, await admin approval"
```

## 3. Operator: Login & Dashboard

```mermaid
sequenceDiagram
    actor O as Operator
    participant LP as Login Page
    participant NA as NextAuth
    participant P as Portal Page
    participant EP as Edit Page
    participant API as /api/operators
    participant DB as PostgreSQL

    O->>LP: Opens /auth/login
    LP-->>O: Login form (Google, Email OTP, WhatsApp OTP tabs)

    alt Google OAuth
        O->>LP: Clicks "Sign in with Google"
        LP->>NA: Redirect to Google consent screen
        NA-->>O: Google account picker
        O->>NA: Selects account
        NA->>NA: JWT callback (enrich with operator_id, is_admin)
        NA-->>LP: Session created
    else Email OTP
        O->>LP: Enters email, clicks "Send OTP"
        LP->>API: POST /api/auth/otp/send { email }
        API->>Resend: Send 6-digit code
        O->>LP: Enters OTP
        LP->>API: POST /api/auth/otp/verify { email, otp }
        API-->>LP: Session created
    else WhatsApp OTP
        O->>LP: Enters phone, clicks "Send OTP"
        LP->>API: POST /api/auth/otp/send { phone }
        API->>WhatsApp: Send 6-digit code
        O->>LP: Enters OTP
        LP->>API: POST /api/auth/otp/verify { phone, otp }
        API-->>LP: Session created
    end

    LP->>P: Redirect to /portal
    P->>API: GET /api/operators?email={email} (or by operator_id)
    API->>DB: SELECT operator
    DB-->>API: operator data
    API-->>P: operator JSON
    P-->>O: Dashboard (completion score, leads count)

    O->>P: Clicks "Edit Profile"
    P->>EP: Navigate to /portal/edit
    EP->>API: GET /api/operators/[slug]
    API->>DB: SELECT operator
    DB-->>API: operator data
    API-->>EP: operator JSON
    EP-->>O: Edit form (pre-filled)

    O->>EP: Modifies fields, uploads photos, saves
    EP->>API: PATCH /api/operators/[slug] { ... }
    API->>DB: UPDATE operator
    DB-->>API: success
    API-->>EP: 200 { operator }
    EP-->>O: "Profile updated" toast
```

## 4. Admin: Approve Operator

```mermaid
sequenceDiagram
    actor A as Admin
    participant AD as Admin Page
    participant API as /api/admin/operators
    participant APID as /api/admin/operators/[id]
    participant DB as PostgreSQL

    A->>AD: Opens /admin
    AD->>API: GET /api/admin/operators
    API->>DB: SELECT all operators with lead counts
    DB-->>API: operator rows
    API-->>AD: JSON array
    AD-->>A: Table of all operators

    A->>AD: Finds pending operator, clicks "Approve"
    AD->>APID: PATCH /api/admin/operators/[id] { status: 'approved' }
    APID->>DB: UPDATE operators SET status='approved' WHERE id=[id]
    DB-->>APID: success
    APID-->>AD: 200
    AD-->>A: Operator now shows "approved"
```

## 5. Session Validation (Stale Token Handling)

```mermaid
flowchart TD
    A[User visits /portal] --> B{Has valid session?}
    B -->|No| C[Redirect to /auth/login]
    B -->|Yes| D{Session has operator_id?}
    D -->|Yes| E[Render dashboard]
    D -->|No| F[Call signOut]
    F --> G[Clear cookies / JWT]
    G --> C
```

## 6. Category-Specific Profile Flow

```mermaid
flowchart TD
    A[Visitor opens /op/[slug]] --> B[Fetch operator data]
    B --> C{Category?}
    C -->|houseboat| D[Show houseboat_details section]
    C -->|shikara| E[Show shikara_details section]
    C -->|artisan| F[Show artisan_details section]
    C -->|guide| G[Show guide info]
    C -->|vendor| H[Show vendor info]
    D --> I[Show common sections: photos, contact, lead form]
    E --> I
    F --> I
    G --> I
    H --> I
```

## 7. Photo Upload Flow

```mermaid
sequenceDiagram
    actor O as Operator
    participant EP as Edit Page
    participant CL as Cloudinary Widget
    participant CAPI as Cloudinary API
    participant OAPI as /api/upload
    participant S3 as S3 Storage (INFERRED)

    O->>EP: Clicks "Add Photo"
    EP->>CL: Open Cloudinary upload widget
    CL->>O: File picker dialog
    O->>CL: Selects image file
    CL->>CAPI: Upload to Cloudinary
    CAPI-->>CL: { secure_url, public_id }
    CL-->>EP: Returns uploaded URL
    EP->>OAPI: POST /api/upload { url, public_id }
    OAPI->>S3: Backup to S3 (INFERRED — code path unclear)
    OAPI-->>EP: 200
    EP-->>O: Photo added to gallery
```

## 8. Lead Viewing (Operator)

```mermaid
sequenceDiagram
    actor O as Operator
    participant P as Portal Page
    participant API as /api/leads
    participant DB as PostgreSQL

    O->>P: Opens /portal
    P->>API: GET /api/leads?operator_id={id}
    API->>DB: SELECT FROM leads WHERE operator_id = [id]
    DB-->>API: lead rows
    API-->>P: JSON array
    P-->>O: Lead count badge + recent leads list
```

## 9. Full Site Map (Navigation Flow)

```mermaid
flowchart TD
    L["/ (Landing)"] --> B["/browse (Browse All)"]
    L --> C1["/houseboat"]
    L --> C2["/shikara"]
    L --> C3["/artisan"]
    L --> C4["/guide"]
    L --> C5["/vendor"]
    L --> J["/join (Sign Up)"]
    L --> LG["/auth/login"]

    B --> OP["/op/[slug] (Profile)"]
    C1 --> OP
    C2 --> OP
    C3 --> OP
    C4 --> OP
    C5 --> OP

    LG --> PO["/portal (Dashboard)"]
    J --> PO
    PO --> E["/portal/edit (Edit Profile)"]

    LG --> AD["/admin (Admin Panel)"]

    OP --> LG
    PO --> LG
    AD --> LG
```

## 10. Data Flow: Browse with Geospatial Filtering

```mermaid
flowchart TD
    A[Browser requests /browse] --> B{URL has lat/lng params?}
    B -->|No| C[SELECT operators WHERE status='approved' + full-text search]
    B -->|Yes| D[SELECT operators WHERE status='approved' AND earth_distance <= radius]
    C --> E[Return JSON to client]
    D --> E
    E --> F[Render operator cards]
```
