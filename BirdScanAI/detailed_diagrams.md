# BirdScanAI - Detailed Technical Diagrams

## Bird Detection Workflow

```mermaid
flowchart TD
    A[Image Upload] --> B[File Validation]
    B --> C[Save to Uploads Directory]
    C --> D[Load YOLOv8n Model]
    D --> E[Preprocess Image 640x640]
    E --> F[Run YOLO Detection]
    F --> G{Detection Results?}
    
    G -->|Success| H[Parse Bounding Boxes]
    G -->|Failure| I[Fallback Detection]
    
    H --> J[Filter Bird Class (ID 14)]
    J --> K[Apply Confidence Threshold 0.1]
    K --> L[Extract Bird Regions]
    
    I --> M[Keyword-based Detection]
    M --> N[High-confidence Object Analysis]
    
    L --> O[Crop Bird Regions + 15% Padding]
    N --> O
    O --> P[Load ResNet50 Classifier]
    
    P --> Q{Classifier Available?}
    Q -->|Yes| R[Preprocess Crops 224x224]
    Q -->|No| S[Color-based Analysis]
    
    R --> T[Batch Classification]
    T --> U[Top-5 Species Prediction]
    
    S --> V[RGB Color Analysis]
    V --> W[Species Suggestions]
    
    U --> X[Fetch eBird Data]
    W --> X
    X --> Y[Build Rich Profile]
    Y --> Z[Return Response]
```

## Image Processing Pipeline

```mermaid
graph TB
    subgraph "Input Processing"
        A[Image Upload] --> B[Format Detection]
        B --> C[Size Validation]
        C --> D[Memory Allocation]
    end
    
    subgraph "Detection Pipeline"
        E[Resize to 640x640] --> F[YOLO Input Format]
        F --> G[Model Inference]
        G --> H[Bounding Box Extraction]
    end
    
    subgraph "Classification Pipeline"
        I[Crop Detection Regions] --> J[Add 15% Padding]
        J --> K[Resize to 224x224]
        K --> L[Normalize RGB Values]
        L --> M[Convert to Tensor]
        M --> N[Batch Processing]
    end
    
    subgraph "Output Generation"
        O[Confidence Scoring] --> P[Top-K Selection]
        P --> Q[Species Mapping]
        Q --> R[Profile Assembly]
    end
    
    A --> E
    H --> I
    N --> O
```

## eBird API Integration Flow

```mermaid
sequenceDiagram
    participant App as BirdScanAI
    participant Cache as Local Cache
    participant eBird as eBird API
    participant KB as Fallback KB
    
    App->>Cache: Check taxonomy cache
    alt Cache Valid (< 24h)
        Cache->>App: Return cached data
    else Cache Expired/Empty
        App->>eBird: Fetch taxonomy data
        alt API Success
            eBird->>App: Return taxonomy
            App->>Cache: Update cache
        else API Failure
            eBird->>App: Error response
            App->>KB: Use fallback data
            KB->>App: Return static data
        end
    end
    
    App->>eBird: Get species details
    alt Species Found
        eBird->>App: Return species info
        App->>eBird: Get recent occurrences
        eBird->>App: Return occurrence data
    else Species Not Found
        eBird->>App: 404 Not Found
        App->>KB: Search fallback KB
        KB->>App: Return basic info
    end
```

## Model Loading & Management

```mermaid
graph TD
    A[Application Start] --> B[Initialize Model Variables]
    
    B --> C[Load YOLOv8n Model]
    C --> D{Model Load Success?}
    D -->|Yes| E[YOLO Model Ready]
    D -->|No| F[Download Fresh Model]
    
    F --> G[Remove Old Model File]
    G --> H[Download from Ultralytics]
    H --> I[Load New Model]
    I --> E
    
    B --> J[Load ResNet50 Classifier]
    J --> K{Classifier Load Success?}
    K -->|Yes| L[ResNet Model Ready]
    K -->|No| M[Set Classifier to None]
    
    M --> N[Enable Fallback Mode]
    
    E --> O[Detection Pipeline Ready]
    L --> P[Classification Pipeline Ready]
    N --> Q[Fallback Pipeline Ready]
    
    O --> R[System Operational]
    P --> R
    Q --> R
```

## Error Handling & Recovery

```mermaid
graph TD
    A[Request Processing] --> B{Image File Valid?}
    B -->|No| C[Return 400: Invalid File]
    B -->|Yes| D{Model Available?}
    
    D -->|No| E[Download/Reload Model]
    E --> F{Download Success?}
    F -->|No| G[Return 500: Model Error]
    F -->|Yes| D
    
    D -->|Yes| H[Run Detection]
    H --> I{Detection Success?}
    I -->|No| J[Fallback Detection]
    I -->|Yes| K[Process Results]
    
    J --> L{Keyword Match?}
    L -->|Yes| M[Basic Bird Detection]
    L -->|No| N[High-confidence Object]
    
    K --> O[Load Classifier]
    O --> P{Classifier Available?}
    P -->|No| Q[Color-based Analysis]
    P -->|Yes| R[Species Classification]
    
    Q --> S[Build Fallback Response]
    R --> T[Fetch eBird Data]
    T --> U{API Success?}
    U -->|Yes| V[Rich Profile]
    U -->|No| W[Static KB Data]
    
    M --> X[Build Response]
    N --> X
    S --> X
    V --> X
    W --> X
    
    X --> Y[Return to Client]
```

