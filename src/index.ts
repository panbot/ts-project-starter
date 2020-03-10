import bootstrap from './bootstrap';

(async () => {

    const app = await bootstrap();

    app.startFastify();

})().catch(e => {
    console.dir(e, { depth: 5 });
    process.exit(1);
});
