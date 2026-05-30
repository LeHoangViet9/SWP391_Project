package com.hms.common.utils;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import org.springframework.data.domain.Pageable;
import org.springframework.security.core.parameters.P;

public final class PageableUtils {

    private PageableUtils(){

    }

    public static Pageable createPageable(Integer page, Integer size, String sortBy, String direction){
        if(page == null || page < 0){
            page = 0;
        }
        if(size == null || size <=0){
            size =10;
        }
        if(sortBy == null || sortBy.isBlank()){
            sortBy="id";
        }
        if (direction == null || direction.isBlank()){
            direction="asc";
        }
        Sort sort = "desc".equalsIgnoreCase(direction)
                ? Sort.by(sortBy).descending()
                :Sort.by(sortBy).ascending();
        return PageRequest.of(page, size, sort);
    }


}
