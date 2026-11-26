import React from "react";
import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
  filled?: boolean;
}

export function HomeIcon({ size = 20, color = "#101318", filled = false }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.5 10.5L12 3.5l8.5 7v9a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5a1.5 1.5 0 0 1-1.5-1.5v-9Z"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CompassIcon({ size = 20, color = "#101318", filled = false }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.9} fill={filled ? `${color}22` : "none"} />
      <Path d="M15.5 8.5l-2.2 5.2-5.2 2.2 2.2-5.2 5.2-2.2Z" stroke={color} strokeWidth={1.8} fill={filled ? color : "none"} />
    </Svg>
  );
}

export function PlusIcon({ size = 20, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.3} strokeLinecap="round" />
    </Svg>
  );
}

export function PlayCircleIcon({ size = 20, color = "#101318", filled = false }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.9} fill={filled ? `${color}22` : "none"} />
      <Path d="M10.2 8.8l5.6 3.2-5.6 3.2V8.8Z" fill={color} stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
    </Svg>
  );
}

export function UserIcon({ size = 20, color = "#101318", filled = false }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.5" r="3.5" stroke={color} strokeWidth={1.9} fill={filled ? color : "none"} />
      <Path d="M5.5 19.5c1.5-3 3.8-4.5 6.5-4.5s5 1.5 6.5 4.5" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

export function HeartIcon({ size = 18, color = "#101318", filled = false }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20.2s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 7.5 3.1c0 5.5-7.5 10.1-7.5 10.1Z"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChatIcon({ size = 18, color = "#101318" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 12a8 8 0 0 1-11.6 7.1L4 20l.9-4.4A8 8 0 1 1 20 12Z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BookmarkIcon({ size = 18, color = "#101318", filled = false }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 4.5h11a1 1 0 0 1 1 1v14l-6.5-4-6.5 4v-14a1 1 0 0 1 1-1Z"
        fill={filled ? color : "none"}
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BellIcon({ size = 19, color = "#101318" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 16.5h11l-1.2-2V10a4.3 4.3 0 1 0-8.6 0v4.5l-1.2 2ZM10 19a2 2 0 0 0 4 0" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function MenuIcon({ size = 20, color = "#101318" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="7" x2="20" y2="7" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="4" y1="17" x2="15" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function SendIcon({ size = 18, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 18, color = "#101318" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function ArrowLeftIcon({ size = 20, color = "#101318" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="15 18 9 12 15 6" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function UsersIcon({ size = 19, color = "#101318" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="8.5" r="3" stroke={color} strokeWidth={1.8} />
      <Circle cx="16.5" cy="9.5" r="2.5" stroke={color} strokeWidth={1.8} />
      <Path d="M3.5 18.5c1.2-2.5 3.1-3.8 5.5-3.8s4.3 1.3 5.5 3.8M14.5 18.5c.8-1.8 2.1-2.8 4-2.8 1 0 1.8.3 2.5.9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function GearIcon({ size = 19, color = "#101318" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3.2" stroke={color} strokeWidth={1.9} />
      <Rect x="4.5" y="4.5" width="15" height="15" rx="4.5" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}
