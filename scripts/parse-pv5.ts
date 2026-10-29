import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

const PDF_DIR = "./data/pv5/raw/pdf";
const OUT_DIR = "./data/pv5/processed";

async function parseAll() {
  console.log("PDF_DIR:", PDF_DIR);

  const files = fs.readdirSync(PDF_DIR).filter(file => file.endsWith(".pdf"));
  console.log("PDF files:", files.length);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const file of files) {
    try {
      console.log("Parsing:", file);

      const buffer = fs.readFileSync(path.join(PDF_DIR, file));
      const data = await pdf(buffer);

      const outFile = file.replace(".pdf", ".txt").replaceAll(" ", "_");

      fs.writeFileSync(path.join(OUT_DIR, outFile), data.text, "utf8");

      console.log("OK:", outFile, "chars:", data.text.length);
    } catch (err) {
      console.error("ERROR:", file, err);
    }
  }
}

parseAll();
