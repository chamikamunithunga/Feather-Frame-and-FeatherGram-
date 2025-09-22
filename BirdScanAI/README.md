# BirdScanAI - AI-Powered Bird Detection & Classification System

## 🦅 Project Overview

BirdScanAI is a sophisticated AI-powered system that combines computer vision, machine learning, and ornithological data to provide comprehensive bird analysis from uploaded images. The system uses YOLOv8 for bird detection and ResNet50 for species classification, enriched with real-time data from eBird API.

## 🏗️ System Architecture

### Core Components
- **Flask Backend**: RESTful API server running on port 5001
- **YOLOv8n Model**: Bird detection with bounding box extraction
- **ResNet50 Classifier**: Species identification with confidence scoring
- **eBird Integration**: Real-time species data and taxonomy
- **Fallback Systems**: Robust error handling and offline capabilities

### Key Features
- 🖼️ **Image Processing**: Supports JPG, JPEG, PNG, WEBP, HEIC formats
- 🎯 **Bird Detection**: YOLO-based object detection with 0.1 confidence threshold
- 🧠 **Species Classification**: Top-5 species prediction with confidence scores
- 📊 **Rich Profiles**: 20+ field comprehensive bird information
- 🔄 **Intelligent Fallbacks**: Color-based analysis when AI models fail
- 💾 **Caching System**: 24-hour eBird taxonomy cache for performance
- 🚀 **Production Ready**: Comprehensive error handling and security

## 📊 Diagram Documentation

This project includes comprehensive diagrams that visualize the system architecture, data flow, and technical implementation. All diagrams are written in Mermaid syntax and can be rendered in GitHub, GitLab, or any Mermaid-compatible viewer.

### Available Diagrams

#### 1. **architecture_diagram.md** - High-Level System Architecture
- **High-Level System Architecture**: Overall system overview
- **Detailed Component Architecture**: Component relationships and dependencies
- **Data Flow Diagram**: Request/response sequence
- **API Endpoint Structure**: Route organization and functionality
- **Model Architecture**: YOLO and ResNet internal structure
- **Training Pipeline**: Model training workflow
- **System Dependencies**: Library and requirement relationships
- **Error Handling & Fallbacks**: Robustness and recovery mechanisms
- **Cache Management**: Performance optimization strategies
- **Performance Optimization**: Scalability and efficiency considerations

#### 2. **detailed_diagrams.md** - Technical Implementation Details
- **Bird Detection Workflow**: Complete detection pipeline
- **Image Processing Pipeline**: Image transformation steps
- **eBird API Integration Flow**: External service integration
- **Model Loading & Management**: Model lifecycle management
- **Error Handling & Recovery**: Comprehensive error scenarios
- **Training Configuration & Results**: Model training details
- **Response Data Structure**: API response format
- **System Performance Metrics**: Monitoring and measurement
- **Security & Access Control**: Security implementation
- **Deployment Architecture**: Production deployment considerations

#### 3. **system_overview.md** - Complete System Overview
- **System Architecture Overview**: Comprehensive system view
- **Complete Data Flow Architecture**: End-to-end data processing
- **Database Schema & Data Models**: Data structure relationships
- **Component Interaction Matrix**: Component dependencies
- **System Configuration Architecture**: Configuration management
- **Performance & Scalability Architecture**: Scalability considerations
- **Security & Access Control Architecture**: Security implementation
- **Integration Points & External Services**: External system integration

## 🚀 Getting Started

### Prerequisites
- Python 3.10.13
- Virtual environment support
- 8GB+ RAM (for model loading)
- GPU support (optional, for acceleration)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BirdScanAI
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv bird-env
   source bird-env/bin/activate  # On Windows: bird-env\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Download models** (if not already present)
   ```bash
   # Models will be downloaded automatically on first run
   ```

5. **Run the application**
   ```bash
   cd backend
   python main.py
   ```

### API Usage

#### Bird Detection Endpoint
```bash
POST /detect-bird
Content-Type: multipart/form-data

# Upload an image file
curl -X POST http://localhost:5001/detect-bird \
  -F "image=@bird_photo.jpg"
```

#### Bird Search Endpoint
```bash
GET /search-bird?name=American%20Robin

curl "http://localhost:5001/search-bird?name=American%20Robin"
```

#### Health Check
```bash
GET /health

curl http://localhost:5001/health
```

## 🔧 Configuration

### Model Configuration (`bird.yaml`)
```yaml
path: /path/to/dataset
train: images/train
val: images/val
nc: 1
names: ['bird']
```

### Training Configuration
```python
# train_yolo.py
model.train(
    data='bird.yaml',
    epochs=50,
    imgsz=640,
    logger='tensorboard'
)
```

### Environment Variables
- `EBIRD_API_KEY`: Your eBird API key
- `PORT`: Server port (default: 5001)
- `DEBUG`: Debug mode (default: False)

## 📈 Training & Models

