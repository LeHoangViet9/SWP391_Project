package com.hms.config.audit;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventType;
import org.hibernate.internal.SessionFactoryImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HibernateListenerConfigurer {

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    @Autowired
    private AuditEventListener auditEventListener;

    @PostConstruct
    public void registerListeners() {
        SessionFactory sessionFactory = entityManagerFactory.unwrap(SessionFactory.class);
        EventListenerRegistry registry = ((SessionFactoryImpl) sessionFactory).getServiceRegistry().getService(EventListenerRegistry.class);

        registry.getEventListenerGroup(EventType.POST_INSERT).appendListener(auditEventListener);
        registry.getEventListenerGroup(EventType.POST_UPDATE).appendListener(auditEventListener);
        registry.getEventListenerGroup(EventType.POST_DELETE).appendListener(auditEventListener);
    }
}
