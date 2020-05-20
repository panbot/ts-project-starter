import { Route, RouteContext } from "../core/route";
import { App } from "../core/app";
import { Inject, Service } from "typedi";
import { Roles } from "../core/auth";

export const API_ENTRY_ROUTE = '/api/:module/:api';

@Service()
export class ApiController {

    @Inject(_ => App)
    private app: App;

    @Route(
        'POST',
        API_ENTRY_ROUTE,
        Roles.Anonymous,
        'application/json',
    )
    api({
        params: { module, api },
        body,
        userContext,
    }: RouteContext) {
        return this.app.run(module, api, userContext, body);
    }
}
