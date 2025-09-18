from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from datetime import datetime
from database import db # Import db from database.py
from auth import require_auth, get_current_user # Import auth functions

timeline_bp = Blueprint('timeline', __name__)
timeline_collection = db["timeline"]

@timeline_bp.route('/timeline', methods=['GET'])
@require_auth
def get_timeline():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    user_timeline = list(timeline_collection.find({"user_id": user_id}).sort("timestamp", -1))
    for item in user_timeline:
        item['_id'] = str(item['_id'])
        item['user_id'] = str(item['user_id'])
    return jsonify({"success": True, "timeline": user_timeline}), 200

@timeline_bp.route('/timeline', methods=['POST'])
@require_auth
def add_timeline_item():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    data = request.get_json()
    content = data.get('content')
    item_type = data.get('type', 'update')

    if not content:
        return jsonify({"success": False, "message": "Content is required"}), 400

    new_item = {
        "user_id": user_id,
        "content": content,
        "type": item_type,
        "timestamp": datetime.utcnow(),
    }
    result = timeline_collection.insert_one(new_item)
    new_item['_id'] = str(result.inserted_id)
    new_item['user_id'] = str(new_item['user_id'])
    return jsonify({"success": True, "message": "Timeline item added", "item": new_item}), 201

@timeline_bp.route('/timeline/<id>', methods=['PUT'])
@require_auth
def update_timeline_item(id):
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    data = request.get_json()

    update_fields = {
        "timestamp": datetime.utcnow(),
    }
    if 'content' in data: update_fields['content'] = data['content']
    if 'type' in data: update_fields['type'] = data['type']

    result = timeline_collection.update_one(
        {"_id": ObjectId(id), "user_id": user_id},
        {"$set": update_fields}
    )

    if result.matched_count > 0:
        updated_item = timeline_collection.find_one({"_id": ObjectId(id)})
        updated_item['_id'] = str(updated_item['_id'])
        updated_item['user_id'] = str(updated_item['user_id'])
        return jsonify({"success": True, "message": "Timeline item updated", "item": updated_item}), 200
    else:
        return jsonify({"success": False, "message": "Timeline item not found or not authorized"}), 404

@timeline_bp.route('/timeline/<id>', methods=['DELETE'])
@require_auth
def delete_timeline_item(id):
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    result = timeline_collection.delete_one({"_id": ObjectId(id), "user_id": user_id})

    if result.deleted_count > 0:
        return jsonify({"success": True, "message": "Timeline item deleted"}), 200
    else:
        return jsonify({"success": False, "message": "Timeline item not found or not authorized"}), 404