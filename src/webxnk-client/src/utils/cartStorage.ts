import { CartItem } from "@/types";
import { isPositiveInteger } from "@/utils/validation";

export const getCartStorageKey = (userId: string | null): string =>
  userId ? `cart_user_${encodeURIComponent(userId)}` : "cart_guest";

export const readCart = (key: string): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        !!item &&
        typeof item === "object" &&
        !!item.product &&
        typeof item.product.id === "number" &&
        isPositiveInteger(String(item.quantity))
    );
  } catch {
    return [];
  }
};

export const writeCart = (key: string, items: CartItem[]): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Storage can be unavailable or full; cart remains usable for this session.
  }
};
