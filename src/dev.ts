import { Roles, UserContext } from "./app";
import { DemoModule, SubDemoModule } from "./demo/module";
import { Container, Tokens } from "./framework";

console.log('dev mode');

Container.get(Tokens.EnabledModules).push(
    SubDemoModule,
    DemoModule,
);

Container.get(Tokens.AuthSchemes)['uid'] = uid => new UserContext({
    uid,
    roles: Roles.Authenticated | Roles.Superuser,
})
