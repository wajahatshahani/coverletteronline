const form = document.getElementById("coverForm");
const result = document.getElementById("result");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadPdf");
const generateBtn = form.querySelector("button[type='submit']");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    name: document.getElementById("name").value.trim(),
    jobTitle: document.getElementById("jobTitle").value.trim(),
    company: document.getElementById("company").value.trim(),
    experience: document.getElementById("experience").value.trim(),
    skills: document.getElementById("skills").value.trim(),
    tone: document.getElementById("tone").value
  };

  if (!data.name || !data.jobTitle || !data.company) {
    result.value = "❌ Please fill in all required fields (Name, Job Title, Company).";
    return;
  }

  result.value = "Generating your cover letter...";
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
  generateBtn.disabled = true;
  generateBtn.textContent = "Generating...";

  try {
    const res = await fetch("http://localhost:5000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorJson = await res.json();
      throw new Error(errorJson.error || "Server error");
    }

    const json = await res.json();
    result.value = json.coverLetter || "❌ Failed to generate a cover letter. No output returned.";

    copyBtn.disabled = false;
    downloadBtn.disabled = false;

  } catch (err) {
    console.error("API Error:", err);
    result.value = `❌ Failed to generate cover letter. ${err.message}`;
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate Cover Letter";
  }
});

// Copy to clipboard
copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(result.value);
    alert("✅ Copied to clipboard!");
  } catch (err) {
    alert("❌ Failed to copy text.");
  }
});

// Download as PDF
downloadBtn.addEventListener("click", () => {
  if (!result.value) {
    alert("Nothing to download.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;
  const textLines = doc.splitTextToSize(result.value, pageWidth);

  doc.setFont("Times", "Normal");
  doc.setFontSize(12);
  doc.text(textLines, margin, 25);
  doc.save("AI_Cover_Letter.pdf");
});
