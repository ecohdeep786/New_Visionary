export function connectionStatus<T>(record: {status:T; expiresAt?:unknown}, at?:number): T | 'expired' | 'unavailable';
