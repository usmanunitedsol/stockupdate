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
    Papa.parse(wooFile, {
      header: true,
      complete: (wooResults) => {
        console.log("WooCommerce Data:", wooResults.data);
        console.log("WooCommerce Data Length:", wooResults.data.length);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          const lines = content.split('\n').filter(line => line.trim() !== '');
          const headers = lines[0].split(',');
          
          const shopifyData = lines.slice(1).map(line => {
            const values = line.split(',');
            return headers.reduce((obj, header, index) => {
              obj[header.trim()] = values[index] ? values[index].trim() : '';
              return obj;
            }, {});
          });
  
          console.log("Shopify parsing complete");
          console.log("Shopify Headers:", headers);
          console.log("Shopify Data:", shopifyData);
          console.log("Shopify Data Length:", shopifyData.length);
          
          if (shopifyData.length === 0) {
            console.error("No Shopify data found. Please check the Shopify CSV file.");
            return;
          }
          
          compareAndGenerateFile(wooResults.data, shopifyData);
        };
        reader.onerror = (error) => console.error("Error reading Shopify file:", error);
        reader.readAsText(shopifyFile);
      },
      error: (error) => console.error("Error parsing WooCommerce CSV:", error)
    });
  };

  const compareAndGenerateFile = (wooData, shopifyData) => {
    console.log("WooCommerce Data Length:", wooData.length);
    console.log("Shopify Data Length:", shopifyData.length);
  
    const results = wooData.map(wooItem => {
      const shopifyItem = shopifyData.find(item => {
        const wooSKU = (wooItem.SKU || '').toLowerCase().trim();
        const shopifySKU = (item.SKU || '').toLowerCase().trim();
  
        return wooSKU && shopifySKU && wooSKU === shopifySKU;
      });
  
      console.log("Matching WooCommerce Item:", wooItem);
      console.log("Matching Shopify Item:", shopifyItem);
  
      if (shopifyItem) {
        const shopifyStock = parseInt(shopifyItem['On hand']) || 0;
        console.log("Shopify On hand Stock:", shopifyStock);
  
        const wooStock = parseInt(wooItem.Stock) || 0;
        console.log("WooCommerce Stock:", wooStock);
  
        const totalStock = wooStock + shopifyStock;

        const result = {
          WooCommerceName: wooItem.Name || 'N/A',
          ShopifyName: shopifyItem.Title || 'N/A',
          Flavor: shopifyItem['Option1 Value'] || 'N/A',
          'WordPress Stock': wooStock.toString(),
          'Shopify Stock': shopifyStock.toString(),
          'Total Stock': totalStock.toString(),
          'Reorder Level - Amount to Order': '',
          WooCommerceSKU: wooItem.SKU || 'N/A',
          ShopifySKU: shopifyItem.SKU || 'N/A',
        };
  
        console.log("Result item:", result);
        return result;
      }
      return null;
    }).filter(Boolean);
  
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