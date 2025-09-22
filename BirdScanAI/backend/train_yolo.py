from ultralytics import YOLO

model = YOLO('yolov8n.pt')

# Train with TensorBoard logging enabled
model.train(data='bird.yaml', epochs=50, imgsz=640, logger='tensorboard')






