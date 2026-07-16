package com.hms.controller.booking;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.IdType;
import com.hms.common.enums.RoomStatus;
import com.hms.dto.booking.request.BookingRequest;
import com.hms.entity.booking.Booking;
import com.hms.entity.customer.Customer;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.customer.CustomerRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.hotel.RoomTypeRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;

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
class BookingConcurrencyIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Customer customer;
    private RoomType roomType;
    private Room room;

    @BeforeEach
    void setUp() {
        String suffix = String.valueOf(System.nanoTime());
        customer = customerRepository.save(Customer.builder()
                .fullName("Concurrency Customer")
                .email("concurrency." + suffix + "@hms-test.com")
                .phone("09" + String.format("%08d", Math.abs(System.nanoTime()) % 100000000L))
                .idType(IdType.CCCD)
                .idNumberCard(String.format("%012d", Math.abs(System.nanoTime()) % 1000000000000L))
                .nationality("Vietnam")
                .status(AccountStatus.ACTIVE)
                .build());

        roomType = roomTypeRepository.save(RoomType.builder()
                .typeName("CONCURRENCY-" + suffix)
                .description("Concurrency test room type")
                .basePrice(500000)
                .maxGuests(2)
                .status(AccountStatus.ACTIVE)
                .build());

        room = roomRepository.save(Room.builder()
                .roomNumber("CONCURRENCY-" + suffix)
                .floorNumber(1)
                .roomType(roomType)
                .roomStatus(RoomStatus.AVAILABLE)
                .description("Concurrency test room")
                .build());
    }

    @AfterEach
    void tearDown() {
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(booking -> booking.getCustomer() != null
                        && booking.getCustomer().getId().equals(customer.getId()))
                .toList();
        bookings.forEach(booking -> {
            jdbcTemplate.update("DELETE FROM booking_rooms WHERE booking_id = ?", booking.getId());
            jdbcTemplate.update("DELETE FROM booking_room_guests WHERE booking_id = ?", booking.getId());
            jdbcTemplate.update("DELETE FROM invoices WHERE booking_id = ?", booking.getId());
            bookingRepository.deleteById(booking.getId());
        });
        roomRepository.delete(room);
        roomTypeRepository.delete(roomType);
        customerRepository.delete(customer);
    }

    @Test
    void onlyOneBookingSucceedsWhenTwoRequestsTargetTheSameRoomConcurrently() throws Exception {
        BookingRequest request = new BookingRequest();
        request.setCustomerId(customer.getId());
        request.setRoomTypeId(roomType.getId());
        request.setCheckInDate(LocalDateTime.now().plusDays(5));
        request.setCheckOutDate(LocalDateTime.now().plusDays(7));
        request.setQuantity(1);
        String body = objectMapper.writeValueAsString(request);

        CyclicBarrier barrier = new CyclicBarrier(2);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            List<Future<Integer>> futures = new ArrayList<>();
            for (int i = 0; i < 2; i++) {
                futures.add(executor.submit(() -> {
                    barrier.await();
                    return mockMvc.perform(post("/api/v1/bookings")
                                    .with(SecurityMockMvcRequestPostProcessors.user("concurrency-user")
                                            .authorities(new SimpleGrantedAuthority("BOOKING_CREATE")))
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(body))
                            .andReturn().getResponse().getStatus();
                }));
            }

            List<Integer> statuses = List.of(futures.get(0).get(), futures.get(1).get());
            assertEquals(2, statuses.size());
            assertTrue(statuses.contains(201), "One request must create the booking");
            assertTrue(statuses.contains(409), "The competing request must receive a conflict");
        } finally {
            executor.shutdownNow();
        }
    }
}
