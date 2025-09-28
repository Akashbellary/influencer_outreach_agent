from flask import Blueprint, request, jsonify, session
from database import get_db_connection
import logging

settings_bp = Blueprint('settings', __name__)

# MANUAL CONFIGURATION FOR WEB SCRAPING
# To ENABLE web scraping globally: Change GLOBAL_WEB_SCRAPING_ENABLED = True
# To DISABLE web scraping globally: Change GLOBAL_WEB_SCRAPING_ENABLED = False
GLOBAL_WEB_SCRAPING_ENABLED = False  # DEFAULT: DISABLED for Meta compliance

@settings_bp.route('/settings/web-scraping', methods=['GET', 'POST'])
def web_scraping_setting():
    """Get or update web scraping enabled/disabled setting for the current user"""
    
    # Use global setting instead of user authentication for now
    if request.method == 'GET':
        return jsonify({"success": True, "web_scraping_enabled": GLOBAL_WEB_SCRAPING_ENABLED})
    
    elif request.method == 'POST':
        # For now, just return the global setting (can't change it via API)
        return jsonify({"success": True, "web_scraping_enabled": GLOBAL_WEB_SCRAPING_ENABLED})
        
    # Original authenticated version (commented out):
    """
    if 'user_id' not in session:
        return jsonify({"success": False, "error": "Not authenticated"}), 401
    
    user_id = session['user_id']
    
    try:
        client = get_db_connection()
        db = client.get_default_database()
        collection = db.user_settings
        
        if request.method == 'GET':
            # Get current web scraping setting
            setting = collection.find_one({"user_id": user_id})
            web_scraping_enabled = setting.get("web_scraping_enabled", False) if setting else False  # Default to DISABLED
            return jsonify({"success": True, "web_scraping_enabled": web_scraping_enabled})
        
        elif request.method == 'POST':
            # Update web scraping setting
            data = request.get_json() or {}
            web_scraping_enabled = data.get("web_scraping_enabled", False)  # Default to DISABLED
            
            # Upsert the setting
            collection.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "user_id": user_id,
                        "web_scraping_enabled": web_scraping_enabled,
                        "updated_at": {"$currentDate": True}
                    }
                },
                upsert=True
            )
            
            return jsonify({"success": True, "web_scraping_enabled": web_scraping_enabled})
            
    except Exception as e:
        logging.error(f"Error handling web scraping setting: {e}")
        return jsonify({"success": False, "error": "Internal server error"}), 500
    """