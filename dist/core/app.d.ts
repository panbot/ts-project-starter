import { ModuleType } from './module';
import { UserContext } from './auth';
import { ApiType } from './api';
export declare class App {
    private fastifyOptions;
    private Modules;
    private moduleService;
    private apiService;
    private routeService;
    private authService;
    loadModules(Modules: ModuleType[]): Promise<void>;
    run(module: string, api: string, userContext: UserContext, args: Object): Promise<unknown>;
    runApi(Api: ApiType, userContext: UserContext, args: Object): Promise<unknown>;
    startFastify(): void;
}
