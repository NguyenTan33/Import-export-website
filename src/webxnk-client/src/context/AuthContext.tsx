"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "B2C_CUSTOMER" | "B2B_BUYER" | "SUPER_ADMIN";

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
}

interface RegisterB2cData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

interface RegisterB2bData {
  companyName: string;
  taxId: string;
  country: string;
  companyAddress: string;
  companyWebsite?: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginAsDemo: (demoType: "b2c" | "b2b" | "admin") => void;
  registerB2c: (data: RegisterB2cData) => Promise<boolean>;
  registerB2b: (data: RegisterB2bData) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  loginAsDemo: () => {},
  registerB2c: async () => false,
  registerB2b: async () => false,
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("webxnk_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("webxnk_user");
      }
    }
  }, []);

  const saveSession = (userData: AuthUser, token = "mock_jwt_token_webxnk_auth") => {
    setUser(userData);
    localStorage.setItem("webxnk_user", JSON.stringify(userData));
    localStorage.setItem("webxnk_token", token);
  };

  const login = async (email: string): Promise<boolean> => {
    // Check if matches known demo or create session
    let authUser: AuthUser;
    if (email.toLowerCase().includes("sato") || email.toLowerCase().includes("b2b")) {
      authUser = {
        id: "usr_b2b_sato",
        email: email,
        fullName: "Kenji Sato",
        role: "B2B_BUYER",
        companyName: "TOKYO OVERSEAS LOGISTICS & TRADING CO., LTD",
        taxId: "JP-9010401020304",
        country: "Japan (Nhật Bản)",
        phone: "+81 3 5555 0192",
        isVerifiedB2b: true,
      };
    } else if (email.toLowerCase().includes("admin")) {
      authUser = {
        id: "usr_admin_qth",
        email: email,
        fullName: "Võ Văn Phú (Super Admin)",
        role: "SUPER_ADMIN",
        companyName: "CÔNG TY TNHH SX & TM DV XNK QUANG TẤN HOÀNG",
        phone: "(+84) 901 234 567",
      };
    } else {
      authUser = {
        id: `usr_${Date.now()}`,
        email: email,
        fullName: email.split("@")[0],
        role: "B2C_CUSTOMER",
        country: "United States",
      };
    }

    saveSession(authUser);
    return true;
  };

  const loginAsDemo = (demoType: "b2c" | "b2b" | "admin") => {
    if (demoType === "b2b") {
      saveSession({
        id: "usr_b2b_sato",
        email: "sato@tokyotrading.co.jp",
        fullName: "Kenji Sato",
        role: "B2B_BUYER",
        companyName: "TOKYO OVERSEAS LOGISTICS CO., LTD",
        taxId: "JP-9010401020304",
        country: "Japan",
        phone: "+81 3 5555 0192",
        isVerifiedB2b: true,
      });
    } else if (demoType === "admin") {
      saveSession({
        id: "usr_admin_qth",
        email: "admin@quangtanhoang.com",
        fullName: "Võ Văn Phú",
        role: "SUPER_ADMIN",
        companyName: "CÔNG TY TNHH SX & TM DV XNK QUANG TẤN HOÀNG",
        phone: "(+84) 28 3899 9999",
      });
    } else {
      saveSession({
        id: "usr_b2c_john",
        email: "john.buyer@gmail.com",
        fullName: "Johnathan Miller",
        role: "B2C_CUSTOMER",
        country: "United States",
        phone: "+1 212 555 0199",
      });
    }
  };

  const registerB2c = async (data: RegisterB2cData): Promise<boolean> => {
    const newUser: AuthUser = {
      id: `usr_${Date.now()}`,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      role: "B2C_CUSTOMER",
    };
    saveSession(newUser);
    return true;
  };

  const registerB2b = async (data: RegisterB2bData): Promise<boolean> => {
    const newUser: AuthUser = {
      id: `usr_b2b_${Date.now()}`,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      role: "B2B_BUYER",
      companyName: data.companyName,
      taxId: data.taxId,
      country: data.country,
      companyAddress: data.companyAddress,
      companyWebsite: data.companyWebsite,
      isVerifiedB2b: true,
    };
    saveSession(newUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("webxnk_user");
    localStorage.removeItem("webxnk_token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginAsDemo,
        registerB2c,
        registerB2b,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
