import { SessionEventPayload } from "@truststream/shared";
import { FastifyReply } from "fastify";

type Client = {
  reply: FastifyReply;
  sessionId: string;
};

export class SseHub {
  private clients = new Set<Client>();

  addClient(sessionId: string, reply: FastifyReply) {
    this.clients.add({ sessionId, reply });
  }

  removeClient(reply: FastifyReply) {
    const client = Array.from(this.clients).find((entry) => entry.reply === reply);
    if (client) this.clients.delete(client);
  }

  emit(sessionId: string, payload: SessionEventPayload) {
    const data = `event: ${payload.event}\ndata: ${JSON.stringify(payload)}\n\n`;
    this.clients.forEach((client) => {
      if (client.sessionId === sessionId) {
        client.reply.raw.write(data);
      }
    });
  }
}
