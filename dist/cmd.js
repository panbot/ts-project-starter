"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bootstrap_1 = require("./bootstrap");
const auth_1 = require("./core/auth");
(async () => {
    const app = await bootstrap_1.default();
    console.dir(await app.run(process.argv[2], process.argv[3], { uid: 'root', name: 'cmd line user', roles: auth_1.Roles.Super }, JSON.parse(process.argv[4] || '{}')), { depth: 5 });
    process.exit(0);
})().catch(e => {
    console.dir(e, { depth: 5 });
    process.exit(1);
});
//# sourceMappingURL=cmd.js.map