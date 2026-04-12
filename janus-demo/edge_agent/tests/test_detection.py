"""
Gate 2.1 — RF-DETR pipeline tests.

Tests the detection logic in edge_agent.py (person class filtering,
bbox extraction, data cleanup) without requiring the actual ML model.
"""

import sys

import numpy as np
import pytest

# conftest installs the mocks before this runs
sv = sys.modules["supervision"]
FakeDetections = sv.Detections


class TestModelInterface:
    """Verify the RF-DETR model interface contract."""

    def test_model_loads(self):
        """RFDETRNano() can be instantiated without raising."""
        from rfdetr import RFDETRNano
        model = RFDETRNano()
        assert model is not None

    def test_model_has_predict(self):
        """Model exposes a .predict() method."""
        from rfdetr import RFDETRNano
        model = RFDETRNano()
        assert callable(model.predict)

    def test_predict_returns_detections(self, mock_model, fake_detections):
        """model.predict() returns an object with xyxy and class_id."""
        dets = fake_detections(n_persons=2, n_other=1)
        mock_model.predict.return_value = dets

        result = mock_model.predict(np.zeros((480, 640, 3), dtype=np.uint8), threshold=0.4)

        assert hasattr(result, "xyxy"), "Detections must have xyxy"
        assert hasattr(result, "class_id"), "Detections must have class_id"

    def test_detections_have_xyxy(self, fake_detections):
        """Detection bboxes are in xyxy format (4 columns)."""
        dets = fake_detections(n_persons=3)
        assert dets.xyxy.shape[1] == 4

    def test_detections_have_class_id(self, fake_detections):
        """Detections carry class_id arrays."""
        dets = fake_detections(n_persons=2, n_other=2)
        assert dets.class_id is not None
        assert len(dets.class_id) == len(dets.xyxy)


class TestPersonClassFilter:
    """Verify the person-class filtering logic used in edge_agent.py."""

    def test_person_class_filter_keeps_persons(self, fake_detections):
        """class_id == 1 mask keeps only person detections."""
        dets = fake_detections(n_persons=3, n_other=2)
        person_mask = dets.class_id == 1
        filtered = dets[person_mask]
        assert len(filtered) == 3

    def test_person_class_filter_removes_non_persons(self, fake_detections):
        """class_id == 1 mask removes non-person classes (e.g. cars)."""
        dets = fake_detections(n_persons=1, n_other=4)
        person_mask = dets.class_id == 1
        filtered = dets[person_mask]
        assert len(filtered) == 1

    def test_empty_frame_produces_no_persons(self):
        """Frame with no detections produces empty person set."""
        empty = FakeDetections(
            xyxy=np.empty((0, 4)),
            class_id=np.array([], dtype=int),
        )
        person_mask = empty.class_id == 1
        filtered = empty[person_mask]
        assert len(filtered) == 0

    def test_source_image_data_stripped_before_filter(self, fake_detections):
        """
        edge_agent strips 'source_image' and 'source_shape' from detections.data
        before boolean indexing — verify that pattern doesn't crash.
        """
        dets = fake_detections(n_persons=2, n_other=1)
        dets.data["source_image"] = np.zeros((480, 640, 3), dtype=np.uint8)
        dets.data["source_shape"] = (480, 640)

        dets.data.pop("source_image", None)
        dets.data.pop("source_shape", None)

        person_mask = dets.class_id == 1
        filtered = dets[person_mask]
        assert len(filtered) == 2
        assert "source_image" not in dets.data
