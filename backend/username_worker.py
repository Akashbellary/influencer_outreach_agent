import os
import json
import threading
import subprocess
import sys
import time
import uuid
from typing import List, Dict, Any, Optional
from flask import Blueprint, request, jsonify
import requests

# In-memory job store. For production, switch to Redis or a DB.
_jobs: Dict[str, Dict[str, Any]] = {}

discovery_bp = Blueprint("discovery", __name__)

def _ensure_node_path() -> str:
    node = "node"
    return node

def _spawn_node_username_extractor(permalinks: List[str]):
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    extractor_path = os.path.join(backend_dir, "node_username_extractor.js")
    if not os.path.exists(extractor_path):
        raise FileNotFoundError(f"Extractor not found at {extractor_path}")
    node = _ensure_node_path()
    # Pass JSON array via stdin; output JSON lines per result
    proc = subprocess.Popen(
        [node, extractor_path],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )
    assert proc.stdin is not None
    proc.stdin.write(json.dumps({"permalinks": permalinks}))
    proc.stdin.close()
    return proc

def _load_config() -> Dict[str, Any]:
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    cfg_path = os.path.join(backend_dir, "config.json")
    try:
        with open(cfg_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _get_hashtag_id(ig_user_id: str, access_token: str, hashtag_query: str) -> Optional[str]:
    try:
        url = "https://graph.facebook.com/v23.0/ig_hashtag_search"
        params = {"user_id": ig_user_id, "q": hashtag_query, "access_token": access_token}
        print(f"[v0] Calling Instagram API: {url} with params: {params}")
        r = requests.get(url, params=params, timeout=20)
        print(f"[v0] Instagram API response status: {r.status_code}")
        if r.ok:
            data = r.json()
            print(f"[v0] Instagram API response data: {data}")
            arr = data.get("data") or []
            if arr:
                hashtag_id = arr[0].get("id")
                print(f"[v0] Found hashtag ID: {hashtag_id}")
                return hashtag_id
            else:
                print(f"[v0] No hashtag data found in response")
        else:
            print(f"[v0] Instagram API error: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"[v0] Exception in _get_hashtag_id: {e}")
    return None

def _get_top_media_permalinks(ig_user_id: str, access_token: str, hashtag_id: str) -> List[str]:
    try:
        url = f"https://graph.facebook.com/v20.0/{hashtag_id}/top_media"
        params = {"user_id": ig_user_id, "fields": "id,permalink", "access_token": access_token}
        print(f"[v0] Calling Instagram media API: {url} with params: {params}")
        r = requests.get(url, params=params, timeout=20)
        print(f"[v0] Instagram media API response status: {r.status_code}")
        if r.ok:
            data = r.json()
            print(f"[v0] Instagram media API response data: {data}")
            permalinks = [m.get("permalink") for m in (data.get("data") or []) if m.get("permalink")]
            print(f"[v0] Found {len(permalinks)} permalinks")
            return permalinks
        else:
            print(f"[v0] Instagram media API error: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"[v0] Exception in _get_top_media_permalinks: {e}")
    return []

def _get_user_info(ig_user_id: str, access_token: str, username: str) -> Dict[str, Any]:
    try:
        url = (
            f"https://graph.facebook.com/v21.0/{ig_user_id}"
            f"?fields=business_discovery.username({username}){{id,username,followers_count,media_count,name,biography,website,profile_picture_url,follows_count,is_published}}"
            f"&access_token={access_token}"
        )
        r = requests.get(url, timeout=20)
        if r.ok:
            return r.json()
    except Exception:
        pass
    return {}

def _worker_thread(job_id: str, hashtag: str, product_name: Optional[str], product_description: Optional[str]):
    print(f"[v0] Worker thread started for job {job_id}, hashtag: {hashtag}")
    job = _jobs[job_id]
    try:
        print(f"[v0] Loading config for job {job_id}")
        cfg = _load_config()
        ig_user_id = str(cfg.get("ig_user_id", ""))
        access_token = str(cfg.get("long_access_token", cfg.get("instagram_access_token", "")))
        print(f"[v0] Config loaded - ig_user_id: {ig_user_id[:10]}..., access_token: {access_token[:10]}...")
        
        print(f"[v0] Getting hashtag ID for: {hashtag}")
        hashtag_id = _get_hashtag_id(ig_user_id, access_token, hashtag)
        print(f"[v0] Hashtag ID result: {hashtag_id}")
        if not hashtag_id:
            job["status"] = "failed"
            job["message"] = "Invalid hashtag or API error"
            print(f"[v0] Failed to get hashtag ID for: {hashtag}")
            return

        print(f"[v0] Getting top media permalinks for hashtag ID: {hashtag_id}")
        permalinks = _get_top_media_permalinks(ig_user_id, access_token, hashtag_id)
        print(f"[v0] Found {len(permalinks)} permalinks: {permalinks[:3]}...")
        job["permalinks"] = permalinks
        if not permalinks:
            job["status"] = "completed"
            print(f"[v0] No permalinks found, completing job")
            return

        print(f"[v0] Spawning Node.js username extractor for {len(permalinks)} permalinks")
        proc = _spawn_node_username_extractor(permalinks)
        assert proc.stdout is not None

        print(f"[v0] Reading output from Node.js extractor...")
        for line in proc.stdout:
            line = line.strip()
            if not line:
                continue
            try:
                payload = json.loads(line)
                print(f"[v0] Received from Node.js: {payload}")
            except Exception as e:
                print(f"[v0] Failed to parse Node.js output: {line}, error: {e}")
                continue

            url = payload.get("url")
            username = payload.get("username")
            if username:
                print(f"[v0] Found username: {username} from URL: {url}")
                # Deduplicate
                if username in job["usernames"]:
                    print(f"[v0] Username {username} already processed, skipping")
                    continue
                job["usernames"].append(username)
                print(f"[v0] Getting user info for: {username}")
                info = _get_user_info(ig_user_id, access_token, username)
                if info and isinstance(info, dict) and info.get("business_discovery"):
                    print(f"[v0] Got user info for {username}: {info['business_discovery'].get('username', 'N/A')}")
                    job["user_data"].append(info["business_discovery"])
                else:
                    print(f"[v0] Failed to get user info for: {username}")

        print(f"[v0] Waiting for Node.js process to complete...")
        proc.wait(timeout=5)
        print(f"[v0] Node.js process completed. Final job status: {len(job['user_data'])} users found")
        job["status"] = "completed"
    except Exception as e:
        job["status"] = "failed"
        job["message"] = str(e)


@discovery_bp.route("/start-discovery", methods=["POST"])
def start_discovery():
    print(f"[v0] start_discovery called with data: {request.get_json(silent=True)}")
    data = request.get_json(silent=True) or {}
    hashtag = (data.get("hashtag") or "").strip()
    product_name = (data.get("productName") or "").strip() or None
    product_description = (data.get("productDescription") or "").strip() or None
    print(f"[v0] Parsed hashtag: {hashtag}, product_name: {product_name}")
    if not hashtag:
        print(f"[v0] Error: hashtag is required")
        return jsonify({"success": False, "message": "hashtag is required"}), 400

    job_id = uuid.uuid4().hex
    _jobs[job_id] = {
        "status": "running",
        "hashtag": hashtag,
        "permalinks": [],
        "usernames": [],
        "user_data": [],
        "message": "",
        "created_at": time.time(),
    }

    t = threading.Thread(target=_worker_thread, args=(job_id, hashtag, product_name, product_description), daemon=True)
    t.start()

    print(f"[v0] Started discovery job: {job_id}")
    return jsonify({"success": True, "job_id": job_id})


@discovery_bp.route("/discovery-status/<job_id>", methods=["GET"])
def discovery_status(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        return jsonify({"success": False, "message": "job not found"}), 404
    return jsonify({
        "success": True,
        "status": job["status"],
        "permalinks": job.get("permalinks", []),
        "usernames": job.get("usernames", []),
        "user_data": job.get("user_data", []),
        "message": job.get("message", ""),
    })


