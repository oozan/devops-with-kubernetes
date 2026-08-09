const { connect, StringCodec } = require("nats");

const NATS_URL = process.env.NATS_URL;
const NATS_SUBJECT = process.env.NATS_SUBJECT;
const NATS_QUEUE = process.env.NATS_QUEUE;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const BROADCAST_MODE = process.env.BROADCAST_MODE || "forward";
const stringCodec = StringCodec();

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const run = async () => {
  while (true) {
    try {
      const connection = await connect({
        servers: NATS_URL,
        maxReconnectAttempts: -1,
        reconnectTimeWait: 1000,
      });
      const subscription = connection.subscribe(NATS_SUBJECT, {
        queue: NATS_QUEUE,
      });

      console.log(
        `Broadcaster subscribed to ${NATS_SUBJECT} in queue ${NATS_QUEUE}`
      );

      const shutDown = async () => {
        await connection.drain();
        process.exit(0);
      };

      process.once("SIGTERM", shutDown);
      process.once("SIGINT", shutDown);

      for await (const message of subscription) {
        try {
          const event = JSON.parse(stringCodec.decode(message.data));
          const payload = {
            user: event.user || "bot",
            message: event.message,
          };

          if (BROADCAST_MODE === "log") {
            console.log(`Staging event: ${JSON.stringify(payload)}`);
            continue;
          }

          const response = await fetch(WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`Webhook returned HTTP ${response.status}`);
          }

          console.log(`Forwarded ${event.type} for todo ${event.todo.id}`);
        } catch (error) {
          console.error(`Unable to forward Todo event: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`Broadcaster connection failed: ${error.message}`);
      await sleep(3000);
    }
  }
};

run();
