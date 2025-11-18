// Ambient types for Vite's import.meta.glob used in tests/build.
interface ImportMeta {
  glob: (
    pattern: string,
    options?: { import?: string },
  ) => Record<string, () => Promise<unknown>>;
}
