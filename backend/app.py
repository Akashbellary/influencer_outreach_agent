print("Starting app.py...")
import os
import json
import time
import random
import requests
from flask import Flask, request, jsonify, session, redirect, url_for
from flask_cors import CORS
from username_worker import discovery_bp
from blueprints.history import history_bp
# Import auth module
from auth import register_user, authenticate_user, google_login_callback, get_google_login_url, logout_user, require_auth, get_current_user

# Import blueprints
from blueprints.campaigns import campaigns_bp
from blueprints.influencers import influencers_bp
from blueprints.notes import notes_bp
from blueprints.events import events_bp
from blueprints.tasks import tasks_bp
from blueprints.deals import deals_bp
from blueprints.deals import deals_bp
from blueprints.messages import messages_bp
from blueprints.timeline import timeline_bp
from blueprints.user_profile import user_profile_bp
from blueprints.todos import todos_bp

# ---------------- Load Config ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(BASE_DIR, "config.json")
with open(config_path, "r", encoding="utf-8") as f:
    config = json.load(f)

# Import db from database.py
from database import db


# ---------------- Flask App ----------------
app = Flask(__name__)
app.secret_key = config['app_secret_key']  # Required for sessions

# Configure session cookie settings for cross-origin requests
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS

# Configure CORS with credentials support
CORS(app, supports_credentials=True, origins=["http://localhost:3000", "http://localhost:3001", "https://campaignio.onrender.com"], allow_headers=[
    "Content-Type",
    "Authorization"
], methods=["GET", "POST", "OPTIONS", "PATCH"], expose_headers=["Access-Control-Allow-Credentials"])

# Register async discovery blueprint (non-breaking)
app.register_blueprint(discovery_bp)
app.register_blueprint(history_bp)

# Register blueprints
app.register_blueprint(campaigns_bp, url_prefix='/api')
app.register_blueprint(influencers_bp, url_prefix='/api')
app.register_blueprint(notes_bp, url_prefix='/api')
app.register_blueprint(events_bp, url_prefix='/api')
app.register_blueprint(tasks_bp, url_prefix='/api')
app.register_blueprint(deals_bp, url_prefix='/api')
app.register_blueprint(messages_bp, url_prefix='/api')
app.register_blueprint(timeline_bp, url_prefix='/api')
app.register_blueprint(user_profile_bp, url_prefix='/api')
app.register_blueprint(todos_bp, url_prefix='/api')

IG_USER_ID = config["ig_user_id"]
ACCESS_TOKEN = config["long_access_token"]

# ---------------- Helpers ----------------
FIELDS = "id,caption,media_type,media_url,permalink,like_count,comments_count,timestamp"
INSTAGRAM_ERROR_OCCURRED = False  # Flag to track if we've encountered an Instagram error
LAST_PERMALINKS =  []  # Store permalinks for fallback

# ---------------- Auth Routes ----------------
@app.route("/register", methods=["POST"])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
        name = data.get("name", "")
        
        if not email or not password:
            return jsonify({"success": False, "message": "Email and password are required"}), 400
        
        result = register_user(email, password, name)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "message": f"Registration failed: {str(e)}"}), 500

@app.route("/login", methods=["POST"])
def login():
    """Login with email and password"""
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
        
        if not email or not password:
            return jsonify({"success": False, "message": "Email and password are required"}), 400
        
        result = authenticate_user(email, password)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "message": f"Login failed: {str(e)}"}), 500

@app.route("/google-login")
def google_login():
    """Initiate Google OAuth login"""
    try:
        authorization_url = get_google_login_url()
        return jsonify({"success": True, "authorization_url": authorization_url})
    except Exception as e:
        return jsonify({"success": False, "message": f"Google login initiation failed: {str(e)}"}), 500

@app.route("/google-callback")
def google_callback():
    """Handle Google OAuth callback"""
    # Use the updated function from auth.py that handles port detection
    return google_login_callback()

