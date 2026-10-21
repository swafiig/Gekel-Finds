import { useEffect, useState } from "react";
import { api } from "../services/http";

export interface ApiCategory {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  image_url: string;
  color: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ categories: ApiCategory[] }>("/categories")
      .then((d) => setCategories(d.categories ?? []))
      .catch((e) => {
        console.error("categories fetch failed", e);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}
