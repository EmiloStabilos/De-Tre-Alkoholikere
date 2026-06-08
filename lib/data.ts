import { createClient } from "@/lib/supabase/client";
import type {
  Category,
  Product,
  ProductAverage,
  Rating,
  Session,
  Taster,
} from "@/lib/types";

export async function getCategory(id: string): Promise<Category | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Category) ?? null;
}

export async function getLeaderboard(
  categoryId: string,
): Promise<ProductAverage[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("product_averages")
    .select("*")
    .eq("category_id", categoryId);
  return ((data as ProductAverage[]) ?? [])
    .filter((p) => p.num_ratings > 0)
    .sort((a, b) => (b.avg_total ?? 0) - (a.avg_total ?? 0));
}

export async function getSessions(categoryId: string): Promise<Session[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("sessions")
    .select("*")
    .eq("category_id", categoryId)
    .order("date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  return (data as Session[]) ?? [];
}

export async function getTasters(): Promise<Taster[]> {
  const supabase = createClient();
  const { data } = await supabase.from("tasters").select("*").order("sort_order");
  return (data as Taster[]) ?? [];
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Product) ?? null;
}

export async function getRatingsForProduct(productId: string): Promise<Rating[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("ratings")
    .select("*")
    .eq("product_id", productId);
  return (data as Rating[]) ?? [];
}
