package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestGroundingUnavailableNeverReturnsSuccess(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	server.Close()
	result, err := NewNLIClient(server.URL).BatchValidateClaims(context.Background(), []string{"A synthetic claim."}, []string{"A synthetic source."})
	if err == nil || result != nil {
		t.Fatal("Unavailable NLI must return an error and no verified claims")
	}
}

func TestGroundingRejectsInvalidOrIncompleteServiceEvidence(t *testing.T) {
	good := `{"results":[{"claim":"claim","is_grounded":true,"grounding_score":0.9,"best_chunk_idx":0,"label":"entailment"}],"overall_grounding_score":1}`
	cases := map[string]string{
		"empty": `{}`, "missing-claim": `{"results":[],"overall_grounding_score":1}`,
		"wrong-claim":       strings.Replace(good, `"claim":"claim"`, `"claim":"other"`, 1),
		"invalid-score":     strings.Replace(good, `0.9`, `1.5`, 1),
		"missing-score":     strings.Replace(good, `"grounding_score":0.9,`, ``, 1),
		"missing-source":    strings.Replace(good, `"best_chunk_idx":0,`, ``, 1),
		"null-source":       strings.Replace(good, `"best_chunk_idx":0`, `"best_chunk_idx":null`, 1),
		"missing-decision":  strings.Replace(good, `"is_grounded":true,`, ``, 1),
		"missing-aggregate": strings.Replace(good, `,"overall_grounding_score":1`, ``, 1),
		"unknown-label":     strings.Replace(good, `entailment`, `unknown`, 1),
		"conflicting-label": strings.Replace(good, `entailment`, `contradiction`, 1),
		"wrong-source":      strings.Replace(good, `"best_chunk_idx":0`, `"best_chunk_idx":9`, 1),
		"fake-aggregate":    strings.Replace(good, `"overall_grounding_score":1`, `"overall_grounding_score":0`, 1),
		"oversized":         strings.Repeat("x", (1<<20)+1),
	}
	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.Write([]byte(body)) }))
			defer server.Close()
			result, err := NewNLIClient(server.URL).BatchValidateClaims(context.Background(), []string{"claim"}, []string{"source"})
			if err == nil || result != nil {
				t.Fatal("Invalid evidence was accepted")
			}
		})
	}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.Write([]byte(good)) }))
	defer server.Close()
	result, err := NewNLIClient(server.URL).BatchValidateClaims(context.Background(), []string{"claim"}, []string{"source"})
	if err != nil || result.OverallGroundingScore != 1 {
		t.Fatalf("Valid service result rejected: %v", err)
	}
}

func TestGroundingIncludesShortClaimsAndDoesNotVerifyEmptySentences(t *testing.T) {
	for _, empty := range []bool{false, true} {
		t.Run(map[bool]string{true: "empty", false: "short-formula"}[empty], func(t *testing.T) {
			batchCalls := 0
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if r.URL.Path == "/split-sentences" {
					sentences := []string{"E=mc²"}
					if empty {
						sentences = []string{" ", ""}
					}
					json.NewEncoder(w).Encode(SplitSentencesResponse{Sentences: sentences})
					return
				}
				batchCalls++
				var request BatchValidateRequest
				json.NewDecoder(r.Body).Decode(&request)
				if len(request.Claims) != 1 || request.Claims[0] != "E=mc²" {
					t.Error("Short formula was omitted")
				}
				json.NewEncoder(w).Encode(BatchValidateResponse{Results: []ClaimResult{{Claim: "E=mc²", IsGrounded: true, GroundingScore: 0.9, BestChunkIdx: 0, Label: "entailment"}}, OverallGroundingScore: 1})
			}))
			defer server.Close()
			result, err := NewGroundingValidator(0.6, 0.3).Validate(context.Background(), "E=mc²", []string{"synthetic source"}, NewNLIClient(server.URL), nil)
			if err != nil {
				t.Fatal(err)
			}
			if empty {
				if result.GroundingScore != 0 || result.Warning == "" || batchCalls != 0 {
					t.Fatal("Empty sentences became verified success")
				}
			} else if batchCalls != 1 || result.TotalClaims != 1 {
				t.Fatal("Short formula did not reach the validator")
			}
		})
	}
}

func TestGroundingDiscardsPartialBatchAndRedactsFailureBody(t *testing.T) {
	count := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		count++
		if count > 1 {
			w.WriteHeader(503)
			w.Write([]byte("private upstream credential detail"))
			return
		}
		var request BatchValidateRequest
		json.NewDecoder(r.Body).Decode(&request)
		result := BatchValidateResponse{OverallGroundingScore: 1}
		for _, claim := range request.Claims {
			result.Results = append(result.Results, ClaimResult{Claim: claim, IsGrounded: true, GroundingScore: 0.9, BestChunkIdx: 0, Label: "entailment"})
		}
		json.NewEncoder(w).Encode(result)
	}))
	defer server.Close()
	claims := make([]string, 51)
	for i := range claims {
		claims[i] = "claim"
	}
	result, err := NewNLIClient(server.URL).BatchValidateClaims(context.Background(), claims, []string{"source"})
	if result != nil || err == nil || strings.Contains(err.Error(), "credential") || count != 2 {
		t.Fatal("Partial/failure data escaped as success or leaked response body")
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if result, err := NewNLIClient(server.URL).BatchValidateClaims(ctx, []string{"claim"}, []string{"source"}); err == nil || result != nil {
		t.Fatal("Cancelled validation accepted")
	}
}
