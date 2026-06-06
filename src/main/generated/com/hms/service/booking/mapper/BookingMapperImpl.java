package com.hms.service.booking.mapper;

import com.hms.dto.booking.request.BookingRequest;
import com.hms.dto.booking.response.BookingResponse;
import com.hms.entity.booking.Booking;
import com.hms.entity.customer.Customer;
import com.hms.entity.hotel.RoomType;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-06T22:23:44+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.9 (Oracle Corporation)"
)
@Component
public class BookingMapperImpl implements BookingMapper {

    @Override
    public Booking toEntity(BookingRequest request) {
        if ( request == null ) {
            return null;
        }

        Booking.BookingBuilder booking = Booking.builder();

        booking.checkInDate( request.getCheckInDate() );
        booking.checkOutDate( request.getCheckOutDate() );

        return booking.build();
    }

    @Override
    public BookingResponse toResponse(Booking booking) {
        if ( booking == null ) {
            return null;
        }

        BookingResponse bookingResponse = new BookingResponse();

        bookingResponse.setCustomerId( bookingCustomerId( booking ) );
        bookingResponse.setCustomerName( bookingCustomerFullName( booking ) );
        bookingResponse.setRoomTypeId( bookingRoomTypeId( booking ) );
        bookingResponse.setRoomTypeName( bookingRoomTypeTypeName( booking ) );
        bookingResponse.setId( booking.getId() );
        bookingResponse.setCheckInDate( booking.getCheckInDate() );
        bookingResponse.setCheckOutDate( booking.getCheckOutDate() );
        bookingResponse.setBookingStatus( booking.getBookingStatus() );
        bookingResponse.setTotalPrice( booking.getTotalPrice() );

        return bookingResponse;
    }

    @Override
    public void updateBookingFromRequest(BookingRequest request, Booking booking) {
        if ( request == null ) {
            return;
        }

        booking.setCheckInDate( request.getCheckInDate() );
        booking.setCheckOutDate( request.getCheckOutDate() );
    }

    private Long bookingCustomerId(Booking booking) {
        if ( booking == null ) {
            return null;
        }
        Customer customer = booking.getCustomer();
        if ( customer == null ) {
            return null;
        }
        Long id = customer.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String bookingCustomerFullName(Booking booking) {
        if ( booking == null ) {
            return null;
        }
        Customer customer = booking.getCustomer();
        if ( customer == null ) {
            return null;
        }
        String fullName = customer.getFullName();
        if ( fullName == null ) {
            return null;
        }
        return fullName;
    }

    private Long bookingRoomTypeId(Booking booking) {
        if ( booking == null ) {
            return null;
        }
        RoomType roomType = booking.getRoomType();
        if ( roomType == null ) {
            return null;
        }
        Long id = roomType.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String bookingRoomTypeTypeName(Booking booking) {
        if ( booking == null ) {
            return null;
        }
        RoomType roomType = booking.getRoomType();
        if ( roomType == null ) {
            return null;
        }
        String typeName = roomType.getTypeName();
        if ( typeName == null ) {
            return null;
        }
        return typeName;
    }
}
