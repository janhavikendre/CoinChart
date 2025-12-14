import fs from "fs";
import path from "path";
import csv from "csv-parser";

// Update DATA_DIR to point to the source controllers folder regardless of compilation output
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const CANDLESTICK_DIR = process.env.CANDLESTICK_DIR || path.join(process.cwd(), "data/candlestick_data");

const RISK_FILES: Record<string, string> = {
  binance: "binance_risks.csv",
  btcc: "btcc_risks.csv",
};

//const SIGNAL_FILES: Record<string, string> = {
//  binance: "binance_signals.json",
//  btcc: "btcc_signals.json",
//};

const SIGNAL_FILE: Record<string, string> = {
  signals: "signals.json",
};

// Exported function to read CSV file and process risks
export async function readRisks(source: string): Promise<Record<string, any> | undefined> {
  if (!(source in RISK_FILES)) {
    console.error(`Invalid source '${source}'. Available sources: ${Object.keys(RISK_FILES).join(", ")}`);
    return;
  }
  const csvFileName = RISK_FILES[source];
  const csvFilePath = path.join(DATA_DIR, csvFileName);
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ File does not exist: ${csvFilePath}`);
    return;
  }
  console.log(`📂 Reading risks from: ${csvFilePath}`);
  const tokensData: Record<string, any> = {};
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: ";" }))
      .on("data", (row) => {
        const symbol = row["Symbol"];
        const riskValue = parseInt(row["Risk"], 10);
        const riskUsdtValue = parseInt(row["Risk_USDT"], 10);
        if (isNaN(riskValue) || isNaN(riskUsdtValue)) {
          console.log(`⚠️ Skipping ${symbol} due to NaN risk value.`);
          return;
        }
        tokensData[symbol] = {
          name: "",
          symbol: symbol,
          price: row["Price"],
          volume: row["Volume"],
          //moralisLink: `https://moralis.io/token/eth/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599/chart`,
          chainId: row["CHAIN_ID"],
          tokenAddress: row["TOKEN_ID"],
          icon: `https://coinchart.fun/icons/${symbol.toUpperCase()}.png`,
          risk: riskValue,
          risk_usdt: riskUsdtValue,
          "3mChange": row["3M_CHANGE"],
          "1mChange": row["1M_CHANGE"],
          "2wChange": row["2W_CHANGE"],
          "bubbleSize": row["BUBBLE_SIZE"],
          warnings: row["WARNINGS"] ? row["WARNINGS"].split(";") : [],
        };
      })
      .on("end", () => {
        console.log("✅ Processed risk data:");
        console.log(JSON.stringify(tokensData, null, 2));
        resolve(tokensData);
      })
      .on("error", (err) => {
        console.error("❌ Error processing CSV:", err);
        reject(err);
      });
  });
}

// Exported function to read JSON file and process signals
export async function readSignals(): Promise<any> {
  const DEFAULT_SOURCE = "signals"; // <-- set your default key here

  if (!(DEFAULT_SOURCE in SIGNAL_FILE)) {
    console.error(`Invalid default source '${DEFAULT_SOURCE}'. Available sources: ${Object.keys(SIGNAL_FILE).join(", ")}`);
    return;
  }

  const filePath = path.join(DATA_DIR, SIGNAL_FILE[DEFAULT_SOURCE]);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File does not exist: ${filePath}`);
    return;
  }

  console.log(`📂 Reading signals from: ${filePath}`);
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const parsedData = JSON.parse(data);
    console.log("✅ Processed signals data:");
    console.log(JSON.stringify(parsedData, null, 2));
    return parsedData;
  } catch (err) {
    console.error("❌ Error processing JSON file:", err);
    throw err;
  }
}

// Exported function to read candlestick data
export async function readCandleData(source: string): Promise<any[]> {
  const filePath = path.join(CANDLESTICK_DIR, `${source.toUpperCase()}USDT_data.json`);
  fs.readdir(filePath, (err, files) => {
    if (err) {
        console.error("Error reading directory:", err);
        return;
    }

    console.log("Files in directory:", filePath);
    files.forEach(file => {
        console.log(file);
    });
  });


  if (!fs.existsSync(filePath)) {
    console.error(`❌ Candlestick data file does not exist: ${filePath}`);
    return [];
  }
  console.log(`📂 Reading candlestick data from: ${filePath}`);
  const data: any[] = [];
  try {
    const fileStream = fs.readFileSync(filePath, "utf8");
    fileStream.split("\n").forEach((line) => {
      if (line.trim()) {
        try {
          data.push(JSON.parse(line.trim()));
        } catch (err) {
          console.error("❌ Error decoding JSON line:", err);
        }
      }
    });
    return data;
  } catch (err) {
    console.error("❌ Error reading candlestick file:", err);
    return [];
  }
}

// Exported function to read the symbol list
export async function readSymbolList(): Promise<any> {
  const filePath = path.join(DATA_DIR, "all_symbols.json");
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Data file does not exist: ${filePath}`);
    return;
  }
  console.log(`📂 Reading symbol list from: ${filePath}`);
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ Error processing JSON file:", err);
    throw err;
  }
}