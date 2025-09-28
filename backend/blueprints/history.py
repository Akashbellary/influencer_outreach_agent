import os
import json
from datetime import datetime
from typing import Any, Dict
from flask import Blueprint, request, jsonify

from database import db

history_bp = Blueprint("history", __name__)

def _col():
	return db.get_collection("search_history") if db is not None else None

from auth import require_auth

@history_bp.route("/history", methods=["POST"])
@require_auth
def create_history():
	col = _col()
	if col is None:
		return jsonify({"success": False, "message": "DB unavailable"}), 500
	from flask import session
	data = request.get_json(silent=True) or {}
	user_id = session.get("user_id")
	if not user_id:
		return jsonify({"success": False, "message": "User not authenticated"}), 401
	entry = {
		"productName": (data.get("productName") or "").strip(),
		"productDescription": (data.get("productDescription") or "").strip(),
		"hashtags": data.get("hashtags") or [],
		"image": data.get("image") or "",
		"userId": user_id,
		"influencers": data.get("influencers") or [],
		"createdAt": datetime.utcnow(),
		"updatedAt": datetime.utcnow(),
	}
	res = col.insert_one(entry)
	return jsonify({"success": True, "id": str(res.inserted_id)})

@history_bp.route("/history", methods=["GET"])
@require_auth
def list_history():
	col = _col()
	if col is None:
		return jsonify({"success": False, "message": "DB unavailable"}), 500
	from flask import session
	user_id = session.get("user_id")
	if not user_id:
		return jsonify({"success": False, "message": "User not authenticated"}), 401
	q: Dict[str, Any] = {"userId": user_id}
	cursor = col.find(q).sort("updatedAt", -1).limit(100)
	items = []
	for doc in cursor:
		items.append({
			"id": str(doc.get("_id")),
			"productName": doc.get("productName"),
			"productDescription": doc.get("productDescription"),
			"hashtags": doc.get("hashtags", []),
			"image": doc.get("image", ""),
			"updatedAt": doc.get("updatedAt"),
		})
	return jsonify({"success": True, "items": items})

@history_bp.route("/history/<hid>", methods=["GET"])
def get_history(hid: str):
	col = _col()
	if col is None:
		return jsonify({"success": False, "message": "DB unavailable"}), 500
	from bson.objectid import ObjectId
	doc = col.find_one({"_id": ObjectId(hid)})
	if not doc:
		return jsonify({"success": False, "message": "Not found"}), 404
	return jsonify({
		"success": True,
		"item": {
			"id": str(doc.get("_id")),
			"productName": doc.get("productName"),
			"productDescription": doc.get("productDescription"),
			"hashtags": doc.get("hashtags", []),
			"image": doc.get("image", ""),
			"influencers": doc.get("influencers", []),
			"updatedAt": doc.get("updatedAt"),
		}
	})

@history_bp.route("/history/<hid>/influencers", methods=["PATCH"])
def append_influencers(hid: str):
	col = _col()
	if col is None:
		return jsonify({"success": False, "message": "DB unavailable"}), 500
	body = request.get_json(silent=True) or {}
	new_infs = body.get("influencers") or []
	from bson.objectid import ObjectId
	col.update_one({"_id": ObjectId(hid)}, {
		"$set": {"updatedAt": datetime.utcnow()},
		"$addToSet": {"influencers": {"$each": new_infs}},
	})
	return jsonify({"success": True})


