from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings
import os

def init_chroma_db(persist_directory="vector_db"):
    # Initialize Chroma with persistence
    client = chromadb.PersistentClient(path=persist_directory)
    return client

def create_or_load_collection(client, collection_name="legal_chunks"):
    collection = client.get_or_create_collection(name=collection_name)
    return collection

def store_chunks(chunks, collection, embedder=None):
    if embedder is None:
        embedder = SentenceTransformer("all-MiniLM-L6-v2")

    embeddings = embedder.encode(chunks, show_progress_bar=True)

    # Store each chunk with an id
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        collection.add(
            documents=[chunk],
            embeddings=[embedding.tolist()],
            ids=[f"chunk-{i}"]
        )

def preview_collection(collection, n: int = 5):
    """
    Print the first `n` documents stored in the collection.
    """
    results = collection.get(include=["documents"])
    ids = collection.get()["ids"] 
    total = len(ids)
    print(f"[INFO] Total documents in collection: {total}")

    for i in range(min(n, total)):
        print(f"\n[ID] {results['ids'][i]}")
        print(f"[Doc] {results['documents'][i][:200]}...")  # Print first 200 chars