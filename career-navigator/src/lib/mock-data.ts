export type AppStatus = "applied" | "interview" | "offer" | "rejected" | "archived";

export interface Application {
  id: string;
  company: string;
  role: string;
  status: AppStatus;
  location: string;
  salary?: string;
  appliedDate: string;
  source: string;
  tag?: "new" | "hot" | "high";
  logoColor: string;
}

// Interview interface moved to src/lib/interview-api.ts (InterviewResponse)
// interviews mock data removed — now fetched from GET /api/interviews


// Offer interface moved to src/lib/offer-api.ts (OfferResponse)
// offers mock data removed — now fetched from GET /api/offers


// Resume interface moved to src/lib/resume-api.ts (ResumeResponse)
// resumes mock data removed — now fetched from GET /api/resumes

// Activity interface moved to src/lib/activity-api.ts (ActivityResponse)
// activity mock data removed — now fetched from GET /api/activities

// Notification interface moved to src/lib/notification-api.ts (NotificationResponse)
// notifications mock data removed — now fetched from GET /api/notifications


export const statusLabels: Record<AppStatus, string> = {
  applied: "Applied",
  interview: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  archived: "Archived",
};
