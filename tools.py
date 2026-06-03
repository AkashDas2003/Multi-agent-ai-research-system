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

if __name__ == "__main__":
    print(web_search.invoke("what is the present situation of job marker in IT sector in India?"))
    