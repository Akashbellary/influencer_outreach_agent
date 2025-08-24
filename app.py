import os
import tempfile
import json
import streamlit as st
from dotenv import load_dotenv

from llama_index.core import Settings
from llama_index.core.node_parser import SentenceSplitter
from llama_index.embeddings.nvidia import NVIDIAEmbedding
from llama_index.llms.nvidia import NVIDIA
from llama_index.core import SimpleDirectoryReader

from services.vector_store import (
    init_pinecone_index,
    upsert_documents_direct,
    create_index_from_documents,
    semantic_query_index,
)
from services.mongo_store import (
    get_mongo_collection,
    upsert_people_bulk,
    get_top20_active_authentic,
    structured_query_generic,
)
from processors.json_processor import (
    load_people_json_file,
    people_to_documents,
)
from document_processors import materialize_uploaded_files, ingest_directory_documents

# ========== Streamlit Config ==========
st.set_page_config(page_title="Hybrid RAG — MongoDB + Pinecone (NVIDIA)", layout="wide")

# ========== Load .env ==========
load_dotenv()

# ========== Constants / ENV ==========
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nvidia/nv-embedqa-e5-v5")
EMBED_DIM = int(os.getenv("EMBED_DIM", "1024"))
LLM_MODEL = os.getenv("LLM_MODEL", "meta/llama-3.1-70b-instruct")

PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE", "influencers")

MONGODB_URI = os.getenv("MONGODB_URI", "")
MONGODB_DB = os.getenv("MONGODB_DB", "rabbitt-dbms")
MONGODB_COLLECTION = os.getenv("MONGODB_COLLECTION", "rabbitt-collections")

# ========== Initialize LlamaIndex Settings ==========
def initialize_settings():
    Settings.embed_model = NVIDIAEmbedding(model=EMBEDDING_MODEL, truncate="END")
    Settings.llm = NVIDIA(model=LLM_MODEL, temperature=0.2, max_tokens=1024)
    Settings.text_splitter = SentenceSplitter(chunk_size=600, chunk_overlap=60)

# ========== Session State ==========
if "index" not in st.session_state:
    st.session_state.index = None
if "messages" not in st.session_state:
    st.session_state.messages = []

# ========== Helpers ==========
def ensure_vector_index():
    """
    Ensure LlamaIndex VectorStoreIndex is initialized (connected to Pinecone).
    """
    if st.session_state.index is None:
        st.session_state.index = create_index_from_documents([], namespace=PINECONE_NAMESPACE)

