"use client";

import { createContext, type ReactNode, useContext } from "react";

const ModelsContext = createContext<string[]>([]);

interface ModelsProviderProps {
  models: string[];
  children: ReactNode;
}

export function ModelsProvider({ models, children }: ModelsProviderProps) {
  return (
    <ModelsContext.Provider value={models}>{children}</ModelsContext.Provider>
  );
}

export function useModels(): string[] {
  return useContext(ModelsContext);
}
