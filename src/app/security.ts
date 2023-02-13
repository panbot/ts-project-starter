import { UserContextGeneric } from "../lib/framework/types";
import RolesFactory from '../lib/framework/roles';

export const Roles = RolesFactory({
    // roles for your awesome project

});

export class UserContext implements UserContextGeneric {

    roles: number = Roles.Anonymous;

    constructor(data?: any) {
        Object.assign(this, data);
    }

    // user context properties for your awesome project
    uid?: string;
}
