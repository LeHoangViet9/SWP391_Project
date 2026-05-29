package com.hms.repository.hotel;

import com.hms.entity.hotel.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomTypeRepository extends JpaRepository<RoomType,Long> {
    boolean existsByTypeName(String typeName);
    boolean existsByTypeNameAndIdNot(String typeName, Long id);
}
