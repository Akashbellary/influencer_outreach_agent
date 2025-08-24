import json
from typing import List, Dict, Any
from llama_index.core import Document

def load_people_json_file(uploaded_file) -> List[Dict[str, Any]]:
    """
    uploaded_file: Streamlit UploadedFile or a file-like object.
    Returns list of people dicts.
    """
    data = json.loads(uploaded_file.read().decode("utf-8"))
    if isinstance(data, dict):
        data = [data]
    return data

def flatten_person_to_text(person: Dict[str, Any]) -> str:
    """
    Convert a person record into a descriptive text for semantic embeddings.
    """
    parts = []
    name = person.get("name")
    username = person.get("username")
    platform = person.get("platform")
    email = person.get("email")
    phone = person.get("phone")
    company = person.get("company")
    is_active = person.get("isActive")
    follower_count = person.get("followerCount")
    following_count = person.get("followingCount")
    post_count = person.get("postCount")
    is_verified = person.get("isVerified")
    is_business = person.get("isBusinessAccount")

    posts = person.get("postsAnalysis", {})
    captions = posts.get("captions")
    hashtags = posts.get("hashtags")
    image_content = posts.get("imageContent")

    brand = person.get("brandAlignment", {})
    tone = brand.get("toneMatchScore")
    notes = brand.get("alignmentNotes")

    auth = person.get("authenticityScore", {})
    auth_score = auth.get("score")
    fake_pct = auth.get("fakeFollowersEstimate")
    engagement = auth.get("engagementRate")

    audience = person.get("audienceMatch", {})
    demographics = audience.get("demographics", {})
    gender = demographics.get("gender")
    age_groups = demographics.get("ageGroups")
    locations = audience.get("locations")

    tags = person.get("tags")
    favorite = person.get("favoriteProduct")

    parts.append(f"Name: {name}, Username: {username}, Platform: {platform}.")
    parts.append(f"Contact: email {email}, phone {phone}. Company: {company}. Active: {is_active}.")
    parts.append(f"Followers: {follower_count}, Following: {following_count}, Posts: {post_count}.")
    parts.append(f"Verified: {is_verified}, Business account: {is_business}.")
    if captions:
        parts.append(f"Typical caption: {captions}")
    if hashtags:
        parts.append(f"Hashtags: {', '.join(hashtags)}")
    if image_content:
        parts.append(f"Image content: {image_content}")
    if tone is not None or notes:
        parts.append(f"Brand alignment: tone match {tone}. Notes: {notes}")
    if auth_score is not None or fake_pct or engagement:
        parts.append(f"Authenticity score: {auth_score}, Fake followers: {fake_pct}, Engagement: {engagement}")
    if gender or age_groups:
        parts.append(f"Audience: gender {gender}, age groups {age_groups}")
    if locations:
        parts.append(f"Locations: {', '.join(locations)}")
    if tags:
        parts.append(f"Tags: {', '.join(tags)}")
    if favorite:
        parts.append(f"Favorite product: {favorite}")

    return " ".join([str(p) for p in parts if p is not None])

def people_to_documents(people: List[Dict[str, Any]]) -> List[Document]:
    """
    Convert people list into LlamaIndex Documents with metadata.
    """
    docs = []
    for p in people:
        text = flatten_person_to_text(p)
        meta = dict(p)  # keep entire record for source display
        pid = p.get('id', p.get('_id', ''))
        if isinstance(pid, str):
            pid = pid.strip()
        doc_id = f"person-{pid or abs(hash(text))}"
        docs.append(Document(text=text, metadata=meta, doc_id=doc_id))
    return docs