### Current Models
- **YOLOv8n**: 6.2MB detection model
- **ResNet50**: 5.3MB classification model

### Training Results
- Multiple training iterations available in `runs/` directory
- Training logs and metrics stored per run
- Model weights saved for deployment

### Custom Training
```bash
cd backend
python train_yolo.py
```

## 🔍 Understanding the Diagrams

### Mermaid Syntax
All diagrams use Mermaid syntax, which provides:
- **Flowcharts**: Process flows and decision trees
- **Sequence Diagrams**: API interactions and timing
- **Entity-Relationship**: Data model relationships
- **Graphs**: Component dependencies and architecture

### Diagram Categories

#### **Architecture Diagrams**
- Show system structure and component relationships
- Useful for understanding overall system design
- Help with system planning and documentation

#### **Flow Diagrams**
- Illustrate data flow and processing steps
- Show decision points and error handling
- Useful for debugging and optimization

#### **Data Diagrams**
- Display data structures and relationships
- Show API response formats
- Help with integration and development

#### **Deployment Diagrams**
- Illustrate production deployment considerations
- Show scalability and security aspects
- Useful for DevOps and operations

## 🛠️ Development

### Project Structure
```
BirdScanAI/
├── backend/                 # Main application
│   ├── main.py             # Flask application (765 lines)
│   ├── test_api.py         # API testing utilities
│   ├── train_yolo.py       # YOLO training script
│   ├── bird.yaml           # Dataset configuration
│   ├── uploads/            # Image upload directory
│   ├── runs/               # Training outputs
│   └── bird-env/           # Virtual environment
├── architecture_diagram.md  # High-level architecture
├── detailed_diagrams.md     # Technical implementation
├── system_overview.md       # Complete system overview
└── README.md               # This file
```

### Key Functions

#### **Bird Detection Pipeline**
```python
def detect_bird():
    # 1. Image upload and validation
    # 2. YOLO detection with confidence threshold 0.1
    # 3. Bird class filtering (ID 14)
    # 4. Bounding box extraction and cropping
    # 5. ResNet50 species classification
    # 6. eBird data enrichment
    # 7. Rich profile generation
```

#### **Species Classification**
```python
def classify_bird_species(image_path):
    # 1. Image preprocessing (224x224, normalization)
    # 2. ResNet50 inference
    # 3. Top-5 species prediction
    # 4. Confidence scoring
    # 5. Fallback to color-based analysis
```

#### **eBird Integration**
```python
def get_bird_details_from_api(species_name):
    # 1. Check local cache (24-hour TTL)
    # 2. Fetch from eBird API
    # 3. Fallback to static knowledge base
    # 4. Build comprehensive profile
```

## 📊 Performance & Monitoring

### Metrics to Monitor
- **Response Time**: Image processing latency
- **Accuracy**: Detection and classification precision
- **Resource Usage**: Memory and CPU utilization
- **Error Rates**: Fallback and failure frequencies
- **Cache Hit Rate**: eBird API efficiency

### Optimization Strategies
- Model quantization for faster inference
- Batch processing for multiple images
- GPU acceleration when available
- Intelligent caching strategies
- Fallback mechanisms for reliability

## 🔒 Security & Best Practices

### Security Features
- CORS configuration for cross-origin requests
- File upload validation and sanitization
- Input validation and error handling
- Secure API key management
- Request logging and monitoring

### Best Practices
- Use virtual environments for isolation
- Regular model updates and retraining
- Comprehensive error handling
- Performance monitoring and optimization
- Security audit and penetration testing

## 🚀 Deployment

### Production Considerations
- Load balancing for multiple instances
- Model serving optimization
- Database integration for persistence
- Monitoring and alerting systems
- Backup and disaster recovery

### Scaling Options
- Horizontal scaling with multiple Flask instances
- Model serving with dedicated inference servers
- Distributed caching with Redis
- CDN integration for model distribution
- Container orchestration with Docker/Kubernetes

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Update diagrams if architecture changes
5. Submit a pull request

### Code Standards
- Follow PEP 8 Python style guidelines
- Add comprehensive error handling
- Include docstrings for all functions
- Update diagrams for architectural changes
- Test all endpoints before submission

## 📚 Additional Resources

### Documentation
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Ultralytics YOLO](https://docs.ultralytics.com/)
- [PyTorch Documentation](https://pytorch.org/docs/)
- [eBird API Documentation](https://documenter.getpostman.com/view/664302/S1TS5z9g)

### Research Papers
- YOLOv8: [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics)
- ResNet: [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **eBird**: For comprehensive bird taxonomy and occurrence data
- **Ultralytics**: For YOLOv8 implementation
- **PyTorch**: For deep learning framework
- **OpenCV**: For computer vision capabilities

---

**Note**: This system represents a sophisticated AI-powered ornithological tool that combines cutting-edge computer vision with comprehensive bird knowledge. The diagrams provide complete technical documentation for understanding, developing, and deploying the system. 