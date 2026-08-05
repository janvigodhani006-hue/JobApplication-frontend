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

export interface Activity {
  id: string;
  type: "moved" | "applied" | "offer" | "resume" | "rejected" | "note";
  message: string;
  detail?: string;
  time: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  type: "interview" | "offer" | "reminder" | "system";
}

export const applications: Application[] = [
  { id: "a1", company: "Airbnb", role: "Product Design Intern", status: "applied", location: "San Francisco, CA", appliedDate: "2 days ago", source: "Referral", tag: "new", logoColor: "#FF5A5F" },
  { id: "a2", company: "Vercel", role: "Solutions Engineer", status: "applied", location: "Remote", appliedDate: "4 days ago", source: "LinkedIn", logoColor: "#ffffff" },
  { id: "a3", company: "Notion", role: "Software Engineer Intern", status: "applied", location: "New York, NY", appliedDate: "5 days ago", source: "Company site", logoColor: "#ededed" },
  { id: "a4", company: "Figma", role: "Frontend Engineer", status: "applied", location: "San Francisco, CA", appliedDate: "1 week ago", source: "LinkedIn", logoColor: "#A259FF" },
  { id: "a5", company: "Stripe", role: "Software Engineer (New Grad)", status: "interview", location: "Seattle, WA", appliedDate: "2 weeks ago", source: "Referral", tag: "hot", logoColor: "#635BFF" },
  { id: "a6", company: "Discord", role: "Backend Engineer Intern", status: "interview", location: "Remote", appliedDate: "10 days ago", source: "LinkedIn", logoColor: "#5865F2" },
  { id: "a7", company: "Google", role: "SWE Intern, Summer 2026", status: "interview", location: "Mountain View, CA", appliedDate: "3 weeks ago", source: "Career fair", logoColor: "#4285F4" },
  { id: "a8", company: "Linear", role: "Frontend Engineer", status: "offer", location: "Remote", appliedDate: "1 month ago", source: "Referral", salary: "$165k", tag: "high", logoColor: "#5E6AD2" },
  { id: "a9", company: "Cursor", role: "Founding Engineer", status: "offer", location: "San Francisco, CA", appliedDate: "1 month ago", source: "Cold email", salary: "$180k", logoColor: "#ffffff" },
  { id: "a10", company: "Datadog", role: "Systems Engineer", status: "rejected", location: "New York, NY", appliedDate: "3 weeks ago", source: "LinkedIn", logoColor: "#632CA6" },
  { id: "a11", company: "Snowflake", role: "Data Engineer Intern", status: "rejected", location: "San Mateo, CA", appliedDate: "1 month ago", source: "Career site", logoColor: "#29B5E8" },
  { id: "a12", company: "Uber", role: "Software Engineer", status: "archived", location: "San Francisco, CA", appliedDate: "2 months ago", source: "LinkedIn", logoColor: "#ededed" },
];

// interviews mock removed — use useInterviews() hook from src/hooks/useInterviews.ts

// offers mock removed — use useOffers() hook from src/hooks/useOffers.ts

export const activity: Activity[] = [
  { id: "ac1", type: "moved", message: "Application moved to Interview for Stripe", time: "2h ago" },
  { id: "ac2", type: "resume", message: "Updated resume uploaded", detail: "Software_General_v4.pdf", time: "5h ago" },
  { id: "ac3", type: "offer", message: "New offer received from Linear", time: "1d ago" },
  { id: "ac4", type: "applied", message: "Applied to Product Design Intern at Notion", time: "2d ago" },
  { id: "ac5", type: "rejected", message: "Datadog Systems Engineer marked Rejected", time: "3d ago" },
  { id: "ac6", type: "note", message: "Added preparation notes for Google final round", time: "4d ago" },
];

export const notifications: Notification[] = [
  { id: "n1", title: "Interview tomorrow", description: "Stripe Technical Screen at 2:30 PM", time: "1h ago", unread: true, type: "interview" },
  { id: "n2", title: "Offer deadline approaching", description: "Linear offer expires in 8 days", time: "3h ago", unread: true, type: "offer" },
  { id: "n3", title: "Reminder: Follow up", description: "Send thank you note to Discord recruiter", time: "1d ago", unread: true, type: "reminder" },
  { id: "n4", title: "Resume viewed", description: "Your resume was viewed by Notion", time: "2d ago", unread: false, type: "system" },
  { id: "n5", title: "Weekly summary", description: "You applied to 7 roles this week", time: "5d ago", unread: false, type: "system" },
];

export const monthlyTrend = [
  { month: "Apr", applications: 8, interviews: 1 },
  { month: "May", applications: 14, interviews: 3 },
  { month: "Jun", applications: 11, interviews: 2 },
  { month: "Jul", applications: 22, interviews: 5 },
  { month: "Aug", applications: 31, interviews: 8 },
  { month: "Sep", applications: 24, interviews: 6 },
  { month: "Oct", applications: 32, interviews: 9 },
];

export const statusBreakdown = [
  { name: "Applied", value: 64, color: "var(--color-chart-2)" },
  { name: "Interview", value: 18, color: "var(--color-chart-1)" },
  { name: "Offer", value: 4, color: "var(--color-chart-3)" },
  { name: "Rejected", value: 28, color: "var(--color-chart-5)" },
  { name: "Archived", value: 28, color: "var(--color-muted-foreground)" },
];

export const sourceBreakdown = [
  { source: "LinkedIn", count: 54 },
  { source: "Referral", count: 32 },
  { source: "Career site", count: 24 },
  { source: "Career fair", count: 18 },
  { source: "Cold email", count: 14 },
];

export const stats = {
  total: 142,
  active: 12,
  interviews: 4,
  offers: 2,
  rejections: 28,
  successRate: 14.2,
};

export const statusLabels: Record<AppStatus, string> = {
  applied: "Applied",
  interview: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  archived: "Archived",
};
