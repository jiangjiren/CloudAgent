import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject, ReactNode } from 'react';

export type PaletteOps = {
  openFile: (path: string) => void;
  openSettings: (tab?: string) => void;
  refreshProjects: () => Promise<void> | void;
  openCreateProject: () => void;
};

type Registry = MutableRefObject<Partial<PaletteOps>>;

const PaletteOpsContext = createContext<Registry | null>(null);

const defaultOps: PaletteOps = {
  openFile: () => undefined,
  openSettings: () => undefined,
  refreshProjects: () => undefined,
  openCreateProject: () => undefined,
};

export function PaletteOpsProvider({ children }: { children: ReactNode }) {
  const ref = useRef<Partial<PaletteOps>>({});
  return <PaletteOpsContext.Provider value={ref}>{children}</PaletteOpsContext.Provider>;
}

export function usePaletteOps(): PaletteOps {
  const ref = useContext(PaletteOpsContext);
  return useMemo<PaletteOps>(
    () => ({
      openFile: (path) => (ref?.current.openFile ?? defaultOps.openFile)(path),
      openSettings: (tab) => (ref?.current.openSettings ?? defaultOps.openSettings)(tab),
      refreshProjects: () => (ref?.current.refreshProjects ?? defaultOps.refreshProjects)(),
      openCreateProject: () => (ref?.current.openCreateProject ?? defaultOps.openCreateProject)(),
    }),
    [ref],
  );
}

export function usePaletteOpsRegister(partial: Partial<PaletteOps>) {
  const ref = useContext(PaletteOpsContext);
  const { openFile, openSettings, refreshProjects, openCreateProject } = partial;

  useEffect(() => {
    if (!ref) return undefined;
    const registry = ref.current;
    const prev = { ...registry };
    if (openFile) registry.openFile = openFile;
    if (openSettings) registry.openSettings = openSettings;
    if (refreshProjects) registry.refreshProjects = refreshProjects;
    if (openCreateProject) registry.openCreateProject = openCreateProject;
    return () => {
      if (openFile && registry.openFile === openFile) registry.openFile = prev.openFile;
      if (openSettings && registry.openSettings === openSettings) registry.openSettings = prev.openSettings;
      if (refreshProjects && registry.refreshProjects === refreshProjects) registry.refreshProjects = prev.refreshProjects;
      if (openCreateProject && registry.openCreateProject === openCreateProject) registry.openCreateProject = prev.openCreateProject;
    };
  }, [ref, openFile, openSettings, refreshProjects, openCreateProject]);
}
