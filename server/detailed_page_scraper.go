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
	Links   []string          `json:"links"`
	Elements map[string]string `json:"elements"` // Dynamic keys: {"title": "xpath", "price": "css"}
	IsXPath bool              `json:"is_xpath"`
}

type ScrapedData struct {
	URL     string            `json:"url"`
	Details map[string]string `json:"details"` // Store extracted values dynamically
}

func scrapeLinks(links []string, elements map[string]string, isXPath bool) []ScrapedData {
	c := colly.NewCollector()
	var results []ScrapedData

	c.OnHTML("html", func(e *colly.HTMLElement) {
		data := ScrapedData{
			URL:     e.Request.URL.String(),
			Details: make(map[string]string),
		}

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

			// Extract values dynamically using XPath
			for key, selector := range elements {
				nodes := htmlquery.Find(doc, selector)
				if len(nodes) > 0 {
					data.Details[key] = strings.TrimSpace(htmlquery.InnerText(nodes[0]))
				}
			}
		} else {
			// Extract values dynamically using CSS selectors
			for key, selector := range elements {
				data.Details[key] = strings.TrimSpace(e.ChildText(selector))
			}
		}

		results = append(results, data)
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
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	results := scrapeLinks(payload.Links, payload.Elements, payload.IsXPath)

	// Save results to a JSON file
	file, err := os.Create("scraped_data.json")
	if err != nil {
		http.Error(w, "Failed to save data", http.StatusInternalServerError)
		return
	}
	defer file.Close()
	json.NewEncoder(file).Encode(results)

	// Send results as response
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
//request to generate json file with all elementes/pathes we want to scrape
// {
// 	"links": ["https://example.com/product"],
// 	"elements": {
// 	  "title": "//h1[@class='product-title']",
// 	  "price": "//span[@class='price']",
// 	  "description": "//div[@class='description']"
// 	},
// 	"is_xpath": true
//   }
// curl -X POST "http://localhost:8080/collect" \
//      -H "Content-Type: application/json" \
//      -d '{
//        "links": ["https://books.toscrape.com/catalogue/private-paris-private-10_958/index.html"],
//        "elements": {
//          "title": "//h1",
//          "price": "//p[@class='\''price_color'\'']",
//          "description": "//p"
//        },
//        "is_xpath": true
//      }'
