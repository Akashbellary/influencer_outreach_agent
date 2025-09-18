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
influencers_collection = db["influencers"] # Access collection from imported db

influencers_bp = Blueprint('influencers_bp', __name__)

@influencers_bp.route('/influencers', methods=['POST'])
def create_influencer():
    data = request.get_json()
    # Basic validation
    if not data or 'username' not in data:
        return jsonify({'error': 'Missing influencer username'}), 400
    
    influencer_id = influencers_collection.insert_one(data).inserted_id
    return jsonify({'id': str(influencer_id)}), 201

@influencers_bp.route('/influencers', methods=['GET'])
@require_auth
def get_influencers():
    user = get_current_user()
    if not user:
        return jsonify({"success": False, "message": "User not authenticated"}), 401
    user_id = str(user.get('_id'))
    influencers = list(influencers_collection.find({"user_id": user_id}))
    influencers = list(influencers_collection.find())
    for influencer in influencers:
        influencer['_id'] = str(influencer['_id'])
    return jsonify(influencers), 200
