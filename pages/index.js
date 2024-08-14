import React, { useState } from 'react';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

function CompareStock() {
  const [wooFile, setWooFile] = useState(null);
  const [shopifyFile, setShopifyFile] = useState(null);

  const handleFileChange = (setter) => (e) => {
    const file = e.target.files[0];
    console.log("Selected File:", file);
    setter(file);
  };

  const handleCompareStock = () => {
    if (wooFile && shopifyFile) {
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
    console.log("Shopify sku", shopifyData[30].SKU);
    console.log("Shopify sku", wooData[0].Barcode);

    const results = wooData.map(wooItem => {
      const shopifyItem = shopifyData.find(item => {
        const wooBarcode = (wooItem.Barcode || '').toLowerCase().trim();
        const shopifySKU = (item.SKU || '').toLowerCase().trim();

        return wooBarcode && shopifySKU && wooBarcode === shopifySKU;
      });

      console.log("Matching WooCommerce Item:", wooItem);
      console.log("Matching Shopify Item:", shopifyItem);

      if (shopifyItem) {
        const stockColumns = [
          "Volcano Vapes Bult,Potchefstroom",
          "Volcano Vapes Vyfhoek,Potchefstroom",
          "Volcano Vapes Delmas",
          "Volcano Vapes Germiston",
          "Volcano Vapes Ballito",
          "Germiston Wharehouse"
        ];

        const shopifyTotalStock = stockColumns.reduce((sum, column) => {
          const stock = shopifyItem[column] === 'not stocked' ? 0 : parseInt(shopifyItem[column]) || 0;
          return sum + stock;
        }, 0);

        const wooStock = wooItem['In stock?'] === 'true' ? parseInt(wooItem.Stock) || 0 : 0;

        return {
          WooCommerceName: wooItem.Name,
          ShopifyName: shopifyItem.Title,
          Flavor: shopifyItem['Option1 Value'] || 'N/A',
          ShopifyStock: shopifyTotalStock.toString(),
          WooCommerceStock: wooStock.toString(),
          WooCommerceSKU: wooItem.SKU || 'N/A',
          ShopifySKU: shopifyItem.SKU || 'N/A',
          WooCommerceBarcode: wooItem.Barcode || 'N/A',
          ShopifyHandle: shopifyItem.Handle || 'N/A'
        };
      }
      return null;
    }).filter(Boolean);

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
  };

  return (
    <div>
      <label htmlFor="wooFile">Upload WooCommerce file</label>
      <input id="wooFile" type="file" accept=".csv" onChange={handleFileChange(setWooFile)} />
      <label htmlFor="shopifyFile">Upload Shopify file</label>
      <input id="shopifyFile" type="file" accept=".csv" onChange={handleFileChange(setShopifyFile)} />
      <button onClick={handleCompareStock}>Compare Stock</button>
    </div>
  );
}

export default CompareStock;