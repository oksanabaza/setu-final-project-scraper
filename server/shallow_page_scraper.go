package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gocolly/colly/v2"
)

type Product struct {
	Title string `json:"title"`
	Price string `json:"price"`
	URL   string `json:"url"`
}

func scrapeCategoryPage(categoryURL string) []Product {
	c := colly.NewCollector()
	var products []Product

	c.OnHTML(".product_pod", func(e *colly.HTMLElement) {
		title := e.ChildAttr("h3 a", "title")
		price := e.ChildText(".price_color")
		productURL := e.ChildAttr("h3 a", "href")

		// Convert relative URL to absolute URL
		fullURL := e.Request.AbsoluteURL(productURL)

		products = append(products, Product{
			Title: title,
			Price: price,
			URL:   fullURL,
		})
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

	var payload struct {
		CategoryURL string `json:"category_url"`
	}
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	products := scrapeCategoryPage(payload.CategoryURL)

	// Save to a file
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
//request to send to scrape category 
// curl -X POST "http://localhost:8080/category" \
//      -H "Content-Type: application/json" \
//      -d '{
//        "category_url": "https://books.toscrape.com/catalogue/category/books/fiction_10/index.html"
//      }'
