export function getAuthToken(): Promise<string | null>;
export function setAuthToken(token: string): Promise<void>;
export function removeAuthToken(): Promise<void>; 