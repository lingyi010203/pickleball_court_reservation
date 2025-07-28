package com.pickleball_backend.pickleball.service;

import java.awt.image.BufferedImage;
import java.util.Map;

public interface ChartService {
    
    /**
     * 生成柱状图
     */
    BufferedImage generateBarChart(String title, Map<String, Number> data, String xAxisLabel, String yAxisLabel);
    
    /**
     * 生成折线图
     */
    BufferedImage generateLineChart(String title, Map<String, Number> data, String xAxisLabel, String yAxisLabel);
    
    /**
     * 生成饼图
     */
    BufferedImage generatePieChart(String title, Map<String, Number> data);
    
    /**
     * 生成收入趋势图
     */
    BufferedImage generateRevenueTrendChart(Map<String, Object> trends, String chartType);
    
    /**
     * 生成预订趋势图
     */
    BufferedImage generateBookingTrendChart(Map<String, Object> trends, String chartType);
    
    /**
     * 生成用户活动图
     */
    BufferedImage generateUserActivityChart(Map<String, Object> trends, String chartType);
} 