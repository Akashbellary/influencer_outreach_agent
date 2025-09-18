from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from datetime import datetime
from database import db
from auth import require_auth, get_current_user

notes_bp = Blueprint('notes', __name__)
notes_collection = db.notes

@notes_bp.route('/notes', methods=['GET'])
@require_auth
def get_notes():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    user_notes = list(notes_collection.find({"user_id": user_id}).sort("created_at", -1))
    for note in user_notes:
        note['_id'] = str(note['_id'])
        note['user_id'] = str(note['user_id'])
    return jsonify({"success": True, "notes": user_notes}), 200

@notes_bp.route('/notes', methods=['POST'])
@require_auth
def add_note():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    data = request.get_json()
    title = data.get('title')
    content = data.get('content', '')

    if not title:
        return jsonify({"success": False, "message": "Title is required"}), 400

    new_note = {
        "user_id": user_id,
        "title": title,
        "content": content,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = notes_collection.insert_one(new_note)
    new_note['_id'] = str(result.inserted_id)
    new_note['user_id'] = str(new_note['user_id'])
    return jsonify({"success": True, "message": "Note added", "note": new_note}), 201

@notes_bp.route('/notes/<id>', methods=['PUT'])
@require_auth
def update_note(id):
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    data = request.get_json()

    update_fields = {
        "updated_at": datetime.utcnow(),
    }
    if 'title' in data: update_fields['title'] = data['title']
    if 'content' in data: update_fields['content'] = data['content']

    result = notes_collection.update_one(
        {"_id": ObjectId(id), "user_id": user_id},
        {"$set": update_fields}
    )

    if result.matched_count > 0:
        updated_note = notes_collection.find_one({"_id": ObjectId(id)})
        updated_note['_id'] = str(updated_note['_id'])
        updated_note['user_id'] = str(updated_note['user_id'])
        return jsonify({"success": True, "message": "Note updated", "note": updated_note}), 200
    else:
        return jsonify({"success": False, "message": "Note not found or not authorized"}), 404

@notes_bp.route('/notes/<id>', methods=['DELETE'])
@require_auth
def delete_note(id):
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    result = notes_collection.delete_one({"_id": ObjectId(id), "user_id": user_id})

    if result.deleted_count > 0:
        return jsonify({"success": True, "message": "Note deleted"}), 200
    else:
        return jsonify({"success": False, "message": "Note not found or not authorized"}), 404