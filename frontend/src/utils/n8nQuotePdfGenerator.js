import jsPDF from 'jspdf';

/**
 * Generates a PDF document for an approved n8n quote
 * @param {Object} quoteData - The n8n project quote data
 * @returns {void} - Downloads the PDF file
 */
export function generateN8nQuotePDF(quoteData) {
    if (!quoteData) {
        console.error('PDF Generation failed - No quote data provided');
        alert('Failed to generate PDF. No quote data available.');
        return;
    }

    try {
        console.log('Starting n8n quote PDF generation...', quoteData);
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const maxWidth = pageWidth - 2 * margin;
        let yPosition = margin;

        // Helper function to add text with word wrapping
        const addText = (text, fontSize = 12, isBold = false, color = '#000000') => {
            doc.setFontSize(fontSize);
            if (isBold) {
                doc.setFont(undefined, 'bold');
            } else {
                doc.setFont(undefined, 'normal');
            }
            doc.setTextColor(color);

            const lines = doc.splitTextToSize(text, maxWidth);
            lines.forEach((line) => {
                if (yPosition > 280) { // Near bottom of page
                    doc.addPage();
                    yPosition = margin;
                }
                doc.text(line, margin, yPosition);
                yPosition += fontSize * 0.5;
            });
            yPosition += 5; // Add some spacing after text
        };

        // Header
        addText('N8N WORKFLOW QUOTE', 20, true, '#1976d2');
        yPosition += 10;
        addText(`Generated on: ${new Date().toLocaleDateString()}`, 10);
        yPosition += 15;

        // Workflow Information
        addText('WORKFLOW INFORMATION', 16, true, '#1976d2');
        yPosition += 5;
        addText(`Workflow File: ${quoteData.fileName || 'Unnamed Workflow'}`);
        if (quoteData.workflowId) addText(`Workflow ID: ${quoteData.workflowId}`);
        if (quoteData.fileSize) addText(`File Size: ${(quoteData.fileSize / 1024).toFixed(2)} KB`);
        yPosition += 10;

        // Customer Request
        if (quoteData.customerRequest || quoteData.modifications) {
            addText('CUSTOMER REQUEST', 16, true, '#1976d2');
            yPosition += 5;
            addText(quoteData.customerRequest || quoteData.modifications || 'No specific modifications requested');
            yPosition += 10;
        }

        // Pricing Breakdown
        addText('PRICING BREAKDOWN', 16, true, '#1976d2');
        yPosition += 5;

        if (quoteData.totalPrice !== undefined) {
            addText(`Total Price: $${quoteData.totalPrice.toFixed(2)}`, 14, true, '#059669');
            yPosition += 5;

            if (quoteData.basePrice !== undefined) {
                addText(`• Base Price: $${quoteData.basePrice.toFixed(2)}`);
            }
            if (quoteData.modificationsPrice && quoteData.modificationsPrice > 0) {
                addText(`• Modifications Price: $${quoteData.modificationsPrice.toFixed(2)}`);
            }
            yPosition += 5;
        }

        // Node-by-Node Breakdown
        if (quoteData.nodes && quoteData.nodes.length > 0) {
            yPosition += 5;
            addText('NODE BREAKDOWN', 14, true, '#1976d2');
            yPosition += 5;

            quoteData.nodes.forEach((node, index) => {
                if (yPosition > 260) { // Check if we need a new page
                    doc.addPage();
                    yPosition = margin;
                }

                addText(`${index + 1}. ${node.nodeLabel || node.nodeType}`, 11, true);
                addText(`   Type: ${node.nodeType}`, 10);
                addText(`   Base Price: $${(node.basePrice || 0).toFixed(2)}`, 10);
                if (node.totalPrice !== node.basePrice) {
                    addText(`   Total Price: $${(node.totalPrice || 0).toFixed(2)}`, 10);
                }
                if (node.requiresManualReview) {
                    addText(`   Note: Required manual review`, 10, false, '#dc2626');
                }
                yPosition += 3;
            });

            yPosition += 5;
        }

        // Admin Notes
        if (quoteData.adminNotes) {
            yPosition += 5;
            addText('ADMIN NOTES', 14, true, '#1976d2');
            yPosition += 5;
            addText(quoteData.adminNotes);
            yPosition += 10;
        }

        // Integration Status
        if (quoteData.integrationStatus) {
            addText('INTEGRATION STATUS', 14, true, '#1976d2');
            yPosition += 5;
            const statusColor = quoteData.integrationStatus === 'completed' ? '#059669' :
                quoteData.integrationStatus === 'failed' ? '#dc2626' :
                    quoteData.integrationStatus === 'in_progress' ? '#1976d2' : '#6b7280';
            addText(`Status: ${quoteData.integrationStatus.replace('_', ' ').toUpperCase()}`, 12, true, statusColor);

            if (quoteData.integrationCompletedAt) {
                addText(`Completed: ${new Date(quoteData.integrationCompletedAt).toLocaleString()}`, 10);
            }

            if (quoteData.integrationError) {
                addText(`Error: ${quoteData.integrationError}`, 10, false, '#dc2626');
            }
            yPosition += 10;
        }

        // Timestamps
        addText('TIMELINE', 14, true, '#1976d2');
        yPosition += 5;
        if (quoteData.createdAt) {
            addText(`Created: ${new Date(quoteData.createdAt).toLocaleString()}`);
        }
        if (quoteData.reviewedAt) {
            addText(`Reviewed: ${new Date(quoteData.reviewedAt).toLocaleString()}`);
        }
        if (quoteData.updatedAt) {
            addText(`Last Updated: ${new Date(quoteData.updatedAt).toLocaleString()}`);
        }

        yPosition += 15;
        addText('This document serves as the official n8n workflow quote and pricing agreement.', 10, false, '#666666');

        // Save the PDF
        const fileName = `${(quoteData.fileName || 'n8n_workflow').replace(/[^a-z0-9]/gi, '_')}_quote.pdf`;
        console.log('Saving PDF with filename:', fileName);
        doc.save(fileName);
        console.log('PDF generation completed successfully!');
    } catch (error) {
        console.error('PDF generation failed:', error);
        alert('Failed to generate PDF. Please check console for details.');
    }
}

export default { generateN8nQuotePDF };
