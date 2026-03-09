"""
Generate Project Janus Cloud Tracking Proposal PDF
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib import colors
import os

# Colors
NAVY = HexColor("#0f172a")
DARK_BLUE = HexColor("#1e293b")
ACCENT_BLUE = HexColor("#3b82f6")
ACCENT_CYAN = HexColor("#06b6d4")
LIGHT_GRAY = HexColor("#f1f5f9")
MED_GRAY = HexColor("#94a3b8")
DARK_TEXT = HexColor("#1e293b")
GREEN = HexColor("#22c55e")
RED = HexColor("#ef4444")
AMBER = HexColor("#f59e0b")
PURPLE = HexColor("#8b5cf6")

# Styles
styles = {}

styles["title"] = ParagraphStyle(
    "title", fontName="Helvetica-Bold", fontSize=28,
    textColor=NAVY, spaceAfter=6, alignment=TA_LEFT, leading=34
)
styles["subtitle"] = ParagraphStyle(
    "subtitle", fontName="Helvetica", fontSize=13,
    textColor=MED_GRAY, spaceAfter=24, alignment=TA_LEFT
)
styles["h1"] = ParagraphStyle(
    "h1", fontName="Helvetica-Bold", fontSize=20,
    textColor=NAVY, spaceBefore=28, spaceAfter=12, leading=26
)
styles["h2"] = ParagraphStyle(
    "h2", fontName="Helvetica-Bold", fontSize=15,
    textColor=ACCENT_BLUE, spaceBefore=20, spaceAfter=8, leading=20
)
styles["h3"] = ParagraphStyle(
    "h3", fontName="Helvetica-Bold", fontSize=12,
    textColor=DARK_TEXT, spaceBefore=14, spaceAfter=6, leading=16
)
styles["body"] = ParagraphStyle(
    "body", fontName="Helvetica", fontSize=10,
    textColor=DARK_TEXT, spaceAfter=8, leading=15, alignment=TA_JUSTIFY
)
styles["body_bold"] = ParagraphStyle(
    "body_bold", fontName="Helvetica-Bold", fontSize=10,
    textColor=DARK_TEXT, spaceAfter=8, leading=15
)
styles["bullet"] = ParagraphStyle(
    "bullet", fontName="Helvetica", fontSize=10,
    textColor=DARK_TEXT, spaceAfter=4, leading=14,
    leftIndent=20, bulletIndent=8
)
styles["pro"] = ParagraphStyle(
    "pro", fontName="Helvetica", fontSize=9.5,
    textColor=HexColor("#166534"), spaceAfter=3, leading=13,
    leftIndent=20, bulletIndent=8
)
styles["con"] = ParagraphStyle(
    "con", fontName="Helvetica", fontSize=9.5,
    textColor=HexColor("#991b1b"), spaceAfter=3, leading=13,
    leftIndent=20, bulletIndent=8
)
styles["code"] = ParagraphStyle(
    "code", fontName="Courier", fontSize=9,
    textColor=DARK_TEXT, spaceAfter=8, leading=13,
    leftIndent=16, backColor=LIGHT_GRAY
)
styles["caption"] = ParagraphStyle(
    "caption", fontName="Helvetica-Oblique", fontSize=9,
    textColor=MED_GRAY, spaceAfter=12, alignment=TA_CENTER
)
styles["rec_body"] = ParagraphStyle(
    "rec_body", fontName="Helvetica", fontSize=10.5,
    textColor=DARK_TEXT, spaceAfter=8, leading=16, alignment=TA_JUSTIFY
)
styles["footer"] = ParagraphStyle(
    "footer", fontName="Helvetica", fontSize=8,
    textColor=MED_GRAY, alignment=TA_CENTER
)
styles["toc"] = ParagraphStyle(
    "toc", fontName="Helvetica", fontSize=11,
    textColor=ACCENT_BLUE, spaceAfter=6, leading=18, leftIndent=12
)

def hr():
    return HRFlowable(width="100%", thickness=1, color=HexColor("#e2e8f0"), spaceAfter=12, spaceBefore=8)

def make_table(headers, rows, col_widths=None):
    data = [headers] + rows
    if col_widths is None:
        col_widths = [None] * len(headers)
    t = Table(data, colWidths=col_widths, repeatRows=1)
    style_cmds = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 1), (-1, -1), DARK_TEXT),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#cbd5e1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GRAY]),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]
    t.setStyle(TableStyle(style_cmds))
    return t

def arch_diagram(lines):
    """Create a simple architecture diagram as a styled table."""
    data = [[Paragraph(l, ParagraphStyle("diag", fontName="Courier", fontSize=9, textColor=DARK_TEXT, leading=13))] for l in lines]
    t = Table(data, colWidths=[6.5 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 1, HexColor("#cbd5e1")),
        ("LEFTPADDING", (0, 0), (-1, -1), 16),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t

def build_pdf():
    output_path = os.path.join(os.path.dirname(__file__), "Janus-Cloud-Tracking-Proposal.pdf")
    doc = SimpleDocTemplate(
        output_path, pagesize=letter,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch
    )
    story = []

    # ── COVER PAGE ──
    story.append(Spacer(1, 1.5*inch))
    story.append(Paragraph("Project Janus", styles["title"]))
    story.append(Spacer(1, 6))
    cover_title = ParagraphStyle("ct", fontName="Helvetica-Bold", fontSize=22, textColor=ACCENT_BLUE, leading=28)
    story.append(Paragraph("Cloud-Based Person Tracking:<br/>Architecture Options &amp; Recommendation", cover_title))
    story.append(Spacer(1, 24))
    story.append(HRFlowable(width="40%", thickness=3, color=ACCENT_BLUE, spaceAfter=24))
    meta_style = ParagraphStyle("meta", fontName="Helvetica", fontSize=11, textColor=MED_GRAY, leading=18)
    story.append(Paragraph("Prepared by: Claude Code (AI Engineering Assistant)<br/>"
                           "Prepared for: Ali Mabsoute<br/>"
                           "Date: February 2026<br/>"
                           "Version: 1.0", meta_style))
    story.append(Spacer(1, 1*inch))
    story.append(Paragraph("Moonlight Analytica", ParagraphStyle("brand", fontName="Helvetica-Bold", fontSize=14, textColor=NAVY)))
    story.append(Paragraph("moonlightanalytica.com", ParagraphStyle("url", fontName="Helvetica", fontSize=10, textColor=ACCENT_BLUE)))

    story.append(PageBreak())

    # ── TABLE OF CONTENTS ──
    story.append(Paragraph("Table of Contents", styles["h1"]))
    story.append(hr())
    toc_items = [
        "1.  Executive Summary",
        "2.  Current Architecture &amp; Challenges",
        "3.  Option 1: Roboflow Docker (Self-Hosted) &mdash; Recommended",
        "4.  Option 2: Roboflow Hosted Cloud API",
        "5.  Option 3: Replicate API (Cloud YOLO)",
        "6.  Option 4: Pre-Process Offline + Replay with Overlay",
        "7.  Option 5: AWS Rekognition Video",
        "8.  Option 6: Google Cloud Video Intelligence",
        "9.  Comparison Matrix",
        "10. Recommendation &amp; Roadmap",
        "11. Implementation Plan",
        "12. Sources &amp; References",
    ]
    for item in toc_items:
        story.append(Paragraph(item, styles["toc"]))
    story.append(PageBreak())

    # ── 1. EXECUTIVE SUMMARY ──
    story.append(Paragraph("1. Executive Summary", styles["h1"]))
    story.append(hr())
    story.append(Paragraph(
        "Project Janus is a visual person-tracking and analytics system that processes video feeds "
        "to detect, count, and track individuals across defined zones. The system currently relies on "
        "YOLO (You Only Look Once) object detection models running locally on the CPU via Python's "
        "ultralytics library. This approach has proven unreliable: model loading takes 15-20 seconds, "
        "the video streamer process frequently crashes under load, and CPU-bound inference drops frames "
        "and delivers inconsistent performance.", styles["body"]
    ))
    story.append(Paragraph(
        "This document evaluates six alternative architectures for offloading or optimizing the person "
        "detection and tracking workload, ranging from self-hosted Docker containers to fully managed "
        "cloud services. Each option is assessed on cost, reliability, real-time capability, implementation "
        "effort, and alignment with the existing Janus UI.", styles["body"]
    ))
    story.append(Paragraph(
        "<b>Primary Requirement:</b> The user-facing experience must remain unchanged &mdash; a live video feed "
        "with colored bounding boxes around detected people, tracking IDs, zone labels, and a dashboard "
        "displaying real-time metrics (current count, entries, exits, dwell time, queue length).", styles["body"]
    ))

    # ── 2. CURRENT ARCHITECTURE ──
    story.append(Paragraph("2. Current Architecture &amp; Challenges", styles["h1"]))
    story.append(hr())
    story.append(Paragraph("Current System Flow", styles["h2"]))
    story.append(arch_diagram([
        "User selects video from Library (React Frontend)",
        "    |",
        "    v",
        "Backend (Flask :8000) spawns video_streamer.py subprocess",
        "    |",
        "    v",
        "video_streamer.py loads YOLO model (15-20s cold start)",
        "    |-- Reads video frames with OpenCV",
        "    |-- Runs YOLO inference on CPU (ultralytics)",
        "    |-- Applies ByteTrack for person tracking IDs",
        "    |-- Draws bounding boxes + zone overlays",
        "    |-- Serves MJPEG stream on :8001/video_feed",
        "    |",
        "    v",
        "Frontend displays &lt;img src='localhost:8001/video_feed'&gt;",
    ]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Key Challenges", styles["h2"]))
    challenges = [
        ["Instability", "video_streamer.py crashes under load; subprocess management is fragile"],
        ["Cold Start", "YOLO model loading takes 15-20 seconds, causing timeouts"],
        ["Performance", "CPU inference delivers 3-8 FPS with frame dropping"],
        ["Resource Usage", "Ultralytics + OpenCV + YOLO consume significant CPU/RAM"],
        ["UI Bug (Fixed)", "setLoading(true) destroyed the Library modal &mdash; now resolved"],
    ]
    story.append(make_table(
        ["Challenge", "Description"],
        challenges,
        col_widths=[1.5*inch, 5*inch]
    ))

    story.append(PageBreak())

    # ── 3. OPTION 1: ROBOFLOW DOCKER ──
    story.append(Paragraph("3. Option 1: Roboflow Inference Server (Docker)", styles["h1"]))
    story.append(hr())
    # Recommended badge
    badge_style = ParagraphStyle("badge", fontName="Helvetica-Bold", fontSize=11, textColor=white, backColor=GREEN, alignment=TA_CENTER)
    badge_data = [[Paragraph("RECOMMENDED", badge_style)]]
    badge_t = Table(badge_data, colWidths=[1.8*inch])
    badge_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), GREEN),
        ("ALIGN", (0, 0), (0, 0), "CENTER"),
        ("TOPPADDING", (0, 0), (0, 0), 6),
        ("BOTTOMPADDING", (0, 0), (0, 0), 6),
        ("BOX", (0, 0), (0, 0), 0, GREEN),
    ]))
    story.append(badge_t)
    story.append(Spacer(1, 8))

    story.append(Paragraph(
        "Run Roboflow's open-source inference server as a Docker container on the local machine. "
        "This is a production-grade, battle-tested YOLO inference server that replaces our hand-rolled "
        "video_streamer.py's inference logic. It supports GPU acceleration if available, but even on CPU "
        "it provides significantly more stability than raw ultralytics because of proper process management, "
        "model caching, and health monitoring.", styles["body"]
    ))

    story.append(Paragraph("Architecture", styles["h2"]))
    story.append(arch_diagram([
        "Video File",
        "    |",
        "    v",
        "video_streamer.py (simplified: frame reader + box drawer)",
        "    |-- Reads frames with OpenCV",
        "    |-- POST frame to localhost:9001/infer (Roboflow Container)",
        "    |-- Receives detection JSON (bounding boxes, confidence)",
        "    |-- Applies ByteTrack for tracking IDs",
        "    |-- Draws boxes + zones on frame",
        "    |-- Serves MJPEG stream on :8001/video_feed",
        "    |",
        "    v",
        "Frontend displays feed (unchanged from current UI)",
    ]))
    story.append(Spacer(1, 6))
    story.append(Paragraph("Pricing", styles["h2"]))
    story.append(make_table(
        ["Item", "Cost"],
        [
            ["Roboflow Inference Server (self-hosted)", "FREE (Apache 2.0)"],
            ["Docker Desktop", "FREE (personal use)"],
            ["API Key", "Not required for local inference"],
            ["Monthly running cost", "$0"],
        ],
        col_widths=[3.5*inch, 3*inch]
    ))

    story.append(Paragraph("Advantages", styles["h2"]))
    pros = [
        "Zero cost, unlimited inferences &mdash; no API keys, no metering",
        "Far more stable than raw ultralytics &mdash; production-grade process management",
        "GPU-ready: add a GPU later for 10x+ speedup with zero code changes",
        "Works completely offline &mdash; no internet dependency",
        "Supports 50+ models: YOLO, RF-DETR, Florence-2, CLIP, and more",
        "Real-time video feed works exactly as the current UI",
        "Docker container isolates dependencies &mdash; no more venv issues",
    ]
    for p in pros:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {p}", styles["pro"]))

    story.append(Paragraph("Limitations", styles["h2"]))
    cons = [
        "Still runs on the local machine (but in a managed container)",
        "Requires Docker Desktop to be installed and running",
        "CPU inference still limited to ~5-15 FPS (improved but not blazing)",
        "No built-in tracking IDs (ByteTrack handled separately &mdash; already implemented)",
    ]
    for c in cons:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {c}", styles["con"]))

    story.append(Paragraph("<b>Implementation Effort:</b> Low &mdash; primarily refactor video_streamer.py to call an HTTP API instead of importing YOLO directly.", styles["body"]))

    story.append(PageBreak())

    # ── 4. OPTION 2: ROBOFLOW CLOUD ──
    story.append(Paragraph("4. Option 2: Roboflow Hosted Cloud API", styles["h1"]))
    story.append(hr())
    story.append(Paragraph(
        "Send video frames to Roboflow's cloud servers via REST API. Their GPUs run inference and return "
        "bounding box JSON. The local video_streamer.py draws boxes on frames and serves the MJPEG stream.", styles["body"]
    ))
    story.append(Paragraph("Architecture", styles["h2"]))
    story.append(arch_diagram([
        "video_streamer.py reads video frames",
        "    |",
        "    v",
        "POST frame (base64) --> api.roboflow.com --> Detection JSON",
        "    |",
        "    v",
        "Draw boxes on frame, serve MJPEG stream",
    ]))
    story.append(Paragraph("Pricing", styles["h2"]))
    story.append(make_table(
        ["Plan", "Monthly Cost", "Inferences/Month", "Video Time at 10 FPS"],
        [
            ["Free", "$0", "~1,000-10,000 credits", "~2-15 minutes"],
            ["Starter", "$49", "100,000 credits", "~2.7 hours"],
            ["Growth", "$299", "500,000 credits", "~13.8 hours"],
        ],
        col_widths=[1.2*inch, 1.2*inch, 1.8*inch, 2.3*inch]
    ))
    story.append(Paragraph("Advantages", styles["h2"]))
    for p in ["Zero local compute &mdash; machine just reads video and draws boxes",
              "Fast cloud GPU inference", "Easy setup (REST API calls)",
              "Real-time video feed preserved"]:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {p}", styles["pro"]))
    story.append(Paragraph("Limitations", styles["h2"]))
    for c in ["Free tier extremely limited (~2-15 min/month)",
              "Requires constant internet connection",
              "Network latency: 100-300ms/frame = max 3-5 FPS real-time",
              "Paid plans expensive for continuous use",
              "API key management required"]:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {c}", styles["con"]))
    story.append(Paragraph("<b>Implementation Effort:</b> Low-Medium", styles["body"]))

    # ── 5. OPTION 3: REPLICATE ──
    story.append(Paragraph("5. Option 3: Replicate API (Cloud YOLO)", styles["h1"]))
    story.append(hr())
    story.append(Paragraph(
        "Use Replicate's hosted model infrastructure to run YOLO-World or custom YOLO models via their API. "
        "Pay-per-inference with no monthly minimums.", styles["body"]
    ))
    story.append(Paragraph("Pricing", styles["h2"]))
    story.append(make_table(
        ["Metric", "Cost"],
        [
            ["Per inference", "~$0.001"],
            ["1 minute of video (10 FPS)", "$0.60"],
            ["1 hour of video", "$36.00"],
            ["Monthly minimum", "$0 (pay-as-you-go)"],
        ],
        col_widths=[3*inch, 3.5*inch]
    ))
    story.append(Paragraph("Advantages", styles["h2"]))
    for p in ["No local compute required", "Access to cutting-edge models (YOLO-World, SAM2)",
              "Pay only for what you use", "No minimum commitment"]:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {p}", styles["pro"]))
    story.append(Paragraph("Limitations", styles["h2"]))
    for c in ["Extremely expensive for real-time video ($36/hour)",
              "Higher latency due to cold starts",
              "Not practical for continuous real-time tracking",
              "Better suited for batch/offline processing"]:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {c}", styles["con"]))
    story.append(Paragraph("<b>Implementation Effort:</b> Low", styles["body"]))

    story.append(PageBreak())

    # ── 6. OPTION 4: PRE-PROCESS ──
    story.append(Paragraph("6. Option 4: Pre-Process Offline + Replay with Overlay", styles["h1"]))
    story.append(hr())
    badge2_data = [[Paragraph("BEST LONG-TERM", badge_style)]]
    badge2_t = Table(badge2_data, colWidths=[1.8*inch])
    badge2_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), PURPLE),
        ("ALIGN", (0, 0), (0, 0), "CENTER"),
        ("TOPPADDING", (0, 0), (0, 0), 6),
        ("BOTTOMPADDING", (0, 0), (0, 0), 6),
    ]))
    story.append(badge2_t)
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Process each video once at upload time. Store all tracking data (bounding boxes, IDs, timestamps) "
        "in a JSON file alongside the video. During playback, the frontend uses a native HTML5 &lt;video&gt; "
        "element with a &lt;canvas&gt; overlay that draws pre-computed bounding boxes frame-by-frame. "
        "This is how production surveillance analytics systems actually work.", styles["body"]
    ))
    story.append(Paragraph("Architecture", styles["h2"]))
    story.append(arch_diagram([
        "UPLOAD PHASE (one-time):",
        "  User uploads video --> Backend queues processing",
        "  --> Cloud API processes entire video (Roboflow/Replicate)",
        "  --> Store tracking JSON: video_library/[id]_tracking.json",
        "",
        "PLAYBACK PHASE (unlimited replays, zero compute):",
        "  Frontend &lt;video&gt; plays MP4 natively",
        "  Frontend &lt;canvas&gt; overlay reads tracking JSON",
        "  --> Draws bounding boxes per frame in real-time",
        "  --> Dashboard metrics loaded from pre-computed data",
    ]))
    story.append(Paragraph("Pricing", styles["h2"]))
    story.append(make_table(
        ["Provider", "Processing Cost", "30-sec Video", "Replays"],
        [
            ["Roboflow Free", "$0 (limited)", "Free", "Unlimited"],
            ["Roboflow Starter", "$49/mo (100K credits)", "~$0.01", "Unlimited"],
            ["Replicate", "~$0.001/frame", "~$0.30", "Unlimited"],
        ],
        col_widths=[1.5*inch, 2*inch, 1.5*inch, 1.5*inch]
    ))
    story.append(Paragraph("Advantages", styles["h2"]))
    for p in ["Cheapest long-term: process once, replay forever at zero cost",
              "No real-time compute needed during playback",
              "Buttery smooth playback (native HTML5 video, not MJPEG)",
              "Dashboard data is instant (pre-computed)",
              "Works offline after initial processing",
              "Most reliable &mdash; no streaming failures, no model loading delays",
              "Can use the BEST, slowest, most accurate models (no real-time constraint)"]:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {p}", styles["pro"]))
    story.append(Paragraph("Limitations", styles["h2"]))
    for c in ["Not truly real-time &mdash; replays pre-computed data",
              "Processing delay when uploading new videos (minutes)",
              "More complex frontend changes (video + canvas overlay)",
              "Does not support live webcam feeds"]:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {c}", styles["con"]))
    story.append(Paragraph("<b>Implementation Effort:</b> Medium-High", styles["body"]))

    # ── 7. OPTION 5: AWS ──
    story.append(Paragraph("7. Option 5: AWS Rekognition Video", styles["h1"]))
    story.append(hr())
    story.append(Paragraph(
        "Upload video to Amazon S3 and use Rekognition's Person Tracking API. Returns per-frame bounding "
        "boxes with unique tracking IDs. Enterprise-grade accuracy with built-in person pathing.", styles["body"]
    ))
    story.append(make_table(
        ["Metric", "Details"],
        [
            ["Free Tier", "60 minutes/month (first 12 months)"],
            ["Standard Rate", "$0.10 per minute of video"],
            ["Streaming Video", "$0.00817 per minute"],
            ["Person Tracking", "Included (built-in IDs, no ByteTrack needed)"],
        ],
        col_widths=[2.5*inch, 4*inch]
    ))
    story.append(Paragraph("<b>Verdict:</b> Overkill for a demo project. Batch-only processing, requires full AWS setup (IAM, S3, Lambda), and no real-time streaming capability.", styles["body"]))

    # ── 8. OPTION 6: GOOGLE ──
    story.append(Paragraph("8. Option 6: Google Cloud Video Intelligence", styles["h1"]))
    story.append(hr())
    story.append(Paragraph(
        "Similar to AWS Rekognition. Upload video to Google Cloud Storage, process with Video Intelligence API. "
        "Unique advantage: detects body landmarks (pose estimation) and clothing attributes (color, type).", styles["body"]
    ))
    story.append(make_table(
        ["Metric", "Details"],
        [
            ["Person Detection Rate", "~$0.10 per minute"],
            ["Pose Estimation", "Available (body landmarks)"],
            ["Clothing Detection", "Available (color + type)"],
            ["Processing Mode", "Batch only (not real-time)"],
        ],
        col_widths=[2.5*inch, 4*inch]
    ))
    story.append(Paragraph("<b>Verdict:</b> Same limitations as AWS. Interesting pose/clothing features but requires full GCP setup and is batch-only.", styles["body"]))

    story.append(PageBreak())

    # ── 9. COMPARISON MATRIX ──
    story.append(Paragraph("9. Comparison Matrix", styles["h1"]))
    story.append(hr())
    story.append(make_table(
        ["Criteria", "Roboflow\nDocker", "Roboflow\nCloud", "Replicate", "Pre-Process\n+ Replay", "AWS\nRekognition", "Google\nVideo AI"],
        [
            ["Monthly Cost", "$0", "$0-299", "Pay/use", "$0-49", "$0-$$", "$0-$$"],
            ["Real-Time Feed", "Yes", "Yes*", "No", "Replay", "No", "No"],
            ["FPS (approx)", "5-15", "3-5", "N/A", "30+", "N/A", "N/A"],
            ["Reliability", "High", "Medium", "Medium", "Highest", "High", "High"],
            ["Offline Support", "Yes", "No", "No", "Yes**", "No", "No"],
            ["Setup Effort", "Low", "Low", "Low", "Med-High", "High", "High"],
            ["UI Changes", "None", "None", "None", "Moderate", "Major", "Major"],
            ["Tracking IDs", "ByteTrack", "ByteTrack", "Varies", "Pre-computed", "Built-in", "Built-in"],
        ],
        col_widths=[1.1*inch, 0.85*inch, 0.85*inch, 0.85*inch, 0.95*inch, 0.95*inch, 0.95*inch]
    ))
    story.append(Spacer(1, 6))
    story.append(Paragraph("* Limited by network latency &nbsp;&nbsp; ** After initial cloud processing", styles["caption"]))

    story.append(PageBreak())

    # ── 10. RECOMMENDATION ──
    story.append(Paragraph("10. Recommendation &amp; Roadmap", styles["h1"]))
    story.append(hr())

    # Recommendation box
    rec_data = [[Paragraph(
        "<b>Primary Recommendation: Option 1 (Roboflow Docker)</b><br/>"
        "<b>Long-Term Upgrade: Option 4 (Pre-Process + Replay)</b>",
        ParagraphStyle("rec", fontName="Helvetica-Bold", fontSize=12, textColor=white, leading=18)
    )]]
    rec_t = Table(rec_data, colWidths=[6.5*inch])
    rec_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), ACCENT_BLUE),
        ("TOPPADDING", (0, 0), (0, 0), 14),
        ("BOTTOMPADDING", (0, 0), (0, 0), 14),
        ("LEFTPADDING", (0, 0), (0, 0), 16),
    ]))
    story.append(rec_t)
    story.append(Spacer(1, 16))

    story.append(Paragraph("Phase 1: This Week &mdash; Roboflow Docker Container", styles["h2"]))
    story.append(Paragraph(
        "The Roboflow Inference Server running in Docker is the clear winner for immediate deployment. "
        "It is completely free, requires no API keys, works offline, and needs minimal code changes. "
        "The video_streamer.py simply swaps its YOLO import for an HTTP POST to the local container. "
        "The existing MJPEG streaming, zone overlays, ByteTrack tracking, and dashboard integration "
        "remain completely unchanged. If Docker Desktop is installed, implementation takes approximately "
        "30 minutes.", styles["rec_body"]
    ))

    story.append(Paragraph("Phase 2: Future Polish &mdash; Pre-Process + Replay", styles["h2"]))
    story.append(Paragraph(
        "For a production-grade experience, the pre-process approach is the gold standard. Each video "
        "is processed once using a cloud API (Roboflow free tier handles 15-30 videos/month), and the "
        "tracking data is stored alongside the video file. During playback, the frontend uses native "
        "HTML5 video with a canvas overlay &mdash; resulting in buttery smooth 30+ FPS playback with "
        "perfect tracking data and instant dashboard metrics. This is how commercial surveillance "
        "analytics systems operate.", styles["rec_body"]
    ))

    story.append(Paragraph("What We Do NOT Recommend", styles["h2"]))
    story.append(Paragraph(
        "<b>Cloud API for real-time inference (Options 2/3):</b> Network latency limits real-time performance "
        "to 3-5 FPS at best, and costs escalate quickly. Replicate at $36/hour is prohibitively expensive "
        "for continuous video processing.", styles["body"]
    ))
    story.append(Paragraph(
        "<b>Enterprise cloud services (Options 5/6):</b> AWS Rekognition and Google Video Intelligence "
        "are batch-only services designed for enterprise workflows. They require significant infrastructure "
        "setup (IAM roles, S3 buckets, Lambda functions) and provide no real-time streaming capability. "
        "Overkill complexity for a demo/portfolio project.", styles["body"]
    ))

    story.append(PageBreak())

    # ── 11. IMPLEMENTATION PLAN ──
    story.append(Paragraph("11. Implementation Plan (Phase 1)", styles["h1"]))
    story.append(hr())

    story.append(Paragraph("Prerequisites", styles["h2"]))
    story.append(Paragraph("<bullet>&bull;</bullet> Install Docker Desktop for Windows", styles["bullet"]))
    story.append(Paragraph("<bullet>&bull;</bullet> Ensure ports 8000, 8001, 5173, 9001 are available", styles["bullet"]))

    story.append(Paragraph("Step 1: Start Roboflow Inference Container", styles["h2"]))
    story.append(Paragraph("docker run -d -p 9001:9001 roboflow/roboflow-inference-server-cpu", styles["code"]))

    story.append(Paragraph("Step 2: Modify video_streamer.py", styles["h2"]))
    story.append(Paragraph("<bullet>&bull;</bullet> Remove <font face='Courier'>from ultralytics import YOLO</font> and local model loading", styles["bullet"]))
    story.append(Paragraph("<bullet>&bull;</bullet> Add HTTP calls to <font face='Courier'>http://localhost:9001/infer</font> with frame data", styles["bullet"]))
    story.append(Paragraph("<bullet>&bull;</bullet> Keep existing frame reading, box drawing, MJPEG serving, and zone logic", styles["bullet"]))
    story.append(Paragraph("<bullet>&bull;</bullet> Keep ByteTrack tracking (runs independently from detection)", styles["bullet"]))

    story.append(Paragraph("Step 3: Update Backend (main.py)", styles["h2"]))
    story.append(Paragraph("<bullet>&bull;</bullet> Remove venv/subprocess launching complexity", styles["bullet"]))
    story.append(Paragraph("<bullet>&bull;</bullet> video_streamer.py becomes a lightweight script (no heavy ML deps)", styles["bullet"]))
    story.append(Paragraph("<bullet>&bull;</bullet> Can run with system Python instead of a dedicated virtual environment", styles["bullet"]))

    story.append(Paragraph("Step 4: Add to docker-compose.yml", styles["h2"]))
    story.append(Paragraph("<bullet>&bull;</bullet> Add Roboflow inference service alongside existing services", styles["bullet"]))
    story.append(Paragraph("<bullet>&bull;</bullet> Enable one-command startup: <font face='Courier'>docker-compose up</font>", styles["bullet"]))

    story.append(Paragraph("Files to Modify", styles["h2"]))
    story.append(make_table(
        ["File", "Changes"],
        [
            ["edge_agent/video_streamer.py", "Replace YOLO import with HTTP calls to Roboflow container"],
            ["backend/main.py", "Simplify subprocess spawning (no venv dependency)"],
            ["docker-compose.yml", "Add Roboflow inference service definition"],
        ],
        col_widths=[2.5*inch, 4*inch]
    ))

    story.append(Paragraph("Verification", styles["h2"]))
    story.append(Paragraph("<bullet>&bull;</bullet> Puppeteer screenshots showing video feed with tracking boxes", styles["bullet"]))
    story.append(Paragraph("<bullet>&bull;</bullet> Test 3+ different videos from the library", styles["bullet"]))
    story.append(Paragraph("<bullet>&bull;</bullet> Verify dashboard metrics update in real-time", styles["bullet"]))
    story.append(Paragraph("<bullet>&bull;</bullet> Test video upload and delete functionality", styles["bullet"]))

    story.append(PageBreak())

    # ── 12. SOURCES ──
    story.append(Paragraph("12. Sources &amp; References", styles["h1"]))
    story.append(hr())
    sources = [
        ("Roboflow Pricing", "https://roboflow.com/pricing"),
        ("Roboflow Inference Server (GitHub)", "https://github.com/roboflow/inference"),
        ("Roboflow Docker Deployment Guide", "https://inference.roboflow.com/quickstart/docker/"),
        ("Roboflow Credits System", "https://roboflow.com/credits"),
        ("YOLO26 Announcement (Roboflow Blog)", "https://blog.roboflow.com/yolo26/"),
        ("Replicate YOLO-World Model", "https://replicate.com/zsxkib/yolo-world"),
        ("Replicate Pricing", "https://replicate.com/pricing"),
        ("AWS Rekognition Pricing", "https://aws.amazon.com/rekognition/pricing/"),
        ("AWS Rekognition Video Features", "https://aws.amazon.com/rekognition/video-features/"),
        ("Google Cloud Video Intelligence Pricing", "https://cloud.google.com/video-intelligence/pricing"),
        ("Google Cloud Person Detection Docs", "https://docs.cloud.google.com/video-intelligence/docs/feature-person-detection"),
        ("Hugging Face Inference Pricing", "https://huggingface.co/pricing"),
    ]
    for title, url in sources:
        story.append(Paragraph(f"<bullet>&bull;</bullet> <b>{title}</b><br/>&nbsp;&nbsp;&nbsp;&nbsp;<font color='#3b82f6'>{url}</font>", styles["bullet"]))

    story.append(Spacer(1, 36))
    story.append(HRFlowable(width="100%", thickness=1, color=HexColor("#e2e8f0")))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Project Janus &mdash; Cloud-Based Person Tracking Proposal &mdash; v1.0 &mdash; February 2026", styles["footer"]))
    story.append(Paragraph("Prepared by Claude Code for Moonlight Analytica", styles["footer"]))

    # Build
    doc.build(story)
    print(f"PDF generated: {output_path}")
    return output_path

if __name__ == "__main__":
    build_pdf()
