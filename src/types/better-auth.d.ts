declare module "better-auth" {
  export type BetterAuthPlugin = Record<string, unknown>;
  export function betterAuth(...args: any[]): any;
}

declare module "better-auth/api" {
  export function createAuthMiddleware(handler: any): any;
  export function getSessionFromCtx(ctx: any): Promise<any>;
}

declare module "better-auth/cookies" {
  export function parseSetCookieHeader(value: string): any;
  export function setRequestCookie(headers: Headers, name: string, value: string): void;
  export function setSessionCookie(ctx: any, sessionData: any): Promise<void>;
}

declare module "better-auth/oauth2" {
  export function handleOAuthUserInfo(ctx: any, input: any): Promise<any>;
}

declare module "better-auth/plugins" {
  export function bearer(...args: any[]): any;
  export function genericOAuth(...args: any[]): any;
}

declare module "better-auth/react" {
  export function createAuthClient(config: any): any;
}

declare module "better-auth/client/plugins" {
  export function genericOAuthClient(...args: any[]): any;
}

declare module "better-auth/tanstack-start" {
  export function tanstackStartCookies(...args: any[]): any;
}
