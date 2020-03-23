import { AccessDeniedError, ArgumentError } from "./error";
import { InjectParam } from "./parameter";
import { jwt } from "./connectors";

export enum Roles {
    Anonymous = 0,
    Authenticated = 1,
    Game = 2,
    CMS = 4,
    Super = 1023,
}

export type UserContext = {
    uid?: string,
    name?: string,
    roles: Roles,
}

export class AuthService {

    @InjectParam(p => p.auth.dev)
    private dev: {
        [ key: string ]: UserContext,
    };

    assertRoles(required: Roles, provided: Roles) {
        if (required && !(required & provided)) throw new AccessDeniedError(
            `insufficient permissions`
        );
    }

    extractUserContext(str: string | undefined): UserContext {
        if (str == null) return {
            roles: Roles.Anonymous,
        }

        let [ scheme, payload ] = str.split(' ', 2);

        switch (scheme) {
            case 'Bearer':
            return this.extractBearer(payload);

            case 'dev':
            if (!this.dev) throw new ArgumentError(`unknown scheme "dev"`);
            const ctx = this.dev[payload];
            if (!ctx) throw new ArgumentError(`dev auth "${payload}" not found`);
            return this.dev[payload];

            case 'uid':
            if (!this.dev) throw new ArgumentError(`unknown scheme "uid"`);
            return {
                uid: payload,
                roles: Roles.Authenticated | Roles.Game,
            }

            default: throw new ArgumentError(`unknown scheme "${scheme}"`);
        }
    }

    private extractBearer(payload: string) {
        let o: any = jwt.decode(payload);

        if (o.uid && o.roles) return o as UserContext;

        if (o.user_id) return {
            uid: o.user_id,
            roles: Roles.Authenticated & Roles.Game,
        }

        throw new ArgumentError(`unknown bearer payload`);
    }
}
