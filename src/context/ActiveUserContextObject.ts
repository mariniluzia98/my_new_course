import { createContext } from "react";
import type { Usuario } from "../types";

export interface ActiveUserContextType {
  currentUser: Usuario | null;
  setCurrentUser: (user: Usuario) => void;
  usuarios: Usuario[];
  loading: boolean;
  reloadUsuarios: () => Promise<void>;
}

export const ActiveUserContext = createContext<
  ActiveUserContextType | undefined
>(undefined);
