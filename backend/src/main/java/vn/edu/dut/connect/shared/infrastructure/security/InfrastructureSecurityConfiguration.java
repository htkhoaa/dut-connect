package vn.edu.dut.connect.shared.infrastructure.security;

import java.util.List;
import java.util.Map;
import javax.crypto.spec.SecretKeySpec;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.AuthorizationFilter;
import org.springframework.security.crypto.password.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.web.cors.*;
import org.springframework.web.filter.CorsFilter;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.beans.factory.annotation.Qualifier;
import vn.edu.dut.connect.identity.infrastructure.security.*;

/**
 * Stateless bearer authentication with explicitly protected cookie flows.
 */
@Configuration(proxyBeanMethods = false)
public class InfrastructureSecurityConfiguration {
    @Bean
    CorsFilter corsFilter(@Qualifier("corsConfigurationSource") CorsConfigurationSource source, SecurityErrorWriter errors) {
        CorsFilter filter = new CorsFilter(source);
        filter.setCorsProcessor(new ApiCorsProcessor(errors));
        return filter;
    }

    @Bean
    FilterRegistrationBean<CorsFilter> corsFilterRegistration(CorsFilter filter) {
        FilterRegistrationBean<CorsFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    JwtEncoder jwtEncoder(IdentitySettings settings) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(settings.secret()));
    }

    @Bean
    JwtDecoder jwtDecoder(IdentitySettings settings) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(new SecretKeySpec(settings.secret(), "HmacSHA256"))
                .macAlgorithm(MacAlgorithm.HS256).build();
        MappedJwtClaimSetConverter claims = MappedJwtClaimSetConverter.withDefaults(Map.of());
        decoder.setClaimSetConverter(raw -> {
            // Spring's default converter synthesizes iat from exp when it is absent.
            if (raw.get("iat") == null) throw new BadJwtException("Issued-at claim required");
            return claims.convert(raw);
        });
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer("dut-connect"), new IdentityJwtValidator()));
        return decoder;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(IdentitySettings settings) {
        CorsConfiguration cors = new CorsConfiguration();
        cors.setAllowedOrigins(settings.origins());
        cors.setAllowCredentials(true);
        cors.setAllowedMethods(List.of("GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        cors.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-Id"));
        cors.setExposedHeaders(List.of("X-Request-Id", "Location", "Content-Disposition"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", cors);
        return source;
    }

    @Bean
    SecurityFilterChain infrastructureSecurityFilterChain(HttpSecurity http, ActiveUserJwtConverter converter,
                                                          IdentitySettings settings, SecurityErrorWriter errors) throws Exception {
        return http
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .requestCache(AbstractHttpConfigurer::disable)
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> {
                })
                .addFilterBefore(new CookieOriginFilter(settings, errors), AuthorizationFilter.class)
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.GET, "/api/v1/system/edition").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/actuator/health", "/api/actuator/health/**").permitAll()
                        .requestMatchers(HttpMethod.HEAD, "/api/actuator/health", "/api/actuator/health/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/skills").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/activities", "/api/v1/activities/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/campaign-categories", "/api/v1/campaigns", "/api/v1/campaigns/*").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/organizations", "/api/v1/organizations/*").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login", "/api/v1/auth/refresh").permitAll()
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((r, s, x) -> errors.write(r, s, 401, "AUTHENTICATION_REQUIRED", "Authentication required"))
                        .accessDeniedHandler((r, s, x) -> errors.write(r, s, 403, "ACCESS_DENIED", "Permission denied")))
                .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(converter))
                        .authenticationEntryPoint((r, s, x) -> {
                            if (x instanceof OAuth2AuthenticationException oauth
                                    && "temporarily_unavailable".equals(oauth.getError().getErrorCode()))
                                errors.write(r, s, 503, "SERVICE_UNAVAILABLE", "Authentication temporarily unavailable");
                            else errors.write(r, s, 401, "AUTHENTICATION_REQUIRED", "Invalid or expired authentication");
                        })
                        .accessDeniedHandler((r, s, x) -> errors.write(r, s, 403, "ACCESS_DENIED", "Permission denied")))
                .build();
    }
}
