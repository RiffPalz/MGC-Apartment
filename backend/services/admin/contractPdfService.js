import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import cloudinary from "../../config/cloudinary.js";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* Upload a PDF buffer to Cloudinary and return the secure URL */
const uploadPdfToCloudinary = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "raw", type: "upload", access_mode: "public", public_id },
      (error, result) => {
        if (error) return reject(new Error("Failed to upload PDF to Cloudinary"));
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

/* Render an HTML template to PDF using Puppeteer */
const renderPdf = async (htmlContent) => {
  const executablePath = await chromium.executablePath();
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "60px", right: "60px", bottom: "60px", left: "60px" },
  });
  await browser.close();
  return pdfBuffer;
};

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
    : "___________";

/* Generate the MGC Contract of Lease PDF and upload to Cloudinary */
export const generateContractPdf = async ({
  unit_number,
  lessor_name = "MGC BUILDING MANAGEMENT",
  lessor_address = "762 F. Gomez St., Barangay Ibaba, Santa Rosa, Laguna",
  lessee_name,
  lessee_address,
  start_date,
  end_date,
  rent_amount,
  tenancy_rules,
  termination_renewal_conditions,
  execution_date,
  execution_place = "Santa Rosa, Laguna",
}) => {
  try {
    const templatePath = path.resolve(__dirname, "../../templates/mgcContractTemplate.html");
    let htmlContent = await fs.readFile(templatePath, "utf-8");

    const execDateObj = execution_date ? new Date(execution_date) : new Date();
    const execDay = execDateObj.getDate();
    const execMonth = execDateObj.toLocaleString("en-PH", { month: "long" });
    const execYear = execDateObj.getFullYear();

    const sDate = new Date(start_date);
    const eDate = new Date(end_date);
    const monthDiff = (eDate.getFullYear() - sDate.getFullYear()) * 12 + (eDate.getMonth() - sDate.getMonth());
    const leasePeriod = monthDiff > 0 ? `${monthDiff} Month(s)` : "Less than a month";

    let dynamicSectionsHtml = "";

    if (tenancy_rules) {
      const rulesList = tenancy_rules
        .split("\n")
        .filter(Boolean)
        .map((r) => `<li>${r.replace(/^[•\-\*]\s*/, "")}</li>`)
        .join("");
      dynamicSectionsHtml += `<div class="section-title">7. ADDITIONAL TENANCY RULES</div><ol>${rulesList}</ol>`;
    }

    if (termination_renewal_conditions) {
      const condList = termination_renewal_conditions
        .split("\n")
        .filter(Boolean)
        .map((c) => `<li>${c.replace(/^[•\-\*]\s*/, "")}</li>`)
        .join("");
      dynamicSectionsHtml += `<div class="section-title">8. SPECIFIC TERMINATION / RENEWAL CONDITIONS</div><ol>${condList}</ol>`;
    }

    const replacements = {
      "{{executionDay}}": execDay,
      "{{executionMonth}}": execMonth,
      "{{executionYear}}": execYear.toString().slice(-2),
      "{{executionCity}}": execution_place,
      "{{lessorName}}": lessor_name.toUpperCase(),
      "{{lessorAddress}}": lessor_address,
      "{{lesseeName}}": (lessee_name || "[NAME OF LESSEE]").toUpperCase(),
      "{{lesseeAddress}}": lessee_address || "____________________________________",
      "{{unitNo}}": unit_number,
      "{{startDate}}": fmtDate(start_date),
      "{{endDate}}": fmtDate(end_date),
      "{{monthlyRental}}": `₱${Number(rent_amount).toLocaleString()} (Single Occupancy) / ₱3,000.00 (Double Occupancy)`,
      "{{dynamicSections}}": dynamicSectionsHtml,
      "{{leasePeriod}}": leasePeriod,
      "{{paymentDay}}": "5th",
    };

    for (const [key, value] of Object.entries(replacements)) {
      htmlContent = htmlContent.replace(new RegExp(key, "g"), value);
    }

    const pdfBuffer = await renderPdf(htmlContent);
    return await uploadPdfToCloudinary(
      pdfBuffer,
      `MGC-Building/contracts/unit_${unit_number}`,
      `contract_${unit_number}_${Date.now()}.pdf`
    );
  } catch (error) {
    console.error("Error generating Contract PDF:", error);
    throw error;
  }
};

