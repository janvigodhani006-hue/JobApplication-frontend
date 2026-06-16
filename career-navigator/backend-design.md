# CareerPilot Backend Architecture & API Specification

This document details the database schema (DDL), Java Spring Boot JPA entities, DTOs, and REST API endpoints required to transition the CareerPilot career-navigator frontend from static mock data to a fully functional backend system.

---

## 1. Database Schema (SQL DDL Queries)

We use **PostgreSQL** as the database system. All tables are structured around a multi-tenant model using a `user_id` relation, ensuring users can only access their own job applications, resumes, interviews, offers, and activity records.

```sql
-- Enable UUID extension if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USERS TABLE
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index on email for rapid user authentication lookup
CREATE INDEX idx_users_email ON users(email);

-- ==========================================
-- 2. APPLICATIONS TABLE
-- ==========================================
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('applied', 'interview', 'offer', 'rejected', 'archived')),
    location VARCHAR(150) NOT NULL,
    salary VARCHAR(50),
    applied_date TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(100) NOT NULL,
    tag VARCHAR(20) CHECK (tag IN ('new', 'hot', 'high')),
    logo_color VARCHAR(20) NOT NULL DEFAULT '#ededed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for listing/filtering applications by user and status
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_user_status ON applications(user_id, status);

-- ==========================================
-- 3. INTERVIEWS TABLE
-- ==========================================
CREATE TABLE interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    company VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL, -- e.g., 'Technical Screen', 'Final Round', 'Behavioral'
    interview_date TIMESTAMP WITH TIME ZONE NOT NULL,
    platform VARCHAR(100) NOT NULL, -- e.g., 'Zoom', 'Google Meet'
    prep_notes TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index on user_id and interview date to quickly query upcoming interviews
CREATE INDEX idx_interviews_user_date ON interviews(user_id, interview_date ASC);
CREATE INDEX idx_interviews_app_id ON interviews(application_id);

-- ==========================================
-- 4. OFFERS TABLE
-- ==========================================
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id UUID UNIQUE REFERENCES applications(id) ON DELETE SET NULL,
    company VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    base DECIMAL(12, 2) NOT NULL,
    equity VARCHAR(50),
    bonus DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    location VARCHAR(150) NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    match_percentage INTEGER NOT NULL CHECK (match_percentage BETWEEN 0 AND 100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'negotiating')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for retrieving offers
CREATE INDEX idx_offers_user_id ON offers(user_id);
CREATE INDEX idx_offers_app_id ON offers(application_id);

-- ==========================================
-- 5. RESUMES TABLE
-- ==========================================
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL, -- e.g., 'v1', 'v2', 'v4'
    file_path VARCHAR(512) NOT NULL, -- Storage URL or filepath
    file_size VARCHAR(50) NOT NULL, -- Pre-formatted size string, e.g. '184 KB'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for retrieving user resumes
CREATE INDEX idx_resumes_user_id ON resumes(user_id);

-- ==========================================
-- 6. ACTIVITIES TABLE
-- ==========================================
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('moved', 'applied', 'offer', 'resume', 'rejected', 'note')),
    message VARCHAR(255) NOT NULL,
    detail VARCHAR(255), -- Additional details (e.g. resume filename)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for generating the activity feed chronologically
CREATE INDEX idx_activities_user_created ON activities(user_id, created_at DESC);

-- ==========================================
-- 7. NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(255) NOT NULL,
    unread BOOLEAN NOT NULL DEFAULT TRUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('interview', 'offer', 'reminder', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for loading unread notifications quickly
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, unread, created_at DESC);
```

---

## 2. Spring Boot Domain Entities (JPA)

These Java entity classes map directly to our SQL tables. They leverage Lombok to keep the syntax clear and reduce boilerplate code.

### 2.1 User Entity (`User.java`)
```java
package com.careerpilot.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
```

### 2.2 Application Entity (`Application.java`)
```java
package com.careerpilot.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "applications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private String status; // 'applied', 'interview', 'offer', 'rejected', 'archived'

    @Column(nullable = false)
    private String location;

    private String salary;

    @Column(name = "applied_date", nullable = false)
    private OffsetDateTime appliedDate;

    @Column(nullable = false)
    private String source;

    private String tag; // 'new', 'hot', 'high'

    @Column(name = "logo_color", nullable = false)
    private String logoColor = "#ededed";

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
```

