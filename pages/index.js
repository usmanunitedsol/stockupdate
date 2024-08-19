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
      console.log("Selected File:", file);
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
      console.log("Starting to parse WooCommerce file");
      Papa.parse(wooFile, {
        header: true,
        complete: (wooResults) => {
          console.log("WooCommerce parsing complete");
          console.log("WooCommerce Data:", wooResults.data);
          
          console.log("Starting to parse Shopify file");
          Papa.parse(shopifyFile, {
            header: false,
            complete: (shopifyResults) => {
              console.log("Shopify parsing complete");
              
              // Process the raw CSV data
              const headers = shopifyResults.data[0];
              const shopifyData = shopifyResults.data.slice(1).map(row => {
                const item = {};
                headers.forEach((header, index) => {
                  item[header] = row[index];
                });
                return item;
              });
              
              console.log("Processed Shopify Data:", shopifyData);
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
    
      const results = wooData.map(wooItem => {
        const shopifyItem = shopifyData.find(item => {
          const wooSKU = (wooItem.SKU || '').toLowerCase().trim();
          const shopifySKU = (item.SKU || '').toLowerCase().trim();
    
          return wooSKU && shopifySKU && wooSKU === shopifySKU;
        });
    
        const locationStocks = {};
        let totalShopifyStock = 0;
    
        locationFields.forEach(location => {
          let stock = 0;
          if (shopifyItem) {
            const rawValue = shopifyItem[location] || shopifyItem[`"${location}"`]; // Try both with and without quotes
            console.log(`Raw value for ${location}:`, rawValue);
            stock = rawValue === 'not stocked' ? 0 : (parseInt(rawValue) || 0);
            console.log(`Parsed stock for ${location}:`, stock);
          }
          locationStocks[location] = stock;
          totalShopifyStock += stock;
        });
    
        console.log("Total Shopify Stock:", totalShopifyStock);
    
        const wooStock = parseInt(wooItem.Stock) || 0;
        const totalStock = wooStock + totalShopifyStock;
    
        const result = {
          WooCommerceName: wooItem.Name || 'N/A',
          ShopifyName: shopifyItem ? (shopifyItem.Title || 'N/A') : 'N/A',
          Flavor: shopifyItem ? (shopifyItem['Option1 Value'] || 'N/A') : 'N/A',
          'WordPress Stock': wooStock.toString(),
          ...locationStocks,
          'Total Shopify Stock': totalShopifyStock.toString(),
          'Total Stock': totalStock.toString(),
          'Reorder Level - Amount to Order': '',
          WooCommerceSKU: wooItem.SKU || 'N/A',
          ShopifySKU: shopifyItem ? (shopifyItem.SKU || 'N/A') : 'N/A',
        };
    
        console.log("Result item:", result);
        return result;
      });
    
      console.log("Results:", results);
      console.log("Results Length:", results.length);
      generateCSVFile(results);
    };
  
    const generateCSVFile = (data) => {
      console.log("Generating CSV file with data:", data);
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      const wbout = XLSX.write(wb, { bookType: 'csv', type: 'array' });
      const blob = new Blob([wbout], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, 'stock_comparison_result.csv');
      setIsComparing(false);
    };
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