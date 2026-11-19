export default {
  async fetch(request: Request): Promise<Response> {
    return new Response("Eksporflow", { status: 200 });
  },
};
