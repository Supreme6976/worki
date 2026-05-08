import { handler } from '../dist/server/server.js';

export default async function (req, res) {
  // Prilagođavanje Vercel req/res objekata u Web Standards Request/Response
  // koje TanStack Start očekuje.
  return handler(req, res);
}
