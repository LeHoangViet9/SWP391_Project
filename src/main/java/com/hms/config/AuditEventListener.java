package com.hms.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hms.common.utils.SecurityUtils;
import com.hms.entity.common.AuditAction;
import com.hms.entity.common.AuditLog;
import com.hms.service.AuditLogService;
import org.hibernate.event.spi.*;
import org.hibernate.persister.entity.EntityPersister;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class AuditEventListener implements PostInsertEventListener, PostUpdateEventListener, PostDeleteEventListener {

    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    @Autowired
    public AuditEventListener(@Lazy AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Override
    public void onPostInsert(PostInsertEvent event) {
        if (event.getEntity() instanceof AuditLog) return;
        saveLog(AuditAction.CREATE, event.getEntity().getClass().getSimpleName(), event.getId().toString(), null, event.getEntity());
    }

    @Override
    public void onPostUpdate(PostUpdateEvent event) {
        if (event.getEntity() instanceof AuditLog) return;
        Map<String, Object> oldState = getEntityState(event.getPersister().getPropertyNames(), event.getOldState());
        Map<String, Object> newState = getEntityState(event.getPersister().getPropertyNames(), event.getState());

        saveLog(AuditAction.UPDATE, event.getEntity().getClass().getSimpleName(), event.getId().toString(), oldState, newState);
    }

    @Override
    public void onPostDelete(PostDeleteEvent event) {
        if (event.getEntity() instanceof AuditLog) return;
        Map<String, Object> oldState = getEntityState(event.getPersister().getPropertyNames(), event.getDeletedState());
        saveLog(AuditAction.DELETE, event.getEntity().getClass().getSimpleName(), event.getId().toString(), oldState, null);
    }

    @Override
    public boolean requiresPostCommitHandling(EntityPersister persister) {
        return false;
    }

    private Map<String, Object> getEntityState(String[] propertyNames, Object[] state) {
        if (propertyNames == null || state == null) return null;
        Map<String, Object> map = new HashMap<>();
        for (int i = 0; i < propertyNames.length; i++) {
            if (state[i] != null && !propertyNames[i].toLowerCase().contains("password")) {
                if (state[i].getClass().getName().startsWith("com.hms.entity")) {
                    map.put(propertyNames[i], "{" + state[i].getClass().getSimpleName() + "}");
                } else {
                    map.put(propertyNames[i], state[i]);
                }
            }
        }
        return map;
    }

    private void saveLog(AuditAction action, String entityName, String recordId, Object oldValue, Object newValue) {
        try {
            String oldJson = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newJson = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            AuditLog log = AuditLog.builder()
                    .userEmail(SecurityUtils.getCurrentUserEmail())
                    .actionType(action)
                    .entityName(entityName)
                    .recordId(recordId)
                    .oldValue(oldJson)
                    .newValue(newJson)
                    .ipAddress(SecurityUtils.getClientIp())
                    .build();

            auditLogService.saveAuditLog(log);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }
}
