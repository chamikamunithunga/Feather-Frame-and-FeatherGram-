# BirdScanAI - Complete System Overview

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Applications"
        A1[Web Browser]
        A2[Mobile App]
        A3[API Client]
        A4[Testing Tools]
    end
    
    subgraph "API Gateway Layer"
        B1[Flask Application]
        B2[CORS Handler]
        B3[Request Router]
        B4[Error Handler]
    end
    
    subgraph "AI Processing Engine"
        C1[Image Upload Handler]
        C2[YOLOv8n Detection]
        C3[ResNet50 Classification]
        C4[Image Preprocessing]
        C5[Crop & Analysis Engine]
    end
    
    subgraph "Data Management"
        D1[eBird API Client]
        D2[Taxonomy Cache]
        D3[Fallback Knowledge Base]
        D4[File Storage]
        D5[Model Weights]
    end
    
    subgraph "Response Generation"
        E1[Profile Builder]
        E2[Species Mapper]
        E3[Alternative Generator]
        E4[Metadata Assembler]
    end
    
    subgraph "Training & Development"
        F1[YOLO Training Script]
        F2[Dataset Configuration]
        F3[Model Validation]
        F4[Performance Monitoring]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
    
    B1 --> B2
    B2 --> B3
    B3 --> C1
    B3 --> C2
    B3 --> C3
    
    C1 --> C4
    C2 --> C4
    C3 --> C4
    C4 --> C5
    
    C5 --> D1
    C5 --> D2
    C5 --> D3
    
    D1 --> E1
    D2 --> E1
    D3 --> E1
    
    E1 --> E2
    E2 --> E3
    E3 --> E4
    
    F1 --> F2
    F2 --> F3
    F3 --> F4
```

## Complete Data Flow Architecture

```mermaid
flowchart TD
    subgraph "Input Layer"
        A[Image Upload] --> B[File Validation]
        B --> C[Format Detection]
        C --> D[Size Validation]
    end
    
    subgraph "Storage Layer"
        E[Save to Uploads/] --> F[File Path Generation]
        F --> G[Memory Allocation]
    end
    
    subgraph "Detection Layer"
        H[Load YOLOv8n] --> I[Image Resize 640x640]
        I --> J[YOLO Inference]
        J --> K[Parse Results]
    end
    
    subgraph "Processing Layer"
        L[Filter Bird Class] --> M[Extract Bounding Boxes]
        M --> N[Crop Regions + Padding]
        N --> O[Load ResNet50]
    end
    
    subgraph "Classification Layer"
        P[Preprocess Crops 224x224] --> Q[Batch Classification]
        Q --> R[Top-K Selection]
        R --> S[Confidence Scoring]
    end
    
    subgraph "Enrichment Layer"
        T[Fetch eBird Data] --> U[Cache Management]
        U --> V[Fallback KB Lookup]
        V --> W[Profile Assembly]
    end
    
    subgraph "Output Layer"
        X[Response Builder] --> Y[Error Handling]
        Y --> Z[Client Response]
    end
    
    A --> E
    D --> H
    G --> I
    K --> L
    O --> P
    S --> T
    W --> X
    Y --> Z
```

## Database Schema & Data Models

```mermaid
erDiagram
    BIRD_DETECTION {
        string detection_id PK
        string image_filename
        datetime detection_timestamp
        float confidence_score
        string species_name
        string scientific_name
        json bounding_box
        json detection_metadata
    }
    
    BIRD_SPECIES {
        string species_id PK
        string common_name
        string scientific_name
        string family
        string order
        string genus
        string conservation_status
        text description
        text habitat
        text behavior
        text diet
        text breeding_info
        text migration_pattern
        text cultural_significance
        text ecological_role
        text observation_tips
        string image_url
        datetime last_updated
    }
    
    EBIRD_INTEGRATION {
        string integration_id PK
        string species_code
        string ebird_taxonomy
        json occurrence_data
        datetime last_fetch
        boolean is_active
        string api_key
    }
    
    IMAGE_UPLOADS {
        string upload_id PK
        string filename
        string original_filename
        string file_path
        string file_type
        integer file_size
        datetime upload_timestamp
        string user_session
        boolean processed
        string processing_status
    }
    
    TRAINING_RECORDS {
        string training_id PK
        string model_version
        string dataset_config
        integer epochs
        float final_accuracy
        datetime training_start
        datetime training_end
        string training_status
        json hyperparameters
        json performance_metrics
    }
    
    CACHE_ENTRIES {
        string cache_key PK
        text cache_data
        datetime created_at
        datetime expires_at
        string data_type
        integer access_count
    }
    
    API_REQUESTS {
        string request_id PK
        string endpoint
        string method
        datetime request_timestamp
        integer response_time_ms
        integer status_code
        string client_ip
        string user_agent
        boolean success
        text error_message
    }
    
    BIRD_DETECTION ||--|| BIRD_SPECIES : "identifies"
    BIRD_DETECTION ||--|| IMAGE_UPLOADS : "processes"
    BIRD_SPECIES ||--|| EBIRD_INTEGRATION : "enriches"
    IMAGE_UPLOADS ||--|| BIRD_DETECTION : "generates"
    TRAINING_RECORDS ||--|| BIRD_SPECIES : "improves"
    CACHE_ENTRIES ||--|| EBIRD_INTEGRATION : "stores"
    API_REQUESTS ||--|| BIRD_DETECTION : "triggers"
