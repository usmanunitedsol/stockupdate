import React, { useState } from 'react';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

function CompareStock() {
  const [wooFile, setWooFile] = useState(null);
  const [shopifyFile, setShopifyFile] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  const handleFileChange = (setter) => (e) => {
    const file = e.target.files[0];
   
    setter(file);
  };

  const handleCompareStock = () => {
    if (wooFile && shopifyFile) {
      setIsComparing(true);
      parseCSVFiles(wooFile, shopifyFile);
    } else {
      alert("Please upload both files.");
    }
  };

  const parseCSVFiles = (wooFile, shopifyFile) => {
  
    Papa.parse(wooFile, {
      header: true,
      complete: (wooResults) => {
     
        Papa.parse(shopifyFile, {
          header: false,
          complete: (shopifyResults) => {
        
            
            // Process the raw CSV data
            const headers = shopifyResults.data[0];
            const shopifyData = shopifyResults.data.slice(1).map(row => {
              const item = {};
              headers.forEach((header, index) => {
                item[header] = row[index];
              });
              return item;
            });
            
         
            compareAndGenerateFile(wooResults.data, shopifyData);
          },
          error: (error) => console.error("Error parsing Shopify CSV:", error)
        });
      },
      error: (error) => console.error("Error parsing WooCommerce CSV:", error)
    });
  };
  const compareAndGenerateFile = (wooData, shopifyData) => {
    console.log("WooCommerce Data Length:", wooData.length);
    console.log("Shopify Data Length:", shopifyData.length);
  
    // Extract location fields from the Shopify data
    const locationFields = [
      "Volcano Vapes Bult,Potchefstroom",
      "Volcano Vapes Vyfhoek,Potchefstroom",
      "Volcano Vapes Delmas",
      "Volcano Vapes Germiston",
      "Volcano Vapes Ballito",
      "Germiston Wharehouse"
    ];
  
    const results = wooData.reduce((acc, wooItem) => {
      const shopifyItem = shopifyData.find(item => {
        const wooSKU = (wooItem.SKU || '').toLowerCase().trim();
        const shopifySKU = (item.SKU || '').toLowerCase().trim();
  
        return wooSKU && shopifySKU && wooSKU === shopifySKU;
      });
  
      // If no matching Shopify item is found, skip this product
      if (!shopifyItem) {
        console.log(`No matching Shopify item found for WooCommerce SKU: ${wooItem.SKU}. Skipping.`);
        return acc;
      }
  
      const locationStocks = {};
      let totalShopifyStock = 0;
  
      locationFields.forEach(location => {
        const rawValue = shopifyItem[location] || shopifyItem[`"${location}"`]; // Try both with and without quotes
        console.log(`Raw value for ${location}:`, rawValue);
        const stock = rawValue === 'not stocked' ? 0 : (parseInt(rawValue) || 0);
        console.log(`Parsed stock for ${location}:`, stock);
        locationStocks[location] = stock;
        totalShopifyStock += stock;
      });
  
      console.log("Total Shopify Stock:", totalShopifyStock);
  
      const wooStock = parseInt(wooItem.Stock) || 0;
      const totalStock = wooStock + totalShopifyStock;
  
      const result = {
        WooCommerceName: wooItem.Name,
        ShopifyName: shopifyItem.Title,
        Flavor: shopifyItem['Option1 Value'],
        'WordPress Stock': wooStock.toString(),
        ...locationStocks,
        'Total Shopify Stock': totalShopifyStock.toString(),
        'Total Stock': totalStock.toString(),
        'Reorder Level - Amount to Order': '',
        WooCommerceSKU: wooItem.SKU,
        ShopifySKU: shopifyItem.SKU,
      };
  
      console.log("Result item:", result);
      acc.push(result);
      return acc;
    }, []);
  
    console.log("Results:", results);
    console.log("Results Length:", results.length);
    generateCSVFile(results);
  };

  const generateCSVFile = (data) => {
 
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const wbout = XLSX.write(wb, { bookType: 'csv', type: 'array' });
    const blob = new Blob([wbout], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'stock_comparison_result.csv');
    setIsComparing(false);
  };

  // ... rest of the component (return statement) remains the same

  return (
    <div className="compare-stock-container">
      <h2 className="compare-stock-title">Stock Comparison Tool</h2>
      
      <div className="file-upload-container">
        <div className="file-upload-item">
          <div className="file-icon-label">
            <span className="file-icon">📄</span>
            <span>WooCommerce File</span>
          </div>
          <label htmlFor="wooFile" className="file-upload-button">
            <span className="upload-icon">⬆️</span>
            <span>Upload</span>
          </label>
          <input id="wooFile" type="file" accept=".csv" onChange={handleFileChange(setWooFile)} />
        </div>

        <div className="file-upload-item">
          <div className="file-icon-label">
            <span className="file-icon">📄</span>
            <span>Shopify File</span>
          </div>
          <label htmlFor="shopifyFile" className="file-upload-button">
            <span className="upload-icon">⬆️</span>
            <span>Upload</span>
          </label>
          <input id="shopifyFile" type="file" accept=".csv" onChange={handleFileChange(setShopifyFile)} />
        </div>
      </div>

      <button 
        onClick={handleCompareStock}
        disabled={isComparing || !wooFile || !shopifyFile}
        className={`compare-button ${isComparing || !wooFile || !shopifyFile ? 'disabled' : ''}`}
      >
        <span className={`compare-icon ${isComparing ? 'spinning' : ''}`}>🔄</span>
        {isComparing ? 'Comparing...' : 'Compare Stock'}
      </button>
    </div>
  );
}

export default CompareStock;