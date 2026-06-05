import os
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_mistralai import ChatMistralAI
from dotenv import load_dotenv
from langchain.agents import create_agent 
from tools import web_search, extract_url_info
# from langchain.output_parsers import  StructuredOutputParser
from pydantic import BaseModel ,Field
from typing import List
from enum import Enum
load_dotenv()

def get_llm():
    """Returns a prioritized fallback LLM stack based on strict priority: OpenAI -> Gemini -> Groq -> Mistral."""
    llms = []
    
    # 1. OpenAI
    if os.getenv("OPENAI_API_KEY"):
        llms.append(ChatOpenAI(model="gpt-4o-mini", temperature=0))
    
    # 2. Gemini (Fallback if OpenAI fails or has no quota)
    gemini_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if gemini_key:
        llms.append(ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            temperature=0,
            google_api_key=gemini_key
        ))
        
    # 3. Groq (Fallback if Gemini fails)
    if os.getenv("GROQ_API_KEY"):
        llms.append(ChatGroq(model="llama-3.3-70b-versatile", temperature=0))
        
    # 4. Mistral (Fallback if Groq fails)
    if os.getenv("MISTRAL_API_KEY"):
        llms.append(ChatMistralAI(model="mistral-large-latest", temperature=0))

    if not llms:
        raise ValueError("No API keys found for OpenAI, Gemini, Groq, or Mistral.")

    print(f"[SYSTEM] LLM Stack Initialized: {' -> '.join([type(l).__name__ for l in llms])}")
    
    primary = llms[0]
    return primary.with_fallbacks(llms[1:]) if len(llms) > 1 else primary

agent_llm = get_llm()
writer_llm = get_llm()
critic_llm = get_llm()

