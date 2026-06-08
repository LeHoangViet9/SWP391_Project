package com.hms.common.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
public enum SortField {
    ID("id"),
    TYPE_NAME("typeName"),
    BASE_PRICE("basePrice");

    private final String field;

    SortField(String field) {
        this.field = field;
    }
}
