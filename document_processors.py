import os
from typing import List
from llama_index.core import SimpleDirectoryReader

def materialize_uploaded_files(uploaded_files, tmp_dir: str) -> List[str]:
    """
    Save Streamlit UploadedFile objects to tmp_dir and return file paths.
    """
    paths = []
    for f in uploaded_files:
        file_name = f.name or "uploaded_file"
        safe_name = file_name.replace("/", "_").replace("\\", "_")
        path = os.path.join(tmp_dir, safe_name)
        with open(path, "wb") as out:
            out.write(f.read())
        paths.append(path)
    return paths

def ingest_directory_documents(directory_path: str):
    """
    Read documents from a directory using LlamaIndex's SimpleDirectoryReader.
    """
    reader = SimpleDirectoryReader(input_dir=directory_path, recursive=True)
    docs = reader.load_data()
    return docs