/* Generate the MGC Termination of Lease PDF and upload to Cloudinary */
export const generateTerminationPdf = async ({
  unit_number,
  lessor_name = "MGC BUILDING MANAGEMENT",
  lessor_address = "762 F. Gomez St., Barangay Ibaba, Santa Rosa, Laguna",
  lessee_name,
  lessee_address,
  original_contract_date,
  termination_effective_date,
  termination_city = "Santa Rosa, Laguna",
}) => {
  try {
    const templatePath = path.resolve(__dirname, "../../templates/mgcTerminationContract.html");
    let htmlContent = await fs.readFile(templatePath, "utf-8");

    const termDateObj = termination_effective_date ? new Date(termination_effective_date) : new Date();
    const termDay = termDateObj.getDate();
    const termMonth = termDateObj.toLocaleString("en-PH", { month: "long" });
    const termYear = String(termDateObj.getFullYear()).slice(-2);

    const replacements = {
      "{{terminationDay}}": termDay,
      "{{terminationMonth}}": termMonth,
      "{{terminationYear}}": termYear,
      "{{terminationCity}}": termination_city,
      "{{lessorName}}": lessor_name.toUpperCase(),
      "{{lessorAddress}}": lessor_address,
      "{{lesseeName}}": (lessee_name || "[NAME OF LESSEE]").toUpperCase(),
      "{{lesseeAddress}}": lessee_address || "____________________________________",
      "{{originalContractDate}}": fmtDate(original_contract_date),
      "{{unitNo}}": unit_number,
      "{{terminationEffectiveDate}}": fmtDate(termination_effective_date),
    };

    for (const [key, value] of Object.entries(replacements)) {
      htmlContent = htmlContent.replace(new RegExp(key, "g"), value);
    }

    const pdfBuffer = await renderPdf(htmlContent);
    return await uploadPdfToCloudinary(
      pdfBuffer,
      `MGC-Building/terminations/unit_${unit_number}`,
      `termination_${unit_number}_${Date.now()}.pdf`
    );
  } catch (error) {
    console.error("Error generating Termination PDF:", error);
    throw error;
  }
};

/* Generate the Tenant Request for Termination PDF and upload to Cloudinary */
export const generateTenantTerminationRequestPdf = async ({
  unit_number,
  lessor_name = "MGC BUILDING MANAGEMENT",
  building_name = "MGC Building",
  building_address = "762 F. Gomez St., Barangay Ibaba, Santa Rosa, Laguna",
  lessee_name,
  lessee_address,
  contract_date,
  vacate_date,
  request_date,
}) => {
  try {
    const templatePath = path.resolve(__dirname, "../../templates/tenantRequestTermination.html");
    let htmlContent = await fs.readFile(templatePath, "utf-8");

    const replacements = {
      "{{requestDate}}": fmtDate(request_date || new Date()),
      "{{lessorName}}": lessor_name,
      "{{buildingName}}": building_name,
      "{{buildingAddress}}": building_address,
      "{{lesseeName}}": lessee_name || "[NAME OF LESSEE]",
      "{{unitNo}}": unit_number,
      "{{contractDate}}": fmtDate(contract_date),
      "{{vacateDate}}": fmtDate(vacate_date),
      "{{lesseeAddress}}": lessee_address || "____________________________________",
    };

    for (const [key, value] of Object.entries(replacements)) {
      htmlContent = htmlContent.replace(new RegExp(key, "g"), value);
    }

    const pdfBuffer = await renderPdf(htmlContent);
    return await uploadPdfToCloudinary(
      pdfBuffer,
      `MGC-Building/termination-requests/unit_${unit_number}`,
      `termination_request_${unit_number}_${Date.now()}.pdf`
    );
  } catch (error) {
    console.error("Error generating Tenant Termination Request PDF:", error);
    throw error;
  }
};
