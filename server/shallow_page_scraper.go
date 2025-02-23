package main

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gocolly/colly/v2"
)

// RequestBody defines the expected JSON structure
type RequestBody struct {
	Links    []string          `json:"links"`
	Elements map[string]string `json:"elements"`
	Wrapper  string            `json:"wrapper"`  
	IsXPath  bool              `json:"is_xpath"`
}

// ResponseData defines the JSON response structure
type ResponseData struct {
	URL   string            `json:"url"`
	Data  map[string]string `json:"data"`
	Error string            `json:"error,omitempty"`
}

// Handles the POST request
func scrapeHandler(w http.ResponseWriter, r *http.Request) {
	// Decode JSON request
	var req RequestBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON request", http.StatusBadRequest)
		return
	}

	// Initialise colly collector
	c := colly.NewCollector()
	var results []ResponseData
	var mu sync.Mutex
	var wg sync.WaitGroup

	// Process each link
	for _, url := range req.Links {
		wg.Add(1) // Increment waitgroup counter for each URL
		go func(url string) {
			defer wg.Done() // Decrement counter when scraping is done

			var productResults []map[string]string
			var scrapeErr error

			// Scraping logic
			c.OnHTML(req.Wrapper, func(e *colly.HTMLElement) {
				data := make(map[string]string)
				for key, selector := range req.Elements {
					if req.IsXPath {
						data[key] = "XPath support not implemented yet"
					} else {
						data[key] = e.ChildText(selector)
					}
				}
				productResults = append(productResults, data)
			})

			err := c.Visit(url)
			if err != nil {
				scrapeErr = err
			}

			// Store results after scraping completes
			mu.Lock() // Lock access to shared resource
			for _, product := range productResults {
				response := ResponseData{
					URL:  url,
					Data: product,
				}
				if scrapeErr != nil {
					response.Error = scrapeErr.Error()
				}
				results = append(results, response)
			}
			mu.Unlock()
		}(url)
	}

	// Wait for all goroutines to finish
	wg.Wait()

	// Save data to CSV after scraping completes
	saveToCSV(results)

	// Convert response to JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

// Saves scraped data to a CSV file
func saveToCSV(results []ResponseData) {
	// Create filename with timestamp
	timestamp := time.Now().Format("2006-01-02_15-04-05")
	filename := fmt.Sprintf("scraped_data_%s.csv", timestamp)

	// Create CSV file
	file, err := os.Create(filename)
	if err != nil {
		log.Println("Error creating CSV file:", err)
		return
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// Write CSV header
	headers := []string{"URL", "price", "availability", "title"}
	writer.Write(headers)

	// Write data rows
	for _, result := range results {
		// Prepare the row data
		row := []string{result.URL}
		for _, key := range headers[1:] {
			// Trim spaces for each field to avoid extra spaces in the output
			row = append(row, strings.TrimSpace(result.Data[key]))
		}
		writer.Write(row)
	}

	fmt.Println("Scraped data saved to", filename)
}

func main() {
	// Start HTTP server
	http.HandleFunc("/collect", scrapeHandler)
	fmt.Println("Server running on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}


// curl -X POST "http://localhost:8080/collect" \
//    -H "Content-Type: application/json" \
//    -d '{
//     "links": ["https://www.bookstation.ie/product-category/books/just-released/"],
//     "elements": {
//      "title": "h2 a",
//      "price": ".woocommerce-Price-amount"
//     },
//     "wrapper": ".product",
//     "is_xpath": false
//    }'

// curl -X POST "http://localhost:8080/collect" \
//    -H "Content-Type: application/json" \
//    -d '{
//     "links": ["https://books.toscrape.com/catalogue/category/books/science_22/index.html"],
//     "elements": {
//          "title": "h3 a",
//          "price": ".price_color",
//          "availability": ".instock.availability"
//     },
//     "wrapper": ".product_pod",
//     "is_xpath": false
//    }'

