import os
import sys
import re
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from src.parsers.pdf_loader import extract_text_from_pdf
from src.parsers.chunk_text import clean_text, chunk_text
from src.vector_store import init_chroma_db, create_or_load_collection, store_chunks, preview_collection
from src.retriever import retrieve_relevant_chunks
from sentence_transformers import SentenceTransformer
from src.llm.ask_gemini import ask_gemini
from src.tools.tool_registry import TOOLS

def main():
    # Step 1: Load PDF
    pdf_path = "data/raw/nda_sample.pdf"
    print(f"[INFO] Loading PDF from: {pdf_path}")
    text = extract_text_from_pdf(pdf_path)

    # Step 2: Clean and chunk the text
    print("[INFO] Cleaning and chunking text...")
    cleaned_text = clean_text(text)
    chunks = chunk_text(cleaned_text, max_chunk_size=500)

    # Step 3: Initialize vector DB
    print("[INFO] Initializing ChromaDB...")
    db_client = init_chroma_db(persist_directory="vector_db")
    collection = create_or_load_collection(db_client, collection_name="legal_chunks")

    # Step 4: Store chunks in vector DB
    print(f"[INFO] Storing {len(chunks)} chunks in ChromaDB...")
    store_chunks(chunks, collection)
    print("[INFO] Done. All chunks stored successfully.")

    #print(collection.peek(5))

    preview_collection(collection)

    embedder = SentenceTransformer("all-MiniLM-L6-v2")

    query = input("Ask a question about the document: ")
    top_chunks = retrieve_relevant_chunks(query, collection, embedder=embedder)

    print("\n--- Top Relevant Chunks ---")
    for i, chunk in enumerate(top_chunks):
        print(f"\n[Chunk {i+1}]\n{chunk}")

    # Build LLM Prompt
    context = "\n\n".join(top_chunks)
    llm_prompt = f"""
You are a legal assistant AI helping a user understand a legal document.

You have access to external tools to assist with specific types of questions.

---

TOOL USAGE RULES:

Only use a tool if the question involves:
- Dates (e.g., agreement signing, start/end dates, deadlines)
- Parties (e.g., identifying the Disclosing Party, Receiving Party, or entities involved)

If the question falls under one of the above, respond with:
use tool: <tool_name> <only the relevant passage from the document>

Available tools:
- extract_dates → for extracting dates
- extract_parties → for identifying involved parties

Use tools only when needed.  
Do not explain or summarize anything when using a tool.  
Do not include anything outside the tool command.

---

For all other types of questions, respond directly and concisely using the provided document context.  
Remain factual, clear, and professional.

---

DOCUMENT:
\"\"\"
    {context}
    \"\"\"

    QUESTION:
    {query}

    ANSWER:"""

    print("\n--- Prompt to LLM ---\n")
    print(llm_prompt)

    print("\n--- Gemini's Answer ---\n")
    answer = ask_gemini(llm_prompt)
    print(answer)
    # print("=== RAW GEMINI RESPONSE ===")
    # print(repr(answer))
    # print("=== END RAW RESPONSE ===")

if __name__ == "__main__":
    main()
