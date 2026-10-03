package vn.edu.dut.connect.reporting.infrastructure;

import java.io.*;
import java.util.List;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;
import vn.edu.dut.connect.reporting.application.*;

@Component
public class PoiExcelReportWriter implements ExcelReportWriter {
    private static final int ROWS_PER_SHEET = 1_048_575;
    public byte[] write(List<ReportQuery.Sheet> sheets) {
        try (var workbook = new XSSFWorkbook(); var output = new ByteArrayOutputStream()) {
            var header = workbook.createCellStyle(); var font = workbook.createFont(); font.setBold(true); font.setColor(IndexedColors.WHITE.getIndex()); header.setFont(font);
            header.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex()); header.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            header.setWrapText(true);
            var body = workbook.createCellStyle(); body.setWrapText(true); body.setVerticalAlignment(VerticalAlignment.TOP);
            workbook.getProperties().getCoreProperties().setDescription("Timestamp columns use UTC. Monetary values and identifiers are exact text.");
            for (var data : sheets) {
                int parts = data.rows().isEmpty() ? 1 : (data.rows().size()-1)/ROWS_PER_SHEET+1;
                int[] widths = widths(data);
                for (int part=0; part<parts; part++) {
                    var sheet = workbook.createSheet(data.name()+(part==0 ? "" : " "+(part+1)));
                    var title = sheet.createRow(0);
                    title.setHeightInPoints(30);
                    for (int col=0; col<data.headers().size(); col++) {
                        var cell=title.createCell(col); var label=data.headers().get(col);
                        cell.setCellValue(label); cell.setCellStyle(header); sheet.setColumnWidth(col,widths[col]*256);
                        if (label.equals("Verified At") || label.equals("Paid At") || label.equals("Reviewed At")) {
                            var anchor=workbook.getCreationHelper().createClientAnchor();
                            anchor.setCol1(col); anchor.setCol2(col+3); anchor.setRow1(1); anchor.setRow2(4);
                            var comment=sheet.createDrawingPatriarch().createCellComment(anchor);
                            comment.setAuthor("DUT Connect"); comment.setString(workbook.getCreationHelper().createRichTextString("ISO timestamp in UTC (Z).")); cell.setCellComment(comment);
                        }
                    }
                    int from=part*ROWS_PER_SHEET, to=Math.min(data.rows().size(),from+ROWS_PER_SHEET);
                    for (int i=from; i<to; i++) {
                        var row=sheet.createRow(i-from+1); var values=data.rows().get(i);
                        // String cells preserve exact VND/identifiers and never execute supplied formulas.
                        for (int col=0; col<values.size(); col++) {
                            var cell=row.createCell(col); var label=data.headers().get(col); var value=values.get(col); cell.setCellStyle(body);
                            if (label.equals("Present Attendance Sessions") || label.equals("Total Attendance Sessions") || label.equals("Successful Donation Count")) cell.setCellValue(Long.parseLong(value));
                            else if (label.endsWith("Status") || label.equals("Assigned Contribution Track")) cell.setCellValue(display(value));
                            else cell.setCellValue(value);
                        }
                        row.setHeightInPoints(height(values,widths));
                    }
                    sheet.createFreezePane(0,1); sheet.setAutoFilter(new CellRangeAddress(0,to-from,0,data.headers().size()-1));
                }
            }
            workbook.write(output); return output.toByteArray();
        } catch (IOException e) { throw new UncheckedIOException("Unable to generate Excel report",e); }
    }
    private int[] widths(ReportQuery.Sheet data) {
        var widths = new int[data.headers().size()];
        for (int col=0; col<widths.length; col++) widths[col]=Math.max(18,data.headers().get(col).length()+2);
        for (var values : data.rows()) for (int col=0; col<values.size(); col++) {
            for (var line : values.get(col).split("\\R",-1)) widths[col]=Math.max(widths[col],line.length()+2);
        }
        for (int col=0; col<widths.length; col++) widths[col]=Math.min(60,widths[col]);
        return widths;
    }
    private float height(List<String> values,int[] widths) {
        int lines=1;
        for (int col=0; col<values.size(); col++) {
            int wrapped=0;
            for (var line : values.get(col).split("\\R",-1)) wrapped+=Math.max(1,(line.length()+widths[col]-3)/(widths[col]-2));
            lines=Math.max(lines,wrapped);
        }
        return Math.min(409,15*lines);
    }
    private String display(String value) {
        if (value.isBlank()) return "";
        String words=value.toLowerCase(java.util.Locale.ROOT).replace('_',' ');
        return Character.toUpperCase(words.charAt(0))+words.substring(1);
    }
}
