
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```sh
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const KDE_FULL_SESSION: string;
	export const VSCODE_CWD: string;
	export const VSCODE_ESM_ENTRYPOINT: string;
	export const LC_TIME: string;
	export const USER: string;
	export const VSCODE_NLS_CONFIG: string;
	export const CLAUDE_CODE_ENTRYPOINT: string;
	export const npm_config_user_agent: string;
	export const VSCODE_HANDLES_UNCAUGHT_ERRORS: string;
	export const XDG_SEAT: string;
	export const GIT_EDITOR: string;
	export const XDG_SESSION_TYPE: string;
	export const npm_node_execpath: string;
	export const QT_WAYLAND_RECONNECT: string;
	export const CLAUDE_AGENT_SDK_VERSION: string;
	export const SHLVL: string;
	export const CHROME_DESKTOP: string;
	export const HOME: string;
	export const KDE_APPLICATIONS_AS_SCOPE: string;
	export const OLDPWD: string;
	export const DESKTOP_SESSION: string;
	export const npm_package_json: string;
	export const VSCODE_IPC_HOOK: string;
	export const COREPACK_ROOT: string;
	export const GTK_RC_FILES: string;
	export const KDE_SESSION_VERSION: string;
	export const XDG_SEAT_PATH: string;
	export const LC_MONETARY: string;
	export const MANAGERPID: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const SSH_ASKPASS: string;
	export const SYSTEMD_EXEC_PID: string;
	export const POSTHOG_API_KEY: string;
	export const VSCODE_CRASH_REPORTER_PROCESS_TYPE: string;
	export const WAYLAND_DISPLAY: string;
	export const XKB_DEFAULT_LAYOUT: string;
	export const APPLICATION_INSIGHTS_NO_STATSBEAT: string;
	export const VSCODE_L10N_BUNDLE_LOCATION: string;
	export const COREPACK_ENABLE_DOWNLOAD_PROMPT: string;
	export const LOGNAME: string;
	export const pnpm_config_verify_deps_before_run: string;
	export const JOURNAL_STREAM: string;
	export const _: string;
	export const MEMORY_PRESSURE_WATCH: string;
	export const XDG_SESSION_CLASS: string;
	export const npm_config_registry: string;
	export const XDG_SESSION_ID: string;
	export const OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
	export const FC_FONTATIONS: string;
	export const GTK2_RC_FILES: string;
	export const npm_config_node_gyp: string;
	export const PATH: string;
	export const INVOCATION_ID: string;
	export const SESSION_MANAGER: string;
	export const npm_package_name: string;
	export const NODE: string;
	export const GDK_BACKEND: string;
	export const LC_ADDRESS: string;
	export const XDG_MENU_PREFIX: string;
	export const XDG_RUNTIME_DIR: string;
	export const XDG_SESSION_PATH: string;
	export const XKB_DEFAULT_MODEL: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const npm_config_frozen_lockfile: string;
	export const DISPLAY: string;
	export const ICEAUTHORITY: string;
	export const LANG: string;
	export const LC_TELEPHONE: string;
	export const XDG_CURRENT_DESKTOP: string;
	export const NoDefaultCurrentDirectoryInExePath: string;
	export const XAUTHORITY: string;
	export const XDG_SESSION_DESKTOP: string;
	export const npm_lifecycle_script: string;
	export const SSH_AUTH_SOCK: string;
	export const LC_NAME: string;
	export const SHELL: string;
	export const npm_package_version: string;
	export const npm_lifecycle_event: string;
	export const npm_config_verify_deps_before_run: string;
	export const NODE_PATH: string;
	export const QT_ACCESSIBILITY: string;
	export const ELECTRON_RUN_AS_NODE: string;
	export const CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING: string;
	export const npm_config_npm_globalconfig: string;
	export const LC_MEASUREMENT: string;
	export const CLAUDECODE: string;
	export const GPG_AGENT_INFO: string;
	export const LC_IDENTIFICATION: string;
	export const XDG_VTNR: string;
	export const npm_config_globalconfig: string;
	export const PWD: string;
	export const VSCODE_CLI: string;
	export const npm_execpath: string;
	export const VSCODE_CODE_CACHE_PATH: string;
	export const XDG_CONFIG_DIRS: string;
	export const XDG_DATA_DIRS: string;
	export const LC_NUMERIC: string;
	export const npm_config__jsr_registry: string;
	export const npm_command: string;
	export const PNPM_SCRIPT_SRC_DIR: string;
	export const KDE_SESSION_UID: string;
	export const LC_PAPER: string;
	export const ELECTRON_NO_ATTACH_CONSOLE: string;
	export const MEMORY_PRESSURE_WRITE: string;
	export const VSCODE_PID: string;
	export const INIT_CWD: string;
	export const NODE_ENV: string;
}

/**
 * Similar to [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		KDE_FULL_SESSION: string;
		VSCODE_CWD: string;
		VSCODE_ESM_ENTRYPOINT: string;
		LC_TIME: string;
		USER: string;
		VSCODE_NLS_CONFIG: string;
		CLAUDE_CODE_ENTRYPOINT: string;
		npm_config_user_agent: string;
		VSCODE_HANDLES_UNCAUGHT_ERRORS: string;
		XDG_SEAT: string;
		GIT_EDITOR: string;
		XDG_SESSION_TYPE: string;
		npm_node_execpath: string;
		QT_WAYLAND_RECONNECT: string;
		CLAUDE_AGENT_SDK_VERSION: string;
		SHLVL: string;
		CHROME_DESKTOP: string;
		HOME: string;
		KDE_APPLICATIONS_AS_SCOPE: string;
		OLDPWD: string;
		DESKTOP_SESSION: string;
		npm_package_json: string;
		VSCODE_IPC_HOOK: string;
		COREPACK_ROOT: string;
		GTK_RC_FILES: string;
		KDE_SESSION_VERSION: string;
		XDG_SEAT_PATH: string;
		LC_MONETARY: string;
		MANAGERPID: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		SSH_ASKPASS: string;
		SYSTEMD_EXEC_PID: string;
		POSTHOG_API_KEY: string;
		VSCODE_CRASH_REPORTER_PROCESS_TYPE: string;
		WAYLAND_DISPLAY: string;
		XKB_DEFAULT_LAYOUT: string;
		APPLICATION_INSIGHTS_NO_STATSBEAT: string;
		VSCODE_L10N_BUNDLE_LOCATION: string;
		COREPACK_ENABLE_DOWNLOAD_PROMPT: string;
		LOGNAME: string;
		pnpm_config_verify_deps_before_run: string;
		JOURNAL_STREAM: string;
		_: string;
		MEMORY_PRESSURE_WATCH: string;
		XDG_SESSION_CLASS: string;
		npm_config_registry: string;
		XDG_SESSION_ID: string;
		OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
		FC_FONTATIONS: string;
		GTK2_RC_FILES: string;
		npm_config_node_gyp: string;
		PATH: string;
		INVOCATION_ID: string;
		SESSION_MANAGER: string;
		npm_package_name: string;
		NODE: string;
		GDK_BACKEND: string;
		LC_ADDRESS: string;
		XDG_MENU_PREFIX: string;
		XDG_RUNTIME_DIR: string;
		XDG_SESSION_PATH: string;
		XKB_DEFAULT_MODEL: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		npm_config_frozen_lockfile: string;
		DISPLAY: string;
		ICEAUTHORITY: string;
		LANG: string;
		LC_TELEPHONE: string;
		XDG_CURRENT_DESKTOP: string;
		NoDefaultCurrentDirectoryInExePath: string;
		XAUTHORITY: string;
		XDG_SESSION_DESKTOP: string;
		npm_lifecycle_script: string;
		SSH_AUTH_SOCK: string;
		LC_NAME: string;
		SHELL: string;
		npm_package_version: string;
		npm_lifecycle_event: string;
		npm_config_verify_deps_before_run: string;
		NODE_PATH: string;
		QT_ACCESSIBILITY: string;
		ELECTRON_RUN_AS_NODE: string;
		CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING: string;
		npm_config_npm_globalconfig: string;
		LC_MEASUREMENT: string;
		CLAUDECODE: string;
		GPG_AGENT_INFO: string;
		LC_IDENTIFICATION: string;
		XDG_VTNR: string;
		npm_config_globalconfig: string;
		PWD: string;
		VSCODE_CLI: string;
		npm_execpath: string;
		VSCODE_CODE_CACHE_PATH: string;
		XDG_CONFIG_DIRS: string;
		XDG_DATA_DIRS: string;
		LC_NUMERIC: string;
		npm_config__jsr_registry: string;
		npm_command: string;
		PNPM_SCRIPT_SRC_DIR: string;
		KDE_SESSION_UID: string;
		LC_PAPER: string;
		ELECTRON_NO_ATTACH_CONSOLE: string;
		MEMORY_PRESSURE_WRITE: string;
		VSCODE_PID: string;
		INIT_CWD: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
