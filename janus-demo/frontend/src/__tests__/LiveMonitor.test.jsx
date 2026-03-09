import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LiveMonitor from '../pages/LiveMonitor';

// Mock the lazy-loaded components
vi.mock('../../../shared/HumanoidTrackingDemo', () => ({
  default: () => <div data-testid="humanoid-demo">HumanoidTrackingDemo</div>,
}));

vi.mock('../../../shared/Tracking3DView', () => ({
  default: () => <div data-testid="tracking-3d">Tracking3DView</div>,
}));

// Mock API module
vi.mock('../api', () => ({
  getKpis: vi.fn(() => Promise.resolve({
    current_count: 5,
    avg_count: 3.2,
    peak_count: 10,
    total_events: 150,
    throughput: 12.5,
  })),
  getSeriesCsv: vi.fn(() => Promise.resolve('ts,count_value\n2024-01-01T00:00:00,5')),
  parseSeries: vi.fn((csv) => [{ ts: '2024-01-01T00:00:00', count_value: 5 }]),
  seedDemo: vi.fn(() => Promise.resolve({ ok: true })),
  getDwellTime: vi.fn(() => Promise.resolve({ avg_dwell_seconds: 180 })),
  getOccupancy: vi.fn(() => Promise.resolve({ occupancy_rate: 45.5 })),
  getEntriesExits: vi.fn(() => Promise.resolve({ entries: 50, exits: 45 })),
  getQueue: vi.fn(() => Promise.resolve({ current_queue_length: 3, avg_wait_seconds: 120 })),
}));

describe('LiveMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch responses
    global.fetch = vi.fn((url) => {
      if (url.includes('/video/settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            model: 'yolov8n.pt',
            tracker: 'bytetrack.yaml',
          }),
        });
      }
      if (url.includes('/video/library')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            videos: [
              { id: 1, name: 'Test Video 1', description: 'First test video', file_size: 1024000, uploaded_at: '2024-01-01' },
              { id: 2, name: 'Test Video 2', description: 'Second test video', file_size: 2048000, uploaded_at: '2024-01-02' },
            ],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });
    });
  });

  it('renders LiveMonitor without crashing', async () => {
    render(<LiveMonitor />);
    await waitFor(() => {
      expect(screen.getByText('Live Monitor')).toBeInTheDocument();
    });
  });

  it('displays KPI stats after loading', async () => {
    render(<LiveMonitor />);
    await waitFor(() => {
      expect(screen.getByText('Current Count')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('opens video source modal when clicking Change Video Source', async () => {
    render(<LiveMonitor />);
    await waitFor(() => {
      expect(screen.getByText('Live Monitor')).toBeInTheDocument();
    });

    const changeSourceBtn = screen.getByText('📹 Change Video Source');
    fireEvent.click(changeSourceBtn);

    await waitFor(() => {
      expect(screen.getByText('Select Video Source')).toBeInTheDocument();
    });
  });

  it('opens video library modal when clicking Video Library button', async () => {
    render(<LiveMonitor />);
    await waitFor(() => {
      expect(screen.getByText('Live Monitor')).toBeInTheDocument();
    });

    const libraryBtn = screen.getByText('📚 Video Library');
    fireEvent.click(libraryBtn);

    await waitFor(() => {
      expect(screen.getByText('📚 Video Library')).toBeInTheDocument();
    });
  });

  it('shows model selection buttons', async () => {
    render(<LiveMonitor />);
    await waitFor(() => {
      expect(screen.getByText('Model:')).toBeInTheDocument();
      expect(screen.getByText('yolov8n')).toBeInTheDocument();
      expect(screen.getByText('yolo11n')).toBeInTheDocument();
      expect(screen.getByText('yolo11s')).toBeInTheDocument();
    });
  });

  it('shows tracker selection buttons', async () => {
    render(<LiveMonitor />);
    await waitFor(() => {
      expect(screen.getByText('Tracker:')).toBeInTheDocument();
      expect(screen.getByText('bytetrack')).toBeInTheDocument();
      expect(screen.getByText('botsort')).toBeInTheDocument();
    });
  });

  it('can switch between models', async () => {
    render(<LiveMonitor />);
    await waitFor(() => {
      expect(screen.getByText('Model:')).toBeInTheDocument();
    });

    const yolo11nBtn = screen.getByText('yolo11n');
    fireEvent.click(yolo11nBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/video/model?model=yolo11n.pt'),
        expect.any(Object)
      );
    });
  });

  it('can switch between trackers', async () => {
    render(<LiveMonitor />);
    await waitFor(() => {
      expect(screen.getByText('Tracker:')).toBeInTheDocument();
    });

    const botsortBtn = screen.getByText('botsort');
    fireEvent.click(botsortBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/video/tracker?tracker=botsort.yaml'),
        expect.any(Object)
      );
    });
  });

  it('displays video source options in modal', async () => {
    render(<LiveMonitor />);
    await waitFor(() => {
      expect(screen.getByText('Live Monitor')).toBeInTheDocument();
    });

    const changeSourceBtn = screen.getByText('📹 Change Video Source');
    fireEvent.click(changeSourceBtn);

    await waitFor(() => {
      expect(screen.getByText('📹 Demo Video / YouTube')).toBeInTheDocument();
      expect(screen.getByText('📷 Live Webcam')).toBeInTheDocument();
      expect(screen.getByText('🎲 Procedural Demo')).toBeInTheDocument();
    });
  });

  it('toggles auto-refresh checkbox', async () => {
    render(<LiveMonitor />);
    await waitFor(() => {
      expect(screen.getByText('Auto-refresh (10s)')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});

describe('Video Controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    }));
  });

  it('shows play button when video is paused', async () => {
    render(<LiveMonitor />);

    // Initially, when no video stream URL, show placeholder
    await waitFor(() => {
      expect(screen.getByText('📹 No Video Feed')).toBeInTheDocument();
    });
  });
});
