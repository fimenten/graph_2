export interface Position {
    x: number;
    y: number;
}
export interface PositionNullable {
    x: number | null;
    y: number | null;
}
export interface ActionHistoryItem {
    type: 'add_circle' | 'remove_circle' | 'add_connection' | 'remove_connection';
    data: any;
}
export interface CircleData {
    id: string;
    name: string;
    x: number;
    y: number;
    radius: number;
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
    pageRank?: number;
    rectWidth?: number;
    rectHeight?: number;
}
export interface ConnectionData {
    circleA: CircleData;
    circleB: CircleData;
    k: number;
    dimension?: EdgeDimensionData;
}
export interface EdgeDimensionData {
    id: string;
    name: string;
    color: string;
    isVisible: boolean;
}
export interface GraphData {
    circles: CircleData[];
    connections: ConnectionData[];
}
export interface Node3D {
    id: string;
    name: string;
    val: number;
}
export interface Link3D {
    source: string;
    target: string;
}
export interface Graph3DData {
    nodes: Node3D[];
    links: Link3D[];
}
declare global {
    interface Window {
        ForceGraph3D: any;
        SpriteText: any;
    }
}
export {};
