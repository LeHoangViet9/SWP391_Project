package com.hms.entity.booking;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomGuestAllocation {
    private Integer adults;
    private Integer children;
    private Integer infants;
}
