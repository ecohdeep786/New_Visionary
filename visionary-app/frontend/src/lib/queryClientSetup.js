/* The real query client — lives in its own chunk so @tanstack/query-core
 * and react-query stay out of the entry graph. query-client.js dynamically
 * imports this module on first need (the dashboard provider chunk pulls the
 * same module, so there is no extra round trip on dashboard navigation). */
import { QueryClient } from '@tanstack/react-query';
import { setQueryClient } from './query-client';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			// Cache data for 5 minutes to avoid unnecessary refetches on quick navigation
			staleTime: 5 * 60 * 1000,
			gcTime: 10 * 60 * 1000,
		},
	},
});

setQueryClient(queryClientInstance);
