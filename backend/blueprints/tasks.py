from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from datetime import datetime
from database import db # Import db from database.py
from auth import require_auth, get_current_user # Import auth functions

tasks_bp = Blueprint('tasks', __name__)
tasks_collection = db["tasks"]

@tasks_bp.route('/tasks', methods=['GET'])
@require_auth
def get_tasks():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    user_tasks = list(tasks_collection.find({"user_id": user_id}).sort("created_at", -1))
    for task in user_tasks:
        task['_id'] = str(task['_id'])
        task['user_id'] = str(task['user_id'])
    return jsonify({"success": True, "tasks": user_tasks}), 200

@tasks_bp.route('/tasks', methods=['POST'])
@require_auth
def add_task():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    data = request.get_json()
    title = data.get('title')
    priority = data.get('priority', 'low')
    due_date = data.get('due_date')

    if not title:
        return jsonify({"success": False, "message": "Title is required"}), 400

    new_task = {
        "user_id": user_id,
        "title": title,
        "completed": False,
        "priority": priority,
        "due_date": datetime.fromisoformat(due_date.replace('Z', '+00:00')) if due_date else None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = tasks_collection.insert_one(new_task)
    new_task['_id'] = str(result.inserted_id)
    new_task['user_id'] = str(new_task['user_id'])
    if new_task['due_date']: new_task['due_date'] = new_task['due_date'].isoformat()
    return jsonify({"success": True, "message": "Task added", "task": new_task}), 201

@tasks_bp.route('/tasks/<id>', methods=['PUT'])
@require_auth
def update_task(id):
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    data = request.get_json()

    update_fields = {
        "updated_at": datetime.utcnow(),
    }
    if 'title' in data: update_fields['title'] = data['title']
    if 'completed' in data: update_fields['completed'] = data['completed']
    if 'priority' in data: update_fields['priority'] = data['priority']
    if 'due_date' in data: update_fields['due_date'] = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))

    result = tasks_collection.update_one(
        {"_id": ObjectId(id), "user_id": user_id},
        {"$set": update_fields}
    )

    if result.matched_count > 0:
        updated_task = tasks_collection.find_one({"_id": ObjectId(id)})
        updated_task['_id'] = str(updated_task['_id'])
        updated_task['user_id'] = str(updated_task['user_id'])
        if updated_task['due_date']: updated_task['due_date'] = updated_task['due_date'].isoformat()
        return jsonify({"success": True, "message": "Task updated", "task": updated_task}), 200
    else:
        return jsonify({"success": False, "message": "Task not found or not authorized"}), 404

@tasks_bp.route('/tasks/<id>', methods=['DELETE'])
@require_auth
def delete_task(id):
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    result = tasks_collection.delete_one({"_id": ObjectId(id), "user_id": user_id})

    if result.deleted_count > 0:
        return jsonify({"success": True, "message": "Task deleted"}), 200
    else:
        return jsonify({"success": False, "message": "Task not found or not authorized"}), 404