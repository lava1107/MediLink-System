import React, { createContext, useCallback, useEffect, useState } from "react";
import { getSession, login as loginService, loginWithUser, logout as logoutService, oauthLogin as oauthLoginService } from "../services/authService.js";
import { BRANCHES } from "../data/mockData.js";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSession());
  const [currentBranch, setCurrentBranchState] = useState(() => {
    const saved = localStorage.getItem("medilink.currentBranch");
    const session = getSession();
    if (session && session.role !== "Admin") return session.branch;
    return saved || "All";
  });

  const setCurrentBranch = useCallback((branch) => {
    setCurrentBranchState(branch);
    localStorage.setItem("medilink.currentBranch", branch);
  }, []);

  useEffect(() => {
    if (user && user.role !== "Admin") setCurrentBranch(user.branch);
  }, [user, setCurrentBranch]);

  const login = useCallback(async (usernameOrUser, password) => {
    if (typeof usernameOrUser === "string") {
      const u = await loginService(usernameOrUser, password);
      setUser(u);
      if (u.role !== "Admin") setCurrentBranch(u.branch);
      return u;
    } else {
      loginWithUser(usernameOrUser);
      setUser(usernameOrUser);
      if (usernameOrUser?.role !== "Admin" && usernameOrUser?.branch) setCurrentBranch(usernameOrUser.branch);
      return usernameOrUser;
    }
  }, [setCurrentBranch]);

  const oauthLogin = useCallback(async (params) => {
    const u = await oauthLoginService(params);
    setUser(u);
    if (u.role !== "Admin") setCurrentBranch(u.branch);
    return u;
  }, [setCurrentBranch]);

  const logout = useCallback(() => {
    logoutService();
    setUser(null);
  }, []);

  const value = { user, login, oauthLogin, logout, currentBranch, setCurrentBranch };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
