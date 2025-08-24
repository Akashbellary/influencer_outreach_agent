def flatten_dict(d, parent_key='', sep='.'):
    """
    Flatten nested dictionary so Pinecone can accept it as metadata.
    Example: {"audience": {"country": "US", "age": 25}}
    → {"audience.country": "US", "audience.age": 25}
    """
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        elif isinstance(v, list):
            if all(isinstance(i, str) for i in v):
                items.append((new_key, v))  # valid: list of strings
            else:
                items.append((new_key, str(v)))  # convert non-string lists
        else:
            items.append((new_key, v))
    return dict(items)


def unflatten_dict(d, sep='.'):
    """
    Convert flattened dict back into nested JSON-like structure.
    """
    result = {}
    for k, v in d.items():
        keys = k.split(sep)
        current = result
        for part in keys[:-1]:
            current = current.setdefault(part, {})
        current[keys[-1]] = v
    return result


def clean_metadata(meta: dict) -> dict:
    """
    Remove None/null values and keep only Pinecone-allowed metadata types.
    Allowed: string, number, bool, list of strings
    """
    safe_meta = {}
    for k, v in meta.items():
        if v is None:
            continue
        if isinstance(v, (str, int, float, bool)):
            safe_meta[k] = v
        elif isinstance(v, list) and all(isinstance(i, str) for i in v):
            safe_meta[k] = v
        else:
            # Fallback: store as string
            safe_meta[k] = str(v)
    return safe_meta
