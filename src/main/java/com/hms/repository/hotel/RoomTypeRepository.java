package com.hms.repository.hotel;

import com.hms.common.enums.AccountStatus;
import com.hms.entity.hotel.RoomType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {

    boolean existsByTypeNameAndStatus(String typeName, AccountStatus status);

    boolean existsByTypeNameAndIdNotAndStatus(String typeName, Long id, AccountStatus status);

    Optional<RoomType> findByIdAndStatus(Long id, AccountStatus status);

    Page<RoomType> findByTypeNameContainingIgnoreCaseAndStatus(String keywords, AccountStatus status, Pageable pageable);

    Page<RoomType> findByTypeNameContainingIgnoreCaseAndMaxGuestsGreaterThanEqualAndStatus(
            String keywords,
            Integer maxGuests,
            AccountStatus status,
            Pageable pageable
    );
}