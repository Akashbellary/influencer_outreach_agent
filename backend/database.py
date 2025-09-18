import os
import json
from typing import Optional, Any, Dict
try:
	from bson.objectid import ObjectId  # type: ignore
except Exception:
	ObjectId = None  # type: ignore

try:
	from pymongo import MongoClient
except Exception:
	MongoClient = None  # type: ignore

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CFG_PATH = os.path.join(BASE_DIR, "config.json")

_mongo_client: Optional[MongoClient] = None  # type: ignore
_db = None

# Load config
try:
	with open(CFG_PATH, "r", encoding="utf-8") as f:
		_config = json.load(f)
except Exception:
	_config = {}

MONGODB_URI = _config.get("mongodb_uri") or _config.get("mongo_uri")
DB_NAME = _config.get("mongodb_db") or _config.get("mongo_db") or "CampaignIO_DB"

if MongoClient and MONGODB_URI:
	try:
		_mongo_client = MongoClient(MONGODB_URI, connectTimeoutMS=20000, socketTimeoutMS=20000)
		_db = _mongo_client[DB_NAME]
	except Exception:
		_db = None
else:
	_db = None

# Expose `db` for importers
_db = _db

db = _db

# ---- Backward-compat shims (for legacy imports) ----
# Some modules import `users_collection` and simple profile helpers directly from `database`.
if db is not None:
	users_collection = db.get_collection("userdata")
	_profiles = db.get_collection("user_profiles")
	todos_collection = db.get_collection("todos")
else:
	users_collection = None  # type: ignore
	_profiles = None  # type: ignore
	todos_collection = None  # type: ignore

def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
	if not _profiles or not ObjectId or not user_id:
		return None
	try:
		return _profiles.find_one({"_id": ObjectId(user_id)})
	except Exception:
		return None

def create_user_profile(data: Dict[str, Any]) -> Optional[str]:
	if not _profiles:
		return None
	try:
		res = _profiles.insert_one(data or {})
		return str(res.inserted_id)
	except Exception:
		return None

def update_user_profile(user_id: str, updates: Dict[str, Any]) -> bool:
	if not _profiles or not ObjectId or not user_id:
		return False
	try:
		_res = _profiles.update_one({"_id": ObjectId(user_id)}, {"$set": updates or {}})
		return _res.matched_count > 0
	except Exception:
		return False

# ---- Todos helpers (compat for blueprints.todos) ----
def get_todos(user_id: str) -> Any:
	if todos_collection is None:
		return []
	try:
		cursor = todos_collection.find({"user_id": user_id}).sort("created_at")
		return [
			{
				"id": str(doc.get("_id")),
				"text": doc.get("text", ""),
				"completed": bool(doc.get("completed", False)),
				"created_at": doc.get("created_at"),
			}
			for doc in cursor
		]
	except Exception:
		return []

def create_todo(user_id: str, text: str) -> Optional[str]:
	if todos_collection is None:
		return None
	try:
		res = todos_collection.insert_one({
			"user_id": user_id,
			"text": text,
			"completed": False,
			"created_at": __import__("datetime").datetime.utcnow(),
		})
		return str(res.inserted_id)
	except Exception:
		return None

def update_todo(todo_id: str, updates: Dict[str, Any]) -> bool:
	if todos_collection is None or not ObjectId or not todo_id:
		return False
	try:
		res = todos_collection.update_one({"_id": ObjectId(todo_id)}, {"$set": updates or {}})
		return res.matched_count > 0
	except Exception:
		return False
