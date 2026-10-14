import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { readData, syncData } from "../api/productsApi";
import { supabase } from "../lib/supabase";
import { useOnlineStatus } from "./useOnlineStatus";
const Context = createContext(null);
export function InventoryProvider({ children }) {
  const client = useQueryClient();
  const online = useOnlineStatus();
  const [notice, setNotice] = useState("");
  const [syncError, setSyncError] = useState("");
  const [busy, setBusy] = useState(false);
  const query = useQuery({ queryKey: ["inventory"], queryFn: readData });
  const sync = useCallback(async () => {
    try {
      await syncData();
      setSyncError("");
    } catch (e) {
      setSyncError(e.message);
    } finally {
      await client.invalidateQueries({ queryKey: ["inventory"] });
    }
  }, [client]);
  useEffect(() => {
    sync();
    const timer = setInterval(sync, 30000);
    const channel = supabase
      ?.channel("inventory")
      .on("postgres_changes", { event: "*", schema: "public" }, sync)
      .subscribe();
    return () => {
      clearInterval(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [online, sync]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  const mutate = async (fn, message) => {
    setBusy(true);
    try {
      await fn();
      await client.invalidateQueries({ queryKey: ["inventory"] });
      setNotice(message);
      await sync();
      return true;
    } catch (e) {
      setNotice(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };
  return (
    <Context.Provider
      value={{
        products: [],
        movements: [],
        suppliers: [],
        pending: 0,
        ...query.data,
        loading: query.isLoading,
        error: query.error?.message,
        online,
        notice,
        syncError,
        sync,
        busy,
        mutate,
        setNotice,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useInventory = () => useContext(Context);
