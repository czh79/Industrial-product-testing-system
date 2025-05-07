from flask import Flask, request, jsonify
import os
import uuid
import time
from werkzeug.utils import secure_filename
import numpy as np
import cv2
import torch
from PIL import Image
import torchvision
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from torchvision.transforms import functional as F

app = Flask(__name__)

# 模拟数据库
training_tasks = {}
models = {}
defect_classes = {
    1: {"name": "划痕", "color": "#ef4444"},
    2: {"name": "凹陷", "color": "#f97316"},
    3: {"name": "污渍", "color": "#eab308"},
    4: {"name": "缺失", "color": "#84cc16"},
    5: {"name": "变形", "color": "#06b6d4"},
}

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 加载预训练模型
def load_model(model_type="faster-rcnn"):
    if model_type == "faster-rcnn":
        model = fasterrcnn_resnet50_fpn(pretrained=True)
        model.eval()
        return model
    else:
        # 这里可以添加其他模型的加载逻辑
        return None

# 图像预处理
def preprocess_image(image_path):
    image = Image.open(image_path).convert("RGB")
    image_tensor = F.to_tensor(image)
    return image_tensor.unsqueeze(0)

# 执行检测
def detect_defects(image_path, model_id="default", threshold=0.5):
    try:
        # 加载模型
        model = load_model()
        
        # 预处理图像
        image_tensor = preprocess_image(image_path)
        
        # 执行推理
        with torch.no_grad():
            predictions = model(image_tensor)
        
        # 处理结果
        boxes = predictions[0]['boxes'].cpu().numpy()
        scores = predictions[0]['scores'].cpu().numpy()
        labels = predictions[0]['labels'].cpu().numpy()
        
        # 过滤低置信度结果
        mask = scores > float(threshold)
        boxes = boxes[mask]
        scores = scores[mask]
        labels = labels[mask]
        
        # 转换为前端需要的格式
        defects = []
        for i, (box, score, label) in enumerate(zip(boxes, scores, labels)):
            # 随机分配缺陷类型（在实际应用中，这应该基于模型的预测）
            defect_type = np.random.choice(list(defect_classes.keys()))
            defect_info = defect_classes[defect_type]
            
            defects.append({
                "id": i + 1,
                "type": defect_info["name"],
                "confidence": float(score),
                "x": int(box[0]),
                "y": int(box[1]),
                "width": int(box[2] - box[0]),
                "height": int(box[3] - box[1]),
                "color": defect_info["color"]
            })
        
        return defects
    except Exception as e:
        print(f"检测过程出错: {str(e)}")
        return []

# 训练模型（模拟）
def train_model(dataset_id, model_type, batch_size, epochs, learning_rate, split_ratio, augmentation):
    task_id = str(uuid.uuid4())
    training_tasks[task_id] = {
        "status": "running",
        "progress": 0,
        "current_epoch": 0,
        "total_epochs": epochs,
        "metrics": {
            "loss": 1.0,
            "accuracy": 0.5,
            "precision": 0.6,
            "recall": 0.55
        },
        "start_time": time.time(),
        "params": {
            "dataset_id": dataset_id,
            "model_type": model_type,
            "batch_size": batch_size,
            "epochs": epochs,
            "learning_rate": learning_rate,
            "split_ratio": split_ratio,
            "augmentation": augmentation
        }
    }
    
    # 在实际应用中，这里应该启动一个后台任务来训练模型
    # 这里我们只是模拟训练过程
    
    return task_id

@app.route('/api/detect', methods=['POST'])
def detect():
    try:
        data = request.json
        image_path = data.get('imagePath')
        model_id = data.get('modelId', 'default')
        threshold = data.get('threshold', 0.5)
        
        # 确保图像路径有效
        if not image_path or not os.path.exists(os.path.join(UPLOAD_FOLDER, os.path.basename(image_path))):
            return jsonify({"success": False, "message": "无效的图像路径"}), 400
        
        # 执行检测
        defects = detect_defects(os.path.join(UPLOAD_FOLDER, os.path.basename(image_path)), model_id, threshold)
        
        return jsonify({"success": True, "defects": defects})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/train', methods=['POST'])
def train():
    try:
        data = request.json
        dataset_id = data.get('datasetId')
        model_type = data.get('modelType')
        batch_size = data.get('batchSize')
        epochs = data.get('epochs')
        learning_rate = data.get('learningRate')
        split_ratio = data.get('splitRatio')
        augmentation = data.get('augmentation')
        
        # 验证参数
        if not all([dataset_id, model_type, batch_size, epochs, learning_rate, split_ratio is not None]):
            return jsonify({"success": False, "message": "缺少必要的训练参数"}), 400
        
        # 启动训练
        task_id = train_model(dataset_id, model_type, batch_size, epochs, learning_rate, split_ratio, augmentation)
        
        return jsonify({"success": True, "message": "训练任务已提交", "taskId": task_id})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/train/status', methods=['GET'])
def train_status():
    try:
        task_id = request.args.get('taskId')
        
        if not task_id or task_id not in training_tasks:
            return jsonify({"success": False, "message": "无效的任务ID"}), 400
        
        task = training_tasks[task_id]
        
        # 更新训练进度（在实际应用中，这应该从实际训练过程中获取）
        elapsed_time = time.time() - task["start_time"]
        progress = min(100, int(elapsed_time / 0.5))  # 假设每0.5秒增加1%的进度
        current_epoch = min(task["total_epochs"], int(progress * task["total_epochs"] / 100))
        
        task["progress"] = progress
        task["current_epoch"] = current_epoch
        
        # 更新指标
        if progress > 0:
            task["metrics"]["loss"] = max(0.01, 1.0 - progress / 100)
            task["metrics"]["accuracy"] = min(0.99, 0.5 + progress / 200)
            task["metrics"]["precision"] = min(0.99, 0.6 + progress / 250)
            task["metrics"]["recall"] = min(0.99, 0.55 + progress / 220)
        
        # 检查是否完成
        if progress >= 100:
            task["status"] = "completed"
            
            # 创建模型记录
            model_id = str(uuid.uuid4())
            models[model_id] = {
                "id": model_id,
                "name": f"{task['params']['model_type']}_{task_id[:8]}",
                "type": task['params']['model_type'],
                "accuracy": task["metrics"]["accuracy"],
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "task_id": task_id
            }
        
        return jsonify({
            "success": True,
            "status": task["status"],
            "progress": task["progress"],
            "currentEpoch": task["current_epoch"],
            "totalEpochs": task["total_epochs"],
            "metrics": task["metrics"],
            "remainingTime": f"{max(0, int((100 - progress) * 0.5))}分钟"  # 假设每1%进度需要0.5分钟
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/train/stop', methods=['POST'])
def stop_train():
    try:
        task_id = request.args.get('taskId')
        
        if not task_id or task_id not in training_tasks:
            return jsonify({"success": False, "message": "无效的任务ID"}), 400
        
        task = training_tasks[task_id]
        task["status"] = "stopped"
        
        return jsonify({"success": True, "message": "训练任务已停止"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/models', methods=['GET'])
def get_models():
    try:
        return jsonify({"success": True, "models": list(models.values())})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
