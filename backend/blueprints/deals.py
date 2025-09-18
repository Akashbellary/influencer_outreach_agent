from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from datetime import datetime
from database import db # Import db from database.py
from auth import require_auth, get_current_user # Import auth functions

deals_bp = Blueprint('deals', __name__)
deals_collection = db.deals

@deals_bp.route('/deals', methods=['GET'])
@require_auth
def get_deals():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    user_deals = list(deals_collection.find({"user_id": user_id}).sort("created_at", -1))
    for deal in user_deals:
        deal['_id'] = str(deal['_id'])
        deal['user_id'] = str(deal['user_id'])
    return jsonify({"success": True, "deals": user_deals}), 200

@deals_bp.route('/deals', methods=['POST'])
@require_auth
def add_deal():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    data = request.get_json()
    title = data.get('title')
    value = data.get('value')
    stage = data.get('stage', 'new')
    influencer = data.get('influencer', '')

    if not title or value is None:
        return jsonify({"success": False, "message": "Title and value are required"}), 400

    new_deal = {
        "user_id": user_id,
        "title": title,
        "value": value,
        "stage": stage,
        "influencer": influencer,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = deals_collection.insert_one(new_deal)
    new_deal['_id'] = str(result.inserted_id)
    new_deal['user_id'] = str(new_deal['user_id'])
    return jsonify({"success": True, "message": "Deal added", "deal": new_deal}), 201

@deals_bp.route('/deals/<id>', methods=['PUT'])
@require_auth
def update_deal(id):
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    data = request.get_json()

    update_fields = {
        "updated_at": datetime.utcnow(),
    }
    if 'title' in data: update_fields['title'] = data['title']
    if 'value' in data: update_fields['value'] = data['value']
    if 'stage' in data: update_fields['stage'] = data['stage']
    if 'influencer' in data: update_fields['influencer'] = data['influencer']

    result = deals_collection.update_one(
        {"_id": ObjectId(id), "user_id": user_id},
        {"$set": update_fields}
    )

    if result.matched_count > 0:
        updated_deal = deals_collection.find_one({"_id": ObjectId(id)})
        updated_deal['_id'] = str(updated_deal['_id'])
        updated_deal['user_id'] = str(updated_deal['user_id'])
        return jsonify({"success": True, "message": "Deal updated", "deal": updated_deal}), 200
    else:
        return jsonify({"success": False, "message": "Deal not found or not authorized"}), 404

@deals_bp.route('/deals/<id>', methods=['DELETE'])
@require_auth
def delete_deal(id):
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401

    user_id = user.get('_id')
    result = deals_collection.delete_one({"_id": ObjectId(id), "user_id": user_id})

    if result.deleted_count > 0:
        return jsonify({"success": True, "message": "Deal deleted"}), 200
    else:
        return jsonify({"success": False, "message": "Deal not found or not authorized"}), 404
