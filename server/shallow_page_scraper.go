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
	CategoryURL string            `json:"category_url"`
	Selectors   map[string]string `json:"selectors"`  // Dynamic key-value pairs for selectors
	IsXPath     bool              `json:"is_xpath"`   // Determines if selectors are XPath
}

func scrapeCategoryWithPagination(categoryURL string, selectors map[string]string, isXPath bool) []map[string]string {
	c := colly.NewCollector()
	var products []map[string]string

	// Function to extract data dynamically
	extractData := func(e *colly.HTMLElement, htmlContent string) map[string]string {
		product := make(map[string]string)
		doc, _ := htmlquery.Parse(strings.NewReader(htmlContent))

		for key, selector := range selectors {
			var value string

			if isXPath {
				nodes := htmlquery.Find(doc, selector)
				if len(nodes) > 0 {
					value = strings.TrimSpace(htmlquery.InnerText(nodes[0]))
				}
			} else {
				value = strings.TrimSpace(e.ChildText(selector))
			}

			product[key] = value
		}

		// Store absolute URL
		product["url"] = e.Request.URL.String()
		return product
	}

	// Extract product details from each item
	c.OnHTML(".product_pod", func(e *colly.HTMLElement) {
		htmlContent, _ := e.DOM.Html()
		products = append(products, extractData(e, htmlContent))
	})

	// Handle pagination (Next button)
	c.OnHTML(".pagenav", func(e *colly.HTMLElement) {
		nextPageURL := e.Request.AbsoluteURL(e.Attr("href"))
		fmt.Println("Next page found:", nextPageURL)
		c.Visit(nextPageURL)
	})

	err := c.Visit(categoryURL)
	if err != nil {
		log.Println("Error visiting category page:", err)
	}

	return products
}

func categoryHandler(w http.ResponseWriter, r *http.Request) {
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

	products := scrapeCategoryWithPagination(payload.CategoryURL, payload.Selectors, payload.IsXPath)

	// Save to file
	file, err := os.Create("category_products.json")
	if err != nil {
		http.Error(w, "Failed to save data", http.StatusInternalServerError)
		return
	}
	defer file.Close()
	json.NewEncoder(file).Encode(products)

	// Send response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "success",
		"data":   products,
	})
}

func main() {
	http.HandleFunc("/category", categoryHandler)
	fmt.Println("Server started on port 8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}


// curl -X POST "http://localhost:8080/category" \
//      -H "Content-Type: application/json" \
//      -d '{
//        "category_url": "https://books.toscrape.com/catalogue/category/books/science_22/index.html",
//        "selectors": {
//          "title": "h3 a",
//          "price": ".price_color",
//          "availability": ".instock.availability"
//        },
//        "is_xpath": false
//      }'
