package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gocolly/colly/v2"
	"github.com/antchfx/htmlquery" 
)

type Payload struct {
	Links       []string `json:"links"`
	Element     string   `json:"element"` 
	IsXPath     bool     `json:"is_xpath"` 
}

type ScrapedData struct {
	URL   string `json:"url"`
	Title string `json:"title"`
}

func scrapeLinks(links []string, element string, isXPath bool) []ScrapedData {
	c := colly.NewCollector()
	var results []ScrapedData

	c.OnHTML("html", func(e *colly.HTMLElement) {
		var pageTitle string

		htmlContent, err := e.DOM.Html()
		if err != nil {
			log.Println("Error getting HTML content:", err)
			return
		}

		if isXPath {
			doc, err := htmlquery.Parse(strings.NewReader(htmlContent))
			if err != nil {
				log.Println("Error parsing HTML:", err)
				return
			}
			// Find the element using XPath
			nodes := htmlquery.Find(doc, element)
			for _, node := range nodes {
				pageTitle = strings.TrimSpace(htmlquery.InnerText(node))
			}
		} else {
			// Use CSS selectors if XPath is not used
			pageTitle = strings.TrimSpace(e.ChildText(element))
		}

		if pageTitle != "" {
			url := e.Request.URL.String()
			results = append(results, ScrapedData{URL: url, Title: pageTitle})
		}
	})

	for _, link := range links {
		fmt.Println("Scraping:", link)
		err := c.Visit(link)
		if err != nil {
			log.Println("Error visiting URL:", err)
		}
	}

	return results
}

func collectHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST supported", http.StatusMethodNotAllowed)
		return
	}

	var payload Payload
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		http.Error(w, "Error in JSON", http.StatusBadRequest)
		return
	}

	results := scrapeLinks(payload.Links, payload.Element, payload.IsXPath)

	// Save the scraped data to a file
	file, err := os.Create("scraped_data.json")
	if err != nil {
		http.Error(w, "Failed to save data", http.StatusInternalServerError)
		return
	}
	defer file.Close()
	json.NewEncoder(file).Encode(results)

	// Send the scraped data back in the response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"data":   results,
	})
}

func main() {
	http.HandleFunc("/collect", collectHandler)
	fmt.Println("Server started on port 8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
