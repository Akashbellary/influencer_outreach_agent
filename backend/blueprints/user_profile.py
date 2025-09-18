from flask import Blueprint, request, jsonify
from datetime import datetime
from auth import require_auth, get_current_user
from database import users_collection, get_user_profile, create_user_profile, update_user_profile

user_profile_bp = Blueprint('user_profile', __name__)

@user_profile_bp.route('/user/profile', methods=['GET'])
@require_auth
def get_profile():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = str(user.get('_id')) # Ensure user_id is a string
    profile = users_collection.find_one({"user_id": user_id}) # Find profile by user_id

    if profile:
        profile['_id'] = str(profile['_id'])
        profile['user_id'] = str(profile['user_id'])
        return jsonify({"success": True, "profile": profile}), 200
    else:
        return jsonify({"success": False, "message": "Profile not found"}), 404

@user_profile_bp.route('/user/profile', methods=['POST'])
@require_auth
def create_profile():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = str(user.get('_id')) # Ensure user_id is a string
    if users_collection.find_one({"user_id": user_id}):
        return jsonify({"success": False, "message": "Profile already exists"}), 409

    data = request.get_json()
    profile_data = {
        "user_id": user_id,
        "name": data.get('name', user.get('name', '')),
        "email": data.get('email', user.get('email', '')),
        "bio": data.get('bio', ''),
        "social_links": data.get('social_links', {}),
        "preferences": data.get('preferences', {}),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    
    # Use the create_user_profile from database.py
    new_profile = create_user_profile(profile_data)
    if new_profile:
        return jsonify({"success": True, "message": "Profile created", "profile": new_profile}), 201
    return jsonify({"success": False, "message": "Failed to create profile"}), 500

@user_profile_bp.route('/user/profile', methods=['PUT'])
@require_auth
def update_profile():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = str(user.get('_id')) # Ensure user_id is a string
    data = request.get_json()
    
    update_fields = {
        "updated_at": datetime.utcnow(),
    }
    if 'name' in data: update_fields['name'] = data['name']
    if 'email' in data: update_fields['email'] = data['email']
    if 'bio' in data: update_fields['bio'] = data['bio']
    if 'social_links' in data: update_fields['social_links'] = data['social_links']
    if 'preferences' in data: update_fields['preferences'] = data['preferences']

    # Use the update_user_profile from database.py
    updated_profile = users_collection.find_one_and_update(
        {"user_id": user_id},
        {"$set": update_fields},
        return_document=True
    )

    if updated_profile:
        updated_profile['_id'] = str(updated_profile['_id'])
        updated_profile['user_id'] = str(updated_profile['user_id'])
        return jsonify({"success": True, "message": "Profile updated", "profile": updated_profile}), 200
    else:
        return jsonify({"success": False, "message": "Profile not found or no changes made"}), 404
