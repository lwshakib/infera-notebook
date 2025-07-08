import { BRAVE_SEARCH_API_ENDPOINT, BRAVE_SEARCH_API_KEY } from "@/lib/config";

interface BraveSearchResult {
  id: string;
  title: string;
  url: string;
  description: string;
  content_type: string;
  meta_url: {
    scheme: string;
  };
}

export async function POST(req: Request) {
  try {
    const { interest } = await req.json();
    const params = new URLSearchParams({
      q: interest.toLowerCase() + " filetype:pdf",
      count: "10",
    });
    const response = await fetch(`${BRAVE_SEARCH_API_ENDPOINT}?${params}`, {
      method: "get",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "x-subscription-token": BRAVE_SEARCH_API_KEY as string,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data = await response.json();
    const sources = data.web.results
      .filter(
        (result: BraveSearchResult) =>
          result?.content_type === "pdf" && result?.meta_url?.scheme === "https"
      )
      .map((result: BraveSearchResult) => ({
        id: result.id,
        title: result.title,
        url: result.url,
        description: result.description,
      }));


    return new Response(
      JSON.stringify({
        success: true,
        message: "Discovering sources based on your interests...",
        sources,
      })
    );
  } catch (error) {
    console.error("Error in discover route:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "An error occurred.",
        error: (error as Error).message,
      }),
      { status: 500 }
    );
  }
}
