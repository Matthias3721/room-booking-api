const { createEventBus } = require("../../src/events/eventBus");

test("listener error is isolated from publisher", async () => {
    const logger = { error: jest.fn() };
    const eventBus = createEventBus({ logger });
    eventBus.subscribe("demo", async () => {
        throw new Error("listener failed");
    });

    expect(() => eventBus.publish("demo", { id: 1 })).not.toThrow();
    await new Promise(resolve => setImmediate(resolve));
    expect(logger.error).toHaveBeenCalled();
});
