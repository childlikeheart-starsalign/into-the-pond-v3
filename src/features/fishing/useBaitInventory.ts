import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

import type { BaitStock } from "@/src/features/fishing/baitStock";
import { firestore } from "@/src/services/firebase/client";
import type { UserInventory } from "@/src/services/firebase/types";

export type { BaitStock } from "@/src/features/fishing/baitStock";
export { stockForUiBaitId } from "@/src/features/fishing/baitStock";

const EMPTY_STOCK: BaitStock = { scaleBait: 0, glimmerdustBait: 0 };

export function useBaitInventory(uid: string | null): BaitStock {
  const [stock, setStock] = useState<BaitStock>(EMPTY_STOCK);

  useEffect(() => {
    if (!uid) {
      setStock(EMPTY_STOCK);
      return;
    }

    return onSnapshot(doc(firestore, "users", uid), (snap) => {
      if (!snap.exists()) {
        setStock(EMPTY_STOCK);
        return;
      }
      const inventory = snap.data()?.inventory as UserInventory | undefined;
      setStock({
        scaleBait: inventory?.baits?.scale_bait ?? 0,
        glimmerdustBait: inventory?.baits?.glimmerdust_bait ?? 0,
      });
    });
  }, [uid]);

  return stock;
}
