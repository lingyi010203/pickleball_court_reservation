package com.pickleball_backend.pickleball.dto;
import java.util.Map;
public class ReportRequestDto {
    private String type;
    private String startDate;
    private String endDate;
    private String format;
    private Map<String, Boolean> filters;
    private Map<String, Object> metadata;
    private Map<String, Object> content;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
    public Map<String, Boolean> getFilters() { return filters; }
    public void setFilters(Map<String, Boolean> filters) { this.filters = filters; }
    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    public Map<String, Object> getContent() { return content; }
    public void setContent(Map<String, Object> content) { this.content = content; }
} 