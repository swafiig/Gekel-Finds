import { useEffect, useState } from "react";
import { api } from "../services/http";

export interface Product {
  id: string;
  supplier_id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

export function useProducts(category?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ products: Product[] }>(
        `/products${category ? `?category=${category}` : ""}`,
      )
      .then((d) => setProducts(d.products ?? []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category]);

  return { products, loading };
}
