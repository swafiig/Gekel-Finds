import { useEffect, useState } from "react";
import { api } from "../services/http";

export interface Supplier {
  id: string;
  shop_name: string;
  market: string;
  rating: number;
  review_count: number;
  verified: boolean;
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get<{ suppliers: Supplier[] }>("/suppliers")
      .then((d) => setSuppliers(d.suppliers ?? []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false));
  }, []);
  return { suppliers, loading };
}