```

## Component Interaction Matrix

```mermaid
graph LR
    subgraph "Component Dependencies"
        A[Flask App] --> B[YOLO Model]
        A --> C[ResNet Model]
        A --> D[Image Processor]
        A --> E[eBird Client]
        A --> F[Cache Manager]
        A --> G[Response Builder]
        
        B --> D
        C --> D
        D --> G
        E --> F
        F --> G
        
        H[Training Script] --> I[Dataset Config]
        I --> J[Model Weights]
        J --> B
        J --> C
    end
    
    subgraph "Data Flow Dependencies"
        K[Image Upload] --> L[File Storage]
        L --> M[Detection Engine]
        M --> N[Classification Engine]
        N --> O[Data Enrichment]
        O --> P[Response Generation]
        
        Q[External API] --> R[Cache Layer]
        R --> S[Fallback System]
        S --> O
    end
```

## System Configuration Architecture

```mermaid
graph TB
    subgraph "Configuration Files"
        A[bird.yaml]
        B[main.py Config]
        C[Environment Variables]
        D[Model Parameters]
    end
    
    subgraph "Runtime Configuration"
        E[Model Loading]
        F[API Settings]
        G[Cache Settings]
        H[Error Handling]
    end
    
    subgraph "Training Configuration"
        I[Dataset Paths]
        J[Hyperparameters]
        K[Validation Settings]
        L[Output Configuration]
    end
    
    subgraph "Deployment Config"
        M[Port Settings]
        N[CORS Configuration]
        O[Security Settings]
        P[Performance Tuning]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
    
    A --> I
    B --> J
    C --> K
    D --> L
    
    B --> M
    B --> N
    B --> O
    B --> P
```

## Performance & Scalability Architecture

```mermaid
graph TB
    subgraph "Current Architecture"
        A[Single Flask Instance]
        B[Local Model Storage]
        C[In-Memory Cache]
        D[Sequential Processing]
    end
    
    subgraph "Scalability Options"
        E[Load Balancer]
        F[Multiple Instances]
        G[Model Serving Cluster]
        H[Distributed Cache]
    end
    
    subgraph "Performance Optimizations"
        I[Model Quantization]
        J[Batch Processing]
        K[Async Operations]
        L[GPU Acceleration]
    end
    
    subgraph "Monitoring & Metrics"
        M[Response Time Tracking]
        N[Resource Usage Monitoring]
        O[Error Rate Tracking]
        P[Throughput Measurement]
    end
    
    A --> E
    B --> G
    C --> H
    D --> I
    
    E --> J
    F --> K
    G --> L
    H --> M
    
    I --> N
    J --> O
    K --> P
    L --> M
```

## Security & Access Control Architecture

```mermaid
graph TD
    subgraph "Security Layers"
        A[Request Validation]
        B[File Security]
        C[API Security]
        D[Data Protection]
    end
    
    subgraph "Access Control"
        E[CORS Management]
        F[Method Validation]
        G[Content Validation]
        H[Size Limits]
    end
    
    subgraph "Threat Protection"
        I[File Upload Security]
        J[Input Validation]
        K[Error Handling]
        L[Logging & Monitoring]
    end
    
    subgraph "Compliance"
        M[Data Privacy]
        N[Audit Trails]
        O[Secure Storage]
        P[Access Logs]
    end
    
    A --> E
    B --> F
    C --> G
    D --> H
    
    E --> I
    F --> J
    G --> K
    H --> L
    
    I --> M
    J --> N
    K --> O
    L --> P
```

## Integration Points & External Services

```mermaid
graph LR
    subgraph "BirdScanAI Core"
        A[Main Application]
        B[AI Models]
        C[Processing Engine]
    end
    
    subgraph "External APIs"
        D[eBird API]
        E[Taxonomy Services]
        F[Image Processing APIs]
    end
    
    subgraph "Data Sources"
        G[Species Databases]
        H[Conservation Data]
        I[Geographic Data]
    end
    
    subgraph "Output Services"
        J[Response Delivery]
        K[Data Export]
        L[Analytics Services]
    end
    
    A --> D
    B --> E
    C --> F
    
    D --> G
    E --> H
    F --> I
    
    G --> J
    H --> K
    I --> L
    
    J --> A
    K --> A
    L --> A
``` 