package com.hms.common.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PageResponse <T>{
    private int currentPage;
    private int totalPages;
    private long totalElements;
    private List<T> content;
}
