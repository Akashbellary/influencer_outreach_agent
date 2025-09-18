import os
import json
from datetime import datetime, timedelta
from functools import wraps
import hashlib
import secrets
from flask import request, jsonify, session, redirect
# Removed: from pymongo import MongoClient
from google.auth.transport import requests
from google.oauth2 import id_token
from google_auth_oauthlib.flow import Flow
import pathlib
import urllib
from bson.objectid import ObjectId

# Allow OAuthlib to work with http://localhost for development only
if os.environ.get('NODE_ENV') != 'production':
    os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

# Load config
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
config_path = os.path.join(BASE_DIR, "config.json")
with open(config_path, "r", encoding="utf-8") as f:
    config = json.load(f)

# Import db from database.py
from database import db

users_collection = db["userdata"]

# MongoDB Configuration (no longer needed here, as db is imported)
# MONGODB_URI = config["mongodb_uri"]
# client = MongoClient(MONGODB_URI)
# db = client["CampaignIO_DB"]
# users_collection = db["userdata"]

# Google OAuth Configuration
GOOGLE_CLIENT_CONFIG = config["google_client_config"]

# Create Flow instance for Google OAuth
flow = Flow.from_client_config(
    GOOGLE_CLIENT_CONFIG,
    scopes=[
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.events.readonly",
        "https://www.googleapis.com/auth/calendar.readonly",
    ]
)
# Use production redirect URI in production, localhost in development
if os.environ.get('NODE_ENV') == 'production':
    flow.redirect_uri = "https://campaignio.onrender.com/google-callback"
else:
    flow.redirect_uri = "http://localhost:8000/google-callback"

def hash_password(password, salt=None):
    """Hash a password with salt for secure storage"""
    if salt is None:
        salt = secrets.token_hex(16)
    pwdhash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return pwdhash.hex(), salt

def verify_password(stored_password, salt, provided_password):
    """Verify a stored password against one provided by user"""
    pwdhash, _ = hash_password(provided_password, salt)
    return pwdhash == stored_password

# The function `create_user_collection` has been removed.
# Creating a new database for each user is not a scalable or recommended practice
# in MongoDB. It leads to performance issues, increased resource consumption, and
# management difficulties.
#
# A better approach is to use a single database and include a `user_id` field
# in your other collections (like `campaigns`, `influencers`, etc.) to associate
# data with a specific user. This allows you to query for a user's data efficiently
# using indexes on the `user_id` field.
# All related logic for `user_collection` has been removed from this file.

def register_user(email, password, name=""):
    """Register a new user with email and password"""
    # Check if user already exists
    if users_collection.find_one({"email": email}):
        return {"success": False, "message": "User already exists"}
    
    # Hash password
    pwdhash, salt = hash_password(password)
    
    # Create user document
    user = {
        "email": email,
        "name": name,
        "password_hash": pwdhash,
        "salt": salt,
        "created_at": datetime.utcnow(),
        "last_login": datetime.utcnow(),
        "is_verified": False,
        "auth_method": "email"
    }
    
    # Insert user into database
    result = users_collection.insert_one(user)
    
    if result.inserted_id:
        return {"success": True, "message": "User registered successfully", "user_id": str(result.inserted_id)}
    else:
        return {"success": False, "message": "Failed to register user"}

def authenticate_user(email, password):
    """Authenticate a user with email and password"""
    user = users_collection.find_one({"email": email})
    
    if not user:
        return {"success": False, "message": "User not found"}
    
    if verify_password(user["password_hash"], user["salt"], password):
        # Update last login time
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Store user info in session
        session["user_id"] = str(user["_id"])
        session["email"] = user["email"]
        session["name"] = user.get("name", "")
        
        return {
            "success": True, 
            "message": "Authentication successful",
            "user": {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user.get("name", ""),
                "auth_method": user["auth_method"]
            }
        }
    else:
        return {"success": False, "message": "Invalid password"}

def google_login_callback():
    """Handle Google OAuth callback"""
    try:
        print(f"[v0] Google OAuth callback received: {request.url}")
        # Fetch token using authorization code
        flow.fetch_token(authorization_response=request.url)
        
        # Verify ID token
        id_info = id_token.verify_oauth2_token(
            flow.credentials._id_token,
            requests.Request(),
            GOOGLE_CLIENT_CONFIG["web"]["client_id"]
        )
        
        # Check if email is verified
        if not id_info.get("email_verified"):
            return redirect(f"{'https://campaignio.onrender.com' if os.environ.get('NODE_ENV') == 'production' else 'http://localhost:3000'}/google-callback?success=false&error=Email+not+verified")
        
        email = id_info.get("email")
        name = id_info.get("name", "")
        google_id = id_info.get("sub")
        
        # Check if user exists
        user = users_collection.find_one({"email": email})
        
        if not user:
            # Create new user
            user = {
                "email": email,
                "name": name,
                "google_id": google_id,
                "created_at": datetime.utcnow(),
                "last_login": datetime.utcnow(),
                "is_verified": True,
                "auth_method": "google"
            }
            result = users_collection.insert_one(user)
            user["_id"] = result.inserted_id
            
        else:
            # Update existing user
            users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": {"last_login": datetime.utcnow(), "google_id": google_id}}
            )
        
        # Store user info in session
        session["user_id"] = str(user["_id"])
        session["email"] = user["email"]
        session["name"] = user.get("name", "")
        
        # Encode user data for URL
        user_data = {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name", ""),
            "auth_method": user["auth_method"],
        }
        user_data_encoded = urllib.parse.quote(json.dumps(user_data))
        
        print(f"[v0] OAuth success - redirecting to frontend with user data: {user_data}")
        # Redirect to the frontend callback page to process parameters
        return redirect(f"{'https://campaignio.onrender.com' if os.environ.get('NODE_ENV') == 'production' else 'http://localhost:3000'}/google-callback?success=true&user_data={user_data_encoded}")
    except Exception as e:
        print(f"[v0] OAuth error: {str(e)}")
        # Redirect to frontend callback page with error
        return redirect(f"{'https://campaignio.onrender.com' if os.environ.get('NODE_ENV') == 'production' else 'http://localhost:3000'}/google-callback?success=false&error=Google+authentication+failed:+{urllib.parse.quote(str(e))}")

def get_google_login_url():
    """Get Google OAuth login URL"""
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true"
    )
    session["state"] = state
    return authorization_url

def logout_user():
    """Logout current user"""
    session.pop("user_id", None)
    session.pop("email", None)
    session.pop("name", None)
    return {"success": True, "message": "Logged out successfully"}

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"success": False, "message": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    """Get current authenticated user"""
    if "user_id" in session:
        user = users_collection.find_one({"_id": ObjectId(session["user_id"])})
        if user:
            return {
                "id": str(user["_id"]),
                "email": user["email"],
                "name": user.get("name", ""),
                "auth_method": user["auth_method"]
            }
    return None
