
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const downloadPersonaAsPDF = async (elementId: string, personaName: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element o ID '${elementId}' nie został znaleziony.`);
    throw new Error("Nie można wygenerować PDF: element źródłowy nie istnieje.");
  }

  // Temporarily increase resolution for better PDF quality if needed.
  // This can be tricky and might affect layout if not handled carefully.
  // const scale = 2; // Example scale factor

  try {
    const canvas = await html2canvas(element, {
      scale: 1.5, // Increase scale for better quality
      useCORS: true, // If images are from external sources
      backgroundColor: '#1f2937', // Match card background or choose a neutral one for PDF
      onclone: (document) => {
        // You can make modifications to the cloned document before rendering
        // For example, ensure all dynamic content is loaded, or change styles for PDF
        const clonedElement = document.getElementById(elementId);
        if (clonedElement) {
            // e.g. clonedElement.style.boxShadow = 'none';
        }
      }
    });
    
    const imgData = canvas.toDataURL('image/png');
    
    // Determine PDF page dimensions based on canvas
    // A4 dimensions in points: 595.28 x 841.89
    // Standard PDF is 72 DPI, canvas may be higher.
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4' // Standard A4 size
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate aspect ratio to fit image on A4 page
    const imgAspectRatio = canvasWidth / canvasHeight;
    const pdfAspectRatio = pdfWidth / pdfHeight;

    let finalImgWidth, finalImgHeight;

    if (imgAspectRatio > pdfAspectRatio) { // Image is wider than page
        finalImgWidth = pdfWidth - 40; // With some margin
        finalImgHeight = finalImgWidth / imgAspectRatio;
    } else { // Image is taller than page
        finalImgHeight = pdfHeight - 40; // With some margin
        finalImgWidth = finalImgHeight * imgAspectRatio;
    }
    
    // Center the image on the page
    const xOffset = (pdfWidth - finalImgWidth) / 2;
    const yOffset = (pdfHeight - finalImgHeight) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalImgWidth, finalImgHeight);
    
    const safePersonaName = personaName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    pdf.save(`persona_${safePersonaName}.pdf`);

  } catch (error) {
    console.error("Błąd podczas generowania PDF z html2canvas:", error);
    throw new Error("Wystąpił problem podczas tworzenia pliku PDF.");
  }
};
    