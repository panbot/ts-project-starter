import { UserContext, Roles } from "./app/security";
import { DemoModule, SubDemoModule } from "./demo/module";
import { Container, Tokens } from "./framework";

console.log('dev mode enabled');

Container.get(Tokens.EnabledModules).push(
    SubDemoModule,
    DemoModule,
);

Container.get(Tokens.AuthSchemes)['uid'] = uid => new UserContext({
    uid,
    roles: Roles.Authenticated | Roles.Superuser,
})
