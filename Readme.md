# 🧠 ResearchAI — Multi-Agent Research System

A full-stack AI-powered research platform that uses multiple autonomous agents to perform deep research, synthesize findings, evaluate report quality, and generate exportable research reports.

Built with **LangChain**, **LangGraph**, **FastAPI**, **OpenAI**, and **ReactJS**.

---

## 🚀 Overview

ResearchAI simulates a team of specialized AI agents working together to complete a research task.

Instead of relying on a single LLM response, the system breaks the research process into multiple phases:

1. **Search Agent** – discovers relevant information sources.
2. **Extraction Agent** – identifies and processes useful URLs.
3. **Research Agent** – performs deep content analysis.
4. **Writer Agent** – generates structured reports.
5. **Critic Agent** – evaluates report quality and provides feedback.

The frontend provides real-time pipeline visualization, execution logs, quality scoring, source tracking, and PDF export functionality.

---

## ✨ Features

### Multi-Agent Research Workflow

* Autonomous AI agents
* LangGraph orchestration
* Sequential research pipeline
* Agent-to-agent information flow

### Deep Research

* Web search integration
* Content extraction
* Multi-source analysis
* Evidence-backed findings

### Report Generation

* Executive Summary
* Detailed Analysis
* Key Findings
* Limitations
* Final Conclusion

### Critique & Evaluation

* Automated report scoring
* Strength analysis
* Weakness detection
* Improvement recommendations

### Modern React Dashboard

* Real-time pipeline visualization
* Agent execution tracking
* Interactive tabs
* Research logs terminal
* Responsive UI

### Export

* Professional PDF reports
* Multi-page formatting
* Research sources included
* Executive-ready output

---

## 🏗 Architecture

```text
Research Topic
      │
      ▼
 Search Agent
      │
      ▼
Extract Agent
      │
      ▼
Research Agent
      │
      ▼
 Writer Agent
      │
      ▼
 Critic Agent
      │
      ▼
 Final Report + PDF Export
```

---

## 🛠 Tech Stack

### Backend

* Python
* FastAPI
* LangChain
* LangGraph
* OpenAI API

### Frontend

* ReactJS
* JavaScript
* CSS-in-JS
* Tabler Icons

### Report Generation

* jsPDF


---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AkashDas2003/Multi-agent-ai-research-system

cd research-ai
```

---

## Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

### Create a Virtual Environment

```bash
python -m venv venv
```

### Activate the Environment

#### Windows

```bash
venv\Scripts\activate
```

#### Linux / macOS

```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configure Environment Variables

Create a `.env` file in the backend directory:

```env
OPENAI_API_KEY=your_api_key_here
```

### Start the Backend Server

```bash
uvicorn app:app --reload
```

Backend will run at:

```text
http://localhost:8000
```

---

## Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Frontend will run at:

```text
http://localhost:5173
```

---

## 🔄 Research Workflow

### Phase 1 — Search

Searches for relevant information sources and gathers initial research material.

### Phase 2 — Extract

Identifies, validates, and processes useful URLs and content.

### Phase 3 — Deep Research

Performs detailed content analysis and extracts meaningful insights.

### Phase 4 — Write

Generates a structured research report using the collected information.

### Phase 5 — Critic

Evaluates the report quality, assigns a score, and suggests improvements.

---

## 📄 Report Output

Each generated report includes:

* Executive Summary
* Detailed Analysis
* Key Findings
* Supporting Evidence
* Limitations
* Final Conclusion
* Quality Assessment
* Sources & References

---

## 📊 Quality Evaluation

The Critic Agent generates:

* Overall Score (0–10)
* Quality Verdict
* Strengths
* Weaknesses
* Areas for Improvement

This helps ensure that generated reports are not only informative but also critically assessed for completeness and reliability.

---

## 📥 PDF Export

Generated reports can be exported as professionally formatted PDF documents containing:

* Cover Page
* Executive Summary
* Detailed Analysis
* Key Findings
* Critique Section
* Sources & References

The exported reports are designed for professional presentation, documentation, and sharing.


---

## 📜 License

This project is licensed under the MIT License.

---

## ⭐ Support

If you found this project useful, consider giving it a star on GitHub.
