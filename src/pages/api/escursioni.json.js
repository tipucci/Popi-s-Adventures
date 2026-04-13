import { getCsvUrl, getEscursioniApiData } from "../../data/escursioni.js";

export const prerender = true;

export async function GET() {
  const escursioni = await getEscursioniApiData();

  return new Response(
    JSON.stringify(
      {
        source: getCsvUrl(),
        count: escursioni.length,
        items: escursioni
      },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300"
      }
    }
  );
}
