import { AccessDeniedError, AuthenticationRequiredError } from "./error";

export enum Roles {
    Anonymous = 0,

    // Research = 1, // 投研
    // Market = 2, // 市场

    // Reviewer = 4, // 审核

    // Authenticated = 1,
    // Institution = 2, // 机构投资者
    // Individual = 4, // 个人投资者
    // NetOpen = 8,
    // SMA = 16,

    Super = 65535, // 超级用户
    Cli = 65536 | Roles.Super, // cmd line
}

export namespace Roles {

    export function checkRoles(
        required: Roles | null | undefined,
        provided: Roles,
    ) {
        required = required || 0;
        return (required & provided) == required;
    }

    export function assertRoles(
        required: Roles | null | undefined,
        provided: Roles,
        message?: string,
    ) {
        if (!checkRoles(required, provided)) {
            if (Roles.Anonymous == provided) {
                throw new AuthenticationRequiredError(message);
            } else {
                throw new AccessDeniedError(message);
            }

        }
    }

}

export class UserContext {

    username?: string;

    fullName?: string;

    roles: Roles = Roles.Anonymous;

    ip?: string;

}

// @Service()
// export class SecurityService {

//     extractUserContext(str: unknown): Partial<UserContext> {
//         if (str == null) {
//             return {
//                 roles: Roles.Anonymous,
//             }
//         } else if (typeof str == 'string') {
//             let [ scheme, payload ] = str.split(' ', 2);

//             switch (scheme) {
//                 case 'Bearer':
//                 return this.extractBearer(payload);
//             }
//         }

//         throw new ArgumentError(`auth error: unknown scheme`)
//     }

//     private extractBearer(payload: string) {
//         try {
//             return jwt.decode(payload) as Partial<UserContext>
//         } catch (e) {
//             throw new ArgumentError(`auth error: illegal bearer payload (${e.message})`)
//         }
//     }
// }
