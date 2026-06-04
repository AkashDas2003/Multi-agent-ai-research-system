from agents import build_search_agent, build_reader_agent, build_writer_agent, build_critic_agent
from tools import extract_url_info
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
def invoke_with_retry(agent, input_data):
    """Helper function to invoke agents with exponential backoff retry logic."""
    try:
        return agent.invoke(input_data)
    except Exception as e:
        # If we reach here, all providers in the fallback chain (agents.py) have failed.
        raise e

def extract_urls(text: str) -> list:
    """Extract URLs from text."""
    url_pattern = r'https?://[^\s)"\']+'
    return re.findall(url_pattern, text)

def run_research_pipeline(topic: str):
    """
    Run research pipeline with 4 phases:
    1. Search - Get research text results (no URLs shown)
    2. Extract URLs from search results
    3. Deep Research - Scrape URLs for deeper content
    4. Write & Critic - Synthesize and evaluate
    
    Args:
        topic: Research topic
    """
    state = {}

    # PHASE 1: SEARCH - Get research results as text only
    print("\n" + "=" * 60 + "\n")
    print("PHASE 1 - SEARCH: Researching Topic (Text Results Only)")
    print("=" * 60 + "\n")

    search_agent = build_search_agent()
    
    search_results = invoke_with_retry(search_agent,
        {
            "messages": [
                {
                    "role": "user",
                    "content": (
                        f"Search for recent and relevant information on: {topic}\n"
                        f"Return titles, URLs, and snippets with key information. "
                        f"Focus on text content, statistics, and findings."
                    ),
                }
            ]
        }
    )

    # Robust model extraction: checks both 'model_name' (OpenAI/Google) and 'model' (Groq/Mistral)
    last_msg = search_results["messages"][-1]
    used_model = (
        last_msg.response_metadata.get("model_name") or 
        last_msg.response_metadata.get("model") or 
        "Unknown Model"
    )
    print(f"[SYSTEM] Provider active: {used_model}")

    state["search_results"] = last_msg.content
    print("Search Results (Text Content):\n")
    print(state["search_results"][:800] + "..." if len(state["search_results"]) > 800 else state["search_results"])

    # PHASE 2: EXTRACT URLs from search results
    print("\n" + "=" * 60 + "\n")
    print("PHASE 2 - EXTRACT: Extracting URLs from Search Results")
    print("=" * 60 + "\n")

    urls = extract_urls(state["search_results"])
    print(f"\nExtracted {len(urls)} URLs from search results:")
    for i, url in enumerate(urls, 1):
        print(f"  {i}. {url}")

    if not urls:
        print("\nNo URLs found in search results.")
        return state

    # PHASE 3: DEEP RESEARCH - Scrape URLs for deeper content
    print("\n" + "=" * 60 + "\n")
    print("PHASE 3 - DEEP RESEARCH: Scraping URLs for Detailed Content")
    print("=" * 60 + "\n")

    reader_agent = build_reader_agent()
    scraped_content = []

    print(f"Executing parallel scrape for {len(urls)} URLs...")
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_url = {executor.submit(extract_url_info.invoke, url): url for url in urls}
        for future in as_completed(future_to_url):
            url = future_to_url[future]
            try:
                content = future.result()
                scraped_content.append(content)
                print(f"✓ Successfully extracted: {url}")
            except Exception as e:
                print(f"✗ Error scraping {url}: {e}")

    state["scraped_content"] = "\n\n" + "="*60 + "\n".join(scraped_content)
    
    print("\n" + "=" * 60 + "\n")
    print("Read Agent - Analyzing Deep Content")
    print("=" * 60 + "\n")

    # Reader agent analyzes the scraped content
    reader_results = invoke_with_retry(reader_agent,
        {
            "messages": [
                {
                    "role": "user",
                    "content": (
                        f"Analyze the following deep-scraped web content on '{topic}':\n\n"
                        f"{state['scraped_content']}\n\n"
                        f"Extract and summarize:\n"
                        f"- Main claims and key findings\n"
                        f"- Statistics and evidence\n"
                        f"- Limitations and caveats\n"
                        f"Ignore advertisements and navigation content."
                    ),
                }
            ]
        }
    )

    # Robust model extraction for Reader phase
    last_msg = reader_results["messages"][-1]
    used_model = (
        last_msg.response_metadata.get("model_name") or 
        last_msg.response_metadata.get("model") or 
        "Unknown Model"
    )
    print(f"[SYSTEM] Provider active: {used_model}")

    state["reader_analysis"] = last_msg.content
    print("Reader Analysis Output:\n", state["reader_analysis"][:600] + "..." if len(state["reader_analysis"]) > 600 else state["reader_analysis"])

    # PHASE 4: WRITE - Synthesize into structured report
    print("\n" + "=" * 60 + "\n")
    print("PHASE 4 - WRITE: Synthesizing Final Report")
    print("=" * 60 + "\n")

    writer_agent = build_writer_agent()

    writer_results = invoke_with_retry(writer_agent,
        {
            "info": state["reader_analysis"]
        }
    )

    state["final_report"] = writer_results
    print("\nFinal Report Generated:")
    print(f"\n📋 Executive Summary:\n{writer_results.executive_summary}\n")
    print(f"🔍 Key Findings:")
    for finding in writer_results.key_findings:
        print(f"  • {finding.finding}")
        print(f"    Confidence: {finding.confidence}")
        print(f"    Evidence: {finding.supporting_evidence}\n")
    print(f"📊 Detailed Analysis:\n{writer_results.detailed_analysis[:400]}...\n")
    print(f"⚠️  Limitations:\n{writer_results.limitations}\n")
    print(f"✅ Conclusion:\n{writer_results.final_conclusion}\n")

    # PHASE 5: CRITIC - Evaluate quality
    print("\n" + "=" * 60 + "\n")
    print("PHASE 5 - CRITIC: Evaluating Report Quality")
    print("=" * 60 + "\n")

    critic_agent = build_critic_agent()

    critic_output = invoke_with_retry(critic_agent,
        {
            "report": str(state["final_report"])
        }
    )

    # Extract critique and provider metadata
   # ✅ REPLACE WITH THIS:
    critic_results = critic_output

    state["critique"] = critic_results
    
    print(f"\n{'='*60}")
    print(f"QUALITY ASSESSMENT")
    print(f"{'='*60}")
    print(f"\nQuality Score: {state['critique'].score}/10")
    print(f"Verdict: {state['critique'].verdict}\n")
    print(f"✓ Strengths:")
    for strength in state['critique'].strengths:
        print(f"  • {strength}")
    print(f"\n✗ Weaknesses:")
    for weakness in state['critique'].weaknesses:
        print(f"  • {weakness}")
    print(f"\n→ Areas for Improvement:")
    for improvement in state['critique'].areas_for_improvement:
        print(f"  • {improvement}")
    print(f"{'='*60}\n")

    return state


if __name__ == "__main__":
    topic = "Indian Stock Market Condition in 2026."
    results = run_research_pipeline(topic)
    
    print("\n" + "=" * 60)
    print("RESEARCH PIPELINE COMPLETE")
    print("=" * 60)