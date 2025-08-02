from sentence_transformers import SentenceTransformer
from chromadb.api.types import Documents, Embeddings, IDs

def retrieve_relevant_chunks(query: str, collection, embedder=None, top_k: int = 5) -> list[str]:
    if embedder is None:
        embedder = SentenceTransformer("all-MiniLM-L6-v2")

    query_embedding = embedder.encode(query).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
    )

    return results["documents"][0]  # a list of top-k chunk strings
