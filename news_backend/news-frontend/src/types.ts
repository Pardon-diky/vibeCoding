export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  imageUrl: string;
  summary: string;
  publishedAt: string;
  url?: string;
  politicalLeaning?: string;
  neutralityScore?: number;
}
