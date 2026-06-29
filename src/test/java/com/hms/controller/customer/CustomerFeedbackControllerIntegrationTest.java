package com.hms.controller.customer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.common.enums.AccountStatus;
import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.FeedbackStatus;
import com.hms.common.enums.IdType;
import com.hms.dto.customer.request.CustomerFeedbackRequest;
import com.hms.dto.customer.request.FeedbackReplyRequest;
import com.hms.entity.booking.Booking;
import com.hms.entity.customer.Customer;
import com.hms.entity.customer.CustomerFeedback;
import com.hms.entity.hotel.RoomType;
import com.hms.repository.booking.BookingRepository;
import com.hms.repository.customer.CustomerFeedbackRepository;
import com.hms.repository.customer.CustomerRepository;
import com.hms.repository.hotel.RoomTypeRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class CustomerFeedbackControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private CustomerFeedbackRepository customerFeedbackRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ObjectMapper objectMapper;

    private Customer testCustomer;
    private Customer otherCustomer;
    private RoomType testRoomType;
    private Booking testBooking;
    private Booking pendingBooking;

    @BeforeEach
    void setUp() {
        // Clear tables to ensure isolation
        entityManager.createNativeQuery("TRUNCATE TABLE customer_feedback, bookings, customers, room_type RESTART IDENTITY CASCADE").executeUpdate();

        // 1. Create Active Customer
        testCustomer = Customer.builder()
                .fullName("John Doe Test")
                .email("test.john.doe@hms-test.com")
                .phone("0999999999")
                .idNumberCard("999999999")
                .idType(IdType.CCCD)
                .nationality("Vietnam")
                .status(AccountStatus.ACTIVE)
                .build();
        testCustomer = customerRepository.save(testCustomer);

        // 2. Create Other Customer
        otherCustomer = Customer.builder()
                .fullName("Other Customer")
                .email("other.customer@hms-test.com")
                .phone("0888888888")
                .idNumberCard("888888888")
                .idType(IdType.CCCD)
                .nationality("Vietnam")
                .status(AccountStatus.ACTIVE)
                .build();
        otherCustomer = customerRepository.save(otherCustomer);

        // 3. Create Room Type
        testRoomType = RoomType.builder()
                .typeName("Standard Deluxe")
                .basePrice(600000)
                .maxGuests(2)
                .status(AccountStatus.ACTIVE)
                .build();
        testRoomType = roomTypeRepository.save(testRoomType);

        // 4. Create Checked Out Booking for testCustomer
        testBooking = Booking.builder()
                .customer(testCustomer)
                .roomType(testRoomType)
                .pricePerNight(new BigDecimal("600000"))
                .quantity(1)
                .checkInDate(LocalDateTime.now().minusDays(5))
                .checkOutDate(LocalDateTime.now().minusDays(3))
                .bookingStatus(BookingStatus.CHECKED_OUT)
                .totalPrice(new BigDecimal("1200000"))
                .build();
        testBooking = bookingRepository.save(testBooking);

        // 5. Create Checked In Booking (not Checked Out) for testCustomer
        pendingBooking = Booking.builder()
                .customer(testCustomer)
                .roomType(testRoomType)
                .pricePerNight(new BigDecimal("600000"))
                .quantity(1)
                .checkInDate(LocalDateTime.now().minusDays(2))
                .checkOutDate(LocalDateTime.now().plusDays(2))
                .bookingStatus(BookingStatus.CHECKED_IN)
                .totalPrice(new BigDecimal("2400000"))
                .build();
        pendingBooking = bookingRepository.save(pendingBooking);
    }

    private RequestPostProcessor mockAuthentication(String email, String... authorities) {
        List<SimpleGrantedAuthority> auths = Arrays.stream(authorities)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(email, null, auths);
        return authentication(auth);
    }

    @Test
    void createFeedback_Success() throws Exception {
        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(testBooking.getId());
        request.setRating(5);
        request.setCategory("Room");
        request.setComment("Excellent room condition and view!");

        mockMvc.perform(post("/api/v1/feedbacks")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.bookingId", is(testBooking.getId().intValue())))
                .andExpect(jsonPath("$.data.customerName", is("John Doe Test")))
                .andExpect(jsonPath("$.data.roomTypeName", is("Standard Deluxe")))
                .andExpect(jsonPath("$.data.rating", is(5)))
                .andExpect(jsonPath("$.data.category", is("Room")))
                .andExpect(jsonPath("$.data.comment", is("Excellent room condition and view!")))
                .andExpect(jsonPath("$.data.status", is("PENDING")));
    }

    @Test
    void createFeedback_BookingNotFound() throws Exception {
        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(99999L);
        request.setRating(4);
        request.setCategory("Service");
        request.setComment("N/A");

        mockMvc.perform(post("/api/v1/feedbacks")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isNotFound());
    }

    @Test
    void createFeedback_NotBookingOwner() throws Exception {
        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(testBooking.getId()); // testBooking belongs to testCustomer
        request.setRating(4);
        request.setCategory("Service");
        request.setComment("Should fail");

        mockMvc.perform(post("/api/v1/feedbacks")
                        .with(mockAuthentication("other.customer@hms-test.com", "FEEDBACK_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createFeedback_NotCheckedOut() throws Exception {
        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(pendingBooking.getId()); // Status is CHECKED_IN
        request.setRating(4);
        request.setCategory("Service");
        request.setComment("Should fail because not checked out yet");

        mockMvc.perform(post("/api/v1/feedbacks")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createFeedback_AlreadyExists() throws Exception {
        // Save first feedback
        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(testBooking)
                .customer(testCustomer)
                .rating(5)
                .category("Room")
                .comment("First review")
                .status(FeedbackStatus.PENDING)
                .build();
        customerFeedbackRepository.save(feedback);

        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(testBooking.getId());
        request.setRating(4);
        request.setCategory("Service");
        request.setComment("Second review attempt");

        mockMvc.perform(post("/api/v1/feedbacks")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isConflict());
    }

    @Test
    void createFeedback_InvalidCategory() throws Exception {
        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(testBooking.getId());
        request.setRating(5);
        request.setCategory("InvalidCategoryName");
        request.setComment("Bad category");

        mockMvc.perform(post("/api/v1/feedbacks")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getMyFeedbacks_Success() throws Exception {
        // Pre-save feedback
        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(testBooking)
                .customer(testCustomer)
                .rating(5)
                .category("Room")
                .comment("Excellent room!")
                .status(FeedbackStatus.PENDING)
                .build();
        customerFeedbackRepository.save(feedback);

        mockMvc.perform(get("/api/v1/feedbacks/my")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_VIEW_OWN"))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].comment", is("Excellent room!")));
    }

    @Test
    void updateMyFeedback_Success() throws Exception {
        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(testBooking)
                .customer(testCustomer)
                .rating(5)
                .category("Room")
                .comment("Initial review")
                .status(FeedbackStatus.PENDING)
                .build();
        feedback = customerFeedbackRepository.save(feedback);

        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(testBooking.getId());
        request.setRating(4);
        request.setCategory("Service");
        request.setComment("Updated review comments");

        mockMvc.perform(put("/api/v1/feedbacks/my/" + feedback.getId())
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_UPDATE_OWN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.rating", is(4)))
                .andExpect(jsonPath("$.data.category", is("Service")))
                .andExpect(jsonPath("$.data.comment", is("Updated review comments")));
    }

    @Test
    void updateMyFeedback_CannotUpdateAfterReply() throws Exception {
        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(testBooking)
                .customer(testCustomer)
                .rating(5)
                .category("Room")
                .comment("Reviewed review")
                .status(FeedbackStatus.REVIEWED) // status is already reviewed
                .build();
        feedback = customerFeedbackRepository.save(feedback);

        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(testBooking.getId());
        request.setRating(4);
        request.setCategory("Service");
        request.setComment("Updated review comments");

        mockMvc.perform(put("/api/v1/feedbacks/my/" + feedback.getId())
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_UPDATE_OWN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteMyFeedback_Success() throws Exception {
        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(testBooking)
                .customer(testCustomer)
                .rating(5)
                .category("Room")
                .comment("Review to delete")
                .status(FeedbackStatus.PENDING)
                .build();
        feedback = customerFeedbackRepository.save(feedback);

        mockMvc.perform(delete("/api/v1/feedbacks/my/" + feedback.getId())
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_DELETE_OWN"))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        assertFalse(customerFeedbackRepository.findById(feedback.getId()).isPresent());
    }

    @Test
    void searchFeedback_Success() throws Exception {
        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(testBooking)
                .customer(testCustomer)
                .rating(5)
                .category("Room")
                .comment("Nice experience")
                .status(FeedbackStatus.PENDING)
                .build();
        customerFeedbackRepository.save(feedback);

        mockMvc.perform(get("/api/v1/feedbacks")
                        .with(mockAuthentication("manager@hms.com", "FEEDBACK_VIEW"))
                        .param("rating", "5")
                        .param("category", "Room")
                        .param("status", "PENDING")
                        .param("keyword", "Nice")
                        .locale(Locale.ENGLISH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].comment", is("Nice experience")));
    }

    @Test
    void replyFeedback_Success() throws Exception {
        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(testBooking)
                .customer(testCustomer)
                .rating(5)
                .category("Room")
                .comment("Nice room")
                .status(FeedbackStatus.PENDING)
                .build();
        feedback = customerFeedbackRepository.save(feedback);

        FeedbackReplyRequest replyRequest = new FeedbackReplyRequest();
        replyRequest.setReply("Thank you for your feedback!");

        mockMvc.perform(put("/api/v1/feedbacks/" + feedback.getId() + "/reply")
                        .with(mockAuthentication("manager@hms.com", "FEEDBACK_UPDATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(replyRequest))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("REVIEWED")))
                .andExpect(jsonPath("$.data.reply", is("Thank you for your feedback!")))
                .andExpect(jsonPath("$.data.replyAt", notNullValue()));
    }

    @Test
    void deleteFeedback_Success() throws Exception {
        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(testBooking)
                .customer(testCustomer)
                .rating(5)
                .category("Room")
                .comment("Nice room")
                .status(FeedbackStatus.PENDING)
                .build();
        feedback = customerFeedbackRepository.save(feedback);

        mockMvc.perform(delete("/api/v1/feedbacks/" + feedback.getId())
                        .with(mockAuthentication("manager@hms.com", "FEEDBACK_DELETE"))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        assertFalse(customerFeedbackRepository.findById(feedback.getId()).isPresent());
    }

    // --- Validation failure test cases requested by user ---

    @Test
    void createFeedback_NullBookingId() throws Exception {
        // Trường hợp không chọn đơn phòng (bookingId is null)
        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(null);
        request.setRating(5);
        request.setCategory("Room");
        request.setComment("Excellent room!");

        mockMvc.perform(post("/api/v1/feedbacks")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Validation failed")));
    }

    @Test
    void createFeedback_NullRating() throws Exception {
        // Trường hợp không chọn đánh giá sao (rating is null)
        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(testBooking.getId());
        request.setRating(null);
        request.setCategory("Room");
        request.setComment("Excellent room!");

        mockMvc.perform(post("/api/v1/feedbacks")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Validation failed")));
    }

    @Test
    void createFeedback_BlankComment() throws Exception {
        // Trường hợp không điền chữ vào bình luận (comment is empty / blank)
        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(testBooking.getId());
        request.setRating(5);
        request.setCategory("Room");
        request.setComment("    "); // blank comment

        mockMvc.perform(post("/api/v1/feedbacks")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Validation failed")));
    }

    @Test
    void createFeedback_BlankCategory() throws Exception {
        // Trường hợp không chọn loại danh mục phản hồi (category is blank)
        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(testBooking.getId());
        request.setRating(5);
        request.setCategory("");
        request.setComment("Excellent room!");

        mockMvc.perform(post("/api/v1/feedbacks")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Validation failed")));
    }

    @Test
    void createFeedback_CommentExceedingLimit() throws Exception {
        // Trường hợp bình luận vượt quá giới hạn 2000 ký tự
        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(testBooking.getId());
        request.setRating(5);
        request.setCategory("Room");
        
        // Tạo chuỗi có 2001 ký tự
        String longComment = "a".repeat(2001);
        request.setComment(longComment);

        mockMvc.perform(post("/api/v1/feedbacks")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Validation failed")));
    }

    @Test
    void createFeedback_RatingExceedingLimit() throws Exception {
        // Trường hợp đánh giá sao vượt quá giới hạn (ví dụ: rating = 6)
        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(testBooking.getId());
        request.setRating(6);
        request.setCategory("Room");
        request.setComment("Excellent room!");

        mockMvc.perform(post("/api/v1/feedbacks")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Validation failed")));
    }

    @Test
    void updateMyFeedback_NotFound() throws Exception {
        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(testBooking.getId());
        request.setRating(4);
        request.setCategory("Service");
        request.setComment("Updated review comments");

        mockMvc.perform(put("/api/v1/feedbacks/my/99999")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_UPDATE_OWN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateMyFeedback_NotOwner() throws Exception {
        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(testBooking)
                .customer(testCustomer)
                .rating(5)
                .category("Room")
                .comment("Initial review")
                .status(FeedbackStatus.PENDING)
                .build();
        feedback = customerFeedbackRepository.save(feedback);

        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(testBooking.getId());
        request.setRating(4);
        request.setCategory("Service");
        request.setComment("Updated review comments");

        // Request made by otherCustomer, but feedback belongs to testCustomer
        mockMvc.perform(put("/api/v1/feedbacks/my/" + feedback.getId())
                        .with(mockAuthentication("other.customer@hms-test.com", "FEEDBACK_UPDATE_OWN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteMyFeedback_NotFound() throws Exception {
        mockMvc.perform(delete("/api/v1/feedbacks/my/99999")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_DELETE_OWN"))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteMyFeedback_NotOwner() throws Exception {
        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(testBooking)
                .customer(testCustomer)
                .rating(5)
                .category("Room")
                .comment("Review to delete")
                .status(FeedbackStatus.PENDING)
                .build();
        feedback = customerFeedbackRepository.save(feedback);

        // Delete request made by otherCustomer, but feedback belongs to testCustomer
        mockMvc.perform(delete("/api/v1/feedbacks/my/" + feedback.getId())
                        .with(mockAuthentication("other.customer@hms-test.com", "FEEDBACK_DELETE_OWN"))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isNotFound());
    }

    @Test
    void replyFeedback_NotFound() throws Exception {
        FeedbackReplyRequest replyRequest = new FeedbackReplyRequest();
        replyRequest.setReply("Thank you!");

        mockMvc.perform(put("/api/v1/feedbacks/99999/reply")
                        .with(mockAuthentication("manager@hms.com", "FEEDBACK_UPDATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(replyRequest))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteFeedback_NotFound() throws Exception {
        mockMvc.perform(delete("/api/v1/feedbacks/99999")
                        .with(mockAuthentication("manager@hms.com", "FEEDBACK_DELETE"))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isNotFound());
    }

    @Test
    void createFeedback_RatingLessThanOne() throws Exception {
        CustomerFeedbackRequest request = new CustomerFeedbackRequest();
        request.setBookingId(testBooking.getId());
        request.setRating(0);
        request.setCategory("Room");
        request.setComment("Excellent room!");

        mockMvc.perform(post("/api/v1/feedbacks")
                        .with(mockAuthentication("test.john.doe@hms-test.com", "FEEDBACK_CREATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Validation failed")));
    }

    @Test
    void searchFeedback_InvalidStatus() throws Exception {
        mockMvc.perform(get("/api/v1/feedbacks")
                        .with(mockAuthentication("manager@hms.com", "FEEDBACK_VIEW"))
                        .param("status", "INVALID_STATUS")
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Invalid feedback status")));
    }

    @Test
    void replyFeedback_BlankReply() throws Exception {
        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(testBooking)
                .customer(testCustomer)
                .rating(5)
                .category("Room")
                .comment("Nice room")
                .status(FeedbackStatus.PENDING)
                .build();
        feedback = customerFeedbackRepository.save(feedback);

        FeedbackReplyRequest replyRequest = new FeedbackReplyRequest();
        replyRequest.setReply("   "); // blank reply

        mockMvc.perform(put("/api/v1/feedbacks/" + feedback.getId() + "/reply")
                        .with(mockAuthentication("manager@hms.com", "FEEDBACK_UPDATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(replyRequest))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Validation failed")));
    }

    @Test
    void replyFeedback_ReplyExceedingLimit() throws Exception {
        CustomerFeedback feedback = CustomerFeedback.builder()
                .booking(testBooking)
                .customer(testCustomer)
                .rating(5)
                .category("Room")
                .comment("Nice room")
                .status(FeedbackStatus.PENDING)
                .build();
        feedback = customerFeedbackRepository.save(feedback);

        FeedbackReplyRequest replyRequest = new FeedbackReplyRequest();
        String longReply = "a".repeat(1001);
        replyRequest.setReply(longReply);

        mockMvc.perform(put("/api/v1/feedbacks/" + feedback.getId() + "/reply")
                        .with(mockAuthentication("manager@hms.com", "FEEDBACK_UPDATE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(replyRequest))
                        .locale(Locale.ENGLISH))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Validation failed")));
    }

    @Test
    void getFeedbackStats_Success() throws Exception {
        CustomerFeedback feedback1 = CustomerFeedback.builder()
                .booking(testBooking)
                .customer(testCustomer)
                .rating(5)
                .category("Room")
                .comment("Excellent room!")
                .status(FeedbackStatus.PENDING)
                .build();
        customerFeedbackRepository.save(feedback1);

        Booking otherBooking = Booking.builder()
                .customer(otherCustomer)
                .roomType(testRoomType)
                .pricePerNight(new BigDecimal("600000"))
                .quantity(1)
                .checkInDate(LocalDateTime.now().minusDays(10))
                .checkOutDate(LocalDateTime.now().minusDays(8))
                .bookingStatus(BookingStatus.CHECKED_OUT)
                .totalPrice(new BigDecimal("1200000"))
                .build();
        otherBooking = bookingRepository.save(otherBooking);

        CustomerFeedback feedback2 = CustomerFeedback.builder()
                .booking(otherBooking)
                .customer(otherCustomer)
                .rating(4)
                .category("Room")
                .comment("Good service")
                .status(FeedbackStatus.PENDING)
                .build();
        customerFeedbackRepository.save(feedback2);

        mockMvc.perform(get("/api/v1/feedbacks/stats")
                        .with(mockAuthentication("manager@hms.com", "FEEDBACK_VIEW"))
                        .param("category", "Room")
                        .locale(Locale.ENGLISH))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalReviews", is(2)))
                .andExpect(jsonPath("$.data.averageRating", is(4.5)))
                .andExpect(jsonPath("$.data.ratingDistribution.5", is(1)))
                .andExpect(jsonPath("$.data.ratingDistribution.4", is(1)))
                .andExpect(jsonPath("$.data.ratingDistribution.3", is(0)));
    }
}
