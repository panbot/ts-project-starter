import bootstrap from './bootstrap';

import { Roles } from "./framework/auth";

(async () => {

    const app = await bootstrap();

    console.dir(
        await app.run(
            process.argv[2], process.argv[3],
            { uid: 'root', name: 'cmd line user', roles: Roles.Super },
            JSON.parse(process.argv[4] || '{}'),
        ),
        { depth: 5 },
    );

    process.exit(0);

})().catch(e => {
    console.dir(e, { depth: 5 });
    process.exit(1);
});