### 2.3 Interview Entity (`Interview.java`)
```java
package com.careerpilot.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "interviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Interview {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private Application application;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private String type; // e.g. Technical Screen, System Design, Behavioral

    @Column(name = "interview_date", nullable = false)
    private OffsetDateTime interviewDate;

    @Column(nullable = false)
    private String platform; // e.g. Zoom, Google Meet

    @Column(name = "prep_notes", columnDefinition = "TEXT")
    private String prepNotes;

    @Column(name = "is_completed", nullable = false)
    private boolean isCompleted = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
```

### 2.4 Offer Entity (`Offer.java`)
```java
package com.careerpilot.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "offers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Offer {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", unique = true)
    private Application application;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String role;

    @Column(nullable = false)
    private BigDecimal base;

    private String equity;

    @Column(nullable = false)
    private BigDecimal bonus = BigDecimal.ZERO;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private OffsetDateTime deadline;

    @Column(name = "match_percentage", nullable = false)
    private int matchPercentage;

    @Column(nullable = false)
    private String status = "pending"; // pending, accepted, rejected, negotiating

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
```

### 2.5 Resume Entity (`Resume.java`)
```java
package com.careerpilot.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "resumes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resume {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String version;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "file_size", nullable = false)
    private String fileSize;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
```

### 2.6 Activity Entity (`Activity.java`)
```java
package com.careerpilot.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "activities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Activity {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String type; // 'moved', 'applied', 'offer', 'resume', 'rejected', 'note'

    @Column(nullable = false)
    private String message;

    private String detail;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
```

### 2.7 Notification Entity (`Notification.java`)
```java
package com.careerpilot.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private boolean unread = true;

    @Column(nullable = false)
    private String type; // 'interview', 'offer', 'reminder', 'system'

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
```

---

## 3. Data Transfer Objects (DTOs)

Using modern **Java Records** keeps request/response payloads clean and lightweight.

```java
package com.careerpilot.backend.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

// User DTOs
public record UserRegisterRequest(String fullName, String email, String password) {}
public record UserLoginRequest(String email, String password) {}
public record AuthResponse(String token, UserResponse user) {}
public record UserResponse(UUID id, String fullName, String email) {}

// Application DTOs
public record CreateApplicationRequest(
    String company,
    String role,
    String status,
    String location,
    String salary,
    OffsetDateTime appliedDate,
    String source,
    String tag,
    String logoColor
) {}

public record UpdateApplicationRequest(
    String company,
    String role,
    String status,
    String location,
    String salary,
    OffsetDateTime appliedDate,
    String source,
    String tag,
    String logoColor
) {}

public record ApplicationResponse(
    UUID id,
    String company,
    String role,
    String status,
    String location,
    String salary,
    OffsetDateTime appliedDate,
    String source,
    String tag,
    String logoColor,
    OffsetDateTime createdAt
) {}

// Interview DTOs
public record CreateInterviewRequest(
    UUID applicationId,
    String company,
    String role,
    String type,
    OffsetDateTime interviewDate,
    String platform,
    String prepNotes
) {}

public record InterviewResponse(
    UUID id,
    UUID applicationId,
    String company,
    String role,
    String type,
    OffsetDateTime interviewDate,
    String platform,
    String prepNotes,
    boolean isCompleted
) {}

// Offer DTOs
public record CreateOfferRequest(
    UUID applicationId,
    String company,
    String role,
    BigDecimal base,
    String equity,
    BigDecimal bonus,
    String location,
    OffsetDateTime deadline,
    int matchPercentage
) {}

public record UpdateOfferStatusRequest(String status) {}

public record OfferResponse(
    UUID id,
    UUID applicationId,
    String company,
    String role,
    BigDecimal base,
    String equity,
    BigDecimal bonus,
    String location,
    OffsetDateTime deadline,
    int matchPercentage,
    String status
) {}

// Resume DTOs
public record ResumeResponse(
    UUID id,
    String name,
    String version,
    String filePath,
    String fileSize,
    int applicationCount, -- Calculated by subquery or service layer mapping
    OffsetDateTime createdAt
) {}

// Activity DTOs
public record ActivityResponse(
    UUID id,
    String type,
    String message,
    String detail,
    OffsetDateTime createdAt
) {}

// Notification DTOs
public record NotificationResponse(
    UUID id,
    String title,
    String description,
    boolean unread,
    String type,
    OffsetDateTime createdAt
) {}

// Dashboard Analytics DTO
public record DashboardStatsResponse(
    int totalApps,
    int activeApps,
    int interviewsCount,
    int offersCount,
    int rejectionsCount,
    double successRate,
    java.util.List<MonthlyTrendDTO> monthlyTrends,
    java.util.List<StatusBreakdownDTO> statusBreakdowns,
    java.util.List<SourceBreakdownDTO> sourceBreakdowns
) {}

public record MonthlyTrendDTO(String month, int applications, int interviews) {}
public record StatusBreakdownDTO(String name, int value, String color) {}
public record SourceBreakdownDTO(String source, int count) {}
```

