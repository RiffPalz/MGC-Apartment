import puppeteer from "puppeteer";
import cloudinary from "../../config/cloudinary.js";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import path from "path";

// ES Module workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates the MGC Contract of Lease PDF via HTML/Puppeteer and uploads to Cloudinary.
 * Returns the secure Cloudinary URL.
 */
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
    // 1. Read the HTML Template
    const templatePath = path.resolve(__dirname, "../../templates/mgcContractTemplate.html");
    let htmlContent = await fs.readFile(templatePath, "utf-8");

    // 2. Format Dates & Calculations
    const fmtDate = (d) => {
      if (!d) return "___________";
      return new Date(d).toLocaleDateString("en-PH", {
        year: "numeric", month: "long", day: "numeric",
      });
    };

    const execDateObj = execution_date ? new Date(execution_date) : new Date();
    const execDay = execDateObj.getDate();
    const execMonth = execDateObj.toLocaleString("en-PH", { month: "long" });
    const execYear = execDateObj.getFullYear();

    // Calculate Lease Period (Months)
    const sDate = new Date(start_date);
    const eDate = new Date(end_date);
    const monthDiff = (eDate.getFullYear() - sDate.getFullYear()) * 12 + (eDate.getMonth() - sDate.getMonth());
    const leasePeriod = monthDiff > 0 ? `${monthDiff} Month(s)` : "Less than a month";

    // 3. Format Dynamic Sections (Rules & Conditions)
    let dynamicSectionsHtml = "";

    if (tenancy_rules) {
      const rulesList = tenancy_rules.split("\n").filter(Boolean)
        .map(r => `<li>${r.replace(/^[•\-\*]\s*/, "")}</li>`).join("");
      dynamicSectionsHtml += `
                <div class="section-title">7. ADDITIONAL TENANCY RULES</div>
                <ol>${rulesList}</ol>
            `;
    }

    if (termination_renewal_conditions) {
      const condList = termination_renewal_conditions.split("\n").filter(Boolean)
        .map(c => `<li>${c.replace(/^[•\-\*]\s*/, "")}</li>`).join("");
      dynamicSectionsHtml += `
                <div class="section-title">8. SPECIFIC TERMINATION / RENEWAL CONDITIONS</div>
                <ol>${condList}</ol>
            `;
    }

    // 4. Map Data to Template Placeholders
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
      "{{dynamicSections}}": dynamicSectionsHtml, // Injects the extra rules if they exist
      "{{leasePeriod}}": leasePeriod,             // <--- NEW: Injects calculated months
      "{{paymentDay}}": "5th"                     // <--- NEW: Hardcoded 5th as requested, or make dynamic
    };

    // Inject data into HTML
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(key, "g");
      htmlContent = htmlContent.replace(regex, value);
    }

    // 5. Generate PDF with Puppeteer
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "60px", right: "60px", bottom: "60px", left: "60px" } // Matched your old margins
    });

    await browser.close();

    // 6. Upload Buffer to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `MGC-Building/contracts/unit_${unit_number}`,
          resource_type: "raw",
          type: "upload",
          access_mode: "public",
          public_id: `contract_${unit_number}_${Date.now()}.pdf`
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            return reject(new Error("Failed to upload PDF to Cloudinary"));
          }
          resolve(result.secure_url);
        }
      );

      uploadStream.end(pdfBuffer);
    });

  } catch (error) {
    console.error("Error generating Contract PDF:", error);
    throw error;
  }
};

/**
 * Generates the MGC Termination of Lease PDF via HTML/Puppeteer and uploads to Cloudinary.
 * Returns the secure Cloudinary URL.
 */
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

    const fmtDate = (d) => {
      if (!d) return "___________";
      return new Date(d).toLocaleDateString("en-PH", {
        year: "numeric", month: "long", day: "numeric",
      });
    };

    const termDateObj = termination_effective_date ? new Date(termination_effective_date) : new Date();
    const termDay   = termDateObj.getDate();
    const termMonth = termDateObj.toLocaleString("en-PH", { month: "long" });
    const termYear  = String(termDateObj.getFullYear()).slice(-2);

    const replacements = {
      "{{terminationDay}}":           termDay,
      "{{terminationMonth}}":         termMonth,
      "{{terminationYear}}":          termYear,
      "{{terminationCity}}":          termination_city,
      "{{lessorName}}":               lessor_name.toUpperCase(),
      "{{lessorAddress}}":            lessor_address,
      "{{lesseeName}}":               (lessee_name || "[NAME OF LESSEE]").toUpperCase(),
      "{{lesseeAddress}}":            lessee_address || "____________________________________",
      "{{originalContractDate}}":     fmtDate(original_contract_date),
      "{{unitNo}}":                   unit_number,
      "{{terminationEffectiveDate}}": fmtDate(termination_effective_date),
    };

    for (const [key, value] of Object.entries(replacements)) {
      htmlContent = htmlContent.replace(new RegExp(key, "g"), value);
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "60px", right: "60px", bottom: "60px", left: "60px" },
    });
    await browser.close();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `MGC-Building/terminations/unit_${unit_number}`,
          resource_type: "raw",
          type: "upload",
          access_mode: "public",
          public_id: `termination_${unit_number}_${Date.now()}.pdf`,
        },
        (error, result) => {
          if (error) return reject(new Error("Failed to upload termination PDF to Cloudinary"));
          resolve(result.secure_url);
        }
      );
      uploadStream.end(pdfBuffer);
    });
  } catch (error) {
    console.error("Error generating Termination PDF:", error);
    throw error;
  }
};

/**
 * Generates the Tenant Request for Termination PDF via HTML/Puppeteer and uploads to Cloudinary.
 */
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

    const fmtDate = (d) => {
      if (!d) return "___________";
      return new Date(d).toLocaleDateString("en-PH", {
        year: "numeric", month: "long", day: "numeric",
      });
    };

    const replacements = {
      "{{requestDate}}":    fmtDate(request_date || new Date()),
      "{{lessorName}}":     lessor_name,
      "{{buildingName}}":   building_name,
      "{{buildingAddress}}": building_address,
      "{{lesseeName}}":     lessee_name || "[NAME OF LESSEE]",
      "{{unitNo}}":         unit_number,
      "{{contractDate}}":   fmtDate(contract_date),
      "{{vacateDate}}":     fmtDate(vacate_date),
      "{{lesseeAddress}}":  lessee_address || "____________________________________",
    };

    for (const [key, value] of Object.entries(replacements)) {
      htmlContent = htmlContent.replace(new RegExp(key, "g"), value);
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "60px", right: "60px", bottom: "60px", left: "60px" },
    });
    await browser.close();

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `MGC-Building/termination-requests/unit_${unit_number}`,
          resource_type: "raw",
          type: "upload",
          access_mode: "public",
          public_id: `termination_request_${unit_number}_${Date.now()}.pdf`,
        },
        (error, result) => {
          if (error) return reject(new Error("Failed to upload termination request PDF"));
          resolve(result.secure_url);
        }
      );
      uploadStream.end(pdfBuffer);
    });
  } catch (error) {
    console.error("Error generating Tenant Termination Request PDF:", error);
    throw error;
  }
};
