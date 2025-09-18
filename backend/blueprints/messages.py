from flask import Blueprint, request, jsonify
from pymongo import MongoClient
import json
import os
from bson.objectid import ObjectId

# Load config
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config_path = os.path.join(BASE_DIR, "config.json")
with open(config_path, "r", encoding="utf-8") as f:
    config = json.load(f)

# MongoDB Configuration
MONGODB_URI = config["mongodb_uri"]
client = MongoClient(MONGODB_URI)
db = client["CampaignIO_DB"]
messages_collection = db["messages"]

messages_bp = Blueprint('messages_bp', __name__)

@messages_bp.route('/messages', methods=['POST'])
def create_message():
    data = request.get_json()
    if not data or 'content' not in data:
        return jsonify({'error': 'Missing message content'}), 400
    
    message_id = messages_collection.insert_one(data).inserted_id
    return jsonify({'id': str(message_id)}), 201

@messages_bp.route('/messages', methods=['GET'])
def get_messages():
    messages = list(messages_collection.find())
    for message in messages:
        message['_id'] = str(message['_id'])
    return jsonify(messages), 200

@messages_bp.route('/messages/<message_id>', methods=['PUT'])
def update_message(message_id):
    data = request.get_json()
    messages_collection.update_one({'_id': ObjectId(message_id)}, {'$set': data})
    return jsonify({'message': 'Message updated successfully'}), 200

@messages_bp.route('/messages/<message_id>', methods=['DELETE'])
def delete_message(message_id):
    messages_collection.delete_one({'_id': ObjectId(message_id)})
    return jsonify({'message': 'Message deleted successfully'}), 200