---

## 4. REST API Endpoint Specifications

All endpoints require authorization via a standard `Authorization: Bearer <JWT_TOKEN>` header unless noted as `Public`.

### 4.1 Authentication Modules

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Create a new user account | Public |
| **POST** | `/api/auth/login` | Log in and receive JWT token | Public |
| **GET** | `/api/auth/me` | Fetch authenticated user detail | Authorized |

#### Authenticated User Detail (`GET /api/auth/me`)
- **Headers**: `Authorization: Bearer <Token>`
- **Response (200 OK)**:
  ```json
  {
    "id": "e229c991-8888-4c81-ab0e-d784eb48cb7a",
    "fullName": "Alex Chen",
    "email": "alex@university.edu"
  }
  ```

---

### 4.2 Job Applications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/applications` | List applications with query parameters for searching & sorting |
| **POST** | `/api/applications` | Create a new job application |
| **GET** | `/api/applications/{id}` | Get application details by ID |
| **PUT** | `/api/applications/{id}` | Update application details |
| **PATCH** | `/api/applications/{id}/status` | Fast status update (e.g., Kanban drag-drop) |
| **DELETE** | `/api/applications/{id}` | Delete application |

#### List Applications (`GET /api/applications?search=Notion&status=applied`)
- **Query Params**:
  - `search` (Optional: filter by company, role, location)
  - `status` (Optional: filter by status)
  - `sort` (Optional: `appliedDate,desc` etc.)
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "a3bb889e-128a-4d2b-aa90-b1ff2d05cae1",
      "company": "Notion",
      "role": "Software Engineer Intern",
      "status": "applied",
      "location": "New York, NY",
      "salary": null,
      "appliedDate": "2026-06-10T10:00:00Z",
      "source": "Company site",
      "tag": "new",
      "logoColor": "#ededed",
      "createdAt": "2026-06-10T10:00:00Z"
    }
  ]
  ```

#### Create Application (`POST /api/applications`)
- **Request Body**:
  ```json
  {
    "company": "Stripe",
    "role": "Software Engineer (New Grad)",
    "status": "interview",
    "location": "Seattle, WA",
    "salary": "$140k",
    "appliedDate": "2026-06-01T09:00:00Z",
    "source": "Referral",
    "tag": "hot",
    "logoColor": "#635BFF"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "a5bb9910-128a-4d2b-aa90-b1ff2d05cae2",
    "company": "Stripe",
    "role": "Software Engineer (New Grad)",
    "status": "interview",
    "location": "Seattle, WA",
    "salary": "$140k",
    "appliedDate": "2026-06-01T09:00:00Z",
    "source": "Referral",
    "tag": "hot",
    "logoColor": "#635BFF",
    "createdAt": "2026-06-15T02:00:00Z"
  }
  ```

---

### 4.3 Interviews

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/interviews` | Fetch all interviews (upcoming or past) |
| **POST** | `/api/interviews` | Schedule a new interview |
| **GET** | `/api/interviews/{id}` | Get interview detail |
| **PUT** | `/api/interviews/{id}` | Update interview details or notes |
| **PATCH** | `/api/interviews/{id}/complete` | Mark interview as complete |
| **DELETE** | `/api/interviews/{id}` | Cancel/delete interview |

