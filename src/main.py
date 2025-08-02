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
    llm_prompt = f"""You are a legal assistant. Your job is to help answer questions using legal documents.

If the question involves dates (like agreement signing, contract start/end, duration, deadlines, etc), DO NOT answer directly.

Instead, respond with EXACTLY this format (no extra explanation):

use tool: extract_dates <ONLY the text that contains the date>

Only reply with this tool command. Do NOT explain anything.

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
    print("=== RAW GEMINI RESPONSE ===")
    print(repr(answer))
    print("=== END RAW RESPONSE ===")

    # Tool usage detection
    tool_pattern = r"use tool:\s*(\w+)\s*<(.+?)>"
    match = re.search(tool_pattern, answer, re.DOTALL)

    if match:
        tool_name, tool_input = match.groups()
        print(f"\n[INFO] Gemini requested to use tool: {tool_name}")
        if tool_name in TOOLS:
            tool_func = TOOLS[tool_name]
            print(f"[INFO] Running tool `{tool_name}` on input:\n{tool_input.strip()}\n")
            result = tool_func(tool_input.strip())
            print(f"[TOOL RESULT]: {result}")
        else:
            print(f"[WARN] Tool `{tool_name}` not found in registry.")
    else:
        print("[INFO] No tool requested. Showing Gemini's raw answer:")
        print(answer)

if __name__ == "__main__":
    main()