class ConfidenceLevel(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
class Finding(BaseModel):
    finding: str = Field(description="A key research finding")
    confidence: ConfidenceLevel
    supporting_evidence: List[str] = Field(
        description="Sources or evidence supporting the finding"
    )

class ResearchReport(BaseModel):
    executive_summary: str = Field(
        description="Concise overview of the most important findings"
    )

    key_findings: List[Finding] = Field(
        description="Primary findings extracted from the research"
    )

    detailed_analysis: str = Field(
        description="Comprehensive synthesis and analysis"
    )

    limitations: str = Field(
        description="Research limitations and uncertainties"
    )

    final_conclusion: str = Field(
        description="Most evidence-supported conclusion"
    )

#1st Agent: Search Agent - can search the web for recent and relevant information on a topic. Returns titles, urls and snippets.
def build_search_agent():
    return create_agent(
        model=agent_llm,
        tools=[web_search],
        system_prompt="""
You are a Research Search Agent.

Responsibilities:
- Find authoritative sources
- Prefer recent information
- Gather statistics and evidence
- Avoid duplicate sources
- Return concise findings
- IMPORTANT: Always include the source URLs for every finding so they can be processed by follow-up agents.
"""
    )

#2nd Agent: URL Info Agent - can fetch the provided URL and extract useful page information using BeautifulSoup.
def build_reader_agent():
    return create_agent(
        model=agent_llm,
        tools=[extract_url_info],
        system_prompt="""
You are a Research Source Analysis Agent.

Extract:
- Main claims
- Key findings
- Statistics
- Evidence
- Limitations

Ignore advertisements and navigation content.
"""
    )

writer_prompt = ChatPromptTemplate.from_messages([
(
"system",
"""
You are an Expert Research Synthesis Agent responsible for producing the final report from information collected by multiple research agents.

Your objective is to transform fragmented, overlapping, and potentially conflicting information into a clear, accurate, evidence-based, and actionable report.

Core Responsibilities:

1. Analyze all provided information thoroughly.
2. Extract the most important facts, findings, insights, and conclusions.
3. Merge related information into a coherent narrative.
4. Remove duplicate and redundant content.
5. Prioritize information supported by stronger evidence and more authoritative sources.
6. Preserve important statistics, dates, figures, names, technical details, and factual context.
7. Identify contradictions, inconsistencies, or disagreements between sources.
8. When conflicts exist:

   * Explain the conflicting viewpoints.
   * Evaluate the strength of the available evidence.
   * Present the most reliable conclusion.
9. Clearly distinguish:

   * Confirmed facts
   * Probable conclusions
   * Uncertain or incomplete findings
10. Never invent, assume, or infer facts not present in the provided information.
11. If evidence is insufficient, explicitly acknowledge the limitation.
12. Maintain objectivity, neutrality, and factual accuracy.
"""
),
(
"human",
"""
You are provided with research findings gathered by multiple agents.

Research Corpus:

{info}

Instructions:

1. Review all information carefully before writing.
2. Extract all unique claims, observations, and findings.
3. Group related information into logical themes.
4. Remove duplicate or repetitive content.
5. Preserve important:

   * Statistics
   * Dates
   * Metrics
   * Technical details
   * Names and entities
6. Identify supporting evidence for each major finding.
7. Detect contradictions, inconsistencies, or competing claims.
8. When conflicts exist:

   * Compare the evidence.
   * Explain the disagreement.
   * Present the strongest evidence-backed conclusion.
9. Clearly indicate uncertainty when evidence is weak or incomplete.
10. Use only information contained in the Research Corpus.
11. Do not introduce external knowledge, assumptions, or speculation.

Writing Goals:

* Maximize factual accuracy.
* Maximize information density.
* Minimize redundancy.
* Produce clear and professional writing.
* Focus on actionable insights and meaningful conclusions.

Before generating the report, internally determine:

* What are the most important findings?
* What evidence supports them?
* What information is uncertain?
* What conclusions can be confidently drawn?

Generate the final synthesized report using the required output structure.
"""
)
])

# writer_chain = writer_prompt | llm | structured_output_parser()

structured_writer_llm = writer_llm.with_structured_output(
    ResearchReport
)

writer_chain = (
    writer_prompt
    | structured_writer_llm
)
#critic chain


critic_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are an expert Research Quality Critic Agent in a Multi-Agent AI Research System.

Your role is to rigorously evaluate research reports generated by other agents.

Evaluation Criteria:
1. Research Depth
   - Does the report go beyond surface-level information?
   - Does it provide meaningful insights and analysis?

2. Accuracy & Evidence
   - Are claims supported by evidence?
   - Are there unsupported assumptions or hallucinations?

3. Source Quality
   - Are sources credible, relevant, and diverse?
   - Is information properly attributed?

4. Synthesis Quality
   - Does the report combine information from multiple sources?
   - Does it identify patterns, contradictions, and trends?

5. Structure & Clarity
   - Is the report logically organized?
   - Is it easy to understand?

6. Completeness
   - Does the report fully address the research objective?
   - Are important aspects missing?

7. Actionability
   - Are conclusions practical and useful?
   - Are recommendations supported by findings?

Scoring Rules:
- 9-10: Exceptional research with strong evidence and synthesis.
- 7-8: Good research with minor weaknesses.
- 5-6: Adequate but lacks depth or rigor.
- 3-4: Significant deficiencies.
- 0-2: Poor quality, unreliable, or largely unsupported.

Be critical, objective, and specific.
Do not give high scores unless clearly justified.
            """
        ),
        (
    "human",
    """
Review the research report below and evaluate it strictly.

Research Report:
{report}
"""
)
    ]
)

class CritiqueReport(BaseModel):
    score: int = Field(
    ge=0,
    le=10,
    description="Overall quality score from 0 to 10"
)
    strengths: List[str] = Field(
        description="Major strengths of the report"
    )

    weaknesses: List[str] = Field(
        description="Major weaknesses of the report"
    )

    areas_for_improvement: List[str] = Field(
        description="Specific improvements needed"
    )

    verdict: str = Field(
        description="One-line overall assessment"
    )
    
structured_critic_llm = critic_llm.with_structured_output(
    CritiqueReport
)

critic_chain = (
    critic_prompt
    | structured_critic_llm
)

def build_writer_agent():
    """Build the writer agent that synthesizes research findings into a structured report."""
    return writer_chain

def build_critic_agent():
    """Build the critic agent that evaluates research report quality."""
    return critic_chain
