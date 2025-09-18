from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from datetime import datetime
from database import db # Import db from database.py
from auth import require_auth, get_current_user # Import auth functions

events_bp = Blueprint('events', __name__)
events_collection = db.events

@events_bp.route('/events', methods=['GET'])
@require_auth
def get_events():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    user_events = list(events_collection.find({"user_id": user_id}).sort("start_time", -1))
    for event in user_events:
        event['_id'] = str(event['_id'])
        event['user_id'] = str(event['user_id'])
    return jsonify({"success": True, "events": user_events}), 200

@events_bp.route('/events', methods=['POST'])
@require_auth
def add_event():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    data = request.get_json()
    title = data.get('title')
    start_time = data.get('start_time')
    location = data.get('location', '')

    if not title or not start_time:
        return jsonify({"success": False, "message": "Title and start_time are required"}), 400

    new_event = {
        "user_id": user_id,
        "title": title,
        "start_time": datetime.fromisoformat(start_time.replace('Z', '+00:00')),
        "location": location,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = events_collection.insert_one(new_event)
    new_event['_id'] = str(result.inserted_id)
    new_event['user_id'] = str(new_event['user_id'])
    new_event['start_time'] = new_event['start_time'].isoformat()
    return jsonify({"success": True, "message": "Event added", "event": new_event}), 201

@events_bp.route('/events/<id>', methods=['PUT'])
@require_auth
def update_event(id):
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    data = request.get_json()

    update_fields = {
        "updated_at": datetime.utcnow(),
    }
    if 'title' in data: update_fields['title'] = data['title']
    if 'start_time' in data: update_fields['start_time'] = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
    if 'location' in data: update_fields['location'] = data['location']

    result = events_collection.update_one(
        {"_id": ObjectId(id), "user_id": user_id},
        {"$set": update_fields}
    )

    if result.matched_count > 0:
        updated_event = events_collection.find_one({"_id": ObjectId(id)})
        updated_event['_id'] = str(updated_event['_id'])
        updated_event['user_id'] = str(updated_event['user_id'])
        updated_event['start_time'] = updated_event['start_time'].isoformat()
        return jsonify({"success": True, "message": "Event updated", "event": updated_event}), 200
    else:
        return jsonify({"success": False, "message": "Event not found or not authorized"}), 404

@events_bp.route('/events/<id>', methods=['DELETE'])
@require_auth
def delete_event(id):
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    result = events_collection.delete_one({"_id": ObjectId(id), "user_id": user_id})

    if result.deleted_count > 0:
        return jsonify({"success": True, "message": "Event deleted"}), 200
    else:
        return jsonify({"success": False, "message": "Event not found or not authorized"}), 404