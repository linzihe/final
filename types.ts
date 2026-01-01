
export enum MemberRank {
  INITIATE = 'Initiate',
  ADEPT = 'Adept',
  MAGUS = 'Magus',
  ARCHITECT = 'Architect',
}

export enum ArticleType {
  TEXT = 'TEXT',
  PDF = 'PDF',
  RITUAL = 'RITUAL',
}

export interface Member {
  id: string;
  name: string;
  codename: string; // "Magickal Name"
  password?: string; // New: Password for authentication
  email: string;    // New: Contact Email
  photoUrl?: string; // New: Profile Photo URL
  rank: MemberRank;
  joinedDate: string;
  active: boolean;
  notes?: string;
}

export interface Comment {
  id: string;
  author: string; // Codename of the member
  date: string; // YYYY-MM-DD HH:mm
  content: string;
  likes: number;
  replies: Comment[]; // Nested replies
}

export interface Article {
  id: string;
  title: string;
  author: string;
  date: string;
  type: ArticleType;
  content: string; // Text content or URL to PDF (mocked)
  tags: string[];
  isPinned?: boolean; // New: Pin functionality
  comments?: Comment[]; // New: Comments system
}

export interface CertificateResult {
  valid: boolean;
  member?: Member;
  timestamp: string;
}
