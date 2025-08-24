
# Hybrid Influencer RAG — MongoDB + Pinecone + NVIDIA

A modular app that ingests your **people JSON** into:
- **MongoDB** for structured filtering/sorting (e.g., "top 20 by followers").
- **Pinecone** for semantic retrieval (NVIDIA embeddings) and LLM answers.

Supports **file ingestion** (PDF/DOCX/TXT/etc.) to Pinecone as well.

**Clean layering**: Mongo code lives in `services/mongo_store.py`, Pinecone/LlamaIndex code in `services/vector_store.py`, and JSON flattening in `processors/json_processor.py` — easy to reuse and debug.

## Quickstart

```bash
pip install -r requirements.txt
cp .env.example .env  # fill values
streamlit run app.py
```

### .env fields
- `PINECONE_API_KEY` — Pinecone key
- `PINECONE_INDEX_NAME=rabbitt-ai` — your existing index
- `PINECONE_HOST=https://rabbitt-ai-lkp2esr.svc.aped-4627-b74a.pinecone.io` — connect to the exact index
- `NVIDIA_API_KEY` — NVIDIA NIMs key (OpenAI-compatible)
- `EMBEDDING_MODEL=nvidia/nv-embedqa-e5-v5` with `EMBED_DIM=1024`
- `LLM_MODEL=meta/llama-3.1-70b-instruct`
- `MONGODB_URI` / `MONGODB_DB` / `MONGODB_COLLECTION` — your Mongo details

> Keep embedding model/dimension consistent across your index.

## Ingestion

- **JSON (people)**: upload your 100 records; we upsert to Mongo *and/or* Pinecone.
- **Files**: upload or point at a directory; we chunk and index to Pinecone.

## Querying

- **Semantic / Hybrid Query tab**: Ask natural-language questions. Results are LLM answers with sources (people/items).
- **Structured (MongoDB) tab**:
  - One-click: *Top 20 active people with authenticity score > 80, sorted by followerCount desc*.
  - Custom filter JSON, sort field, direction, limit.

## Optional: Direct OpenAI-compatible client

`services/llm_client.py` lets you stream responses using the OpenAI SDK but pointed at NVIDIA by default. You can switch to an alternate base URL/model (e.g., "gpt-5") with env vars if desired.

## Notes

- If you change embedding models, ensure `EMBED_DIM` and Pinecone index dimension match.
- Set a namespace (default `influencers`) to keep this dataset separated.
- Mongo and Pinecone code are fully isolated for clean reuse and tests.

## Troubleshooting

- **Dimension mismatch** — recreate the Pinecone index or update `EMBED_DIM` to 1024 for `nv-embedqa-e5-v5`.
- **Mongo auth/cluster** — verify `MONGODB_URI` and network access list.
- **Slow first query** — warmup time for models; consider caching and smaller `top_k`.