#### Schedule Interview (`POST /api/interviews`)
- **Request Body**:
  ```json
  {
    "applicationId": "a5bb9910-128a-4d2b-aa90-b1ff2d05cae2",
    "company": "Stripe",
    "role": "Software Engineer (New Grad)",
    "type": "Technical Screen",
    "interviewDate": "2026-06-16T14:30:00Z",
    "platform": "Google Meet",
    "prepNotes": "Review binary trees and graph algorithms."
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "i1ff771a-222a-431b-ab55-09df1342cd18",
    "applicationId": "a5bb9910-128a-4d2b-aa90-b1ff2d05cae2",
    "company": "Stripe",
    "role": "Software Engineer (New Grad)",
    "type": "Technical Screen",
    "interviewDate": "2026-06-16T14:30:00Z",
    "platform": "Google Meet",
    "prepNotes": "Review binary trees and graph algorithms.",
    "isCompleted": false
  }
  ```

---

### 4.4 Job Offers

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/offers` | Fetch all offers for comparison table |
| **POST** | `/api/offers` | Log a job offer |
| **PATCH** | `/api/offers/{id}/status` | Accept, reject, or mark as negotiating |
| **DELETE** | `/api/offers/{id}` | Delete offer details |

#### List Offers (`GET /api/offers`)
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "o1cc999a-999a-441b-a987-bfd29948cd19",
      "applicationId": "88ff9910-128a-4d2b-aa90-b1ff2d05ca33",
      "company": "Linear",
      "role": "Frontend Engineer",
      "base": 165000.00,
      "equity": "0.08%",
      "bonus": 15000.00,
      "location": "Remote",
      "deadline": "2026-11-12T17:00:00Z",
      "matchPercentage": 94,
      "status": "pending"
    }
  ]
  ```

---

### 4.5 Resumes

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/resumes` | Get all uploaded resume versions |
| **POST** | `/api/resumes` | Upload a new resume file (multipart/form-data) |
| **GET** | `/api/resumes/{id}/download` | Download resume file |
| **DELETE** | `/api/resumes/{id}` | Delete a resume version |

#### Upload Resume (`POST /api/resumes`)
- **Consumes**: `multipart/form-data`
- **Multipart parameters**:
  - `file`: (binary file)
  - `version`: "v4" (string)
- **Response (201 Created)**:
  ```json
  {
    "id": "r1bb448e-223a-442b-ab09-91fd8845cd12",
    "name": "Software_General_v4.pdf",
    "version": "v4",
    "filePath": "/uploads/resumes/e229c991_v4.pdf",
    "fileSize": "184 KB",
    "applicationCount": 0,
    "createdAt": "2026-06-15T02:10:00Z"
  }
  ```

---

### 4.6 Analytics & Activity Logs

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/dashboard/stats` | Retrieve all metrics, monthly trends, and breakdowns |
| **GET** | `/api/activities` | Paginated activity list for dashboard feed |

#### Get Dashboard Stats (`GET /api/dashboard/stats`)
- **Response (200 OK)**:
  ```json
  {
    "totalApps": 142,
    "activeApps": 12,
    "interviewsCount": 4,
    "offersCount": 2,
    "rejectionsCount": 28,
    "successRate": 14.2,
    "monthlyTrends": [
      { "month": "Jun", "applications": 11, "interviews": 2 },
      { "month": "Jul", "applications": 22, "interviews": 5 }
    ],
    "statusBreakdowns": [
      { "name": "Applied", "value": 64, "color": "var(--color-chart-2)" }
    ],
    "sourceBreakdowns": [
      { "source": "LinkedIn", "count": 54 }
    ]
  }
  ```

---

### 4.7 Notifications

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/notifications` | Fetch all user notifications |
| **POST** | `/api/notifications/{id}/read` | Mark a specific notification as read |
| **POST** | `/api/notifications/read-all` | Mark all user notifications as read |

#### List Notifications (`GET /api/notifications`)
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "n1bb111a-222a-431b-ab55-09df1342cd18",
      "title": "Interview tomorrow",
      "description": "Stripe Technical Screen at 2:30 PM",
      "unread": true,
      "type": "interview",
      "createdAt": "2026-06-15T06:50:26Z"
    }
  ]
  ```
