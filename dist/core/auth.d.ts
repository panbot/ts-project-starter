export declare enum Roles {
    Anonymous = 0,
    Authenticated = 1,
    Game = 2,
    CMS = 4,
    Super = 1023
}
export declare type UserContext = {
    uid?: string;
    name?: string;
    roles: Roles;
};
export declare class AuthService {
    private dev;
    assertRoles(required: Roles, provided: Roles): void;
    extractUserContext(str: string | undefined): UserContext;
    private extractBearer;
}
