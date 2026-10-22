"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ApiUserProfile, authApi } from "@/services/api";
import { decodeJwtUserId } from "@/utils/validation";

export type UserRole = "B2C_CUSTOMER" | "B2B_BUYER" | "SUPER_ADMIN" | "SALES_EXECUTIVE" | "WAREHOUSE_MANAGER";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  companyName?: string;
  taxId?: string;
  country?: string;
  companyAddress?: string;
  companyWebsite?: string;
  isVerifiedB2b?: boolean;
  isDemo?: boolean;
}

interface RegisterB2cData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface RegisterB2bData extends RegisterB2cData {
  companyName: string;
  taxId: string;
  country: string;
  companyAddress: string;
  companyWebsite?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsDemo: (demoType: "b2c" | "b2b" | "admin") => void;
  registerB2c: (data: RegisterB2cData) => Promise<boolean>;
  registerB2b: (data: RegisterB2bData) => Promise<boolean>;
  loadProfile: () => Promise<boolean>;
  updateProfile: (data: { fullName: string; email: string; phone: string }) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  loginAsDemo: () => {},
  registerB2c: async () => false,
  registerB2b: async () => false,
  loadProfile: async () => false,
  updateProfile: async () => false,
  logout: () => {},
});

const USER_STORAGE_KEY = "webxnk_user";
const TOKEN_STORAGE_KEY = "webxnk_token";

const normalizeRole = (role?: string): UserRole => {
  const normalized = role?.toLowerCase() ?? "";
  if (normalized.includes("admin")) return "SUPER_ADMIN";
  if (normalized.includes("sales")) return "SALES_EXECUTIVE";
  if (normalized.includes("warehouse")) return "WAREHOUSE_MANAGER";
  if (normalized.includes("b2b")) return "B2B_BUYER";
  return "B2C_CUSTOMER";
};

const getRole = (roles: string[] = []): UserRole =>
  roles.map(normalizeRole).find((role) => role === "SUPER_ADMIN") ??
  roles.map(normalizeRole).find((role) => role === "B2B_BUYER") ??
  roles.map(normalizeRole).find((role) => role === "B2C_CUSTOMER") ??
  roles.map(normalizeRole).find((role) => role === "SALES_EXECUTIVE") ??
  roles.map(normalizeRole).find((role) => role === "WAREHOUSE_MANAGER") ??
  "B2C_CUSTOMER";

const mapApiUser = (profile: ApiUserProfile, token?: string): AuthUser => ({
  id: (token && decodeJwtUserId(token)) || String(profile.id),
  email: profile.email,
  fullName: profile.fullName,
  phone: profile.phoneNumber || "",
  role: getRole(profile.roles),
  companyName: profile.company?.companyName,
  taxId: profile.company?.taxId,
  country: profile.company?.countryCode,
  companyWebsite: profile.company?.website,
  isVerifiedB2b: profile.company?.verificationStatus === "VERIFIED",
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveSession = useCallback((userData: AuthUser, token: string) => {
    setUser(userData);
    setIsLoading(false);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // Keep the authenticated session in memory if browser storage is unavailable.
    }
  }, []);

  const completeAuth = useCallback((response: Awaited<ReturnType<typeof authApi.login>>) => {
    saveSession(mapApiUser(response.user, response.accessToken), response.accessToken);
  }, [saveSession]);

  useEffect(() => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (!token || !savedUser) return;
      const parsed = JSON.parse(savedUser) as AuthUser;
      if (parsed?.id && parsed?.email) {
        setUser({
          ...parsed,
          id: decodeJwtUserId(token) || parsed.id,
          role: normalizeRole(parsed.role),
        });
      }
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(email.trim(), password);
      completeAuth(response);
      return true;
    } catch {
      return false;
    }
  };

  const registerB2c = async (data: RegisterB2cData): Promise<boolean> => {
    try {
      const response = await authApi.registerB2c({
        fullName: data.fullName.trim(), email: data.email.trim(), phoneNumber: data.phone,
        password: data.password, confirmPassword: data.confirmPassword,
      });
      completeAuth(response);
      return true;
    } catch {
      return false;
    }
  };

  const registerB2b = async (data: RegisterB2bData): Promise<boolean> => {
    try {
      const response = await authApi.registerB2b({
        fullName: data.fullName.trim(), email: data.email.trim(), phoneNumber: data.phone,
        password: data.password, confirmPassword: data.confirmPassword,
        companyName: data.companyName.trim(), taxId: data.taxId.trim(),
        countryCode: data.country.trim().toUpperCase(), website: data.companyWebsite,
      });
      completeAuth(response);
      return true;
    } catch {
      return false;
    }
  };

  const loginAsDemo = (demoType: "b2c" | "b2b" | "admin") => {
    const demoUsers: Record<typeof demoType, AuthUser> = {
      b2b: {
        id: "demo_b2b_sato", email: "sato@tokyotrading.co.jp", fullName: "Kenji Sato",
        role: "B2B_BUYER", companyName: "TOKYO OVERSEAS LOGISTICS CO., LTD",
        taxId: "JP-9010401020304", country: "JPN", phone: "0901234567", isVerifiedB2b: true, isDemo: true,
      },
      admin: {
        id: "demo_admin_qth", email: "admin@quangtanhoang.com", fullName: "Võ Văn Phú",
        role: "SUPER_ADMIN", companyName: "CÔNG TY TNHH SX & TM DV XNK QUANG TẤN HOÀNG",
        phone: "0901234567", isDemo: true,
      },
      b2c: {
        id: "demo_b2c_john", email: "john.buyer@gmail.com", fullName: "Johnathan Miller",
        role: "B2C_CUSTOMER", country: "USA", phone: "0901234567", isDemo: true,
      },
    };
    saveSession(demoUsers[demoType], "demo-session");
  };

  const loadProfile = async (): Promise<boolean> => {
    if (!user || user.isDemo) return !!user;
    try {
      const profile = await authApi.getProfile();
      const token = localStorage.getItem(TOKEN_STORAGE_KEY) || "";
      const updatedUser = mapApiUser(profile, token);
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      return true;
    } catch {
      return false;
    }
  };

  const updateProfile = async (data: { fullName: string; email: string; phone: string }): Promise<boolean> => {
    if (!user) return false;
    if (user.isDemo) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      return true;
    }
    try {
      const profile = await authApi.updateProfile({
        fullName: data.fullName.trim(), email: data.email.trim(), phoneNumber: data.phone,
      });
      const token = localStorage.getItem(TOKEN_STORAGE_KEY) || "";
      const updatedUser = mapApiUser(profile, token);
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Clearing in-memory auth state is sufficient when storage is unavailable.
    }
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated: !!user, isLoading, login, loginAsDemo, registerB2c, registerB2b,
      loadProfile, updateProfile, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
