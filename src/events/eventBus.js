const { EventEmitter } = require("node:events");

function createEventBus({ logger = console } = {}) {
    const emitter = new EventEmitter();

    return {
        publish(eventName, payload) {
            const event = {
                name: eventName,
                occurredAt: new Date().toISOString(),
                payload
            };
            emitter.emit(eventName, event);
        },

        subscribe(eventName, handler) {
            emitter.on(eventName, event => {
                Promise.resolve()
                    .then(() => handler(event))
                    .catch(error => {
                        logger.error(
                            `[event:${eventName}] handler failed`,
                            error
                        );
                    });
            });
        }
    };
}

const noopEventBus = {
    publish() {},
    subscribe() {}
};

module.exports = {
    createEventBus,
    noopEventBus
};
