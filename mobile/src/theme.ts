export type MobileThemeMode = "light" | "dark";

export interface ThemePalette {
  mode: MobileThemeMode;
  canvas: string;
  canvasDeep: string;
  surface: string;
  surfaceMuted: string;
  ink: string;
  inkSoft: string;
  muted: string;
  faint: string;
  line: string;
  lineStrong: string;
  forest: string;
  forestText: string;
  forestSoft: string;
  clay: string;
  claySoft: string;
  sand: string;
  sandSoft: string;
}

export const LIGHT_THEME: ThemePalette = {
  mode: "light",
  canvas: "#F6F7F9",
  canvasDeep: "#EEF0F3",
  surface: "#FFFFFF",
  surfaceMuted: "#F9FAFB",
  ink: "#101318",
  inkSoft: "#30363F",
  muted: "#5C6572",
  faint: "#8B93A0",
  line: "#E5E8ED",
  lineStrong: "#D3D8E0",
  forest: "#1F6B52",
  forestText: "#FFFFFF",
  forestSoft: "#E8F2EC",
  clay: "#B45A3C",
  claySoft: "#F8EBE5",
  sand: "#A98342",
  sandSoft: "#F7F0E2",
};

export const DARK_THEME: ThemePalette = {
  mode: "dark",
  canvas: "#0B0D11",
  canvasDeep: "#14171D",
  surface: "#111419",
  surfaceMuted: "#171B21",
  ink: "#F2F4F7",
  inkSoft: "#C9CFD8",
  muted: "#98A1AD",
  faint: "#747D8A",
  line: "#232830",
  lineStrong: "#333A44",
  forest: "#256D55",
  forestText: "#FFFFFF",
  forestSoft: "#173127",
  clay: "#E2A189",
  claySoft: "#34231D",
  sand: "#D3B077",
  sandSoft: "#2D2719",
};
