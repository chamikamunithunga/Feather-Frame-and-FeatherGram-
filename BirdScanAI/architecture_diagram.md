# BirdScanAI - System Architecture Diagram

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Client]
        B[Mobile App]
        C[API Client]
    end
    
    subgraph "API Gateway"
        D[Flask App - Port 5001]
        E[CORS Handler]
        F[Request Router]
    end
    
    subgraph "AI Processing Layer"
        G[YOLOv8n Detection Model]
        H[ResNet50 Classification Model]
        I[Image Preprocessing]
        J[Crop & Analysis Engine]
    end
    
    subgraph "External Services"
        K[eBird API]
        L[Taxonomy Cache]
        M[Fallback Knowledge Base]
    end
    
    subgraph "Data Storage"
        N[Upload Directory]
        O[Model Weights]
        P[Training Results]
    end
    
    subgraph "Training Pipeline"
        Q[YOLO Training Script]
        R[Dataset Configuration]
        S[Model Validation]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    F --> H
    G --> I
    H --> I
    I --> J
    J --> K
    K --> L
    L --> M
    N --> I
    O --> G
    O --> H
    P --> S
    Q --> R
    R --> S
```

## Detailed Component Architecture

```mermaid
graph LR
    subgraph "Main Application (main.py)"
        A1[Flask App]
        A2[Route Handlers]
        A3[Error Handling]
        A4[CORS Management]
    end
    
    subgraph "AI Models"
        B1[YOLOv8n Detection]
        B2[ResNet50 Classification]
        B3[Image Transformers]
        B4[Confidence Scoring]
    end
    
    subgraph "Image Processing"
        C1[Upload Handler]
        C2[Image Cropping]
        C3[Preprocessing Pipeline]
        C4[Format Conversion]
    end
    
    subgraph "Data Sources"
        D1[eBird API Client]
        D2[Taxonomy Cache]
        D3[Fallback KB]
        D4[Occurrence Data]
    end
    
    subgraph "Response Builder"
        E1[Profile Generator]
        E2[Species Classification]
        E3[Alternative Suggestions]
        E4[Rich Metadata]
    end
    
    A1 --> A2
    A2 --> B1
    A2 --> B2
    B1 --> C1
    B2 --> C2
    C1 --> C3
    C2 --> C3
    C3 --> C4
    B1 --> D1
    B2 --> D2
    D1 --> D3
    D2 --> D4
    D3 --> E1
    D4 --> E2
    E1 --> E3
    E2 --> E4
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant Client
    participant Flask
    participant YOLO
    participant ResNet
    participant eBird
    participant Cache
    participant Response
    
    Client->>Flask: POST /detect-bird (image)
    Flask->>Flask: Save image to uploads/
    Flask->>YOLO: Run bird detection
    YOLO->>Flask: Return bounding boxes
    
    alt Birds Detected
        Flask->>Flask: Crop detected birds
        Flask->>ResNet: Classify species
        ResNet->>Flask: Return top predictions
        
        Flask->>eBird: Get species details
        eBird->>Cache: Store taxonomy
        Cache->>Flask: Return cached data
        
        Flask->>Response: Build rich profile
        Response->>Client: Return complete analysis
    else No Birds Detected
        Flask->>Response: Build fallback response
        Response->>Client: Return detection results
    end
```

## API Endpoint Structure

```mermaid
graph TD
    A[Flask Application] --> B[Main Routes]
    
    B --> C[POST /detect-bird]
    B --> D[GET /search-bird]
    B --> E[GET /health]
    B --> F[GET/POST /test]
    
    C --> G[Image Upload]
    C --> H[Bird Detection]
    C --> I[Species Classification]
    C --> J[Profile Generation]
    
    D --> K[Name Search]
    D --> L[eBird Lookup]
    D --> M[Fallback KB]
    
    G --> N[File Validation]
    H --> O[YOLO Inference]
    I --> P[ResNet Classification]
    J --> Q[Rich Metadata]
    
    K --> R[Common Name]
    K --> S[Scientific Name]
    L --> T[API Response]
    M --> U[Static Data]
