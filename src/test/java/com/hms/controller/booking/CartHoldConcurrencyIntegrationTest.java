package com.hms.controller.booking;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.RoomStatus;
import com.hms.dto.booking.request.CartHoldItemRequest;
import com.hms.dto.booking.request.CartHoldRequest;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.hotel.RoomTypeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

@SpringBootTest
@AutoConfigureMockMvc
class CartHoldConcurrencyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private RoomType roomType;
    private Room room;

    @BeforeEach
    void setUp() {
        String suffix = String.valueOf(System.nanoTime());
        roomType = roomTypeRepository.save(RoomType.builder()
                .typeName("CART-CONCURRENCY-" + suffix)
                .description("Cart hold concurrency test room type")
                .basePrice(500000)
                .maxGuests(2)
                .status(AccountStatus.ACTIVE)
                .build());
        room = roomRepository.save(Room.builder()
                .roomNumber("CART-CONCURRENCY-" + suffix)
                .floorNumber(1)
                .roomType(roomType)
                .roomStatus(RoomStatus.AVAILABLE)
                .description("Cart hold concurrency test room")
                .build());
    }

    @AfterEach
    void tearDown() {
        List<Long> holdIds = jdbcTemplate.queryForList(
                "SELECT DISTINCT item.cart_hold_id FROM cart_hold_items item "
                        + "JOIN cart_hold_rooms held ON held.cart_hold_item_id = item.id "
                        + "WHERE held.room_id = ?",
                Long.class,
                room.getId());
        for (Long holdId : holdIds) {
            jdbcTemplate.update("DELETE FROM cart_hold_rooms WHERE cart_hold_item_id IN "
                    + "(SELECT id FROM cart_hold_items WHERE cart_hold_id = ?)", holdId);
            jdbcTemplate.update("DELETE FROM cart_hold_items WHERE cart_hold_id = ?", holdId);
            jdbcTemplate.update("DELETE FROM cart_holds WHERE id = ?", holdId);
        }
        roomRepository.delete(room);
        roomTypeRepository.delete(roomType);
    }

    @Test
    void onlyOneCartHoldSucceedsWhenTwoRequestsTargetTheSameRoomConcurrently() throws Exception {
        String body = objectMapper.writeValueAsString(CartHoldRequest.builder()
                .items(List.of(CartHoldItemRequest.builder()
                        .roomTypeId(roomType.getId())
                        .checkInDate(LocalDateTime.now().plusDays(5))
                        .checkOutDate(LocalDateTime.now().plusDays(7))
                        .quantity(1)
                        .build()))
                .build());

        CyclicBarrier barrier = new CyclicBarrier(2);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (int i = 0; i < 2; i++) {
                futures.add(executor.submit(() -> {
                    barrier.await();
                    return mockMvc.perform(post("/api/v1/cart-holds")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(body))
                            .andReturn().getResponse().getStatus();
                }));
            }

            List<Integer> statuses = List.of(futures.get(0).get(), futures.get(1).get());
            assertEquals(2, statuses.size());
            assertTrue(statuses.contains(201), "One request must create the cart hold");
            assertTrue(statuses.contains(409), "The competing request must receive a conflict");
        } finally {
            executor.shutdownNow();
        }
    }
}
