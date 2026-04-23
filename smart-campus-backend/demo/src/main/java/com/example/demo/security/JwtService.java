package com.example.demo.security;

import com.example.demo.model.User;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.time.Instant;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
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
}
