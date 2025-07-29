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
import java.awt.geom.Rectangle2D;
import java.awt.RenderingHints;

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
            .limit(10) // 减少到10个数据点，提高可读性
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
        
        // 设置柱状图样式
        renderer.setBarPainter(new org.jfree.chart.renderer.category.StandardBarPainter());
        renderer.setShadowVisible(false); // 移除阴影
        renderer.setDrawBarOutline(true);
        
        // 优化X轴标签显示
        CategoryPlot plot = chart.getCategoryPlot();
        CategoryAxis domainAxis = plot.getDomainAxis();
        domainAxis.setMaximumCategoryLabelLines(1); // 只允许一行
        domainAxis.setCategoryLabelPositionOffset(20); // 增加标签位置偏移
        domainAxis.setTickLabelFont(new Font("Arial", Font.PLAIN, 10)); // 增加字体大小
        domainAxis.setLabelFont(new Font("Arial", Font.BOLD, 12));
        domainAxis.setTickLabelInsets(new RectangleInsets(8, 8, 8, 8)); // 增加标签内边距
        domainAxis.setTickLabelPaint(Color.BLACK);
        
        // 优化Y轴
        ValueAxis rangeAxis = plot.getRangeAxis();
        rangeAxis.setLabelFont(new Font("Arial", Font.BOLD, 12));
        rangeAxis.setTickLabelFont(new Font("Arial", Font.PLAIN, 10));
        rangeAxis.setTickLabelPaint(Color.BLACK);
        rangeAxis.setAxisLinePaint(Color.BLACK);
        rangeAxis.setTickMarkPaint(Color.BLACK);
        
        // 设置标题字体
        chart.getTitle().setFont(new Font("Arial", Font.BOLD, 16));
        chart.getTitle().setPaint(Color.BLACK);
        
        // 设置图表边距，为X轴标签留出更多空间
        chart.setPadding(new RectangleInsets(25, 25, 50, 25)); // 增加底部边距
        
        // 设置网格线
        plot.setDomainGridlinePaint(new Color(200, 200, 200));
        plot.setRangeGridlinePaint(new Color(200, 200, 200));
        plot.setDomainGridlineStroke(new BasicStroke(0.5f));
        plot.setRangeGridlineStroke(new BasicStroke(0.5f));
        
        return createHighQualityImage(chart, 500, 300); // 减小尺寸，避免PDF渲染问题
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
        if (sortedData.size() > 12) {
            int step = Math.max(1, sortedData.size() / 12);
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
        renderer.setSeriesShapesVisible(0, true);
        renderer.setSeriesShapesFilled(0, true);
        renderer.setUseFillPaint(true);
        renderer.setSeriesFillPaint(0, new Color(102, 126, 234, 50)); // 半透明填充
        
        // 优化X轴标签显示
        CategoryPlot plot = chart.getCategoryPlot();
        CategoryAxis domainAxis = plot.getDomainAxis();
        domainAxis.setMaximumCategoryLabelLines(1); // 只允许一行
        domainAxis.setCategoryLabelPositionOffset(20); // 增加标签位置偏移
        domainAxis.setTickLabelFont(new Font("Arial", Font.PLAIN, 10)); // 增加字体大小
        domainAxis.setLabelFont(new Font("Arial", Font.BOLD, 12));
        domainAxis.setTickLabelInsets(new RectangleInsets(8, 8, 8, 8)); // 增加标签内边距
        domainAxis.setTickLabelPaint(Color.BLACK);
        
        // 优化Y轴
        ValueAxis rangeAxis = plot.getRangeAxis();
        rangeAxis.setLabelFont(new Font("Arial", Font.BOLD, 12));
        rangeAxis.setTickLabelFont(new Font("Arial", Font.PLAIN, 10));
        rangeAxis.setTickLabelPaint(Color.BLACK);
        rangeAxis.setAxisLinePaint(Color.BLACK);
        rangeAxis.setTickMarkPaint(Color.BLACK);
        
        // 设置标题字体
        chart.getTitle().setFont(new Font("Arial", Font.BOLD, 16));
        chart.getTitle().setPaint(Color.BLACK);
        
        // 设置图表边距，为X轴标签留出更多空间
        chart.setPadding(new RectangleInsets(25, 25, 50, 25)); // 增加底部边距
        
        // 设置网格线
        plot.setDomainGridlinePaint(new Color(200, 200, 200));
        plot.setRangeGridlinePaint(new Color(200, 200, 200));
        plot.setDomainGridlineStroke(new BasicStroke(0.5f));
        plot.setRangeGridlineStroke(new BasicStroke(0.5f));
        
        return createHighQualityImage(chart, 500, 300); // 减小尺寸，避免PDF渲染问题
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
            .limit(5) // 减少到5个切片，提高可读性
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
        plot.setLabelFont(new Font("Arial", Font.PLAIN, 10)); // 增加标签字体
        plot.setLabelGenerator(new org.jfree.chart.labels.StandardPieSectionLabelGenerator(
            "{0}: {1}", new java.text.DecimalFormat("0"), new java.text.DecimalFormat("0.0%")
        ));
        plot.setLabelLinkStyle(org.jfree.chart.plot.PieLabelLinkStyle.QUAD_CURVE);
        plot.setLabelLinkPaint(Color.BLACK);
        plot.setLabelOutlinePaint(Color.WHITE);
        plot.setLabelOutlineStroke(new BasicStroke(1.0f));
        
        // 根据品牌色彩设置颜色
        if (useBrandColors) {
            // 使用品牌色彩方案
            Color[] brandColors = {
                new Color(102, 126, 234), // 品牌蓝色
                new Color(255, 193, 7),   // 品牌黄色
                new Color(40, 167, 69),   // 品牌绿色
                new Color(220, 53, 69),   // 品牌红色
                new Color(108, 117, 125)  // 品牌灰色
            };
            
            for (int i = 0; i < Math.min(brandColors.length, dataset.getItemCount()); i++) {
                plot.setSectionPaint(dataset.getKey(i), brandColors[i]);
            }
        } else {
            // 使用标准色彩方案
            Color[] standardColors = {
                new Color(70, 130, 180),  // 标准蓝色
                new Color(255, 140, 0),   // 标准橙色
                new Color(34, 139, 34),   // 标准绿色
                new Color(220, 20, 60),   // 标准红色
                new Color(128, 128, 128)  // 标准灰色
            };
            
            for (int i = 0; i < Math.min(standardColors.length, dataset.getItemCount()); i++) {
                plot.setSectionPaint(dataset.getKey(i), standardColors[i]);
            }
        }
        
        // 设置标题字体
        chart.getTitle().setFont(new Font("Arial", Font.BOLD, 16));
        chart.getTitle().setPaint(Color.BLACK);
        
        // 设置图例
        chart.getLegend().setItemFont(new Font("Arial", Font.PLAIN, 10));
        chart.getLegend().setBackgroundPaint(Color.WHITE);
        chart.getLegend().setFrame(new org.jfree.chart.block.BlockBorder(Color.LIGHT_GRAY));
        
        return createHighQualityImage(chart, 500, 300); // 减小尺寸，避免PDF渲染问题
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
        
        BufferedImage result = null;
        switch (chartType.toLowerCase()) {
            case "bar":
                result = generateBarChart("Daily Revenue Trend (Top 10 Days)", data, "Date", "Revenue (RM)", useBrandColors);
                break;
            case "line":
                result = generateLineChart("Daily Revenue Trend", data, "Date", "Revenue (RM)", useBrandColors);
                break;
            case "pie":
                result = generatePieChart("Revenue Distribution (Top 5 Days)", data, useBrandColors);
                break;
            default:
                result = generateBarChart("Daily Revenue Trend (Top 10 Days)", data, "Date", "Revenue (RM)", useBrandColors);
                break;
        }
        
        return result;
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
        
        // 处理基本用户指标
        if (trends.containsKey("activeUsers")) {
            Number activeUsers = (Number) trends.get("activeUsers");
            data.put("Active Users", activeUsers);
        }
        
        if (trends.containsKey("newUsers")) {
            Number newUsers = (Number) trends.get("newUsers");
            data.put("New Users", newUsers);
        }
        
        if (trends.containsKey("userActivityRate")) {
            Number activityRate = (Number) trends.get("userActivityRate");
            data.put("Activity Rate (%)", activityRate);
        }
        
        // 处理按用户预订分布数据
        if (trends.containsKey("bookingsPerUser")) {
            Object bookingsPerUserObj = trends.get("bookingsPerUser");
            if (bookingsPerUserObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> bookingsPerUser = (Map<String, Object>) bookingsPerUserObj;
                
                // 取前5个最活跃用户
                List<Map.Entry<String, Object>> topUsers = bookingsPerUser.entrySet().stream()
                    .sorted((a, b) -> {
                        Number aValue = (Number) a.getValue();
                        Number bValue = (Number) b.getValue();
                        return Long.compare(bValue.longValue(), aValue.longValue());
                    })
                    .limit(5)
                    .collect(Collectors.toList());
                
                for (Map.Entry<String, Object> entry : topUsers) {
                    String userName = entry.getKey();
                    Number bookings = (Number) entry.getValue();
                    data.put(userName, bookings);
                }
            }
        }
        
        // 处理顶级活跃用户数据
        if (trends.containsKey("topActiveUsers")) {
            Object topActiveUsersObj = trends.get("topActiveUsers");
            if (topActiveUsersObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> topActiveUsers = (List<Map<String, Object>>) topActiveUsersObj;
                
                // 清空之前的数据，使用顶级活跃用户数据
                data.clear();
                for (Map<String, Object> user : topActiveUsers) {
                    String userName = String.valueOf(user.get("user"));
                    Number bookings = (Number) user.get("bookings");
                    data.put(userName, bookings);
                }
            }
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
                return generateBarChart("User Activity Overview", data, "User", "Bookings", useBrandColors);
            case "line":
                return generateLineChart("User Activity Overview", data, "User", "Bookings", useBrandColors);
            case "pie":
                return generatePieChart("User Activity Distribution", data, useBrandColors);
            default:
                return generateBarChart("User Activity Overview", data, "User", "Bookings", useBrandColors);
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
                return date.format(DateTimeFormatter.ofPattern("MM/dd")); // 显示月/日，保持前导零
            } else if (dateStr.matches("\\d{2}-\\d{2}-\\d{4}")) {
                LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                return date.format(DateTimeFormatter.ofPattern("MM/dd")); // 显示月/日，保持前导零
            } else if (dateStr.matches("\\d{1,2}/\\d{1,2}/\\d{4}")) {
                // 处理已有的MM/dd/yyyy格式
                return dateStr.substring(0, 5); // 只取MM/dd部分
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

    /**
     * 生成高DPI的图表，提高PDF中的显示质量
     */
    private BufferedImage createHighQualityImage(JFreeChart chart, int width, int height) {
        // 创建高DPI的BufferedImage
        BufferedImage image = new BufferedImage(width * 2, height * 2, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = image.createGraphics();
        
        // 设置高质量渲染
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2d.setRenderingHint(RenderingHints.KEY_ALPHA_INTERPOLATION, RenderingHints.VALUE_ALPHA_INTERPOLATION_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_COLOR_RENDERING, RenderingHints.VALUE_COLOR_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_DITHERING, RenderingHints.VALUE_DITHER_ENABLE);
        g2d.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_STROKE_CONTROL, RenderingHints.VALUE_STROKE_PURE);
        
        // 绘制图表
        chart.draw(g2d, new Rectangle2D.Double(0, 0, width * 2, height * 2));
        g2d.dispose();
        
        return image;
    }
} 