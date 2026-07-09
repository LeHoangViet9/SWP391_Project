package com.hms.common.audit;

import com.hms.service.audit.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.LinkedHashMap;
import java.util.Map;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private final AuditLogService auditLogService;

    @Around("@annotation(com.hms.common.audit.Auditable)")
    public Object writeAuditLog(ProceedingJoinPoint joinPoint) throws Throwable {
        Method method = ((MethodSignature) joinPoint.getSignature()).getMethod();
        Auditable auditable = method.getAnnotation(Auditable.class);
        Map<String, Object> before = Map.of("methodArgs", extractArgs(method, joinPoint.getArgs()));

        try {
            Object result = joinPoint.proceed();
            if (auditable.logSuccess()) {
                Map<String, Object> after = new LinkedHashMap<>();
                after.put("result", result);
                auditLogService.logSuccess(
                        auditable.action(),
                        auditable.module(),
                        auditable.resourceType(),
                        null,
                        method.getName(),
                        auditLogService.message(before, after)
                );
            }
            return result;
        } catch (Exception e) {
            auditLogService.logFailure(
                    auditable.action(),
                    auditable.module(),
                    auditable.resourceType(),
                    null,
                    method.getName(),
                    before,
                    e
            );
            throw e;
        }
    }

    private Map<String, Object> extractArgs(Method method, Object[] args) {
        Map<String, Object> values = new LinkedHashMap<>();
        Parameter[] parameters = method.getParameters();
        for (int i = 0; i < args.length; i++) {
            String name = i < parameters.length ? parameters[i].getName() : "arg" + i;
            values.put(name, args[i]);
        }
        return values;
    }
}
