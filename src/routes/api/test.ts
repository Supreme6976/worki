import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/test')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        console.log("Vercel runtime log test", new Date().toISOString());
        return Response.json({ ok: true });
      },
    },
  },
})