# ========== UI ==========
def main():
    st.title("🔎 Hybrid RAG — NVIDIA + Pinecone + MongoDB")
    initialize_settings()
    ensure_vector_index()

    tab_ingest, tab_query, tab_structured = st.tabs(["Ingestion", "Semantic / Hybrid Query", "Structured (MongoDB)"])

    # -------- Ingestion --------
    with tab_ingest:
        st.subheader("Upload JSON (people) or general files")
        mode = st.radio("Choose ingestion type", ["JSON (people)", "Files"], horizontal=True)

        if mode == "JSON (people)":
            people_json_file = st.file_uploader("Upload JSON file (list of people)", type=["json"])
            do_to_mongo = st.checkbox("Insert/Upsert into MongoDB", value=True)
            do_to_pinecone = st.checkbox("Upsert into Pinecone (semantic)", value=True)

            if people_json_file and (do_to_mongo or do_to_pinecone):
                with st.spinner("Processing JSON..."):
                    people = load_people_json_file(people_json_file)
                    st.write(f"Loaded {len(people)} people.")

                    # Upsert into MongoDB
                    if do_to_mongo:
                        try:
                            col = get_mongo_collection(MONGODB_URI, MONGODB_DB, MONGODB_COLLECTION)
                            result = upsert_people_bulk(col, people)
                            st.success(f"MongoDB upsert complete: {result}")
                        except Exception as e:
                            st.error(f"MongoDB error: {e}")

                    # Upsert into Pinecone
                    if do_to_pinecone:
                        docs = people_to_documents(people)
                        try:
                            upsert_documents_direct(docs, namespace=PINECONE_NAMESPACE)
                            st.success(f"Upserted {len(docs)} people into Pinecone (namespace: {PINECONE_NAMESPACE}).")
                        except Exception as e:
                            st.error(f"Pinecone upsert error: {e}")

        else:
            uploaded_files = st.file_uploader(
                "Upload PDFs/DOCX/TXT/MD/images etc.",
                accept_multiple_files=True,
                type=None
            )
            directory_path = st.text_input("Or enter directory path to ingest")

            if uploaded_files:
                with st.spinner("Processing uploaded files..."):
                    with tempfile.TemporaryDirectory() as td:
                        file_paths = materialize_uploaded_files(uploaded_files, td)
                        reader = SimpleDirectoryReader(input_files=file_paths, recursive=False)
                        docs = reader.load_data()
                        if docs:
                            try:
                                upsert_documents_direct(docs, namespace=PINECONE_NAMESPACE)
                                st.success(f"Ingested {len(docs)} chunks to Pinecone.")
                            except Exception as e:
                                st.error(f"Pinecone upsert error: {e}")

            if directory_path and os.path.exists(directory_path):
                with st.spinner("Processing directory..."):
                    docs = ingest_directory_documents(directory_path)
                    if docs:
                        try:
                            upsert_documents_direct(docs, namespace=PINECONE_NAMESPACE)
                            st.success(f"Ingested {len(docs)} chunks to Pinecone.")
                        except Exception as e:
                            st.error(f"Pinecone upsert error: {e}")

    # -------- Semantic / Hybrid Query --------
    with tab_query:
        st.subheader("Ask questions (Semantic via Pinecone + NVIDIA)")
        st.caption("Tip: e.g., 'Show verified yoga influencers in India with high engagement'")

        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])
                if "sources" in message and message["sources"]:
                    with st.expander("View Sources"):
                        for s in message["sources"]:
                            st.write(s)

        prompt = st.chat_input("Type your question...")
        if prompt:
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)

            with st.chat_message("assistant"):
                with st.spinner("Searching knowledge base..."):
                    response, sources = semantic_query_index(st.session_state.index, prompt, top_k=6)
                    st.markdown(response)
                    if sources:
                        with st.expander("View Sources"):
                            for s in sources:
                                st.write(s)
            st.session_state.messages.append({"role": "assistant", "content": response, "sources": sources})

        if st.button("Clear chat"):
            st.session_state.messages = []
            st.toast("Cleared.")

    # -------- Structured (MongoDB) --------
    with tab_structured:
        st.subheader("Structured MongoDB Queries (no LLM)")

        if st.button("Run: Top 20 active, authenticity score > 80, sorted by followerCount desc"):
            try:
                col = get_mongo_collection(MONGODB_URI, MONGODB_DB, MONGODB_COLLECTION)
                docs = get_top20_active_authentic(col)
                st.success(f"Found {len(docs)} records.")
                st.json(docs)
            except Exception as e:
                st.error(f"MongoDB error: {e}")

        st.markdown("#### Custom Query")
        with st.form("mongo_form"):
            query_str = st.text_area("Filter JSON", value='{"isActive": true, "authenticityScore.score": {"$gt": 80}}')
            sort_field = st.text_input("Sort field", value="followerCount")
            sort_dir = st.selectbox("Sort direction", options=["desc", "asc"], index=0)
            limit_n = st.number_input("Limit", value=20, step=1, min_value=1)
            submitted = st.form_submit_button("Run Query")

        if submitted:
            try:
                query_filter = json.loads(query_str) if query_str.strip() else {}
                col = get_mongo_collection(MONGODB_URI, MONGODB_DB, MONGODB_COLLECTION)
                docs = structured_query_generic(
                    col,
                    query_filter=query_filter,
                    sort_field=sort_field if sort_field else None,
                    sort_direction=-1 if sort_dir == "desc" else 1,
                    limit_n=int(limit_n),
                )
                st.success(f"Found {len(docs)} records.")
                st.json(docs)
            except Exception as e:
                st.error(f"MongoDB error: {e}")

if __name__ == "__main__":
    main()
