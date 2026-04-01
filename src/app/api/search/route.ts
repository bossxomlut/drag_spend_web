import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supported entity types for search
const ENTITY_TYPES = ["transaction", "card", "category"] as const;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { entity, query, filters, page = 1, pageSize = 20 } = await req.json();

  if (!ENTITY_TYPES.includes(entity)) {
    return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
  }

  // Require auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let data: Record<string, unknown>[] = [];
  let total = 0;

  switch (entity) {
    case "transaction": {
      // Use the unaccent RPC so that diacritic-free queries (e.g. "an sang")
      // match records with diacritics (e.g. "Ăn sáng").
      const { data: rows, error } = await supabase.rpc(
        "search_transactions_unaccent",
        {
          p_user_id: user.id,
          p_query: query ?? "",
          p_type: filters?.type || null,
          p_date_from: filters?.date_from || null,
          p_date_to: filters?.date_to || null,
          p_category_id: filters?.category_id || null,
          p_min_amount: filters?.min_amount || null,
          p_max_amount: filters?.max_amount || null,
          p_limit: pageSize,
          p_offset: (page - 1) * pageSize,
        },
      );
      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      const rowsArray = (rows ?? []) as (Record<string, unknown> & {
        total_count: number;
      })[];
      total = rowsArray.length > 0 ? Number(rowsArray[0].total_count) : 0;
      // Strip the window-function helper column before returning to client
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      data = rowsArray.map(({ total_count, ...rest }) => rest);
      break;
    }
    case "card": {
      let supa = supabase
        .from("spending_cards")
        .select("*, category:categories(*), variants:card_variants(*)", {
          count: "exact",
        })
        .eq("user_id", user.id);
      if (query) {
        supa = supa.ilike("title", `%${query}%`);
      }
      if (filters?.type) {
        supa = supa.eq("type", filters.type);
      }
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data: rows, count, error } = await supa.range(from, to);
      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      data = rows ?? [];
      total = count ?? 0;
      break;
    }
    case "category": {
      let supa = supabase.from("categories").select("*", { count: "exact" });
      if (query) {
        supa = supa.ilike("name", `%${query}%`);
      }
      if (filters?.type) {
        supa = supa.eq("type", filters.type);
      }
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data: rows, count, error } = await supa.range(from, to);
      if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
      data = rows ?? [];
      total = count ?? 0;
      break;
    }
  }

  return NextResponse.json({ data, total, page, pageSize });
}
