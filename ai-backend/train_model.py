from ultralytics import YOLO
import os
import shutil
from datetime import datetime
from pathlib import Path

# ===============================
# CONFIG
# ===============================
BASE_MODEL = "yolov8s.pt"
DATA_YAML = "dataset/data.yaml"
PRODUCTION_MODEL = "models/best.pt"
BACKUP_DIR = "models/backup"

EPOCHS = 50
IMG_SIZE = 640


def train_model():
    data_yaml = Path(DATA_YAML)
    production_model = Path(PRODUCTION_MODEL)
    backup_dir = Path(BACKUP_DIR)

    if not data_yaml.exists():
        raise FileNotFoundError(f"Dataset config tidak ditemukan: {data_yaml}")

    backup_dir.mkdir(parents=True, exist_ok=True)

    # Backup model lama
    if production_model.exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = backup_dir / f"best_{timestamp}.pt"
        shutil.copy2(production_model, backup_path)
        print(f"✅ Backup model lama: {backup_path}")

    print("🚀 Mulai training YOLO...")

    model = YOLO(BASE_MODEL)

    results = model.train(
        data=str(data_yaml),
        epochs=EPOCHS,
        imgsz=IMG_SIZE,
        project="runs/detect",
        name="retrain",
        exist_ok=True,
    )

    # Ambil path hasil training langsung dari Ultralytics
    trained_model_path = Path(results.save_dir) / "weights" / "best.pt"

    if not trained_model_path.exists():
        raise FileNotFoundError(
            f"Training selesai, tapi best.pt tidak ditemukan di: {trained_model_path}"
        )

    production_model.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(trained_model_path, production_model)

    print(f"✅ Model baru berhasil dipasang ke: {production_model}")
    print(f"📦 Source model training: {trained_model_path}")

    return {
        "success": True,
        "model_path": str(production_model),
        "trained_model_path": str(trained_model_path),
    }


if __name__ == "__main__":
    train_model()