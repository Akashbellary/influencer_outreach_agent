from flask import Blueprint, request, jsonify
from auth import require_auth, get_current_user
from database import get_todos, create_todo, update_todo

todos_bp = Blueprint('todos', __name__)

@todos_bp.route('/todos', methods=['GET'])
@require_auth
def get_all_todos():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = str(user.get('_id'))
    todos = get_todos(user_id)
    return jsonify({"success": True, "todos": todos}), 200

@todos_bp.route('/todos', methods=['POST'])
@require_auth
def add_todo():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = str(user.get('_id'))
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')

    if not title:
        return jsonify({"success": False, "message": "Title is required"}), 400

    todo_data = {
        "user_id": user_id,
        "title": title,
        "description": description,
        "completed": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    new_todo = create_todo(todo_data)
    if new_todo:
        return jsonify({"success": True, "message": "Todo created", "todo": new_todo}), 201
    return jsonify({"success": False, "message": "Failed to create todo"}), 500

@todos_bp.route('/todos/<todo_id>', methods=['PUT'])
@require_auth
def update_single_todo(todo_id):
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    data = request.get_json()
    update_fields = {"updated_at": datetime.utcnow()}
    if 'title' in data: update_fields['title'] = data['title']
    if 'description' in data: update_fields['description'] = data['description']
    if 'completed' in data: update_fields['completed'] = data['completed']

    updated_todo = update_todo(todo_id, update_fields)
    if updated_todo:
        updated_todo['_id'] = str(updated_todo['_id'])
        return jsonify({"success": True, "message": "Todo updated", "todo": updated_todo}), 200
    return jsonify({"success": False, "message": "Todo not found or no changes made"}), 404
