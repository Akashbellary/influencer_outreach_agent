import os
from pinecone import Pinecone
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.core import StorageContext, VectorStoreIndex
from llama_index.core.schema import Document
from llama_index.embeddings.nvidia import NVIDIAEmbedding
from .utils import flatten_dict, clean_metadata


# ---------------------------
# Pinecone Initialization
# ---------------------------
def init_pinecone_index():
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index_name = os.getenv("PINECONE_INDEX_NAME", "rabbitt-ai")
    return pc.Index(index_name)


# ---------------------------
# Helper: Build Natural Language Summary
# ---------------------------
def build_summary(meta: dict) -> str:
    """Generate a natural language summary from influencer metadata."""
    name = meta.get("name", "Unknown")
    username = meta.get("username", "")
    platform = meta.get("platform", "social media")
    followers = meta.get("followerCount", "unknown")
    verified = "verified" if meta.get("isVerified") else "not verified"
    engagement = meta.get("authenticityScore_engagementRate", "N/A")
    locations = meta.get("audienceMatch_locations", [])
    tags = meta.get("tags", [])

    summary = (
        f"{name} ({platform} @{username}) is a {verified} influencer "
        f"with {followers} followers and engagement rate {engagement}. "
    )
    if locations:
        summary += f"Popular in {', '.join(locations)}. "
    if tags:
        summary += f"Tags: {', '.join(tags)}."

    return summary.strip()


# ---------------------------
# Upsert Documents
# ---------------------------
def upsert_documents_direct(
    documents: list[Document],
    namespace: str = "influencer_data",
    pinecone_index=None,
    embed_model=None,
):
    """Upsert documents into Pinecone after flattening and cleaning metadata."""

    pinecone_index = pinecone_index or init_pinecone_index()
    embed_model = embed_model or NVIDIAEmbedding(model="nvidia/nv-embedqa-e5-v5")

    vectors = []
    for doc in documents:
        flat_meta = flatten_dict(doc.metadata or {})
        safe_meta = clean_metadata(flat_meta)

        summary_text = build_summary(safe_meta)
        safe_meta["text"] = summary_text

        embedding = embed_model.get_text_embedding(summary_text)

        vectors.append({
            "id": doc.doc_id,
            "values": embedding,
            "metadata": safe_meta
        })

    if vectors:
        pinecone_index.upsert(vectors=vectors, namespace=namespace)
        print(f"✅ Upserted {len(vectors)} documents into Pinecone ({namespace})")
    else:
        print("⚠️ No vectors to upsert")


# ---------------------------
# Create VectorStoreIndex
# ---------------------------
def create_index_from_documents(documents: list[Document], namespace: str = "influencer_data"):
    """Create a LlamaIndex VectorStoreIndex connected to Pinecone."""
    pinecone_index = init_pinecone_index()

    vector_store = PineconeVectorStore(
        pinecone_index=pinecone_index,
        namespace=namespace,
        dimension=1024,
        text_key="text",
    )

    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    return VectorStoreIndex.from_documents(documents, storage_context=storage_context)


# ---------------------------
# Semantic Query
# ---------------------------
def semantic_query_index(index: VectorStoreIndex, query: str, top_k: int = 5):
    """Query Pinecone index semantically."""
    qe = index.as_query_engine(similarity_top_k=top_k)
    response = qe.query(query)

    response_text = response.response
    sources = []
    for node in response.source_nodes:
        src_meta = node.node.metadata
        sources.append({
            "id": node.node.id_,
            "summary": src_meta.get("text", "No summary available"),
            "raw": src_meta
        })

    return response_text, sources
