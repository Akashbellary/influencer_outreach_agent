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
        r = requests.get(url, params=params, timeout=20)
        if r.ok:
            data = r.json()
            arr = data.get("data") or []
            if arr:
                return arr[0].get("id")
    except Exception:
        pass
    return None

def _get_top_media_permalinks(ig_user_id: str, access_token: str, hashtag_id: str) -> List[str]:
    try:
        url = f"https://graph.facebook.com/v20.0/{hashtag_id}/top_media"
        params = {"user_id": ig_user_id, "fields": "id,permalink", "access_token": access_token}
        r = requests.get(url, params=params, timeout=20)
        if r.ok:
            data = r.json()
            return [m.get("permalink") for m in (data.get("data") or []) if m.get("permalink")]
    except Exception:
        pass
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

    job = _jobs[job_id]
    try:
        cfg = _load_config()
        ig_user_id = str(cfg.get("ig_user_id", ""))
        access_token = str(cfg.get("long_access_token", cfg.get("instagram_access_token", "")))
        hashtag_id = _get_hashtag_id(ig_user_id, access_token, hashtag)
        if not hashtag_id:
            job["status"] = "failed"
            job["message"] = "Invalid hashtag or API error"
            return

        permalinks = _get_top_media_permalinks(ig_user_id, access_token, hashtag_id)
        job["permalinks"] = permalinks
        if not permalinks:
            job["status"] = "completed"
            return

        proc = _spawn_node_username_extractor(permalinks)
        assert proc.stdout is not None

        for line in proc.stdout:
            line = line.strip()
            if not line:
                continue
            try:
                payload = json.loads(line)
            except Exception:
                continue

            url = payload.get("url")
            username = payload.get("username")
            if username:
                # Deduplicate
                if username in job["usernames"]:
                    continue
                job["usernames"].append(username)
                info = _get_user_info(ig_user_id, access_token, username)
                if info and isinstance(info, dict) and info.get("business_discovery"):
                    job["user_data"].append(info["business_discovery"])

        proc.wait(timeout=5)
        job["status"] = "completed"
    except Exception as e:
        job["status"] = "failed"
        job["message"] = str(e)


@discovery_bp.route("/start-discovery", methods=["POST"])
def start_discovery():
    data = request.get_json(silent=True) or {}
    hashtag = (data.get("hashtag") or "").strip()
    product_name = (data.get("productName") or "").strip() or None
    product_description = (data.get("productDescription") or "").strip() or None
    if not hashtag:
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


