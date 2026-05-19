from pathlib import Path
import shutil
import uuid

BASE_UPLOAD_DIR = Path("uploads/predictions")
BASE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def upload_to_drive(file_path, file_name=None, folder_id=None):
    """
    Local storage replacement for old Google Drive upload.

    Kept for backward compatibility with old code that still calls:
    upload_to_drive(file_path, file_name, folder_id)

    Returns a local file path string instead of Google Drive file ID.
    """

    source_path = Path(file_path)

    if not source_path.exists():
        raise FileNotFoundError(f"File tidak ditemukan: {source_path}")

    ext = source_path.suffix or ".jpg"
    safe_name = file_name or f"{uuid.uuid4().hex}{ext}"

    destination = BASE_UPLOAD_DIR / safe_name

    # Hindari overwrite kalau nama file sama
    if destination.exists():
        destination = BASE_UPLOAD_DIR / f"{uuid.uuid4().hex}_{safe_name}"

    shutil.copy2(source_path, destination)

    return str(destination)