```

## Model Architecture

```mermaid
graph TB
    subgraph "YOLOv8n Detection Model"
        A1[Input Image 640x640]
        A2[Backbone Network]
        A3[Neck (FPN)]
        A4[Detection Head]
        A5[Bounding Boxes + Confidence]
    end
    
    subgraph "ResNet50 Classification Model"
        B1[Input Image 224x224]
        B2[Convolutional Layers]
        B3[Residual Blocks]
        B4[Global Average Pooling]
        B5[Fully Connected Layer]
        B6[Species Probabilities]
    end
    
    subgraph "Image Processing Pipeline"
        C1[Original Image]
        C2[Detection Results]
        C3[Cropped Regions]
        C4[Preprocessed Tensors]
        C5[Classification Results]
    end
    
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> A5
    
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B5
    B5 --> B6
    
    C1 --> C2
    C2 --> C3
    C3 --> C4
    C4 --> C5
```

## Training Pipeline

```mermaid
graph LR
    subgraph "Training Configuration"
        A[bird.yaml]
        B[Dataset Paths]
        C[Model Parameters]
    end
    
    subgraph "Training Process"
        D[YOLO Training Script]
        E[Data Loading]
        F[Model Training]
        G[Validation]
    end
    
    subgraph "Output Management"
        H[Model Weights]
        I[Training Logs]
        J[Performance Metrics]
        K[Configuration Files]
    end
    
    A --> D
    B --> E
    C --> F
    D --> E
    E --> F
    F --> G
    G --> H
    G --> I
    G --> J
    G --> K
```

## System Dependencies

```mermaid
graph TD
    subgraph "Core Dependencies"
        A[Flask]
        B[PyTorch]
        C[Ultralytics]
        D[OpenCV]
    end
    
    subgraph "AI/ML Libraries"
        E[Torchvision]
        F[PIL/Pillow]
        G[Numpy]
        H[Requests]
    end
    
    subgraph "System Requirements"
        I[Python 3.10.13]
        J[Virtual Environment]
        K[Model Weights]
        L[GPU Support (Optional)]
    end
    
    A --> B
    B --> C
    B --> D
    C --> E
    D --> F
    E --> G
    F --> H
    
    I --> J
    J --> K
    K --> L
```

## Error Handling & Fallbacks

```mermaid
graph TD
    A[Request Received] --> B{Image Valid?}
    B -->|No| C[Return 400 Error]
    B -->|Yes| D[Load YOLO Model]
    
    D --> E{Model Loaded?}
    E -->|No| F[Download Fresh Model]
    E -->|Yes| G[Run Detection]
    
    G --> H{Birds Detected?}
    H -->|No| I[Fallback Detection]
    H -->|Yes| J[Load ResNet Model]
    
    J --> K{Classifier Available?}
    K -->|No| L[Color-based Analysis]
    K -->|Yes| M[Species Classification]
    
    I --> N[Keyword Matching]
    L --> O[Basic Suggestions]
    M --> P[eBird Integration]
    
    N --> Q[Build Response]
    O --> Q
    P --> Q
    
    Q --> R[Return to Client]
```

## Cache Management

```mermaid
graph LR
    subgraph "Cache Strategy"
        A[Taxonomy Cache]
        B[24-hour TTL]
        C[Stale Data Fallback]
    end
    
    subgraph "Cache Operations"
        D[Check Cache]
        E[Fetch from eBird]
        F[Update Cache]
        G[Return Data]
    end
    
    subgraph "Fallback Mechanism"
        H[Static Knowledge Base]
        I[Predefined Species]
        J[Offline Availability]
    end
    
    A --> B
    B --> C
    D --> E
    E --> F
    F --> G
    C --> H
    H --> I
    I --> J
```

## Performance Optimization

```mermaid
graph TB
    subgraph "Model Optimization"
        A[Model Quantization]
        B[Batch Processing]
        C[GPU Acceleration]
        D[Memory Management]
    end
    
    subgraph "API Optimization"
        E[Async Processing]
        F[Request Timeouts]
        G[Connection Pooling]
        H[Response Caching]
    end
    
    subgraph "Image Optimization"
        I[Resize Operations]
        J[Format Conversion]
        K[Compression]
        L[Streaming]
    end
    
    A --> B
    B --> C
    C --> D
    E --> F
    F --> G
    G --> H
    I --> J
    J --> K
    K --> L
``` 