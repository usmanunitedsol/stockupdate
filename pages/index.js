import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useState } from "react";
import * as XLSX from "xlsx";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [wooCommerceFile, setWooCommerceFile] = useState(null);
  const [shopifyFile, setShopifyFile] = useState(null);
  const [mergedData, setMergedData] = useState([]);

  const handleFileUpload = (e, platform) => {
    const file = e.target.files[0];
    if (platform === "woo") {
      setWooCommerceFile(file);
    } else if (platform === "shopify") {
      setShopifyFile(file);
    }
  };

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        resolve(jsonData);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const mergeData = (wooData, shopifyData) => {
    const merged = wooData.map((wooProduct) => {
      const matchingShopifyProduct = shopifyData.find(
        (shopifyProduct) =>
          shopifyProduct.title === wooProduct.title &&
          shopifyProduct.variant === wooProduct.variant
      );

      return {
        title: wooProduct.title,
        variant: wooProduct.variant,
        woo_stock: wooProduct.stock,
        shopify_stock: matchingShopifyProduct ? matchingShopifyProduct.stock : 0,
      };
    });

    setMergedData(merged);
  };

  const handleMerge = async () => {
    if (!wooCommerceFile || !shopifyFile) {
      alert("Please upload both files");
      return;
    }

    const wooData = await parseCSV(wooCommerceFile);
    const shopifyData = await parseCSV(shopifyFile);

    mergeData(wooData, shopifyData);
  };

  const downloadMergedFile = () => {
    const worksheet = XLSX.utils.json_to_sheet(mergedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Comparison");

    XLSX.writeFile(workbook, "stock_comparison.xlsx");
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-xl font-bold mb-4">
          Merge WooCommerce & Shopify Products
        </h1>
        <div className="mb-4">
          <input type="file" onChange={(e) => handleFileUpload(e, "woo")} />
          <label className="ml-2">Upload WooCommerce CSV</label>
        </div>
        <div className="mb-4">
          <input type="file" onChange={(e) => handleFileUpload(e, "shopify")} />
          <label className="ml-2">Upload Shopify CSV</label>
        </div>
        <button
          onClick={handleMerge}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Merge Products
        </button>
        {mergedData.length > 0 && (
          <button
            onClick={downloadMergedFile}
            className="bg-green-500 text-white px-4 py-2 rounded ml-4"
          >
            Download Stock Comparison File
          </button>
        )}
      </div>
    </>
  );
}
