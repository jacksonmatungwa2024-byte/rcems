import { Dispatch, SetStateAction } from "react";

export type TabType =
  | "home"
  | "usajili"
  | "mafunzo"
  | "reports"
  | "messages"
  | "profile";

export type SetActiveTab = Dispatch<SetStateAction<TabType>>;