## Training Configuration & Results

```mermaid
graph LR
    subgraph "Dataset Configuration"
        A[bird.yaml]
        B[Training Images]
        C[Validation Images]
        D[Class Definitions]
    end
    
    subgraph "Training Parameters"
        E[Epochs: 50]
        F[Image Size: 640]
        G[Batch Size: 16]
        H[Learning Rate: 0.01]
    end
    
    subgraph "Training Execution"
        I[train_yolo.py]
        J[Model Loading]
        K[Data Loading]
        L[Training Loop]
    end
    
    subgraph "Output Management"
        M[Weights Directory]
        N[Training Logs]
        O[Performance Metrics]
        P[Configuration Files]
    end
    
    A --> I
    B --> K
    C --> K
    D --> I
    E --> L
    F --> L
    G --> L
    H --> L
    
    I --> J
    J --> K
    K --> L
    L --> M
    L --> N
    L --> O
    L --> P
```

## Response Data Structure

```mermaid
graph TD
    A[API Response] --> B[Message]
    A --> C[Species Information]
    A --> D[Detection Details]
    A --> E[Confidence Metrics]
    A --> F[Alternative Suggestions]
    
    B --> G[Success/Error Message]
    
    C --> H[Common Name]
    C --> I[Scientific Name]
    C --> J[Rich Profile]
    
    J --> K[Taxonomy]
    J --> L[Physical Description]
    J --> M[Behavior & Habitat]
    J --> N[Conservation Status]
    J --> O[Cultural Significance]
    
    D --> P[Bird Detections]
    D --> Q[All Objects Detected]
    D --> R[Bounding Boxes]
    
    E --> S[Species Confidence]
    E --> T[Detection Confidence]
    E --> U[Low Confidence Flag]
    
    F --> V[Alternative Species]
    F --> W[Confidence Scores]
    F --> X[Reasoning]
```

## System Performance Metrics

```mermaid
graph TB
    subgraph "Response Time Metrics"
        A[Image Upload] --> B[File Processing]
        B --> C[Model Loading]
        C --> D[Detection Time]
        D --> E[Classification Time]
        E --> F[API Response Time]
    end
    
    subgraph "Accuracy Metrics"
        G[Detection Precision]
        H[Classification Accuracy]
        I[Species Identification Rate]
        J[Fallback Success Rate]
    end
    
    subgraph "Resource Usage"
        K[Memory Consumption]
        L[CPU Utilization]
        M[GPU Usage (if available)]
        N[Disk I/O]
    end
    
    subgraph "Reliability Metrics"
        O[Uptime Percentage]
        P[Error Rate]
        Q[Recovery Time]
        R[Cache Hit Rate]
    end
    
    A --> G
    D --> H
    E --> I
    F --> J
    
    C --> K
    D --> L
    E --> M
    B --> N
    
    F --> O
    G --> P
    H --> Q
    I --> R
```

## Security & Access Control

```mermaid
graph TD
    A[Incoming Request] --> B[CORS Validation]
    B --> C{Origin Allowed?}
    C -->|No| D[Block Request]
    C -->|Yes| E[Method Validation]
    
    E --> F{Method Supported?}
    F -->|No| G[Return 405: Method Not Allowed]
    F -->|Yes| H[Content Type Check]
    
    H --> I{Content Type Valid?}
    I -->|No| J[Return 400: Invalid Content]
    I -->|Yes| K[File Size Validation]
    
    K --> L{File Size OK?}
    L -->|No| M[Return 413: File Too Large]
    L -->|Yes| N[File Format Check]
    
    N --> O{Format Supported?}
    O -->|No| P[Return 400: Unsupported Format]
    O -->|Yes| Q[Process Request]
    
    Q --> R[Execute Business Logic]
    R --> S[Return Response]
    
    D --> T[Log Security Event]
    G --> T
    J --> T
    M --> T
    P --> T
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        A[Local Development]
        B[Virtual Environment]
        C[Local Models]
        D[Test Images]
    end
    
    subgraph "Production Environment"
        E[Production Server]
        F[Load Balancer]
        G[Model Storage]
        H[File Storage]
    end
    
    subgraph "External Services"
        I[eBird API]
        J[CDN for Models]
        K[Monitoring Services]
        L[Log Aggregation]
    end
    
    subgraph "Data Flow"
        M[Client Requests]
        N[API Gateway]
        O[Processing Engine]
        P[Response Delivery]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
    
    E --> I
    F --> J
    G --> K
    H --> L
    
    M --> N
    N --> O
    O --> P
    P --> M
``` 