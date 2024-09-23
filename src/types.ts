// src/types.ts

import { Circle } from "./models/Circle";
import { Connection } from "./models/Connection";

export interface Position {
    x: number | null;
    y: number | null;
  }
  
  export interface ActionHistoryItem {
    type: ActionType;
    circle?: Circle;
    connection?: Connection;
    oldName?: string;
    newName?: string;
  }
  
  export type ActionType =
    | "addCircle"
    | "removeCircle"
    | "renameCircle"
    | "addConnection"
    | "removeConnection"
    | "changeColor"
    | "resetCanvas";
  