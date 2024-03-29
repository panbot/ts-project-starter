
let initiated = false;
let procedures: (() => void)[] = [];

export default {

    register: (p: () => void) => procedures.push(p),

    initiate() {
        let p: any;
        while (p = procedures.pop()) {
            try {
                p();
            } catch (e) {
                console.error(e);
            }
        }
    },

    listen(signals: string[] = ['SIGTERM', 'SIGINT']) {
        if (!initiated) {
            initiated = true;

            signals.forEach(s => process.on(s, () => {
                console.info(
                    `Shutting down gracefullly on ${s} at`,
                    new Date().toISOString(),
                );

                this.initiate();
            }));
        }
    }
}