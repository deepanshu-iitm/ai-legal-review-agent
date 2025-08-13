"""
Core document processing module that integrates all components
for end-to-end document analysis and question answering.
"""

import os
import sys
import logging
from typing import List, Optional

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.parsers.document_loader import load_document
from src.parsers.chunk_text import clean_text, chunk_text
from src.vector_store import init_chroma_db, create_or_load_collection, store_chunks
from src.retriever import retrieve_relevant_chunks
from src.llm.ask_gemini import ask_gemini
from src.tools.tool_registry import TOOLS
from sentence_transformers import SentenceTransformer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global embedder instance for efficiency
_embedder = None

def get_embedder():
    """Get or create the global embedder instance"""
    global _embedder
    if _embedder is None:
        logger.info("Initializing SentenceTransformer embedder...")
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder

def process_document_query(file_path: str, question: str) -> str:
    """
    Main function to process a document and answer a question about it.
    
    Args:
        file_path (str): Path to the document file
        question (str): Question to answer about the document
        
    Returns:
        str: Answer to the question based on the document content
    """
    try:
        logger.info(f"Processing document: {file_path}")
        logger.info(f"Question: {question}")
        
        # Step 1: Load and extract text from document
        logger.info("Step 1: Loading document...")
        text = load_document(file_path)
        
        if not text or len(text.strip()) == 0:
            return "Error: Could not extract text from the document or document is empty."
        
        logger.info(f"Extracted {len(text)} characters from document")
        
        # Step 2: Clean and chunk the text
        logger.info("Step 2: Cleaning and chunking text...")
        cleaned_text = clean_text(text)
        chunks = chunk_text(cleaned_text, max_chunk_size=500)
        
        if not chunks:
            return "Error: Could not create chunks from the document text."
            
        logger.info(f"Created {len(chunks)} chunks")
        
        # Step 3: Initialize vector database
        logger.info("Step 3: Initializing vector database...")
        db_client = init_chroma_db(persist_directory="vector_db")
        
        # Create collection name based on file
        filename = os.path.basename(file_path)
        collection_name = f"doc_{hash(filename) % 1000000}"  # Simple hash for unique collection
        collection = create_or_load_collection(db_client, collection_name=collection_name)
        
        # Step 4: Store chunks in vector database (if not already stored)
        logger.info("Step 4: Storing chunks in vector database...")
        embedder = get_embedder()
        
        # Check if collection is empty (new document)
        existing_count = collection.count()
        if existing_count == 0:
            logger.info(f"New document - storing {len(chunks)} chunks...")
            store_chunks(chunks, collection, embedder=embedder)
        else:
            logger.info(f"Document already processed - using existing {existing_count} chunks")
        
        # Step 5: Retrieve relevant chunks for the question
        logger.info("Step 5: Retrieving relevant chunks...")
        top_chunks = retrieve_relevant_chunks(question, collection, embedder=embedder, top_k=5)
        
        if not top_chunks:
            return "Error: Could not find relevant information in the document for your question."
        
        logger.info(f"Retrieved {len(top_chunks)} relevant chunks")
        
        # Step 6: Build context and generate LLM prompt
        logger.info("Step 6: Generating answer using LLM...")
        context = "\n\n".join(top_chunks)
        
        llm_prompt = f"""
You are a legal assistant AI helping a user understand a legal document.

You have access to external tools to assist with specific types of questions.

---

TOOL USAGE RULES:

Only use a tool if the question involves:
- Dates (e.g., agreement signing, start/end dates, deadlines)
- Parties (e.g., identifying the Disclosing Party, Receiving Party, or entities involved)
- Summary (e.g., 'summarize the document', 'give me an overview', 'main points of this agreement')

If the question falls under one of the above, respond with:
use tool: <tool_name> <only the relevant passage from the document>

Available tools:
- extract_dates → for extracting dates
- extract_parties → for identifying involved parties
- summarize_document → for summarizing the entire document

Use tools only when needed.  
Do not explain or summarize anything when using a tool.  
Do not include anything outside the tool command.

---

For all other types of questions, respond directly and concisely using the provided document context.  
Remain factual, clear, and professional.

---

DOCUMENT CONTEXT:
\"\"\"
{context}
\"\"\"

QUESTION:
{question}

ANSWER:"""

        # Step 7: Get answer from LLM
        answer = ask_gemini(llm_prompt)
        
        logger.info("Successfully processed document query")
        return answer
        
    except Exception as e:
        error_msg = f"Error processing document query: {str(e)}"
        logger.error(error_msg)
        return error_msg

def process_document_only(file_path: str) -> dict:
    """
    Process a document without answering a specific question.
    Useful for pre-processing documents and extracting basic information.
    
    Args:
        file_path (str): Path to the document file
        
    Returns:
        dict: Basic information about the processed document
    """
    try:
        logger.info(f"Pre-processing document: {file_path}")
        
        # Load and process document
        text = load_document(file_path)
        cleaned_text = clean_text(text)
        chunks = chunk_text(cleaned_text, max_chunk_size=500)
        
        # Initialize vector database
        db_client = init_chroma_db(persist_directory="vector_db")
        filename = os.path.basename(file_path)
        collection_name = f"doc_{hash(filename) % 1000000}"
        collection = create_or_load_collection(db_client, collection_name=collection_name)
        
        # Store chunks
        embedder = get_embedder()
        if collection.count() == 0:
            store_chunks(chunks, collection, embedder=embedder)
        
        # Extract basic information using tools
        basic_info = {}
        
        # Try to extract parties
        try:
            from src.tools.extract_parties import extract_parties
            parties = extract_parties(text)
            basic_info['parties'] = parties
        except:
            basic_info['parties'] = []
        
        # Try to extract dates
        try:
            from src.tools.extract_dates import extract_dates
            dates = extract_dates(text)
            basic_info['dates'] = dates
        except:
            basic_info['dates'] = []
        
        return {
            'status': 'success',
            'chunks_count': len(chunks),
            'text_length': len(text),
            'collection_name': collection_name,
            'basic_info': basic_info
        }
        
    except Exception as e:
        logger.error(f"Error pre-processing document: {str(e)}")
        return {
            'status': 'error',
            'error': str(e)
        }
