package com.pickleball_backend.pickleball.service;

import org.jfree.chart.ChartFactory;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.plot.PiePlot;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.renderer.category.BarRenderer;
import org.jfree.chart.renderer.category.LineAndShapeRenderer;
import org.jfree.chart.axis.CategoryAxis;
import org.jfree.chart.axis.ValueAxis;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.general.DefaultPieDataset;
import org.jfree.chart.ui.RectangleInsets;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class ChartServiceImpl implements ChartService {

    @Override
    public BufferedImage generateBarChart(String title, Map<String, Number> data, String xAxisLabel, String yAxisLabel) {
        return generateBarChart(title, data, xAxisLabel, yAxisLabel, true);
    }
    
    public BufferedImage generateBarChart(String title, Map<String, Number> data, String xAxisLabel, String yAxisLabel, boolean useBrandColors) {
        DefaultCategoryDataset dataset = new DefaultCategoryDataset();
        
        // 限制数据点数量，避免标签重叠
        List<Map.Entry<String, Number>> sortedData = data.entrySet().stream()
            .sorted((a, b) -> Double.compare(b.getValue().doubleValue(), a.getValue().doubleValue()))
            .limit(12) // 减少到12个数据点
            .collect(Collectors.toList());
        
        for (Map.Entry<String, Number> entry : sortedData) {
            String shortLabel = formatDateLabel(entry.getKey());
            dataset.addValue(entry.getValue().doubleValue(), "Value", shortLabel);
        }
        
        JFreeChart chart = ChartFactory.createBarChart(
            title,
            xAxisLabel,
            yAxisLabel,
            dataset,
            PlotOrientation.VERTICAL,
            false, true, false
        );
        
        // 设置图表样式
        chart.setBackgroundPaint(Color.WHITE);
        BarRenderer renderer = (BarRenderer) chart.getCategoryPlot().getRenderer();
        
        // 根据品牌色彩设置颜色
        if (useBrandColors) {
            renderer.setSeriesPaint(0, new Color(102, 126, 234)); // 品牌蓝色
        } else {
            renderer.setSeriesPaint(0, new Color(70, 130, 180)); // 标准蓝色
        }
        
        // 优化X轴标签显示
        CategoryPlot plot = chart.getCategoryPlot();
        CategoryAxis domainAxis = plot.getDomainAxis();
        domainAxis.setMaximumCategoryLabelLines(1); // 只允许一行
        domainAxis.setCategoryLabelPositionOffset(15); // 增加标签位置偏移
        domainAxis.setTickLabelFont(new Font("Arial", Font.PLAIN, 8)); // 增加字体大小
        domainAxis.setLabelFont(new Font("Arial", Font.BOLD, 10));
        domainAxis.setTickLabelInsets(new RectangleInsets(5, 5, 5, 5)); // 增加标签内边距
        
        // 优化Y轴
        ValueAxis rangeAxis = plot.getRangeAxis();
        rangeAxis.setLabelFont(new Font("Arial", Font.BOLD, 10));
        rangeAxis.setTickLabelFont(new Font("Arial", Font.PLAIN, 9));
        
        // 设置标题字体
        chart.getTitle().setFont(new Font("Arial", Font.BOLD, 14));
        
        // 设置图表边距，为X轴标签留出更多空间
        chart.setPadding(new RectangleInsets(20, 20, 40, 20)); // 增加底部边距
        
        return chart.createBufferedImage(600, 400); // 调整为适合A4的尺寸
    }

    @Override
    public BufferedImage generateLineChart(String title, Map<String, Number> data, String xAxisLabel, String yAxisLabel) {
        return generateLineChart(title, data, xAxisLabel, yAxisLabel, true);
    }
    
    public BufferedImage generateLineChart(String title, Map<String, Number> data, String xAxisLabel, String yAxisLabel, boolean useBrandColors) {
        DefaultCategoryDataset dataset = new DefaultCategoryDataset();
        
        // 对于时间序列数据，按时间排序并限制显示
        List<Map.Entry<String, Number>> sortedData = data.entrySet().stream()
            .sorted((a, b) -> a.getKey().compareTo(b.getKey())) // 按日期排序
            .collect(Collectors.toList());
        
        // 如果数据点太多，进行更激进的采样
        if (sortedData.size() > 15) {
            int step = Math.max(1, sortedData.size() / 15);
            List<Map.Entry<String, Number>> sampledData = new ArrayList<>();
            for (int i = 0; i < sortedData.size(); i += step) {
                sampledData.add(sortedData.get(i));
            }
            // 确保包含最后一个数据点
            if (!sampledData.contains(sortedData.get(sortedData.size() - 1))) {
                sampledData.add(sortedData.get(sortedData.size() - 1));
            }
            sortedData = sampledData;
        }
        
        for (Map.Entry<String, Number> entry : sortedData) {
            String shortLabel = formatDateLabel(entry.getKey());
            dataset.addValue(entry.getValue().doubleValue(), "Value", shortLabel);
        }
        
        JFreeChart chart = ChartFactory.createLineChart(
            title,
            xAxisLabel,
            yAxisLabel,
            dataset,
            PlotOrientation.VERTICAL,
            false, true, false
        );
        
        // 设置图表样式
        chart.setBackgroundPaint(Color.WHITE);
        LineAndShapeRenderer renderer = (LineAndShapeRenderer) chart.getCategoryPlot().getRenderer();
        
        // 根据品牌色彩设置颜色
        if (useBrandColors) {
            renderer.setSeriesPaint(0, new Color(102, 126, 234)); // 品牌蓝色
        } else {
            renderer.setSeriesPaint(0, new Color(70, 130, 180)); // 标准蓝色
        }
        renderer.setSeriesStroke(0, new BasicStroke(3.0f));
        
        // 优化X轴标签显示
        CategoryPlot plot = chart.getCategoryPlot();
        CategoryAxis domainAxis = plot.getDomainAxis();
        domainAxis.setMaximumCategoryLabelLines(1); // 只允许一行
        domainAxis.setCategoryLabelPositionOffset(15); // 增加标签位置偏移
        domainAxis.setTickLabelFont(new Font("Arial", Font.PLAIN, 8)); // 增加字体大小
        domainAxis.setLabelFont(new Font("Arial", Font.BOLD, 10));
        domainAxis.setTickLabelInsets(new RectangleInsets(5, 5, 5, 5)); // 增加标签内边距
        
        // 优化Y轴
        ValueAxis rangeAxis = plot.getRangeAxis();
        rangeAxis.setLabelFont(new Font("Arial", Font.BOLD, 10));
        rangeAxis.setTickLabelFont(new Font("Arial", Font.PLAIN, 9));
        
        // 设置标题字体
        chart.getTitle().setFont(new Font("Arial", Font.BOLD, 14));
        
        // 设置图表边距，为X轴标签留出更多空间
        chart.setPadding(new RectangleInsets(20, 20, 40, 20)); // 增加底部边距
        
        return chart.createBufferedImage(600, 400); // 调整为适合A4的尺寸
    }

    @Override
    public BufferedImage generatePieChart(String title, Map<String, Number> data) {
        return generatePieChart(title, data, true);
    }
    
    public BufferedImage generatePieChart(String title, Map<String, Number> data, boolean useBrandColors) {
        DefaultPieDataset dataset = new DefaultPieDataset();
        
        // 限制饼图的数据点数量
        List<Map.Entry<String, Number>> sortedData = data.entrySet().stream()
            .sorted((a, b) -> Double.compare(b.getValue().doubleValue(), a.getValue().doubleValue()))
            .limit(6) // 减少到6个切片
            .collect(Collectors.toList());
        
        for (Map.Entry<String, Number> entry : sortedData) {
            String shortLabel = formatDateLabel(entry.getKey());
            dataset.setValue(shortLabel, entry.getValue().doubleValue());
        }
        
        JFreeChart chart = ChartFactory.createPieChart(
            title,
            dataset,
            true, true, false
        );
        
        // 设置图表样式
        chart.setBackgroundPaint(Color.WHITE);
        PiePlot plot = (PiePlot) chart.getPlot();
        plot.setBackgroundPaint(Color.WHITE);
        plot.setLabelFont(new Font("Arial", Font.PLAIN, 8)); // 减小标签字体
        plot.setLabelGenerator(new org.jfree.chart.labels.StandardPieSectionLabelGenerator(
            "{0}: {1}", new java.text.DecimalFormat("0"), new java.text.DecimalFormat("0.0%")
        ));
        
        // 根据品牌色彩设置颜色
        if (useBrandColors) {
            // 使用品牌色彩方案
            plot.setSectionPaint(0, new Color(102, 126, 234)); // 品牌蓝色
            plot.setSectionPaint(1, new Color(255, 193, 7));   // 品牌黄色
            plot.setSectionPaint(2, new Color(40, 167, 69));   // 品牌绿色
            plot.setSectionPaint(3, new Color(220, 53, 69));   // 品牌红色
            plot.setSectionPaint(4, new Color(108, 117, 125)); // 品牌灰色
            plot.setSectionPaint(5, new Color(23, 162, 184));  // 品牌青色
        }
        
        // 设置标题字体
        chart.getTitle().setFont(new Font("Arial", Font.BOLD, 14));
        
        return chart.createBufferedImage(600, 400);
    }

    @Override
    public BufferedImage generateRevenueTrendChart(Map<String, Object> trends, String chartType) {
        if (trends == null || !trends.containsKey("dailyRevenue")) {
            return null;
        }
        
        @SuppressWarnings("unchecked")
        Map<String, Object> dailyRevenue = (Map<String, Object>) trends.get("dailyRevenue");
        
        if (dailyRevenue == null || dailyRevenue.isEmpty()) {
            return null;
        }
        
        // 转换为Number类型的Map
        Map<String, Number> data = convertToNumberMap(dailyRevenue);
        
        // 检查是否使用品牌色彩
        boolean useBrandColors = true; // 默认使用品牌色彩
        if (trends.containsKey("useBrandColors")) {
            useBrandColors = (Boolean) trends.get("useBrandColors");
        }
        
        switch (chartType.toLowerCase()) {
            case "bar":
                return generateBarChart("Daily Revenue Trend (Top 12 Days)", data, "Date", "Revenue (RM)", useBrandColors);
            case "line":
                return generateLineChart("Daily Revenue Trend", data, "Date", "Revenue (RM)", useBrandColors);
            case "pie":
                return generatePieChart("Revenue Distribution (Top 6 Days)", data, useBrandColors);
            default:
                return generateBarChart("Daily Revenue Trend (Top 12 Days)", data, "Date", "Revenue (RM)", useBrandColors);
        }
    }

    @Override
    public BufferedImage generateBookingTrendChart(Map<String, Object> trends, String chartType) {
        if (trends == null || !trends.containsKey("dailyBookings")) {
            return null;
        }
        
        @SuppressWarnings("unchecked")
        Map<String, Object> dailyBookings = (Map<String, Object>) trends.get("dailyBookings");
        
        if (dailyBookings == null || dailyBookings.isEmpty()) {
            return null;
        }
        
        // 转换为Number类型的Map
        Map<String, Number> data = convertToNumberMap(dailyBookings);
        
        // 检查是否使用品牌色彩
        boolean useBrandColors = true; // 默认使用品牌色彩
        if (trends.containsKey("useBrandColors")) {
            useBrandColors = (Boolean) trends.get("useBrandColors");
        }
        
        switch (chartType.toLowerCase()) {
            case "bar":
                return generateBarChart("Daily Booking Trend (Top 12 Days)", data, "Date", "Bookings", useBrandColors);
            case "line":
                return generateLineChart("Daily Booking Trend", data, "Date", "Bookings", useBrandColors);
            case "pie":
                return generatePieChart("Booking Distribution (Top 6 Days)", data, useBrandColors);
            default:
                return generateBarChart("Daily Booking Trend (Top 12 Days)", data, "Date", "Bookings", useBrandColors);
        }
    }

    @Override
    public BufferedImage generateUserActivityChart(Map<String, Object> trends, String chartType) {
        if (trends == null) {
            return null;
        }
        
        // 创建用户活动数据
        Map<String, Number> data = new java.util.HashMap<>();
        
        if (trends.containsKey("activeUsers")) {
            Number activeUsers = (Number) trends.get("activeUsers");
            data.put("Active Users", activeUsers);
        }
        
        if (trends.containsKey("userActivityRate")) {
            Number activityRate = (Number) trends.get("userActivityRate");
            data.put("Activity Rate (%)", activityRate);
        }
        
        if (data.isEmpty()) {
            return null;
        }
        
        // 检查是否使用品牌色彩
        boolean useBrandColors = true; // 默认使用品牌色彩
        if (trends.containsKey("useBrandColors")) {
            useBrandColors = (Boolean) trends.get("useBrandColors");
        }
        
        switch (chartType.toLowerCase()) {
            case "bar":
                return generateBarChart("User Activity Overview", data, "Metric", "Value", useBrandColors);
            case "line":
                return generateLineChart("User Activity Overview", data, "Metric", "Value", useBrandColors);
            case "pie":
                return generatePieChart("User Activity Distribution", data, useBrandColors);
            default:
                return generateBarChart("User Activity Overview", data, "Metric", "Value", useBrandColors);
        }
    }
    
    /**
     * 格式化日期标签，使其更短更易读
     */
    private String formatDateLabel(String dateStr) {
        try {
            // 尝试解析日期格式
            if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
                LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
                return date.format(DateTimeFormatter.ofPattern("M/d")); // 只显示月/日，去掉前导零
            } else if (dateStr.matches("\\d{2}-\\d{2}-\\d{4}")) {
                LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                return date.format(DateTimeFormatter.ofPattern("M/d")); // 只显示月/日，去掉前导零
            }
        } catch (Exception e) {
            // 如果解析失败，返回原始字符串的前8个字符
            return dateStr.length() > 8 ? dateStr.substring(0, 8) : dateStr;
        }
        return dateStr;
    }
    
    @SuppressWarnings("unchecked")
    private Map<String, Number> convertToNumberMap(Map<String, Object> data) {
        Map<String, Number> result = new java.util.HashMap<>();
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            if (entry.getValue() instanceof Number) {
                result.put(entry.getKey(), (Number) entry.getValue());
            }
        }
        return result;
    }
} 