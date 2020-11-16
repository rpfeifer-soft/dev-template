/** @format */

export enum UserRole {
   Guest = 1,
   User = 2,
   Admin = 4
}

export function userRoles(...args: UserRole[]): UserRole {
   // eslint-disable-next-line no-bitwise
   return args.reduce((p, q) => p | q, 0);
}

export function hasRole(role: UserRole, testRole: UserRole): boolean {
   // eslint-disable-next-line no-bitwise
   return (role & testRole) !== 0;
}

export enum Language {
   German = 1,
   English = 2
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor = new (...args: any[]) => any;

export async function timeout(ms: number): Promise<unknown> {
   return new Promise(resolve => setTimeout(resolve, ms));
}
