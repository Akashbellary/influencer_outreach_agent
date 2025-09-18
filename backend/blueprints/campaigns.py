from flask import Blueprint, request, jsonify
# Removed: from pymongo import MongoClient
import json
import os
from database import db # Import db from database.py
from auth import require_auth, get_current_user # Import auth functions

# Load config
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config_path = os.path.join(BASE_DIR, "config.json")
with open(config_path, "r", encoding="utf-8") as f:
    config = json.load(f)

# MongoDB Configuration (no longer needed here, as db is imported)
# MONGODB_URI = config["mongodb_uri"]
# client = MongoClient(MONGODB_URI)
# db = client["CampaignIO_DB"]
campaigns_collection = db["campaigns"] # Access collection from imported db

campaigns_bp = Blueprint('campaigns_bp', __name__)

@campaigns_bp.route('/campaigns', methods=['POST'])
def create_campaign():
    data = request.get_json()
    # Basic validation
    if not data or 'name' not in data:
        return jsonify({'error': 'Missing campaign name'}), 400
    
    campaign_id = campaigns_collection.insert_one(data).inserted_id
    return jsonify({'id': str(campaign_id)}), 201

@campaigns_bp.route('/campaigns', methods=['GET'])
@require_auth
def get_campaigns():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401
    user_id = str(user.get('_id'))
    campaigns = list(campaigns_collection.find({"user_id": user_id}))
    campaigns = list(campaigns_collection.find())
    for campaign in campaigns:
        campaign['_id'] = str(campaign['_id'])
    return jsonify(campaigns), 200