@app.route("/logout", methods=["POST"])
@require_auth
def logout():
    """Logout current user"""
    try:
        result = logout_user()
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "message": f"Logout failed: {str(e)}"}), 500

@app.route("/current-user", methods=["GET"])
@require_auth
def current_user():
    """Get current authenticated user"""
    try:
        user = get_current_user()
        if user:
            return jsonify({"success": True, "user": user})
        else:
            return jsonify({"success": False, "message": "User not found"}), 404
    except Exception as e:
        return jsonify({"success": False, "message": f"Failed to get user: {str(e)}"}), 500

# ---------------- Existing Instagram Routes ----------------
def get_hashtag_id(hashtag_query):
    """Get Instagram Hashtag ID using Graph API"""
    global INSTAGRAM_ERROR_OCCURRED
    search_url = "https://graph.facebook.com/v23.0/ig_hashtag_search"
    params = {"user_id": IG_USER_ID, "q": hashtag_query, "access_token": ACCESS_TOKEN}
    try:
        response = requests.get(search_url, params=params)
        if response.status_code == 200:
            data = response.json()
            return data["data"][0]["id"]
        else:
            INSTAGRAM_ERROR_OCCURRED = True
    except Exception as e:
        print(f"Error in get_hashtag_id: {e}")
        INSTAGRAM_ERROR_OCCURRED = True
    return None

def get_top_media_for_hashtag(hashtag_id):
    """Fetch top media permalinks for a hashtag"""
    global INSTAGRAM_ERROR_OCCURRED, LAST_PERMALINKS
    media_url = f"https://graph.facebook.com/v20.0/{hashtag_id}/top_media"
    params = {"user_id": IG_USER_ID, "fields": FIELDS, "access_token": ACCESS_TOKEN}
    try:
        response = requests.get(media_url, params=params)
        permalinks = []
        if response.status_code == 200:
            for media in response.json().get("data", []):
                permalinks.append(media.get("permalink"))
            LAST_PERMALINKS = permalinks
            return permalinks
        else:
            INSTAGRAM_ERROR_OCCURRED = True
    except Exception as e:
        print(f"Error in get_top_media_for_hashtag: {e}")
        INSTAGRAM_ERROR_OCCURRED = True
    return []

# ---------------- Existing Routes ----------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Instagram Business Info API is running", 
                    "usage": "/hashtag-info?hashtag=<hashtag_name>"})

@app.route("/hashtag-info", methods=["GET"])
def hashtag_info():
    """User provides a hashtag, returns info of Instagram users in JSON"""
    global INSTAGRAM_ERROR_OCCURRED, LAST_PERMALINKS
    # Reset the error flag for each request
    INSTAGRAM_ERROR_OCCURRED = False
    
    hashtag_query = request.args.get("hashtag")
    if not hashtag_query:
        return jsonify({"status": "error", "message": "Please provide a hashtag"}), 400

    # Step 1: Get hashtag ID
    hashtag_id = get_hashtag_id(hashtag_query)
    if not hashtag_id:
        return jsonify({"status": "error", "message": "Invalid hashtag or API error"}), 400

    # Step 2: Fetch top media permalinks
    permalinks = get_top_media_for_hashtag(hashtag_id)
    if not permalinks:
        return jsonify({"status": "error", "message": "No media found for this hashtag"}), 404

    # Step 3: Save permalinks to database (best-effort; no-op if Mongo not configured)
    try:
        from db import insert_permalinks
        insert_permalinks(permalinks, hashtag_query)
    except Exception:
        pass

    # Prepare response
    response_data = {
        "hashtag": hashtag_query,
        "user_data": [],
        "fallback_permalinks": permalinks,
        "message": "Successfully fetched permalinks."
    }
    
    return jsonify(response_data)

# ---------------- Run Flask ----------------
if __name__ == "__main__":
    print("Flask API running at http://127.0.0.1:8000")
    app.run(host="127.0.0.1", port=8000, debug=False, use_reloader=False)



