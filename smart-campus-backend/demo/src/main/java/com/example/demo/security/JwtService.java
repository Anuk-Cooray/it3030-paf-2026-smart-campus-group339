package com.example.demo.security;

import com.example.demo.model.User;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final String secret;
    private final long ttlSeconds;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.ttl-seconds:43200}") long ttlSeconds) {
        this.secret = secret;
        this.ttlSeconds = ttlSeconds;
    }

    public String issueToken(User user) throws Exception {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(ttlSeconds);

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("name", user.getName())
                .claim("role", user.getRole())
                .issueTime(Date.from(now))
                .expirationTime(Date.from(exp))
                .build();

        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(new MACSigner(secret.getBytes()));
        return jwt.serialize();
    }

    public UsernamePasswordAuthenticationToken authenticateToken(String token) throws Exception {
        SignedJWT jwt = SignedJWT.parse(token);
        if (!jwt.verify(new MACVerifier(secret.getBytes()))) {
            throw new IllegalArgumentException("Invalid token signature");
        }

        JWTClaimsSet claims = jwt.getJWTClaimsSet();
        if (claims.getExpirationTime() != null && claims.getExpirationTime().before(new Date())) {
            throw new IllegalArgumentException("Expired token");
        }

        String email = claims.getSubject();
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Token subject is missing");
        }

        String role = (String) claims.getClaim("role");
        if (role == null || role.isBlank()) {
            role = "ROLE_USER";
        }

        var authorities = List.of(new SimpleGrantedAuthority(role.startsWith("ROLE_") ? role : "ROLE_" + role));
        return new UsernamePasswordAuthenticationToken(email, null, authorities);
    }
}
