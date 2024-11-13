export interface FileResponse {
    name: string;
    lastModified: string;
    thumbnailUrl: string;
    version: string;
    document: Node;
    components: Record<string, ComponentMetadata>;
    schemaVersion: number;
    styles: Record<string, StyleMetadata>;
}
export interface Node {
    id: string;
    name: string;
    type: string;
    children?: Node[];
}
export interface Component {
    id: string;
    name: string;
}
export interface ComponentMetadata {
    key: string;
    name: string;
    description: string;
    documentationLinks: DocumentationLink[];
}
export interface DocumentationLink {
    uri: string;
}
export interface StyleMetadata {
    key: string;
    name: string;
    description: string;
    styleType: string;
}
export interface ImagesResponse {
    err?: string;
    images: Record<string, string>;
}
