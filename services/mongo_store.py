from typing import Any, Dict, List, Optional
from pymongo import MongoClient, DESCENDING
from pymongo.errors import PyMongoError

def get_mongo_collection(uri: str, db_name: str, collection_name: str):
    """
    Connect and return the specified MongoDB collection.
    - Explicit tls=True helps avoid SSL handshake issues with some OpenSSL builds.
    - If your URI already has tls=true, this is harmless.
    """
    client = MongoClient(uri, tls=True, tlsAllowInvalidCertificates=False)
    db = client[db_name]
    collection = db[collection_name]
    return collection

def upsert_people_bulk(collection, people: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Upsert people into MongoDB collection using bulk_write.
    Matches by 'id' (or '_id' if provided).
    """
    from pymongo import UpdateOne
    ops = []
    for p in people:
        key = {"id": p.get("id")} if p.get("id") is not None else {"_id": p.get("_id")}
        if "id" not in key and "_id" not in key:
            # Skip items without a stable id
            continue
        ops.append(UpdateOne(key, {"$set": p}, upsert=True))
    if not ops:
        return {"matched": 0, "modified": 0, "upserted": 0}

    result = collection.bulk_write(ops, ordered=False)
    return {
        "matched": result.matched_count,
        "modified": result.modified_count,
        "upserted": len(result.upserted_ids) if result.upserted_ids else 0
    }

def get_top20_active_authentic(collection) -> List[Dict[str, Any]]:
    """
    isActive=True AND authenticityScore.score > 80,
    sort by followerCount desc, limit 20.
    """
    query_filter = {
        "isActive": True,
        "authenticityScore.score": {"$gt": 80},
    }
    cur = collection.find(query_filter).sort("followerCount", DESCENDING).limit(20)
    return [doc for doc in cur]

def structured_query_generic(
    collection,
    query_filter: Optional[Dict[str, Any]] = None,
    sort_field: Optional[str] = None,
    sort_direction: int = DESCENDING,
    limit_n: int = 20,
) -> List[Dict[str, Any]]:
    """
    Generic helper to run structured queries.
    """
    q = query_filter or {}
    cursor = collection.find(q)
    if sort_field:
        cursor = cursor.sort(sort_field, sort_direction)
    if limit_n:
        cursor = cursor.limit(int(limit_n))
    return [doc for doc in cursor]

