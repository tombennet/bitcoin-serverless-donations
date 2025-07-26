import fs from "fs";
import csv from "csv-parser";

const filename = process.argv[2];

if (!filename) {
  console.error("Usage: pass filename as first argument");
  console.error('Example: npm run process-sparrow -- "utils/SAMPLE.csv"');
  process.exit(1);
}

if (!fs.existsSync(filename)) {
  console.error(`Error: File '${filename}' does not exist.`);
  process.exit(1);
}

const addresses = [];
fs.createReadStream(filename)
  .pipe(csv())
  .on("data", (row) => {
    addresses.push({
      index: parseInt(row.Index),
      address: row["Payment Address"],
      used: false,
    });
  })
  .on("end", () => {
    const output = `export const addresses = ${JSON.stringify(
      addresses,
      null,
      2
    )};`;
    fs.writeFileSync("functions/get-address/addresses.js", output);
    console.log(
      `Successfully processed ${addresses.length} addresses from '${filename}' and saved to 'functions/get-address/addresses.js'`
    );
  })
  .on("error", (error) => {
    console.error(`Error reading file '${filename}':`, error.message);
    process.exit(1);
  });
