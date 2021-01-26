import './bootstrap';
import * as path from 'path';
import Container from 'typedi';
import { run } from './framework';

process.on('uncaughtException', e => console.error(e));

let file = process.argv[2];
if (!file) {
    console.error(`usage: <fiddle file path>`);
    process.exit(1);
}

run(
    Container.get(require(path.join(process.cwd(), file)).default),
).catch(e => {
    console.error(e);
    process.exit(1);
});
