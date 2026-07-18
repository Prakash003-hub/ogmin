export interface OgLink {
  id: string;
  slug: string;
  title: string;
  description: string;
  targetUrl: string;
  /** Public URL/path to the OG image, e.g. "/og/abc123.jpg" or a Vercel Blob URL */
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface OgLinkInput {
  title: string;
  description: string;
  targetUrl: string;
  image: string;
  /** Optional custom slug. If omitted or taken, one is generated. */
  slug?: string;
}
