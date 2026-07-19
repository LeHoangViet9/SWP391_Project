package com.hms.entity.booking;

import com.hms.common.enums.BookingStatus;
import com.hms.common.enums.InvoiceType;
import com.hms.entity.auth.User;
import com.hms.entity.customer.Customer;
import com.hms.entity.hotel.Room;
import com.hms.entity.hotel.RoomType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "booking_rooms", joinColumns = @JoinColumn(name = "booking_id"), inverseJoinColumns = @JoinColumn(name = "room_id"))
    private List<Room> rooms = new ArrayList<>();

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "booking_room_guests", joinColumns = @JoinColumn(name = "booking_id"))
    @OrderColumn(name = "room_index")
    private List<RoomGuestAllocation> guestAllocations = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_id", nullable = false)
    private RoomType roomType;

    @Column(name = "price_per_night", nullable = false)
    private BigDecimal pricePerNight;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "check_in_date", nullable = false)
    private LocalDateTime checkInDate;

    @Column(name = "check_out_date", nullable = false)
    private LocalDateTime checkOutDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "booking_status", nullable = false)
    private BookingStatus bookingStatus;

    @Column(name = "total_price", nullable = false)
    private BigDecimal totalPrice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "hold_expires_at")
    private LocalDateTime holdExpiresAt;

    @Column(name = "actual_check_in_time")
    private LocalDateTime actualCheckInTime;

    @Column(name = "actual_check_out_time")
    private LocalDateTime actualCheckOutTime;

    @Column(name = "booking_for_other")
    @Builder.Default
    private Boolean bookingForOther = false;

    @Column(name = "guest_full_name")
    private String guestFullName;

    @Column(name = "guest_email")
    private String guestEmail;

    @Column(name = "guest_phone")
    private String guestPhone;

    @Column(name = "guest_id_type")
    private String guestIdType;

    @Column(name = "guest_id_number_card")
    private String guestIdNumberCard;

    @Column(name = "guest_nationality")
    private String guestNationality;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Invoice> invoices = new ArrayList<>();

    public Invoice getInvoice() {
        if (invoices == null)
            return null;
        return invoices.stream()
                .filter(inv -> inv.getInvoiceType() == InvoiceType.ROOM)
                .findFirst()
                .orElse(null);
    }

    public void setInvoice(Invoice invoice) {
        if (this.invoices == null) {
            this.invoices = new ArrayList<>();
        }
        if (invoice != null) {
            invoice.setBooking(this);
            invoice.setInvoiceType(InvoiceType.ROOM);
            this.invoices.add(invoice);
        }
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
