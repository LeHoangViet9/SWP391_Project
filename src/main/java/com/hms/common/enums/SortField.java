package com.hms.common.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
public enum SortField {
    ID("id"),
    TYPE_NAME("typeName"),
    BASE_PRICE("basePrice"),
    ROOM_ID("room.id"),
    ASSIGNED_TO_ID("assignedTo.id"),
    ASSIGNED_BY_ID("assignedBy.id"),
    STATUS("taskStatus"),
    CREATED_AT("createdAt"),
    UPDATED_AT("updatedAt");

    private final String field;

    SortField(String field) {
        this.field = field;
    }
}
