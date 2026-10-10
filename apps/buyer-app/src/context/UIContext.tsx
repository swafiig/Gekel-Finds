import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const UI = createContext<{ menuOpen: boolean; openMenu: () => void; closeMenu: () => void } | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [menuOpen, setOpen] = useState(false);
  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);
  const value = useMemo(() => ({ menuOpen, openMenu, closeMenu }), [menuOpen, openMenu, closeMenu]);
  return <UI.Provider value={value}>{children}</UI.Provider>;
}
export const useUI = () => {
  const c = useContext(UI);
  if (!c) throw new Error('useUI must be used inside <UIProvider>');
  return c;
};
