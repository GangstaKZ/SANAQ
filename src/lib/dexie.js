import Dexie from "dexie";
const project = import.meta.env?.VITE_SUPABASE_URL;
export const db = new Dexie(
  project ? `sanaq-cloud-${new URL(project).hostname}` : "sanaq-local-v1",
);
db.version(1).stores({
  products: "id,&barcode,category",
  movements: "id,product_id,created_at",
  suppliers: "id",
  queue: "++id,created_at",
  meta: "key",
});
