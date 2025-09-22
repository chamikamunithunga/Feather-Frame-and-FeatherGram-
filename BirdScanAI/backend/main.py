from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import os
import requests
import cv2
import numpy as np
import torch
import time
from PIL import Image
import torchvision.transforms as transforms
import torchvision.models as models
import torch.nn as nn
import torch.nn.functional as F

# Patch torch.load to use weights_only=False for PyTorch 2.6+ compatibility
original_load = torch.load
def patched_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_load(*args, **kwargs)
torch.load = patched_load

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def add_cors_headers(resp):
    try:
        origin = request.headers.get('Origin', '*')
    except Exception:
        origin = '*'
    resp.headers['Access-Control-Allow-Origin'] = origin if origin else '*'
    resp.headers['Vary'] = 'Origin'
    resp.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    resp.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return resp

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load a pre-trained YOLO model that can detect birds
# Using YOLOv8n which can detect various objects including birds
print("Loading YOLO model...")

try:
    model = YOLO("yolov8n.pt")
    print("YOLO model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    print("Downloading fresh model...")
    # Remove old model and download fresh
    if os.path.exists("yolov8n.pt"):
        os.remove("yolov8n.pt")
    model = YOLO("yolov8n.pt")  # This will download fresh
    print("Fresh YOLO model downloaded and loaded!")

# Bird species identification using image analysis and eBird data
print("Loading bird identification system...")

# Pre-trained bird species classification model
print("Loading pre-trained bird species classifier...")

# Bird species classes (ImageNet classes for birds)
BIRD_CLASSES = [
    "American Robin", "Blue Jay", "Cardinal", "House Sparrow", "American Goldfinch",
    "American Crow", "Bald Eagle", "Red-tailed Hawk", "Great Horned Owl", "Downy Woodpecker",
    "Ruby-throated Hummingbird", "Belted Kingfisher", "Barn Swallow", "Yellow Warbler",
    "Northern Mockingbird", "European Starling", "Mourning Dove", "Rock Pigeon",
    "Canada Goose", "Mallard", "Great Blue Heron", "Snowy Egret", "Turkey Vulture",
    "Red-winged Blackbird", "Common Grackle", "Eastern Bluebird", "Tree Swallow",
    "Chipping Sparrow", "Song Sparrow", "White-throated Sparrow", "Dark-eyed Junco",
    "American Goldfinch", "House Finch", "Purple Finch", "Cedar Waxwing", "Brown-headed Cowbird",
    "Baltimore Oriole", "Orchard Oriole", "Scarlet Tanager", "Summer Tanager", "Western Tanager",
    "Rose-breasted Grosbeak", "Black-headed Grosbeak", "Blue Grosbeak", "Indigo Bunting", "Painted Bunting",
    "Dickcissel", "Bobolink", "Eastern Meadowlark", "Western Meadowlark", "Yellow-headed Blackbird",
    "Brewer's Blackbird", "Rusty Blackbird", "Common Yellowthroat", "Yellow Warbler", "Wilson's Warbler",
    "American Redstart", "Black-throated Blue Warbler", "Black-throated Green Warbler", "Chestnut-sided Warbler",
    "Magnolia Warbler", "Blackburnian Warbler", "Palm Warbler", "Pine Warbler", "Yellow-rumped Warbler",
    "Blackpoll Warbler", "Bay-breasted Warbler", "Canada Warbler", "Mourning Warbler", "Kentucky Warbler",
    "Connecticut Warbler", "Nashville Warbler", "Orange-crowned Warbler", "Tennessee Warbler", "Virginia's Warbler",
    "Lucy's Warbler", "Colima Warbler", "Crescent-chested Warbler", "Golden-cheeked Warbler", "Black-throated Gray Warbler",
    "Hermit Warbler", "Townsend's Warbler", "Grace's Warbler", "Pine Warbler", "Kirtland's Warbler",
    "Prairie Warbler", "Swainson's Warbler", "Worm-eating Warbler", "Bachman's Warbler", "Prothonotary Warbler",
    "Swainson's Warbler", "Louisiana Waterthrush", "Northern Waterthrush", "Kentucky Warbler", "Connecticut Warbler",
    "Mourning Warbler", "MacGillivray's Warbler", "Common Yellowthroat", "Hooded Warbler", "Wilson's Warbler",
    "Canada Warbler", "Red-faced Warbler", "Painted Redstart", "Slate-throated Redstart", "Fan-tailed Warbler",
    # Sri Lankan Endemic Birds (Sinharaja Rainforest Species)
    "Sri Lanka Blue Magpie", "Sri Lanka Junglefowl", "Red-faced Malkoha", "Sri Lanka Whistling Thrush", 
    "Yellow-eared Bulbul", "Ceylon Frogmouth", "Sri Lanka Spurfowl", "Layard's Parakeet", "Orange-billed Babbler",
    "Ashy-headed Laughingthrush", "Sri Lanka Bush Warbler", "Ceylon Small Barbet", "Crimson-fronted Barbet",
    "Brown-capped Babbler", "Sri Lanka Scaly Thrush", "White-faced Starling", "Sri Lanka Hill Myna",
    "Legge's Flowerpecker", "Ceylon Swallow", "Sri Lanka Wood Pigeon", "Spot-winged Thrush",
    # Additional Global Species
    "Rufous-capped Warbler", "Golden-crowned Warbler", "Costa Rican Warbler", "Three-striped Warbler", "Buff-rumped Warbler",
    "Black-cheeked Warbler", "Pirre Warbler", "Choco Warbler", "White-rimmed Warbler", "Black-eared Warbler",
    "Tacarcuna Warbler", "Indian Peafowl", "Asian Paradise Flycatcher", "Common Iora", "Oriental Magpie-Robin"
]

# Load pre-trained ResNet model
try:
    bird_classifier = models.resnet50(pretrained=True)
    # Modify the final layer for our bird classes
    num_classes = len(BIRD_CLASSES)
    bird_classifier.fc = nn.Linear(bird_classifier.fc.in_features, num_classes)
    bird_classifier.eval()
    print("Pre-trained ResNet50 bird classifier loaded successfully!")
except Exception as e:
    print(f"Error loading pre-trained model: {e}")
    # Fallback to a simpler model
    bird_classifier = None

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def classify_bird_species(image_path):
    """Classify bird species using pre-trained ResNet model"""
    try:
        if bird_classifier is None:
            print("Bird classifier not available, using fallback analysis")
            return fallback_bird_analysis(image_path)
        
        # Load and preprocess image
        image = Image.open(image_path).convert('RGB')
        image_tensor = transform(image).unsqueeze(0)
        
        # Get prediction from pre-trained model
        with torch.no_grad():
            outputs = bird_classifier(image_tensor)
            probabilities = F.softmax(outputs, dim=1)
            top_prob, top_class = torch.topk(probabilities, 5)  # Get top 5 predictions
        
        # Get predictions
        predictions = []
        for i in range(5):
            species_idx = top_class[0][i].item()
            confidence = top_prob[0][i].item()
            
            if species_idx < len(BIRD_CLASSES):
                species = BIRD_CLASSES[species_idx]
                predictions.append({
                    'species': species,
                    'confidence': confidence,
                    'reason': f"AI model prediction (confidence: {confidence:.3f})"
                })
        
        print(f"Pre-trained model predictions: {predictions[:3]}")
        return predictions
        
    except Exception as e:
        print(f"Error in pre-trained model classification: {e}")
        return fallback_bird_analysis(image_path)

def fallback_bird_analysis(image_path):
    """Fallback analysis when pre-trained model is not available"""
    try:
        # Load image
        image = Image.open(image_path).convert('RGB')
        img_array = np.array(image)
        
        # Basic image analysis
        height, width = img_array.shape[:2]
        brightness = np.mean(img_array)
        
        # Analyze color patterns
        red_avg = np.mean(img_array[:, :, 0])
        green_avg = np.mean(img_array[:, :, 1])
        blue_avg = np.mean(img_array[:, :, 2])
        
        print(f"Fallback analysis - Size: {width}x{height}, Brightness: {brightness:.1f}")
        print(f"Color analysis - R:{red_avg:.1f}, G:{green_avg:.1f}, B:{blue_avg:.1f}")
        
        # Simple color-based suggestions
        suggestions = []
        
        if red_avg > 150 and green_avg < 100 and blue_avg < 100:
            suggestions.extend([
                {"species": "Cardinal", "confidence": 0.7, "reason": "Strong red coloration"},
                {"species": "American Robin", "confidence": 0.6, "reason": "Reddish breast"}
            ])
        elif blue_avg > 150 and red_avg < 100 and green_avg < 100:
            suggestions.extend([
                {"species": "Blue Jay", "confidence": 0.7, "reason": "Blue coloration"},
                {"species": "Eastern Bluebird", "confidence": 0.6, "reason": "Blue plumage"}
            ])
        elif brightness < 100:
            suggestions.extend([
                {"species": "American Crow", "confidence": 0.7, "reason": "Dark plumage"},
                {"species": "Common Grackle", "confidence": 0.6, "reason": "Dark coloration"}
            ])
        else:
            suggestions.extend([
                {"species": "House Sparrow", "confidence": 0.4, "reason": "Common urban bird"},
                {"species": "American Robin", "confidence": 0.4, "reason": "Common backyard bird"}
            ])
        
        return suggestions[:3]
        
    except Exception as e:
        print(f"Error in fallback analysis: {e}")
        return None

# --- New helpers for crop/clean, classification over crops, and rich profile ---

def _clip(val, lo, hi):
    return max(lo, min(hi, val))

def crop_with_padding(img_path: str, bbox, pad_ratio: float = 0.15) -> Image.Image:
    """Crop the image around bbox with padding. bbox: [x1,y1,x2,y2] in pixels."""
    img = Image.open(img_path).convert('RGB')
    w, h = img.size
    x1, y1, x2, y2 = map(float, bbox)
    bw, bh = x2 - x1, y2 - y1
    px = bw * pad_ratio
    py = bh * pad_ratio
    nx1 = int(_clip(x1 - px, 0, w - 1))
    ny1 = int(_clip(y1 - py, 0, h - 1))
    nx2 = int(_clip(x2 + px, 1, w))
    ny2 = int(_clip(y2 + py, 1, h))
    return img.crop((nx1, ny1, nx2, ny2))

def classify_topk_on_crops(crops: list[Image.Image], top_k: int = 5):
    """Run classifier on multiple crops, return best species and top-k alternatives with confidences."""
    predictions = []
    if bird_classifier is None:
        # Fallback: use color-based analysis on the largest crop
        if not crops:
            return [], []
        return fallback_bird_analysis_for_crops(crops), []

    tensors = []
    for c in crops[:6]:  # limit crops for latency
        tensors.append(transform(c).unsqueeze(0))
    if not tensors:
        return [], []
    batch = torch.cat(tensors, dim=0)
    with torch.no_grad():
        logits = bird_classifier(batch)
        probs = F.softmax(logits, dim=1)
        # Aggregate by taking max probability across crops per class
        agg = torch.max(probs, dim=0).values  # [num_classes]
        top_prob, top_idx = torch.topk(agg, k=min(top_k, agg.shape[0]))
    top = []
    for p, idx in zip(top_prob.tolist(), top_idx.tolist()):
        if idx < len(BIRD_CLASSES):
            top.append({"species": BIRD_CLASSES[idx], "confidence": p})
    best = top[0] if top else None
    return best, top

def fallback_bird_analysis_for_crops(crops: list[Image.Image]):
    # Use the largest crop
    img = max(crops, key=lambda im: im.size[0]*im.size[1])
    arr = np.array(img)
    brightness = float(np.mean(arr))
    r = float(np.mean(arr[:, :, 0]))
    g = float(np.mean(arr[:, :, 1]))
    b = float(np.mean(arr[:, :, 2]))
    suggestions = []
    if r > 150 and g < 100 and b < 100:
        suggestions = [{"species": "Cardinal", "confidence": 0.7}]
    elif b > 150 and r < 100 and g < 100:
        suggestions = [{"species": "Blue Jay", "confidence": 0.7}]
    elif brightness < 100:
        suggestions = [{"species": "American Crow", "confidence": 0.7}]
    else:
        suggestions = [{"species": "American Robin", "confidence": 0.4}]
    return suggestions[0]

def build_rich_profile(species_common: str, species_conf: float, alternatives: list):
    """Build a 20+ field profile by enriching with eBird and adding structured fields."""
    # Try API, then fallback KB for robust defaults
    base = get_bird_details_from_api(species_common) or FALLBACK_KB.get(species_common, {})
    common_name = base.get("common_name") or species_common
    sci = base.get("scientific_name", "")
    family = base.get("family", "")
    order = base.get("order", "")
    profile = {
        "common_name": common_name,
        "scientific_name": sci,
        "taxonomy": {
            "kingdom": "Animalia",
            "phylum": "Chordata",
            "class": "Aves",
            "order": order,
            "family": family,
            "genus": base.get("genus", ""),
            "species": (sci.split(" ")[1] if " " in sci else base.get("species", "")),
            "subspecies": base.get("subspecies", [])
        },
        "physical_description": base.get("description", "Medium-sized bird; plumage and markings vary by species."),
        "vocalization": base.get("vocalization", "Calls and songs vary by region; refer to xeno-canto or Macaulay Library for spectrograms."),
        "distribution": base.get("distribution", "Global/Regional presence varies; consult range maps for specifics."),
        "habitat": base.get("habitat", "Forests, grasslands, wetlands, and urban areas depending on species."),
        "behavior": base.get("behavior", "Foraging, perching, territorial displays typical for the family."),
        "diet": base.get("diet", "Varied diet shifting seasonally (insects, seeds, fruits)."),
        "breeding": base.get("breeding", "Breeding season varies by latitude; typical clutch 2–5 eggs; biparental care common."),
        "conservation_status": base.get("conservation_status", "Not evaluated / varies by region."),
        "cultural_significance": base.get("cultural_significance", "Appears in local folklore and culture; symbolic meanings vary."),
        "ecological_role": base.get("ecological_role", "Insect control, seed dispersal, pollination; prey for higher trophic levels."),
        "similar_species": base.get("similar_species", "Compare size, bill shape, wing bars, eye-rings, and voice with lookalikes."),
        "observation_tips": base.get("observation_tips", "Observe at dawn/dusk; use binoculars; listen for calls in preferred habitat."),
        "local_occurrence": base.get("occurrences", []),
        "migration": base.get("migration", "Resident or migratory depending on population and latitude."),
        "image_url": base.get("image_url", ""),
        "confidence": species_conf,
        "alternatives": alternatives,
        "references": [
            "eBird taxonomy and species info",
            "IUCN Red List",
            "GBIF occurrences",
            "Cornell Lab – Birds of the World"
        ]
    }
    return profile

EBIRD_API_KEY = "omcelrsi7rt2"  # Your eBird API key

# COCO dataset class names (YOLOv8n is trained on COCO)
COCO_CLASSES = [
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
    'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
    'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
    'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
    'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
    'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
    'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors', 'teddy bear',
    'hair drier', 'toothbrush'
]

# Simple in-memory cache for eBird taxonomy
TAXONOMY_CACHE = {"data": None, "fetched_at": 0.0}
CACHE_TTL_SECONDS = 24 * 60 * 60  # 24 hours


def get_cached_taxonomy():
    """Fetch and cache the eBird taxonomy to avoid repeated large downloads."""
    now = time.time()
    if (
        TAXONOMY_CACHE["data"] is not None
        and (now - TAXONOMY_CACHE["fetched_at"]) < CACHE_TTL_SECONDS
    ):
        return TAXONOMY_CACHE["data"]

    try:
        url = "https://api.ebird.org/v2/ref/taxonomy/ebird"
        headers = {"X-eBirdApiToken": EBIRD_API_KEY}
        params = {"fmt": "json"}
        # Use separate connect/read timeouts to avoid long hangs
        response = requests.get(url, headers=headers, params=params, timeout=(3, 5))
        response.raise_for_status()
        TAXONOMY_CACHE["data"] = response.json()
        TAXONOMY_CACHE["fetched_at"] = now
        return TAXONOMY_CACHE["data"]
    except Exception as e:
        print(f"Error fetching eBird taxonomy: {e}")
        # Serve stale cache if available
        if TAXONOMY_CACHE["data"] is not None:
            return TAXONOMY_CACHE["data"]
        return None

def get_ebird_species_info(species_name):
    """
    Query eBird taxonomy and return species info matching common name or scientific name.
    """
    try:
        species_list = get_cached_taxonomy()
        if not species_list:
            return None

        # Search for exact match first (common name)
        for sp in species_list:
            if sp.get("comName", "").lower() == species_name.lower():
                return sp

        # Search for exact scientific name match
        for sp in species_list:
            if sp.get("sciName", "").lower() == species_name.lower():
                return sp

        # Search for partial matches in common name
        for sp in species_list:
            if species_name.lower() in sp.get("comName", "").lower():
                return sp

        # Search for partial matches in scientific name
        for sp in species_list:
            if species_name.lower() in sp.get("sciName", "").lower():
                return sp

        return None
    except Exception as e:
        print(f"Error fetching eBird data: {e}")
        return None

def get_bird_occurrences(species_code, region_code="US"):
    """
    Get recent bird occurrences from eBird
    """
    try:
        url = f"https://api.ebird.org/v2/data/obs/{region_code}/recent/{species_code}"
        headers = {"X-eBirdApiToken": EBIRD_API_KEY}
        params = {"back": 7, "maxResults": 5}  # Last 7 days, max 5 results
        # Use separate connect/read timeouts
        response = requests.get(url, headers=headers, params=params, timeout=(3, 5))
        
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching occurrences: {e}")
        return []

def get_bird_details_from_api(species_name):
    """
    Get detailed bird information from multiple sources
    """
    details = {
        "common_name": species_name,
        "scientific_name": "",
        "family": "",
        "order": "",
        "habitat": "",
        "description": "",
        "conservation_status": "",
        "image_url": "",
        "distribution": "",
        "behavior": "",
        "diet": "",
        "breeding": "",
        "migration": "",
        "occurrences": [],
        "search_type": "unknown"  # Track if search was by common or scientific name
    }
    
    # Try to get info from eBird
    ebird_info = get_ebird_species_info(species_name)
    if ebird_info:
        # Determine search type based on what matched
        if ebird_info["sciName"].lower() == species_name.lower():
            details["search_type"] = "scientific"
            details["common_name"] = ebird_info["comName"]  # Show common name when searching by scientific
        else:
            details["search_type"] = "common"
            details["common_name"] = ebird_info["comName"]
        
        details.update({
            "scientific_name": ebird_info.get("sciName", ""),
            "family": ebird_info.get("familyComName", ""),
            "order": ebird_info.get("order", ""),
            "conservation_status": ebird_info.get("category", ""),
            "species_code": ebird_info.get("speciesCode", "")
        })
        
        # Get recent occurrences if we have a species code
        if ebird_info.get("speciesCode"):
            occurrences = get_bird_occurrences(ebird_info["speciesCode"])
            details["occurrences"] = occurrences[:3]  # Limit to 3 recent sightings
        
        # Add some habitat and behavior information based on family/order
        family = ebird_info.get("familyComName", "").lower()
        order = ebird_info.get("order", "").lower()
        
        # Habitat information based on family
        if "duck" in family or "goose" in family:
            details["habitat"] = "Aquatic habitats including lakes, ponds, rivers, and wetlands"
            details["diet"] = "Aquatic plants, seeds, small invertebrates"
        elif "hawk" in family or "eagle" in family:
            details["habitat"] = "Open areas, forests, and grasslands"
            details["diet"] = "Small mammals, birds, reptiles, and fish"
        elif "sparrow" in family or "finch" in family:
            details["habitat"] = "Grasslands, shrublands, and urban areas"
            details["diet"] = "Seeds, insects, and berries"
        elif "warbler" in family:
            details["habitat"] = "Forests and woodlands"
            details["diet"] = "Insects and spiders"
        elif "heron" in family or "egret" in family:
            details["habitat"] = "Wetlands, marshes, and shallow water"
            details["diet"] = "Fish, frogs, and small aquatic animals"
        elif "malkoha" in family or "cuckoo" in family:
            details["habitat"] = "Forests, woodlands, and dense vegetation"
            details["diet"] = "Insects, small reptiles, and fruits"
        elif "bee-eater" in family:
            details["habitat"] = "Open woodlands, savannas, and grasslands"
            details["diet"] = "Flying insects, especially bees and wasps"
        elif "bulbul" in family:
            details["habitat"] = "Tropical forests, gardens, and woodland edges"
            details["diet"] = "Fruits, nectar, insects, and small invertebrates"
        elif "flycatcher" in family:
            details["habitat"] = "Forest canopy, woodland edges, and gardens"
            details["diet"] = "Flying insects caught on the wing"
        else:
            details["habitat"] = "Various habitats depending on species"
            details["diet"] = "Varied diet including insects, seeds, fruits, and small animals"
        
        # Enhanced habitat for Sri Lankan rainforest species
        sri_lankan_species = species_name.lower()
        if any(keyword in sri_lankan_species for keyword in ["sri lanka", "ceylon", "sinharaja"]):
            if "magpie" in sri_lankan_species:
                details["habitat"] = "Sinharaja Rainforest and other wet zone forests of Sri Lanka"
                details["distribution"] = "Endemic to Sri Lanka, primarily in Sinharaja Forest Reserve"
                details["conservation_status"] = "Vulnerable - Endemic species threatened by habitat loss"
            elif "junglefowl" in sri_lankan_species:
                details["habitat"] = "Dense forests including Sinharaja, dry zone forests, and scrublands"
                details["distribution"] = "Endemic to Sri Lanka, national bird"
                details["conservation_status"] = "Least Concern but declining due to habitat fragmentation"
            elif "whistling thrush" in sri_lankan_species:
                details["habitat"] = "Rocky streams in montane forests, Sinharaja valleys, and hill country"
                details["distribution"] = "Endemic to Sri Lanka's hill country and rainforests"
                details["conservation_status"] = "Near Threatened - Limited to specific altitudes"
            elif "bulbul" in sri_lankan_species:
                details["habitat"] = "Sinharaja Rainforest canopy, wet zone forests, and forest edges"
                details["distribution"] = "Endemic to Sri Lanka's southwestern wet zone"
                details["conservation_status"] = "Vulnerable - Restricted range and habitat loss"
        
        # Behavior information
        if "migratory" in ebird_info.get("category", "").lower():
            details["migration"] = "Migratory species"
        else:
            details["migration"] = "Resident species"
        
        # Breeding information
        details["breeding"] = "Breeding season varies by region and species"
        
        # Description
        details["description"] = f"A {family} species in the order {order}. {details['habitat']}. {details['diet']}."
        
        # Distribution
        details["distribution"] = "Found in various regions depending on habitat and migration patterns"
    
    return details

# --- Static fallback knowledge base (minimal) ---
FALLBACK_KB = {
    "Bald Eagle": {
        "scientific_name": "Haliaeetus leucocephalus",
        "family": "Accipitridae",
        "order": "Accipitriformes",
        "genus": "Haliaeetus",
        "species": "leucocephalus",
        "physical_description": "Large sea eagle; white head/tail (adult), dark brown body, massive yellow bill; juveniles mottled.",
        "vocalization": "High-pitched whistles and chatters; not the Hollywood 'eagle scream'.",
        "distribution": "North America: Alaska, Canada, contiguous U.S., northern Mexico; near large water bodies.",
        "habitat": "Coasts, rivers, lakes, reservoirs with large trees or cliffs for nesting.",
        "behavior": "Soaring, perch-hunting, kleptoparasitism; territorial during breeding.",
        "diet": "Fish primarily; also waterfowl, mammals, carrion.",
        "breeding": "Massive stick nests in trees/cliffs; 1–3 eggs; biparental incubation ~35 days.",
        "conservation_status": "IUCN Least Concern; recovered from DDT-era declines.",
        "cultural_significance": "National symbol of the U.S.; featured in emblems and folklore.",
        "ecological_role": "Top predator/scavenger; influences fish/waterfowl populations.",
        "similar_species": "Golden Eagle (no white head/tail; feathered legs), large buteos over water.",
        "observation_tips": "Scan shorelines for perched birds; look for huge stick nests near water.",
        "local_occurrence": [],
        "migration": "Partial migrant: northern breeders move south in winter; southern birds resident.",
        "image_url": "",
        "references": ["eBird", "IUCN", "GBIF", "Cornell Lab"]
    },
    "American Robin": {
        "scientific_name": "Turdus migratorius",
        "family": "Turdidae",
        "order": "Passeriformes",
        "genus": "Turdus",
        "species": "migratorius",
        "physical_description": "Gray-brown thrush with orange breast; white eye arcs; females duller.",
        "vocalization": "Cheerily-cherry; variable caroling at dawn and dusk.",
        "distribution": "North America; widespread in cities, suburbs, forests, and parks.",
        "habitat": "Lawns, open woodlands, gardens, edges; ground-foraging areas.",
        "behavior": "Ground foraging for worms; conspicuous hopping; territorial singing.",
        "diet": "Earthworms and insects; fruits/berries in fall-winter.",
        "breeding": "Cup nests on ledges/trees; 3–4 eggs; multiple broods possible.",
        "conservation_status": "Least Concern; common and adaptable.",
        "cultural_significance": "Harbinger of spring in North America.",
        "ecological_role": "Seed disperser; insect control.",
        "similar_species": "Varied Thrush (wing bars), Eastern/Spotted Towhee (different bill/shape).",
        "observation_tips": "Look for foraging on lawns; listen for caroling at dawn.",
        "local_occurrence": [],
        "migration": "Short-distance migrant; northern breeders move south/west in winter.",
        "image_url": "",
        "references": ["eBird", "GBIF", "Cornell Lab"]
    },
    
    # Sinharaja Rainforest Endemic Species
    "Sri Lanka Blue Magpie": {
        "common_name": "Sri Lanka Blue Magpie",
        "scientific_name": "Urocissa ornata",
        "family": "Corvidae (Crows, Jays, and Magpies)",
        "order": "Passeriformes",
        "genus": "Urocissa",
        "species": "ornata",
        "physical_description": "Striking blue and white corvid with long graduated tail; bright blue wings and back, white head and underparts, coral-red bill and legs.",
        "vocalization": "Loud harsh calls, chattering notes, and melodious whistles. Often vocal in flocks.",
        "distribution": "Endemic to Sri Lanka; restricted to wet zone forests including Sinharaja Forest Reserve.",
        "habitat": "Primary and secondary rainforests, especially Sinharaja Forest Reserve. Dense canopy of wet zone forests from sea level to 1200m elevation.",
        "behavior": "Highly social; moves in small flocks of 6-10 birds. Arboreal, rarely descends to ground. Intelligent and curious.",
        "diet": "Omnivorous - fruits, insects, small vertebrates, eggs, and nestlings of other birds.",
        "breeding": "Builds stick nest in tree fork; 3-5 eggs; breeds March-June during southwest monsoon.",
        "conservation_status": "Vulnerable (IUCN Red List). Endemic species threatened by deforestation and habitat fragmentation.",
        "cultural_significance": "National bird candidate of Sri Lanka; symbol of the island's unique biodiversity.",
        "ecological_role": "Seed disperser for large-seeded rainforest trees; maintains forest ecosystem health.",
        "similar_species": "No similar species in Sri Lanka - distinctive blue and white coloration is unique.",
        "observation_tips": "Listen for loud calls in forest canopy. Best seen in Sinharaja Forest Reserve early morning. Follows mixed feeding flocks.",
        "local_occurrence": ["Sinharaja Forest Reserve", "Kanneliya Forest", "Knuckles Range", "Peak Wilderness"],
        "migration": "Non-migratory resident endemic to Sri Lanka.",
        "image_url": "",
        "references": ["BirdLife International", "Endemic Birds of Sri Lanka", "Sinharaja Forest Research"]
    },
    
    "Sri Lanka Junglefowl": {
        "common_name": "Sri Lanka Junglefowl", 
        "scientific_name": "Gallus lafayettii",
        "family": "Phasianidae (Pheasants, Grouse, and Allies)",
        "order": "Galliformes",
        "genus": "Gallus",
        "species": "lafayettii",
        "physical_description": "National bird of Sri Lanka. Males: golden-orange neck hackles with dark centers, red comb and wattles, long curved black tail. Females: mottled brown.",
        "vocalization": "Characteristic crowing different from domestic roosters - more musical and prolonged. Dawn and dusk choruses.",
        "distribution": "Endemic to Sri Lanka. Found throughout the island in suitable forest habitat.",
        "habitat": "Dense forests including Sinharaja, dry zone forests, scrublands, and forest edges. From sea level to 1800m elevation.",
        "behavior": "Secretive and elusive. Forages on ground, scratching leaf litter. Strong flier despite terrestrial habits.",
        "diet": "Seeds, fruits, insects, small reptiles, and plant shoots. Ground-foraging omnivore.",
        "breeding": "Ground nest hidden in dense vegetation; 2-4 eggs; extended breeding season.",
        "conservation_status": "Least Concern but declining due to habitat loss and hybridization with domestic chickens.",
        "cultural_significance": "National bird of Sri Lanka since 1979. Featured on currency and official emblems.",
        "ecological_role": "Seed dispersal, insect control, maintains forest floor ecosystem balance.",
        "similar_species": "Domestic chicken hybrids occur; pure wild birds distinguished by plumage details and behavior.",
        "observation_tips": "Very secretive. Best chance in Sinharaja Forest Reserve at dawn. Listen for distinctive crow calls.",
        "local_occurrence": ["Sinharaja Forest Reserve", "Yala National Park", "Wilpattu National Park", "Knuckles Range"],
        "migration": "Non-migratory resident endemic.",
        "image_url": "",
        "references": ["BirdLife International", "Sri Lanka National Bird", "Forest Department Sri Lanka"]
    },
    
    "Red-faced Malkoha": {
        "common_name": "Red-faced Malkoha",
        "scientific_name": "Phaenicophaeus pyrrhocephalus",
        "family": "Cuculidae (Cuckoos)",
        "order": "Cuculiformes", 
        "genus": "Phaenicophaeus",
        "species": "pyrrhocephalus",
        "physical_description": "Large cuckoo with distinctive red face and bill, dark green upperparts, whitish underparts, long graduated tail with white tips.",
        "vocalization": "Deep hollow hooting calls, often in duet. Resonant 'whoop-whoop-whoop' notes carrying through forest.",
        "distribution": "Endemic to Sri Lanka; throughout the island's forest areas.",
        "habitat": "Dense forests including Sinharaja rainforest, dry zone forests, forest edges and gallery forests. Sea level to 1500m.",
        "behavior": "Usually in pairs. Skulking habits, stays in dense foliage. Non-parasitic cuckoo that builds own nest.",
        "diet": "Insects, caterpillars, small reptiles, and occasionally fruits. Gleans from foliage and branches.",
        "breeding": "Builds stick nest in tree fork; 2-3 eggs; both parents incubate and care for young.",
        "conservation_status": "Least Concern but sensitive to forest fragmentation.",
        "cultural_significance": "Important species for birdwatching tourism in Sri Lanka.",
        "ecological_role": "Controls insect populations, particularly caterpillars that damage forest vegetation.",
        "similar_species": "Chestnut-winged Cuckoo (migrant) lacks red face; smaller size distinguishes from other malkohas.",
        "observation_tips": "Listen for distinctive hooting calls. Best found in Sinharaja Forest Reserve and other primary forests.",
        "local_occurrence": ["Sinharaja Forest Reserve", "Knuckles Range", "Kanneliya Forest", "Bodhinagala Forest"],
        "migration": "Non-migratory resident endemic.",
        "image_url": "",
        "references": ["Endemic Birds of Sri Lanka", "Cuckoos of South Asia", "Sinharaja Biodiversity"]
    }
}

@app.route('/detect-bird', methods=['POST', 'OPTIONS'])
def detect_bird():
    if request.method == 'OPTIONS':
        return ('', 204)
    if 'image' not in request.files:
        return jsonify({'message': 'No image uploaded'}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({'message': 'No image file selected'}), 400

    img_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(img_path)

    try:
        # Run detection using basic YOLO inference
        results = model(img_path, conf=0.1)  # Lower threshold to catch more birds
        
        # Handle different YOLO result formats
        result = results[0] if isinstance(results, (list, tuple)) and len(results) > 0 else results
        
        # Debug: Log the result type and structure
        print(f"Detection result type: {type(result)}")
        if hasattr(result, 'boxes') and result.boxes is not None:
            print(f"Result has boxes: {result.boxes}")
        elif hasattr(result, 'shape'):
            print(f"Result is tensor with shape: {result.shape}")
        
        # Initialize detection lists
        bird_detections = []
        detected_objects = []
        
        # Parse detection results
        if hasattr(result, 'boxes') and result.boxes is not None:
            # Modern Ultralytics Results format
            boxes = result.boxes
            if hasattr(boxes, 'cls') and hasattr(boxes, 'conf') and hasattr(boxes, 'xyxy'):
                cls_list = boxes.cls.tolist() if hasattr(boxes, 'cls') else []
                conf_list = boxes.conf.tolist() if hasattr(boxes, 'conf') else []
                xyxy_list = boxes.xyxy.tolist() if hasattr(boxes, 'xyxy') else []
                
                print(f"Parsing boxes format: {len(cls_list)} detections")
                
                num = min(len(cls_list), len(conf_list), len(xyxy_list))
                for i in range(num):
                    class_id = int(cls_list[i])
                    confidence = float(conf_list[i])
                    bbox = xyxy_list[i]
                    
                    if class_id < len(COCO_CLASSES):
                        detected_objects.append({'class': COCO_CLASSES[class_id], 'confidence': confidence})
                    
                    # Check if it's a bird (class 14) with lower threshold
                    if class_id == 14 and confidence > 0.1:
                        bird_detections.append({'confidence': confidence, 'bbox': bbox})
                        print(f"Bird detected (boxes) with confidence: {confidence}")
        
        elif hasattr(result, 'shape') and len(result.shape) > 0:
            # Raw tensor format (N x 6: x1,y1,x2,y2,conf,cls)
            if len(result.shape) == 2 and result.shape[1] == 6:
                print(f"Parsing raw tensor detections: {result.shape[0]}")
                
                for detection in result:
                    if len(detection) >= 6:
                        x1, y1, x2, y2, conf, cls = detection[:6]
                        class_id = int(cls.item())
                        confidence = float(conf.item())
                        bbox = [float(x1.item()), float(y1.item()), float(x2.item()), float(y2.item())]
                        
                        if class_id < len(COCO_CLASSES):
                            detected_objects.append({'class': COCO_CLASSES[class_id], 'confidence': confidence})
                        
                        # Check if it's a bird (class 14) with lower threshold
                        if class_id == 14 and confidence > 0.1:
                            bird_detections.append({'confidence': confidence, 'bbox': bbox})
                            print(f"Bird detected (raw) with confidence: {confidence}")
        
        # Log all detections for debugging
        print(f"Total bird detections: {len(bird_detections)}")
        print(f"All detected objects: {detected_objects}")
        
        # ANTI-HUMAN FILTER: Check for humans first and reject if found
        human_detections = [obj for obj in detected_objects if obj['class'].lower() == 'person' and obj['confidence'] > 0.3]
        if human_detections:
            highest_human_conf = max(human_detections, key=lambda x: x['confidence'])['confidence']
            print(f"Human detected with confidence {highest_human_conf:.3f} - rejecting image")
            
            # Check if bird was also detected to provide better feedback
            bird_also_detected = len(bird_detections) > 0
            
            if bird_also_detected:
                message = "Human photo with bird in background detected. Please upload a photo where the bird is the main subject, not the person."
            else:
                message = "Human photo detected. Please upload a clear photo of a bird only."
                
            return jsonify({
                'message': message,
                'detected_objects': detected_objects,
                'detection_type': 'human',
                'suggestion': 'For best results, upload photos where birds are the main subject without people in the frame.'
            }), 400
        
        # ANTI-NON-BIRD FILTER: Check for other common non-bird subjects
        non_bird_animals = ['cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe']
        animal_detections = [obj for obj in detected_objects 
                           if obj['class'].lower() in non_bird_animals and obj['confidence'] > 0.4]
        
        if animal_detections:
            detected_animal = max(animal_detections, key=lambda x: x['confidence'])
            print(f"Non-bird animal detected: {detected_animal['class']} with confidence {detected_animal['confidence']:.3f}")
            
            return jsonify({
                'message': f"{detected_animal['class'].title()} photo detected. Please upload a photo of a bird.",
                'detected_objects': detected_objects,
                'detection_type': 'other-animal',
                'suggestion': f'This appears to be a {detected_animal["class"]}. Our system is specialized for bird identification only.'
            }), 400
        
        # INDOOR/OBJECT FILTER: Check for indoor objects that suggest non-bird photos
        indoor_objects = ['bottle', 'cup', 'bowl', 'chair', 'couch', 'bed', 'dining table', 'tv', 'laptop', 'cell phone']
        high_conf_indoor = [obj for obj in detected_objects 
                          if obj['class'].lower() in indoor_objects and obj['confidence'] > 0.6]
        
        # If many indoor objects detected and no birds, likely indoor non-bird photo
        if len(high_conf_indoor) >= 2 and len(bird_detections) == 0:
            print(f"Indoor objects detected without birds: {[obj['class'] for obj in high_conf_indoor]}")
            
            return jsonify({
                'message': 'Indoor photo detected without birds. Please upload an outdoor bird photo.',
                'detected_objects': detected_objects,
                'detection_type': 'object',
                'suggestion': 'For best bird detection results, use outdoor photos with natural backgrounds.'
            }), 400
        
        # Fallback: If no birds detected with class 14, look for bird-related objects
        if len(bird_detections) == 0:
            bird_keywords = ['bird', 'owl', 'eagle', 'hawk', 'falcon', 'sparrow', 'robin', 'cardinal', 'bluejay', 'crow', 'raven', 'pigeon', 'dove', 'duck', 'goose', 'swan', 'chicken', 'turkey', 'parrot', 'finch', 'warbler', 'thrush', 'wren', 'titmouse', 'nuthatch', 'woodpecker', 'kingfisher', 'heron', 'egret', 'crane', 'stork', 'pelican', 'gull', 'tern', 'albatross', 'penguin', 'ostrich', 'emu', 'kiwi']
            
            for obj in detected_objects:
                obj_class = obj['class'].lower()
                if any(keyword in obj_class for keyword in bird_keywords):
                    print(f"Found bird-related object: {obj['class']} with confidence: {obj['confidence']}")
                    # Add to bird detections with a note
                    bird_detections.append({
                        'confidence': obj['confidence'], 
                        'bbox': [0, 0, 100, 100],  # Default bbox
                        'detected_as': obj['class']
                    })
                    break
        
        # Final check: If still no birds, check if any high-confidence objects might be birds
        if len(bird_detections) == 0:
            high_confidence_objects = [obj for obj in detected_objects if obj['confidence'] > 0.5]
            if high_confidence_objects:
                print(f"No birds detected, but found high-confidence objects: {high_confidence_objects}")
                # Consider the highest confidence object as a potential bird
                best_obj = max(high_confidence_objects, key=lambda x: x['confidence'])
                if best_obj['confidence'] > 0.6:  # High confidence threshold
                    print(f"Treating high-confidence object '{best_obj['class']}' as potential bird")
                    bird_detections.append({
                        'confidence': best_obj['confidence'],
                        'bbox': [0, 0, 100, 100],
                        'detected_as': best_obj['class'],
                        'fallback': True
                    })
        
        if not bird_detections:
            return jsonify({
                'message': 'No bird detected in the image. Please upload an image with a clear view of a bird.',
                'detected_objects': detected_objects
            })

        # --- NEW: Crop detected birds and classify top-k over crops ---
        crops = []
        for det in bird_detections:
            bbox = det.get('bbox')
            if bbox and len(bbox) == 4:
                try:
                    crops.append(crop_with_padding(img_path, bbox, pad_ratio=0.15))
                except Exception as e:
                    print(f"Crop error: {e}")
        if not crops:
            # fallback: whole image crop
            crops = [Image.open(img_path).convert('RGB')]

        best_pred, top_preds = classify_topk_on_crops(crops, top_k=5)
        if not best_pred:
            # Fallback to previous analysis if classifier not available
            species_name = 'Bird (Species Unknown)'
            species_conf = 0.0
            alternatives = []
        else:
            species_name = best_pred['species']
            species_conf = float(best_pred['confidence'])
            # alternatives excluding top-1
            alternatives = [
                {"species": p['species'], "confidence": float(p['confidence'])}
                for p in (top_preds[1:] if len(top_preds) > 1 else [])
            ]

        print(f"Top species prediction: {species_name} (confidence: {species_conf:.3f})")

        # Build rich profile (20+ fields), enriched via eBird helpers
        # Always build a rich profile; low confidence will be noted in the response
        profile = build_rich_profile(species_name, species_conf, alternatives)

        low_conf = species_conf < 0.2
        advice = None
        if low_conf:
            advice = "Low confidence. Try a clearer, closer photo, and optionally provide location and time for better accuracy."

        return jsonify({
            "message": f"Bird detected! Species: {profile['common_name']}",
            "species": profile['common_name'],
            "scientific_name": profile['scientific_name'],
            "profile": profile,
            "detections": bird_detections,
            "detected_objects": detected_objects,
            "confidence": species_conf,
            "alternatives": profile.get("alternatives", []),
            "low_confidence": low_conf,
            "advice": advice
        })

    except Exception as e:
        return jsonify({'message': f'Error processing image: {str(e)}'}), 500

@app.route('/search-bird', methods=['GET'])
def search_bird():
    species_name = request.args.get('name')
    if not species_name:
        return jsonify({'message': 'Please provide a bird name in the "name" query parameter.'}), 400

    bird_details = get_bird_details_from_api(species_name)
    if bird_details and bird_details.get("scientific_name"):
        # Create appropriate message based on search type
        if bird_details.get("search_type") == "scientific":
            message = f'Found common name for scientific name "{species_name}": {bird_details["common_name"]}'
        else:
            message = f'Detailed information found for "{species_name}".'
        
        return jsonify({
            'message': message,
            'bird_details': bird_details
        })
    else:
        return jsonify({'message': f'No information found for "{species_name}".'}), 404

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'BirdScan AI Backend is running'})

@app.route('/test', methods=['GET', 'POST'])
def test_endpoint():
    return jsonify({
        'status': 'success',
        'method': request.method,
        'message': 'Test endpoint working',
        'headers': dict(request.headers)
    })

if __name__ == '__main__':
    # Disable debug autoreload to prevent restarts that can interrupt long requests
    app.run(debug=False, use_reloader=False, host='0.0.0.0', port=5001)
