import { RouteContext } from "../core/route";
export declare const API_ENTRY_ROUTE = "/api/:module/:api";
export declare class ApiController {
    private app;
    api({ params: { module, api }, body, userContext, }: RouteContext): Promise<unknown>;
}
