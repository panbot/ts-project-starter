import { Roles, UserContext } from "../app/security";
import { Api, ApiArg } from "../framework";
import { Runnable } from "../lib/runnable";

@Api({ doc: 'Who am I?'})
export class WhoAmI implements Runnable {

    @ApiArg.UserContext()
    uc: UserContext;

    async run() {
        return {
            ...this.uc,
            authenticated: Roles.checkRoles(Roles.Authenticated, this.uc.roles),
            roleNames: Roles.nameRoles(this.uc.roles),
        }
    }
}