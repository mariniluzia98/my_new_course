import { useContext } from "react";
import { ActiveUserContext } from "./ActiveUserContextObject";

export const useActiveUser = () => {
  const context = useContext(ActiveUserContext);
  if (context === undefined) {
    throw new Error(
      "useActiveUser deve ser usado dentro de um ActiveUserProvider",
    );
  }
  return context;
};
