import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Server-only environment variables.
	 */
	server: {
		NODE_ENV: z
			.enum(["development", "production", "staging"])
			.default("development"),
		PORT: z.coerce.number().optional(),
		CORS_ORIGIN: z.url()
	},

	/**
	 * No client variables here.
	 */
	client: {},

	/**
	 * Required field for @t3-oss/env-core — even if empty.
	 */
	clientPrefix: "",

	/**
	 * Pass process.env so it can read from your runtime environment.
	 */
	runtimeEnv: process.env,

	/**
	 * Optional: treat empty strings as undefined.
	 */
	emptyStringAsUndefined: true,
});