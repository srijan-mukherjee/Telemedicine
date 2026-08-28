import { createContext, useContext, useEffect, useState } from "react";

import { clearToken, getToken, setToken } from "../services/api.js";
import { fetchCurrentUser, loginRequest } from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On app load, if a token is stored, validate it against /auth/me
    // rather than trusting it blindly — it may have expired.
    if (!getToken()) {
      setLoading(false);
      return;
    }
    fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { access_token: token } = await loginRequest(email, password);
    setToken(token);
    const me = await fetchCurrentUser();
    setUser(me);
    return me;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
