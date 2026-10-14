import { createContext } from 'react';

// Keep the context identity separate from the provider/hook's hot-reloaded module.
export const AuthContext = createContext(null);
