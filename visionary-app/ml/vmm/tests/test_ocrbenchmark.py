"""VOCR-02 (KAN-193) — OCR benchmark harness contracts (synthetic engines)."""
import unittest

from vmm.ocrbenchmark import (
    SLICES,
    OcrBenchmarkError,
    OcrBenchmarkHarness,
    character_error_rate,
    word_accuracy,
)

CUSTODIAN = {"uid": "uid_custodian", "role": "custodian"}
RUNNER = {"uid": "uid_runner", "role": "runner"}

THRESHOLDS = {
    "print": {"maxCer": 0.05, "minWordAccuracy": 0.95, "maxCorrectionRate": 0.2, "maxAbstentionRate": 0.1},
    "handwriting": {"maxCer": 0.25, "minWordAccuracy": 0.75, "maxCorrectionRate": 0.4, "maxAbstentionRate": 0.2},
    "camera": {"maxCer": 0.2, "minWordAccuracy": 0.8, "maxCorrectionRate": 0.3, "maxAbstentionRate": 0.2},
    "layout": {"maxCer": 0.15, "minWordAccuracy": 0.85, "maxCorrectionRate": 0.3, "maxAbstentionRate": 0.2},
    "formula": {"maxCer": 0.3, "minWordAccuracy": 0.7, "maxCorrectionRate": 0.5, "maxAbstentionRate": 0.3},
    "table": {"maxCer": 0.2, "minWordAccuracy": 0.8, "maxCorrectionRate": 0.4, "maxAbstentionRate": 0.2},
}

EXPECTED = "Force equals mass times acceleration"


class GoodEngine:
    version = "good-1"

    @staticmethod
    def invoke(case):
        return {"text": EXPECTED, "abstained": False, "latencyMs": 400, "costUsd": 0.002, "corrected": False}


class SloppyEngine:
    """Small OCR errors; one handwriting case corrected (rate within bounds)."""

    _corrected_seen = 0

    @staticmethod
    def invoke(case):
        if case["slice"] == "handwriting":
            SloppyEngine._corrected_seen += 1
            corrected = SloppyEngine._corrected_seen == 1  # only 1 of 3 corrected
            return {"text": "Force equals mass times accelartion", "abstained": False, "latencyMs": 900, "costUsd": 0.003, "corrected": corrected}
        if case["slice"] == "formula":
            return {"text": "", "abstained": True, "latencyMs": 100, "costUsd": 0.0, "corrected": False}
        return {"text": EXPECTED, "abstained": False, "latencyMs": 500, "costUsd": 0.002, "corrected": False}


class BadEngine:
    """Large errors, no corrections, over-abstention on print."""

    @staticmethod
    def invoke(case):
        if case["slice"] == "print":
            return {"text": "totally wrong output text", "abstained": False, "latencyMs": 100, "costUsd": 0.001, "corrected": False}
        if case["slice"] in ("handwriting", "camera"):
            return {"text": "", "abstained": True, "latencyMs": 50, "costUsd": 0.0, "corrected": False}
        return {"text": "Force equals mass times acceleration", "abstained": False, "latencyMs": 100, "costUsd": 0.001, "corrected": False}


def cases_for(slices, per_slice=3):
    cases = []
    index = 0
    for slice_name in slices:
        for _ in range(per_slice):
            index += 1
            cases.append({
                "caseId": f"case-{index}",
                "slice": slice_name,
                "expectedText": EXPECTED,
                "correctionProbe": False,
            })
    return cases


def harness(engine):
    h = OcrBenchmarkHarness("ocr-bench-1")
    h.preregister(CUSTODIAN, THRESHOLDS)
    h.measure(RUNNER, engine, cases_for(SLICES))
    return h


class MetricContracts(unittest.TestCase):
    def test_cer_and_word_accuracy_are_exact_for_clean_text(self):
        self.assertEqual(character_error_rate(EXPECTED, EXPECTED), 0.0)
        self.assertEqual(word_accuracy(EXPECTED, EXPECTED), 1.0)

    def test_cer_counts_edits(self):
        self.assertEqual(character_error_rate("mas", "mass"), round(1 / 3, 6))  # 1 insert / 3 chars
        self.assertGreater(character_error_rate("totally wrong", EXPECTED), 1.0)

    def test_word_accuracy_penalizes_word_errors(self):
        self.assertEqual(word_accuracy("Force equals mas times acceleration", EXPECTED), 0.8)


class HarnessContracts(unittest.TestCase):
    def test_preregistration_is_custodian_only_and_must_precede_measurement(self):
        h = OcrBenchmarkHarness("b1")
        with self.assertRaises(OcrBenchmarkError):
            h.preregister(RUNNER, THRESHOLDS)
        h.preregister(CUSTODIAN, THRESHOLDS)
        with self.assertRaises(OcrBenchmarkError):
            h.preregister(CUSTODIAN, THRESHOLDS)
        h.measure(RUNNER, GoodEngine(), cases_for(["print"]))  # registered harness measures fine
        h2 = OcrBenchmarkHarness("b2")
        with self.assertRaises(OcrBenchmarkError):
            h2.measure(RUNNER, GoodEngine(), cases_for(["print"]))  # no thresholds yet

    def test_thresholds_must_cover_all_named_slices(self):
        h = OcrBenchmarkHarness("b3")
        with self.assertRaises(OcrBenchmarkError):
            h.preregister(CUSTODIAN, {k: v for k, v in THRESHOLDS.items() if k != "table"})


class VerdictContracts(unittest.TestCase):
    def test_good_engine_qualifies_on_every_slice(self):
        h = harness(GoodEngine())
        report = h.report(CUSTODIAN)
        self.assertTrue(report["overallQualified"])
        for slice_report in report["slices"]:
            self.assertTrue(slice_report["qualified"], slice_report["slice"])
            self.assertEqual(slice_report["downstreamErrorCount"], 0)

    def test_sloppy_engine_qualifies_via_corrections_within_bounds(self):
        h = harness(SloppyEngine())
        report = h.report(CUSTODIAN)
        handwriting = next(s for s in report["slices"] if s["slice"] == "handwriting")
        self.assertGreater(handwriting["correctionRate"], 0.0, "corrections reported per slice")
        self.assertTrue(handwriting["qualified"], "bounded handwriting errors with corrections stay within thresholds")

    def test_bad_engine_fails_print_and_abstention_slices(self):
        h = harness(BadEngine())
        report = h.report(CUSTODIAN)
        self.assertFalse(report["overallQualified"])
        print_slice = next(s for s in report["slices"] if s["slice"] == "print")
        self.assertFalse(print_slice["qualified"])
        self.assertGreater(print_slice["meanCer"], 0.5)
        handwriting = next(s for s in report["slices"] if s["slice"] == "handwriting")
        self.assertGreater(handwriting["abstentionRate"], 0.1, "over-abstention caught")

    def test_downstream_errors_reported(self):
        h = harness(BadEngine())
        report = h.report(CUSTODIAN)
        print_slice = next(s for s in report["slices"] if s["slice"] == "print")
        self.assertGreater(print_slice["downstreamErrorCount"], 0, "downstream propagation reported")

    def test_report_is_custodian_only_and_measurement_requires_preregistration(self):
        h = OcrBenchmarkHarness("b4")
        with self.assertRaises(OcrBenchmarkError):
            h.report(CUSTODIAN)
        h.preregister(CUSTODIAN, THRESHOLDS)
        h.measure(RUNNER, GoodEngine(), cases_for(SLICES))
        with self.assertRaises(OcrBenchmarkError):
            h.report(RUNNER)


if __name__ == "__main__":
    unittest.main()
