package com.hms.common.utils;

import com.hms.common.config.PaginationProperties;
import com.hms.common.enums.SortDirection;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PageableUtils {

    private final PaginationProperties paginationProperties;

    public Pageable createPageable(
            Integer page,
            Integer size,
            String sortBy,
            SortDirection direction
    ) {
        if (page == null || page < 0) {
            page = 0;
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

        return PageRequest.of(page, size, sort);
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public <T> void sortList(
            java.util.List<T> list,
            com.hms.common.enums.SortField sortBy,
            SortDirection direction,
            java.util.Map<String, java.util.function.Function<T, Comparable<?>>> extractorMap) {

        java.util.Comparator<T> comparator = (item1, item2) -> 0;

        String field = sortBy.getField();
        if (extractorMap.containsKey(field)) {
            java.util.function.Function<T, Comparable<?>> extractor = extractorMap.get(field);
            comparator = (item1, item2) -> {
                Comparable val1 = extractor.apply(item1);
                Comparable val2 = extractor.apply(item2);
                if (val1 == null && val2 == null) return 0;
                if (val1 == null) return 1;
                if (val2 == null) return -1;
                return val1.compareTo(val2);
            };
        }

        if (direction == SortDirection.DESC) {
            comparator = comparator.reversed();
        }

        list.sort(comparator);
    }

    public <T> org.springframework.data.domain.Page<T> paginate(
            java.util.List<T> list,
            Pageable pageable
    ) {
        int total = list.size();
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), total);

        java.util.List<T> pageContent;
        if (start > total) {
            pageContent = java.util.Collections.emptyList();
        } else {
            pageContent = list.subList(start, end);
        }

        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, total);
    }
}