"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "./api";
import { User, AuthResponse, LoginCredentials, RegisterData } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<{ message: string; email: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /**
   * Ask the server who we are. The session cookie is HttpOnly, so the client
   * cannot inspect it — the server is the only source of truth for identity,
   * and this call doubles as the check that the session is still valid.
   */
  const refreshUser = useCallback(async () => {
    try {
      setUser(await apiGet<User>("/auth/profile"));
    } catch {
      // 401/403 simply means "not signed in".
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials) => {
    // The response carries only the user; the token arrives as a Set-Cookie.
    const { user: userData } = await apiPost<AuthResponse>(
      "/auth/login",
      credentials,
    );
    setUser(userData);
    router.push("/dashboard");
  };

  const register = async (registerData: RegisterData) => {
    const data = await apiPost<{ message: string; email: string }>(
      "/auth/register",
      registerData,
    );
    router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    return data;
  };

  const verifyEmail = async (email: string, code: string) => {
    const { user: userData } = await apiPost<AuthResponse>(
      "/auth/verify-email",
      { email, code },
    );
    setUser(userData);
    router.push("/dashboard");
  };

  const resendVerification = async (email: string) => {
    await apiPost<{ message: string }>("/auth/resend-code", { email });
  };

  const logout = async () => {
    try {
      // Only the server can clear an HttpOnly cookie, so logout must be a
      // round-trip rather than a local state reset.
      await apiPost("/auth/logout");
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        verifyEmail,
        resendVerification,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
