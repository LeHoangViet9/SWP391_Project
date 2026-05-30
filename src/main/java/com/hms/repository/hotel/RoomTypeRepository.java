package com.hms.repository.hotel;

import com.hms.entity.hotel.RoomType;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Pageable;

public interface RoomTypeRepository extends JpaRepository<RoomType,Long> {

    boolean existsByTypeName(String typeName);

    boolean existsByTypeNameAndIdNot(String typeName, Long id);

    /**Tim theo cột typeName có chứa keywords */
    Page<RoomType> findByTypeNameContainingIgnoreCase (String keywords, Pageable pageable);
}
