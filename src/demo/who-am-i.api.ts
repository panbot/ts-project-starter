import { UserContext, Roles } from "../app/security";
import { Api, ApiArg } from "../framework";
import { Runnable } from "../lib/runnable";

@Api({
    doc: `Who am I?`,
})
export class WhoAmI implements Runnable {

    @ApiArg.UserContext()
    uc: UserContext;

    async run(
    ) {
        return {
            userContext: this.uc,
            roles: Roles.nameRoles(this.uc.roles),
        }
    }
}