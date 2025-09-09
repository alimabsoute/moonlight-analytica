class PaintApp {
    constructor() {
        this.canvas = document.getElementById('paint-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.isPanning = false;
        this.currentTool = 'brush';
        this.brushSize = 5;
        this.brushColor = '#000000';
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.panStartX = 0;
        this.panStartY = 0;

        this.initializeCanvas();
        this.setupEventListeners();
        this.setupTools();
    }

    initializeCanvas() {
        // Set canvas size
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Set initial canvas properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

        // Keyboard events for pasting
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('paste', this.handlePaste.bind(this));

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Mouse coordinates tracking
        this.canvas.addEventListener('mousemove', this.updateCoordinates.bind(this));

        // Wheel event for zooming
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    }

    setupTools() {
        // Tool buttons
        document.getElementById('brush-tool').addEventListener('click', () => this.setTool('brush'));
        document.getElementById('eraser-tool').addEventListener('click', () => this.setTool('eraser'));

        // Color picker
        document.getElementById('color-picker').addEventListener('change', (e) => {
            this.brushColor = e.target.value;
        });

        // Brush size
        const brushSizeSlider = document.getElementById('brush-size');
        const sizeDisplay = document.getElementById('size-display');
        brushSizeSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            sizeDisplay.textContent = this.brushSize;
        });

        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('reset-zoom').addEventListener('click', () => this.resetZoom());

        // Clear canvas
        document.getElementById('clear-btn').addEventListener('click', () => this.clearCanvas());

        // Image upload
        document.getElementById('upload-btn').addEventListener('click', () => {
            document.getElementById('file-input').click();
        });
        
        document.getElementById('file-input').addEventListener('change', this.handleFileUpload.bind(this));

        // Paste button
        document.getElementById('paste-btn').addEventListener('click', this.requestClipboardAccess.bind(this));
    }

    setTool(tool) {
        this.currentTool = tool;
        
        // Update UI
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`${tool}-tool`).classList.add('active');
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.panX) / this.zoom;
        const y = (e.clientY - rect.top - this.panY) / this.zoom;

        if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            // Middle mouse or Ctrl+click for panning
            this.isPanning = true;
            this.panStartX = e.clientX - this.panX;
            this.panStartY = e.clientY - this.panY;
            this.canvas.style.cursor = 'grabbing';
        } else if (e.button === 0) {
            // Left mouse for drawing
            this.isDrawing = true;
            this.lastX = x;
            this.lastY = y;
        }
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.panX) / this.zoom;
        const y = (e.clientY - rect.top - this.panY) / this.zoom;

        if (this.isPanning) {
            this.panX = e.clientX - this.panStartX;
            this.panY = e.clientY - this.panStartY;
            this.applyTransform();
        } else if (this.isDrawing) {
            this.draw(x, y);
        }
    }

    handleMouseUp(e) {
        this.isDrawing = false;
        this.isPanning = false;
        this.canvas.style.cursor = 'crosshair';
    }

    draw(x, y) {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for drawing

        this.ctx.globalCompositeOperation = this.currentTool === 'eraser' ? 'destination-out' : 'source-over';
        this.ctx.strokeStyle = this.currentTool === 'eraser' ? 'rgba(0,0,0,1)' : this.brushColor;
        this.ctx.lineWidth = this.brushSize;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        this.lastX = x;
        this.lastY = y;

        this.ctx.restore();
    }

    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoomFactor = 0.1;
        const newZoom = this.zoom + wheel * zoomFactor;

        if (newZoom >= 0.1 && newZoom <= 5) {
            const zoomChange = newZoom / this.zoom;
            
            this.panX = mouseX - (mouseX - this.panX) * zoomChange;
            this.panY = mouseY - (mouseY - this.panY) * zoomChange;
            
            this.zoom = newZoom;
            this.updateZoomDisplay();
            this.applyTransform();
        }
    }

    zoomIn() {
        if (this.zoom < 5) {
            this.zoom += 0.2;
            this.updateZoomDisplay();
            this.applyTransform();
        }
    }

    zoomOut() {
        if (this.zoom > 0.1) {
            this.zoom -= 0.2;
            this.updateZoomDisplay();
            this.applyTransform();
        }
    }

    resetZoom() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.updateZoomDisplay();
        this.applyTransform();
    }

    updateZoomDisplay() {
        document.getElementById('zoom-level').textContent = Math.round(this.zoom * 100) + '%';
    }

    applyTransform() {
        this.canvas.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }

    updateCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.round((e.clientX - rect.left - this.panX) / this.zoom);
        const y = Math.round((e.clientY - rect.top - this.panY) / this.zoom);
        document.getElementById('coordinates').textContent = `x: ${x}, y: ${y}`;
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
    }

    handleKeyDown(e) {
        // Ctrl+V for paste
        if (e.ctrlKey && e.key === 'v') {
            e.preventDefault();
            this.requestClipboardAccess();
        }
        
        // Space for pan mode
        if (e.code === 'Space') {
            e.preventDefault();
            this.canvas.style.cursor = 'grab';
        }
    }

    async requestClipboardAccess() {
        try {
            const clipboardItems = await navigator.clipboard.read();
            
            for (const clipboardItem of clipboardItems) {
                for (const type of clipboardItem.types) {
                    if (type.startsWith('image/')) {
                        const blob = await clipboardItem.getType(type);
                        this.pasteImage(blob);
                        return;
                    }
                }
            }
            
            alert('No image found in clipboard');
        } catch (err) {
            console.error('Failed to read clipboard:', err);
            alert('Unable to access clipboard. Please use the upload button or drag and drop.');
        }
    }

    handlePaste(e) {
        const items = e.clipboardData.items;
        
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith('image/')) {
                const blob = items[i].getAsFile();
                this.pasteImage(blob);
                break;
            }
        }
    }

    handleFileUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            this.pasteImage(file);
        }
    }

    pasteImage(blob) {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        
        img.onload = () => {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            
            // Calculate position to center the image
            const x = (this.canvas.width - img.width) / 2;
            const y = (this.canvas.height - img.height) / 2;
            
            // Draw the image
            this.ctx.drawImage(img, Math.max(0, x), Math.max(0, y));
            
            this.ctx.restore();
            URL.revokeObjectURL(url);
        };
        
        img.src = url;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PaintApp();
});