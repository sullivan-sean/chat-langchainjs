"""Load html from files, clean up, split, ingest into Weaviate."""
from pathlib import Path
from langchain.document_loaders import ReadTheDocsLoader

if __name__ == "__main__":
    loader = ReadTheDocsLoader("langchain.readthedocs.io/en/latest/")
    raw_documents = loader.load()
    dir_path = Path("ingested_data")
    dir_path.mkdir(parents=True, exist_ok=True)
    for i, doc in enumerate(raw_documents):
        path = dir_path / f"{i}.json"
        with open(path, "w") as f:
            f.write(doc.json())
