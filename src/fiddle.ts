import './bootstrap';
import * as path from 'path';
import Container from 'typedi';
import { run } from './framework/connectors';
// import { App } from './framework/app';

let file = process.argv[2];
if (!file) {
    console.error(`usage: <fiddle file path>`);
    process.exit(1);
}

(async () => {

    // const app = Container.get(App);
    // await app.loadModules([
    // ]);
    // await app.initModules();

    console.dir(
        await run(Container.get(require(path.join(process.cwd(), file)).default)),
        {

        }
    );

    process.exit(0);

})().catch(e => {
    console.dir(e, { depth: 5 });
    process.exit(1);
});
