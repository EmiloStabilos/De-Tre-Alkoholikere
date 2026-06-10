export type AttributeField = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  options?: string[];
};

export type Category = {
  id: string;
  name: string;
  emoji: string | null;
  sort_order: number;
  is_active: boolean;
  attribute_schema: AttributeField[];
};

export type Taster = {
  id: string;
  name: string;
  is_guest: boolean;
  sort_order: number;
};

export type Session = {
  id: string;
  category_id: string;
  name: string;
  date: string | null;
  host: string | null;
  location: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  producer: string | null;
  abv: number | null;
  attributes: Record<string, string | number>;
  photo_url: string | null;
  created_at: string;
};

export type Rating = {
  id: string;
  product_id: string;
  taster_id: string;
  session_id: string | null;
  score: number;
  extra_points: number | null;
  taste_note: string | null;
  aroma_note: string | null;
  color_note: string | null;
  created_at: string;
};

export type CategoryStats = {
  category_id: string;
  product_count: number;
  rating_count: number;
};

export type ProductAverage = {
  product_id: string;
  category_id: string;
  name: string;
  producer: string | null;
  num_ratings: number;
  avg_score: number | null;
  avg_extra: number | null;
  avg_total: number | null;
};
