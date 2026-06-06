import React, { useState, useEffect } from "react";
import type { Usuario } from "../types";
import { api } from "../types";
import { ActiveUserContext } from "./ActiveUserContextObject";

export const ActiveUserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [currentUser, setCurrentUserState] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadUsuarios = async () => {
    try {
      const data = await api.getUsuarios();
      setUsuarios(data);

      // If there's an active user stored in localStorage, match it, otherwise set first one
      const storedId = localStorage.getItem("active_user_id");
      if (storedId) {
        const found = data.find((u) => u.ID_Usuario === Number(storedId));
        if (found) {
          setCurrentUserState(found);
          setLoading(false);
          return;
        }
      }

      // Fallback: set first user (usually Ana Silva, the student)
      if (data.length > 0) {
        setCurrentUserState(data[0]);
        localStorage.setItem("active_user_id", String(data[0].ID_Usuario));
      }
    } catch (err) {
      console.error("Erro ao buscar usuários para o contexto:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUsers = async () => {
      await reloadUsuarios();
    };
    void loadUsers();
  }, []);

  const setCurrentUser = (user: Usuario) => {
    setCurrentUserState(user);
    localStorage.setItem("active_user_id", String(user.ID_Usuario));
  };

  return (
    <ActiveUserContext.Provider
      value={{ currentUser, setCurrentUser, usuarios, loading, reloadUsuarios }}
    >
      {children}
    </ActiveUserContext.Provider>
  );
};
