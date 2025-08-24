"""
Optional: Direct OpenAI-compatible client for NVIDIA (or GPT-5)
Set OPENAI_BASE_URL/OPENAI_API_KEY/OPENAI_MODEL to switch (e.g., to GPT-5).
Defaults to NVIDIA NIM endpoint with your NVIDIA_API_KEY.
"""
import os
from typing import Iterable
from openai import OpenAI

def get_openai_client():
    base_url = os.getenv("OPENAI_BASE_URL", "https://integrate.api.nvidia.com/v1")
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("NVIDIA_API_KEY")
    return OpenAI(base_url=base_url, api_key=api_key)

def stream_chat(messages, model: str = None, temperature: float = 0.2, top_p: float = 0.7, max_tokens: int = 1024) -> Iterable[str]:
    client = get_openai_client()
    model_name = model or os.getenv("OPENAI_MODEL", os.getenv("LLM_MODEL", "meta/llama-3.1-70b-instruct"))
    completion = client.chat.completions.create(
        model=model_name,
        messages=messages,
        temperature=temperature,
        top_p=top_p,
        max_tokens=max_tokens,
        stream=True,
    )
    for chunk in completion:
        delta = chunk.choices[0].delta
        if delta and getattr(delta, "content", None):
            yield delta.content
