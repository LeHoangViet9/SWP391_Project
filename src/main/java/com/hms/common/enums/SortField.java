package com.hms.common.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SortField {
    ID("id"),
    TYPE_NAME("typeName"),
    BASE_PRICE("basePrice");

    private final String field;
}
