import { Route, RouteContext } from "../core/route";
import { App } from "../core/app";
import { Inject, Service } from "typedi";
import { ApiArg } from "../core/api";
import { Roles } from "../core/auth";

@Service()
export class ApiController {

    @Inject(_ => ApiArg)
    private app: App;

    @Route('POST', '/ap/api/:module/:api', Roles.Anonymous, 'application/json')
    api({
        params: { module, api },
        body,
        userContext,
    }: RouteContext) {
        return this.app.run(module, api, userContext, body);
    }
}
