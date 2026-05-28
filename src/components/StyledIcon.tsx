import Feather from "@expo/vector-icons/Feather";
import { withUniwind } from "uniwind";

export type StyledIcon = keyof typeof Feather.glyphMap;
export const StyledIcon = withUniwind(Feather);
