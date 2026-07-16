package com.hms.controller.booking;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.CartHoldStatus;
import com.hms.common.enums.IdType;
import com.hms.common.enums.PaymentStatus;
import com.hms.common.enums.RoomStatus;
import com.hms.dto.booking.request.CartHoldItemRequest;
import com.hms.dto.booking.request.CartHoldRequest;
import com.hms.entity.booking.Booking;
import com.hms.entity.booking.CartHold;
import com.hms.entity.customer.Customer;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.booking.CartHoldRepository;
import com.hms.repository.customer.CustomerRepository;
import com.hms.repository.hotel.RoomRepository;
import com.hms.repository.hotel.RoomTypeRepository;
import com.hms.service.booking.CartHoldService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CartHoldIntegrationTest {

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
    private CartHoldRepository cartHoldRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CartHoldService cartHoldService;

    private Customer customer;
    private RoomType roomType;
    private Room room;

    @BeforeEach
    void setUp() {
        String suffix = String.valueOf(System.nanoTime());
        customer = customerRepository.save(Customer.builder()
                .fullName("Cart Hold Customer")
                .email("cart-hold." + suffix + "@hms-test.com")
                .phone("09" + String.format("%08d", Math.abs(System.nanoTime()) % 100000000L))
                .idType(IdType.CCCD)
                .idNumberCard(String.format("%012d", Math.abs(System.nanoTime()) % 1000000000000L))
                .nationality("Vietnam")
                .status(AccountStatus.ACTIVE)
                .build());
        roomType = roomTypeRepository.save(RoomType.builder()
                .typeName("CART-HOLD-" + suffix)
                .description("Cart hold test room type")
                .basePrice(500000)
                .maxGuests(2)
                .status(AccountStatus.ACTIVE)
                .build());
        room = roomRepository.save(Room.builder()
                .roomNumber("CART-HOLD-" + suffix)
                .floorNumber(1)
                .roomType(roomType)
                .roomStatus(RoomStatus.AVAILABLE)
                .description("Cart hold test room")
                .build());
    }

    @Test
    void creatingAndDeletingCartHoldLocksThenReleasesRoom() throws Exception {
        String response = createHold();
        JsonNode data = objectMapper.readTree(response).path("data");
        String token = data.path("holdToken").asText();

        assertEquals(RoomStatus.RESERVED, roomRepository.findById(room.getId()).orElseThrow().getRoomStatus());
        mockMvc.perform(get("/api/v1/cart-holds/" + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andExpect(jsonPath("$.data.items", hasSize(1)));

        mockMvc.perform(delete("/api/v1/cart-holds/" + token))
                .andExpect(status().isOk());

        assertEquals(RoomStatus.AVAILABLE, roomRepository.findById(room.getId()).orElseThrow().getRoomStatus());
        assertEquals(CartHoldStatus.CANCELLED,
                cartHoldRepository.findByHoldToken(token).orElseThrow().getStatus());
    }

    @Test
    void newCartHoldExpiresAfterOneMinute() throws Exception {
        LocalDateTime before = LocalDateTime.now();
        String response = createHold();
        LocalDateTime expiresAt = LocalDateTime.parse(
                objectMapper.readTree(response).path("data").path("expiresAt").asText());

        long seconds = Duration.between(before, expiresAt).getSeconds();
        assertTrue(seconds >= 60 - 10 && seconds <= 60 + 10,
                "Cart hold should expire in approximately one minute, actual seconds: " + seconds);
    }

    @Test
    void competingCartHoldReceivesConflict() throws Exception {
        createHold();

        mockMvc.perform(post("/api/v1/cart-holds")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(holdRequest())))
                .andExpect(status().isConflict());
    }

    @Test
    void updatingCartHoldReplacesItemsWithoutChangingTheHoldToken() throws Exception {
        String response = createHold();
        String token = objectMapper.readTree(response).path("data").path("holdToken").asText();
        LocalDateTime initialExpiresAt = LocalDateTime.parse(
                objectMapper.readTree(response).path("data").path("expiresAt").asText());
        LocalDateTime checkIn = LocalDateTime.now().plusDays(4);
        LocalDateTime checkOut = LocalDateTime.now().plusDays(5);
        LocalDateTime beforeUpdate = LocalDateTime.now();

        String updatedResponse = mockMvc.perform(put("/api/v1/cart-holds/" + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(holdRequest(checkIn, checkOut))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.holdToken", is(token)))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].checkInDate", startsWith(checkIn.toString().substring(0, 16))))
                .andReturn().getResponse().getContentAsString();

        LocalDateTime updatedExpiresAt = LocalDateTime.parse(
                objectMapper.readTree(updatedResponse).path("data").path("expiresAt").asText());
        assertTrue(updatedExpiresAt.isAfter(initialExpiresAt));
        assertTrue(updatedExpiresAt.isAfter(beforeUpdate.plusSeconds(45)),
                "Updating a cart hold should refresh its expiry to approximately one minute from the update");

        assertEquals(RoomStatus.RESERVED, roomRepository.findById(room.getId()).orElseThrow().getRoomStatus());
    }

    @Test
    void overlappingItemsInOneCartCannotReserveTheSameRoomTwice() throws Exception {
        CartHoldItemRequest item = CartHoldItemRequest.builder()
                .roomTypeId(roomType.getId())
                .checkInDate(LocalDateTime.now().plusDays(2))
                .checkOutDate(LocalDateTime.now().plusDays(3))
                .quantity(1)
                .build();

        mockMvc.perform(post("/api/v1/cart-holds")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(CartHoldRequest.builder()
                                .items(java.util.List.of(item, item))
                                .build())))
                .andExpect(status().isConflict());

    }

    @Test
    void expiredCartHoldIsReleasedAndCannotCheckout() throws Exception {
        String response = createHold();
        String token = objectMapper.readTree(response).path("data").path("holdToken").asText();
        CartHold hold = cartHoldRepository.findByHoldToken(token).orElseThrow();
        hold.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        cartHoldRepository.save(hold);

        cartHoldService.expireHolds();

        assertEquals(CartHoldStatus.EXPIRED, cartHoldRepository.findByHoldToken(token).orElseThrow().getStatus());
        assertEquals(RoomStatus.AVAILABLE, roomRepository.findById(room.getId()).orElseThrow().getRoomStatus());
        mockMvc.perform(post("/api/v1/cart-holds/" + token + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutJson(holdItemId(response))))
                .andExpect(status().isConflict());
    }

    @Test
    void checkoutConvertsCartHoldIntoBookingAndInvoice() throws Exception {
        String response = createHold();
        long itemId = holdItemId(response);
        String token = objectMapper.readTree(response).path("data").path("holdToken").asText();

        mockMvc.perform(post("/api/v1/cart-holds/" + token + "/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutJson(itemId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookings", hasSize(1)))
                .andExpect(jsonPath("$.data.bookings[0].bookingStatus", is("PENDING_PAYMENT")));

        CartHold converted = cartHoldRepository.findByHoldToken(token).orElseThrow();
        assertEquals(CartHoldStatus.CONVERTED, converted.getStatus());
        Booking booking = bookingRepository.findAll().stream()
                .filter(item -> item.getCustomer().getId().equals(customer.getId()))
                .findFirst().orElseThrow();
        assertEquals(BookingStatus.PENDING_PAYMENT, booking.getBookingStatus());
        assertEquals(PaymentStatus.PENDING, booking.getInvoice().getPaymentStatus());
        assertEquals(RoomStatus.RESERVED, roomRepository.findById(room.getId()).orElseThrow().getRoomStatus());
    }

    private String createHold() throws Exception {
        return mockMvc.perform(post("/api/v1/cart-holds")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(holdRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.holdToken").isNotEmpty())
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andReturn().getResponse().getContentAsString();
    }

    private CartHoldRequest holdRequest() {
        return holdRequest(LocalDateTime.now().plusDays(2), LocalDateTime.now().plusDays(3));
    }

    private CartHoldRequest holdRequest(LocalDateTime checkIn, LocalDateTime checkOut) {
        return CartHoldRequest.builder()
                .items(java.util.List.of(CartHoldItemRequest.builder()
                        .roomTypeId(roomType.getId())
                        .checkInDate(checkIn)
                        .checkOutDate(checkOut)
                        .quantity(1)
                        .build()))
                .build();
    }

    private long holdItemId(String response) throws Exception {
        return objectMapper.readTree(response).path("data").path("items").get(0).path("id").asLong();
    }

    private String checkoutJson(long holdItemId) throws Exception {
        return objectMapper.writeValueAsString(java.util.Map.of(
                "customerId", customer.getId(),
                "items", java.util.List.of(java.util.Map.of(
                        "holdItemId", holdItemId,
                        "roomGuests", java.util.List.of(java.util.Map.of(
                                "adults", 1,
                                "children", 0,
                                "infants", 0))))));
    }
}
