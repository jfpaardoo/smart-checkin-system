package org.springframework.samples.smartcheckin.exports;

import java.awt.Color;

import com.lowagie.text.Element;
import com.lowagie.text.Image;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPCellEvent;
import com.lowagie.text.pdf.PdfPTable;

public final class OfficialFormationSheetEvents {

    private OfficialFormationSheetEvents() {
        // Utility class
    }

    public static class BaLogoCellEvent implements PdfPCellEvent {
        @Override
        public void cellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases) {
            PdfContentByte cb = canvases[PdfPTable.TEXTCANVAS];
            float centerX = (position.getLeft() + position.getRight()) / 2f;
            float centerY = (position.getTop() + position.getBottom()) / 2f;
            float radius = Math.min(position.getWidth(), position.getHeight()) * 0.38f;

            cb.setColorFill(Color.BLACK);
            cb.circle(centerX, centerY, radius);
            cb.fill();

            try {
                cb.beginText();
                cb.setFontAndSize(BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.WINANSI, false), radius * 1.02f);
                cb.setColorFill(Color.WHITE);
                cb.showTextAligned(Element.ALIGN_CENTER, "BA", centerX, centerY - radius * 0.35f, 0);
                cb.endText();
            } catch (Exception ignored) {
                // Fallback gracefully if font creation fails
            }
        }
    }

    public static class FixedDottedLinesCellEvent implements PdfPCellEvent {
        private final int numLines;
        private final float firstLineOffset;
        private final float step;

        public FixedDottedLinesCellEvent(int numLines, float firstLineOffset, float step) {
            this.numLines = numLines;
            this.firstLineOffset = firstLineOffset;
            this.step = step;
        }

        @Override
        public void cellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases) {
            PdfContentByte cb = canvases[PdfPTable.LINECANVAS];
            cb.saveState();
            cb.setLineWidth(0.5f);
            cb.setColorStroke(new Color(150, 150, 150));
            cb.setLineDash(0.8f, 1.5f, 0f);

            float x1 = position.getLeft() + 4f;
            float x2 = position.getRight() - 4f;

            for (int i = 0; i < numLines; i++) {
                float y = position.getTop() - firstLineOffset - (i * step);
                if (y > position.getBottom() + 1f) {
                    cb.moveTo(x1, y);
                    cb.lineTo(x2, y);
                }
            }
            cb.stroke();
            cb.restoreState();
        }
    }

    public static class DottedUnderlineCellEvent implements PdfPCellEvent {
        private final float xStartOffset;
        private final float yBottomOffset;

        public DottedUnderlineCellEvent(float xStartOffset) {
            this(xStartOffset, 1.5f);
        }

        public DottedUnderlineCellEvent(float xStartOffset, float yBottomOffset) {
            this.xStartOffset = xStartOffset;
            this.yBottomOffset = yBottomOffset;
        }

        @Override
        public void cellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases) {
            PdfContentByte cb = canvases[PdfPTable.LINECANVAS];
            cb.saveState();
            cb.setLineWidth(0.5f);
            cb.setColorStroke(new Color(140, 140, 140));
            cb.setLineDash(0.8f, 1.5f, 0f);

            float x1 = position.getLeft() + xStartOffset;
            float x2 = position.getRight() - 2f;
            float y = position.getBottom() + yBottomOffset;

            if (x2 > x1) {
                cb.moveTo(x1, y);
                cb.lineTo(x2, y);
                cb.stroke();
            }
            cb.restoreState();
        }
    }

    public static class TrainerSignatureAndUnderlineCellEvent implements PdfPCellEvent {
        private final byte[] signatureBytes;

        public TrainerSignatureAndUnderlineCellEvent(byte[] signatureBytes) {
            this.signatureBytes = signatureBytes;
        }

        @Override
        public void cellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases) {
            // 1. Línea punteada de base
            PdfContentByte lineCb = canvases[PdfPTable.LINECANVAS];
            lineCb.saveState();
            lineCb.setLineWidth(0.5f);
            lineCb.setColorStroke(new Color(140, 140, 140));
            lineCb.setLineDash(0.8f, 1.5f, 0f);

            float x1 = position.getLeft();
            float x2 = position.getRight() - 2f;
            float y = position.getBottom() + 1.5f;

            if (x2 > x1) {
                lineCb.moveTo(x1, y);
                lineCb.lineTo(x2, y);
                lineCb.stroke();
            }
            lineCb.restoreState();

            // 2. Firma estampada y superpuesta directamente sobre el nombre (en el eje Z / 3D)
            if (signatureBytes != null && signatureBytes.length > 0) {
                try {
                    Image tImg = Image.getInstance(signatureBytes);
                    float availableH = Math.max(16f, position.getHeight() - 4f);
                    float maxW = Math.min(position.getWidth() * 0.85f, 120f);
                    float maxH = Math.min(22f, availableH);
                    tImg.scaleToFit(maxW, maxH);

                    float imgW = tImg.getScaledWidth();
                    float imgH = tImg.getScaledHeight();

                    // Centrado horizontal sobre el nombre
                    float imgX = (position.getLeft() + position.getRight() - imgW) / 2f;
                    // Posición vertical: sobrepuesta sobre el nombre y garantizando que no se salga del cuadro
                    float imgY = position.getBottom() + 1.0f;
                    if (imgY + imgH > position.getTop() - 2f) {
                        imgY = position.getTop() - 2f - imgH;
                    }
                    imgY = Math.max(position.getBottom(), imgY);

                    PdfContentByte textCb = canvases[PdfPTable.TEXTCANVAS];
                    textCb.addImage(tImg, imgW, 0, 0, imgH, imgX, imgY);
                } catch (Exception ignored) {
                    // Fallback gracefully if image cannot be added
                }
            }
        }
    }
}
