package analytics

import (
	"encoding/json"
	"math"
	"os"
	"testing"
)

func TestProductRetrievalContractV2(t *testing.T) {
	data, err := os.ReadFile("../../../../evaluation/retrieval-binary-v2.json")
	if err != nil {
		t.Fatal(err)
	}
	var contract struct {
		Contract string `json:"contract"`
		Fixtures []struct {
			Name      string   `json:"name"`
			Retrieved []string `json:"retrieved"`
			Relevant  []string `json:"relevant"`
			K         int      `json:"k"`
			Recall    float64  `json:"recall"`
			MRR       float64  `json:"mrr"`
			NDCG      float64  `json:"ndcg"`
		} `json:"fixtures"`
	}
	if err := json.Unmarshal(data, &contract); err != nil {
		t.Fatal(err)
	}
	if contract.Contract != MetricContract {
		t.Fatal("Metric contract is not pinned")
	}
	for _, f := range contract.Fixtures {
		t.Run(f.Name, func(t *testing.T) {
			actual := []float64{CalculateRecallAtK(f.Retrieved, f.Relevant, f.K), CalculateMRR(f.Retrieved, f.Relevant), CalculateNDCG(f.Retrieved, f.Relevant)}
			expected := []float64{f.Recall, f.MRR, f.NDCG}
			for i, value := range actual {
				if math.Abs(value-expected[i]) > 1e-12 || value < 0 || value > 1 || math.IsNaN(value) {
					t.Fatalf("metric %d = %.16f, expected %.16f", i, value, expected[i])
				}
			}
		})
	}
}
