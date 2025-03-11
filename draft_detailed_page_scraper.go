package main

import (
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/antchfx/htmlquery"
	"github.com/gocolly/colly/v2"
	_ "github.com/lib/pq"
)

type Payload struct {
	Links       []string          `json:"links"`
	Elements    map[string]string `json:"elements"`
	IsXPath     bool              `json:"is_xpath"`
	ScraperType string            `json:"scraper_type"`
}

type ScrapedData struct {
	URL     string            `json:"url"`
	Details map[string]string `json:"details"`
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

func saveToCSV(results []ScrapedData) {
	// Create unique filename based on current date and time
	currentTime := time.Now().Format("2006-01-02_15-04-05")
	fileName := fmt.Sprintf("scraped_data_%s.csv", currentTime)

	// Create CSV file
	file, err := os.Create(fileName)
	if err != nil {
		log.Println("Error creating CSV file:", err)
		return
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Prepare CSV headers
	if len(results) == 0 {
		log.Println("No data to write")
		return
	}

	// Extract the keys from the first result
	headers := []string{"URL"}
	for key := range results[0].Details {
		headers = append(headers, key)
	}

	// Write the header row
	writer.Write(headers)

	// Write data rows
	for _, result := range results {
		// Prepare the row data
		row := []string{result.URL}
		for _, key := range headers[1:] {
			// Trim spaces for each field to avoid extra spaces in the output
			row = append(row, strings.TrimSpace(result.Details[key]))
		}
		writer.Write(row)
	}

	fmt.Println("Scraped data saved to", fileName)
}

// func collectHandler(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodPost {
// 		http.Error(w, "Only POST supported", http.StatusMethodNotAllowed)
// 		return
// 	}

// 	var payload Payload
// 	err := json.NewDecoder(r.Body).Decode(&payload)
// 	if err != nil {
// 		http.Error(w, "Invalid JSON", http.StatusBadRequest)
// 		return
// 	}

// 	results := scrapeLinks(payload.Links, payload.Elements, payload.IsXPath)

// 	// Save results to CSV with a unique filename
// 	saveToCSV(results)

//		// Send results as response
//		w.Header().Set("Content-Type", "application/json")
//		json.NewEncoder(w).Encode(map[string]interface{}{
//			"status": "success",
//			"data":   results,
//		})
//	}
func saveTemplateToDB(links []string, elements map[string]string, isXPath bool, scraperType string) error {
	// Connect to the database
	connStr := "user=oksana dbname=scrapetrack password=password sslmode=disable"

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return fmt.Errorf("failed to connect to the database: %v", err)
	}
	defer db.Close()

	// Convert elements map to JSON
	elementsJSON, err := json.Marshal(elements)
	if err != nil {
		return fmt.Errorf("failed to marshal elements: %v", err)
	}

	// Insert the template into the database
	query := `INSERT INTO templates (website_id, user_id, name, settings, scraping_type) 
              VALUES ($1, $2, $3, $4, $5)`
	_, err = db.Exec(query, nil, nil, "Template Name", elementsJSON, scraperType)
	if err != nil {
		return fmt.Errorf("failed to insert template: %v", err)
	}

	log.Println("Template saved successfully")
	return nil
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

	// Check scraper_type
	if payload.Elements["scraper_type"] != "detail" {
		http.Error(w, "scraper_type is not 'detail'", http.StatusOK)
		return
	}

	results := scrapeLinks(payload.Links, payload.Elements, payload.IsXPath)

	// Save results to CSV with a unique filename
	saveToCSV(results)

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
//        "links": ["https://books.toscrape.com/catalogue/private-paris-private-10_958/index.html","https://books.toscrape.com/catalogue/soumission_998/index.html"],
//        "elements": {
//          "title": "//h1",
//          "price": "//p[@class='\''price_color'\'']",
//          "description": "//p"
//        },
//        "is_xpath": true
//      }'

// curl -X POST "http://localhost:8080/collect" \
//    -H "Content-Type: application/json" \
//    -d '{
//     "links": ["https://www.bookstation.ie/product/wrong-women-selling-sex-in-monto-dublins-forgotten-red-light-district/","https://www.bookstation.ie/product/onyx-storm-discover-the-follow-up-to-the-global-phenom/"],
//     "elements": {
//      "title": "//div[contains(@class, \"product\")]//h1"
//     },
//     "is_xpath": true
//    }'
