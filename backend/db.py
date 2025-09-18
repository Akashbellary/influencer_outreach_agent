import os
import json
from typing import List

_client = None
_db = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def _load_config():
    cfg_path = os.path.join(BASE_DIR, "config.json")
    try:
        with open(cfg_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _ensure_connection():
    global _client, _db
    if _client is not None and _db is not None:
        return _client, _db
    cfg = _load_config()
    mongo_uri = cfg.get("mongodb_uri") or cfg.get("mongo_uri") or cfg.get("MONGO_URI")
    db_name = cfg.get("mongodb_db") or cfg.get("mongo_db") or cfg.get("DB_NAME")
    if not mongo_uri or not db_name:
        return None, None
    try:
        from pymongo import MongoClient
        _client = MongoClient(mongo_uri, connect=False)
        _db = _client[db_name]
        return _client, _db
    except Exception:
        return None, None

def insert_permalinks(permalinks: List[str], hashtag: str):
    """Best-effort insert of permalinks for a hashtag. No-ops if Mongo not configured."""
    _, db = _ensure_connection()
    if db is None:
        return
    try:
        col = db.get_collection("permalinks")
        docs = [{"permalink": p, "hashtag": hashtag} for p in permalinks]
        if docs:
            # Use upsert-like behavior on permalink uniqueness if an index exists
            col.insert_many(docs, ordered=False)
    except Exception:
        # Swallow errors; this is auxiliary storage
        return


