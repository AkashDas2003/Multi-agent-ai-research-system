from langchain.tools import tool
import requests
from bs4 import BeautifulSoup
from tavily import TavilyClient
import os
from dotenv import load_dotenv
load_dotenv()
from rich import print
tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

@tool
def web_search(query: str) -> str:
    """
    Search the web for recent and relevant information on a topic. Returns titles, urls and snippets.
    """
    results = tavily.search(
        query=query,
        max_results=5
    )

    hits = []
    if isinstance(results, dict):
        hits = results.get("results", [])
    elif isinstance(results, list):
        hits = results
    else:
        return str(results)

    out = []
    for r in hits:
        if isinstance(r, dict):
            title = r.get("title", "(no title)")
            url = r.get("url", "(no url)")
            content = r.get("content") or r.get("raw_content") or ""
            out.append(f"Title: {title}\nURL: {url}\nSnippet: {content}\n")
        else:
            out.append(str(r))

    return "\n -----\n".join(out) if out else str(results)

@tool
def extract_url_info(url: str) -> str:
    """
    Fetch the provided URL and extract useful page information using BeautifulSoup.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    }
    try:
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
    except Exception as exc:
        return f"Error fetching URL {url}: {exc}"

    soup = BeautifulSoup(response.text, "lxml")

    title = soup.title.string.strip() if soup.title and soup.title.string else "(no title)"
    description = ""
    description_meta = soup.find("meta", attrs={"name": "description"})
    if description_meta and description_meta.get("content"):
        description = description_meta["content"].strip()
    else:
        description_meta = soup.find("meta", attrs={"property": "og:description"})
        if description_meta and description_meta.get("content"):
            description = description_meta["content"].strip()

    paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p") if p.get_text(strip=True)]
    top_paragraphs = "\n\n".join(paragraphs[:5]) if paragraphs else "(no paragraph text found)"

    return (
        f"URL: {url}\n"
        f"Title: {title}\n"
        f"Description: {description or '(no description)'}\n\n"
        f"Top Content:\n{top_paragraphs}"
    )

if __name__ == "__main__":
    print(web_search.invoke("what is the present situation of Inidan IT job market?"))
    print("\n=== URL extractor test ===\n")
    print(extract_url_info.invoke("https://www.qs.com/insights/us-and-indian-job-markets-most-prepared-for-future-of-work"))
    