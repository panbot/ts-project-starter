"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bootstrap_1 = require("./bootstrap");
(async () => {
    const app = await bootstrap_1.default();
    app.startFastify();
})().catch(e => {
    console.dir(e, { depth: 5 });
    process.exit(1);
});
//# sourceMappingURL=index.js.map