"""Timing invariants; runs without MLX or model downloads."""
import unittest

from transcribe import chunk_ranges, prepare_cues, timestamp


class TimingTests(unittest.TestCase):
    def test_chunks_cover_source_without_gaps(self):
        ranges = list(chunk_ranges(95, 30, [25, 52, 80]))
        self.assertEqual(ranges, [(0, 25), (25, 52), (52, 80), (80, 95)])
        self.assertEqual(list(chunk_ranges(65, 30, [])), [(0, 30), (30, 60), (60, 65)])
        self.assertEqual(list(chunk_ranges(65, 0, [])), [(0, 65)])

    def test_offsets_clipping_and_invalid_segments(self):
        cues, warnings = prepare_cues([{"start": 25, "end": 50, "segments": [
            {"start": 1, "end": 2, "text": "Hello"},
            {"start": 24, "end": 29, "text": "End"},
            {"start": 25, "end": 25, "text": "Artifact"},
        ]}], 50)
        self.assertEqual(cues, [(26000, 27000, "Hello"), (49000, 50000, "End")])
        self.assertTrue(any("clipped" in w["reason"] for w in warnings))
        self.assertTrue(any("nonpositive" in w["reason"] for w in warnings))

    def test_repetition_flagged_without_deleting_dialogue(self):
        cues, warnings = prepare_cues([{"start": 0, "end": 5, "segments": [
            {"start": i, "end": i + 1, "text": "Oh!"} for i in range(3)
        ]}], 5)
        self.assertEqual(len(cues), 3)
        self.assertTrue(any("repeated" in w["reason"] for w in warnings))
        self.assertEqual(timestamp(3600001), "01:00:00,001")


if __name__ == "__main__":
    unittest.main()
