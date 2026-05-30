package com.hms.common.utils;

import com.hms.common.config.PaginationProperties;
import com.hms.common.enums.SortDirection;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PageableUtils {

    private final PaginationProperties paginationProperties;

    public Pageable createPageable(
            Integer page,
            Integer size,
            String sortBy,
            SortDirection direction) {

        if (page == null || page <= 0) {
            page = paginationProperties.getDefaultPage();
        }

        if (size == null || size <= 0) {
            size = paginationProperties.getDefaultSize();
        }

        if (size > paginationProperties.getMaxSize()) {
            size = paginationProperties.getMaxSize();
        }

        if (sortBy == null || sortBy.isBlank()) {
            sortBy = "id";
        }

        if (direction == null) {
            direction = SortDirection.ASC;
        }

        Sort sort = direction == SortDirection.DESC
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        return PageRequest.of(page - 1, size, sort);
    }
}