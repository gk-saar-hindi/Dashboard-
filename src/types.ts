export interface NewsItem {
  id: string;
  title: string;
  category: string;
  points: string[];
  sourceLink?: string;
  timestamp: number;
  createdAt?: string;
  publishedBy?: string;
  likesCount?: number;
  imageUrl?: string;
  syncedToFirebase?: boolean;
  relatedTopic?: string;
  // Exact fields from GKSAAR Firestore schema (news_stories)
  pointsJson?: string;
  relatedWord?: string;
  customGenerated?: boolean;
  saved?: boolean;
  englishTitle?: string | null;
  englishPointsJson?: string | null;
}

export type NewNewsInput = Omit<NewsItem, "id" | "timestamp"> & {
  timestamp?: number;
};

export interface FirebaseConfig {
  apiKey: string;
  projectId: string;
  appId: string;
  collectionName: string;
}

export interface AddNewsResult {
  success: boolean;
  id: string;
  syncedToFirebase: boolean;
  permissionDenied?: boolean;
  error?: string;
}

export interface BatchPublishResult {
  success: boolean;
  publishedCount: number;
  syncedToFirebaseCount: number;
  syncedToFirebase?: boolean;
  permissionDenied?: boolean;
  error?: string;
  errors?: string[];
}

export interface AuthStateInfo {
  isAuthenticated: boolean;
  isAnonymous: boolean;
  uid: string | null;
  email: string | null;
}

export interface AIProcessedItem {
  title: string;
  category: string;
  points: string[];
  sourceLink?: string;
  selected?: boolean;
}
