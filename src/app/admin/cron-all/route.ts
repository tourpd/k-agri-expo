export async function GET() {
  console.log("cron-all running");

  return Response.json({ success: true });
}