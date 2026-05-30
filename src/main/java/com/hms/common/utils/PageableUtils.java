package com.hms.common.utils;

import com.hms.common.enums.SortDirection;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import org.springframework.data.domain.Pageable;

public final class PageableUtils {

    private PageableUtils(){

    }

    public static Pageable createPageable(Integer page, Integer size, String sortBy, SortDirection direction){
        if(page == null || page < 0){
            page = 0;
        }
        if(size == null || size <=0){
            size =10;
        }
        if(sortBy == null || sortBy.isBlank()){
            sortBy="id";
        }
        if (direction == null){
            direction= SortDirection.ASC;
        }
        Sort sort = direction == SortDirection.DESC
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        return PageRequest.of(page, size, sort);
    }


}
