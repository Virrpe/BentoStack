import type { SlotConfig } from './types';

export const DEFAULT_SLOTS: SlotConfig[] = [
	{
		id: 'frontend',
		category: 'Frontend',
		label: 'Frontend Framework',
		description: 'Choose your UI framework',
		defaultTool: 'sveltekit'
	},
	{
		id: 'auth',
		category: 'Auth',
		label: 'Authentication',
		description: 'User auth & session management',
		defaultTool: 'lucia'
	},
	{
		id: 'database',
		category: 'Database',
		label: 'Database',
		description: 'Data persistence layer',
		defaultTool: 'turso'
	},
	{
		id: 'orm',
		category: 'ORM',
		label: 'ORM/Query Builder',
		description: 'Database abstraction',
		defaultTool: 'drizzle'
	}
];
