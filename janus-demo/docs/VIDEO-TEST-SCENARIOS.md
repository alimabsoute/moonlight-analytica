# Janus Test Video Scenarios

## Purpose
Test videos organized by real-world use cases for B2B analytics:
- Retail foot traffic
- Restaurant/hospitality occupancy
- Queue analysis
- Flow rate measurement

**NOT for:** Home security, beach surveillance, general monitoring

---

## VIDEO SOURCES

### Free Stock Video Sites
| Source | API | Quality | License |
|--------|-----|---------|---------|
| [Pexels](https://pexels.com/videos) | Yes (free) | 4K | Free commercial |
| [Pixabay](https://pixabay.com/videos) | Yes (free) | HD/4K | Free commercial |
| [Coverr](https://coverr.co) | No | HD | Free commercial |
| [Videvo](https://videvo.net) | No | HD | Mixed |

### YouTube (for testing only - not redistribution)
- Use `yt-dlp` for stream extraction
- Respect copyright for internal testing only

---

## SCENARIO 1: RETAIL TRAFFIC

### Search Queries
```
Pexels/Pixabay:
- "people walking mall"
- "shopping mall crowd"
- "retail store entrance"
- "store customers walking"
- "supermarket shoppers"
- "clothing store customers"

YouTube:
- "mall foot traffic timelapse"
- "retail store security camera"
- "shopping center crowd"
- "store entrance camera"
```

### Specific Videos Needed
| Scenario | Description | Difficulty |
|----------|-------------|------------|
| Store entrance | Single door, clear entry/exit | Easy |
| Mall corridor | Wide hallway, bidirectional | Medium |
| Busy store | Multiple people, occlusion | Hard |
| Checkout area | Queue forming, waiting | Medium |

---

## SCENARIO 2: RESTAURANT & CAFÉ

### Search Queries
```
Pexels/Pixabay:
- "restaurant dining room"
- "cafe customers sitting"
- "people eating restaurant"
- "coffee shop interior"
- "restaurant tables overhead"
- "busy restaurant timelapse"

YouTube:
- "restaurant timelapse"
- "cafe security camera footage"
- "dining room occupancy"
- "restaurant table turnover"
```

### Specific Videos Needed
| Scenario | Description | Difficulty |
|----------|-------------|------------|
| Table occupancy | Static view of tables | Easy |
| Counter service | People ordering/waiting | Medium |
| Busy dinner rush | Multiple tables, movement | Hard |
| Outdoor patio | Seating with weather | Medium |

---

## SCENARIO 3: QUEUE ANALYSIS

### Search Queries
```
Pexels/Pixabay:
- "people waiting in line"
- "queue customers"
- "checkout line store"
- "bank queue"
- "waiting room people"

YouTube:
- "queue management system"
- "long line waiting"
- "checkout line timelapse"
- "DMV waiting room"
```

### Specific Videos Needed
| Scenario | Description | Difficulty |
|----------|-------------|------------|
| Single file queue | Clear line formation | Easy |
| Multiple queues | Several checkout lanes | Medium |
| Serpentine queue | Bank-style rope line | Medium |
| Informal gathering | Unstructured waiting | Hard |

---

## SCENARIO 4: OFFICE & COWORKING

### Search Queries
```
Pexels/Pixabay:
- "office workers walking"
- "coworking space people"
- "meeting room office"
- "office lobby people"
- "open office workspace"

YouTube:
- "office timelapse"
- "coworking space tour"
- "meeting room occupancy"
```

### Specific Videos Needed
| Scenario | Description | Difficulty |
|----------|-------------|------------|
| Reception area | People entering/waiting | Easy |
| Open floor plan | Desks with movement | Medium |
| Meeting room | Occupancy detection | Easy |
| Hallway traffic | Corridor movement | Medium |

---

## SCENARIO 5: EVENTS & VENUES

### Search Queries
```
Pexels/Pixabay:
- "concert crowd"
- "stadium entrance"
- "event venue people"
- "conference attendees"
- "trade show floor"

YouTube:
- "stadium entry timelapse"
- "concert crowd aerial"
- "convention center traffic"
```

### Specific Videos Needed
| Scenario | Description | Difficulty |
|----------|-------------|------------|
| Entry gates | Single file ingress | Medium |
| Concession line | Food/drink queue | Medium |
| Seating fill | Seats being occupied | Medium |
| Dense crowd | High density movement | Hard |

---

## SCENARIO 6: QUICK SERVICE / FAST FOOD

### Search Queries
```
Pexels/Pixabay:
- "fast food restaurant"
- "drive thru cars"
- "food court people"
- "ordering counter"

YouTube:
- "drive thru timelapse"
- "fast food rush hour"
- "food court overhead"
```

### Specific Videos Needed
| Scenario | Description | Difficulty |
|----------|-------------|------------|
| Counter ordering | People at register | Easy |
| Drive-thru lane | Cars queuing | Medium |
| Food court | Multiple vendors | Hard |
| Pickup area | Order collection | Medium |

---

## SCENARIO 7: TRANSPORTATION

### Search Queries
```
Pexels/Pixabay:
- "train station platform"
- "airport terminal people"
- "bus station waiting"
- "subway station crowd"

YouTube:
- "train station timelapse"
- "airport security line"
- "subway platform crowd"
```

### Specific Videos Needed
| Scenario | Description | Difficulty |
|----------|-------------|------------|
| Platform waiting | People waiting for train | Medium |
| Ticket counter | Queue at counter | Medium |
| Security line | Airport-style queue | Medium |
| Escalator flow | Directional movement | Medium |

---

## EDGE CASES TO TEST

### Tracking Challenges
| Challenge | Example | Priority |
|-----------|---------|----------|
| **Occlusion** | Person walks behind another | High |
| **Similar appearance** | Multiple people in uniforms | High |
| **Sitting/standing** | Person sits down at table | High |
| **Group splitting** | Friends separate | Medium |
| **Re-entry** | Person leaves and returns | High |
| **Lighting change** | Day to night transition | Medium |
| **Camera angle** | Overhead vs eye-level | Medium |
| **Crowding** | 20+ people in frame | High |

### Restaurant-Specific Challenges
| Challenge | Example | Priority |
|-----------|---------|----------|
| **Table assignment** | Which table is which | High |
| **Partial occupancy** | 2 people at 4-top | High |
| **Staff vs customer** | Distinguish servers | Medium |
| **Table clearing** | Detect empty vs dirty | Medium |

---

## VIDEO COLLECTION SCRIPT

Update `download_test_videos.py` to include these categories:

```python
SCENARIO_VIDEOS = {
    "retail": [
        {"query": "mall walking people", "count": 5},
        {"query": "store entrance customers", "count": 3},
        {"query": "checkout line queue", "count": 3},
    ],
    "restaurant": [
        {"query": "restaurant dining tables", "count": 5},
        {"query": "cafe customers sitting", "count": 3},
        {"query": "coffee shop interior", "count": 3},
    ],
    "queue": [
        {"query": "people waiting line", "count": 5},
        {"query": "bank queue customers", "count": 3},
    ],
    "office": [
        {"query": "office workers walking", "count": 3},
        {"query": "meeting room office", "count": 2},
    ],
    "venue": [
        {"query": "concert crowd", "count": 3},
        {"query": "stadium entrance", "count": 2},
    ],
}
```

---

## SUCCESS METRICS BY SCENARIO

| Scenario | Primary Metric | Target |
|----------|---------------|--------|
| Retail entrance | Entry/exit accuracy | >95% |
| Table occupancy | Occupied/empty detection | >90% |
| Queue length | Person count in line | >90% |
| Dwell time | Time tracking accuracy | ±10 sec |
| Flow direction | Direction classification | >85% |
| Turnover rate | Table change detection | >85% |

---

## NOTES

- All videos should be 30 seconds to 5 minutes
- Prefer static camera angles (like security cameras)
- Include variety: empty, moderate, busy scenes
- Test both daytime and evening lighting
- Include overhead and eye-level angles
