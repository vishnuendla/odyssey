package com.odyssey.controller;

import com.odyssey.dto.AuthRequest;
import com.odyssey.dto.UserDto;
import com.odyssey.security.JwtTokenProvider;
import com.odyssey.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtTokenProvider tokenProvider;

    public AuthController(AuthService authService, JwtTokenProvider tokenProvider) {
        this.authService = authService;
        this.tokenProvider = tokenProvider;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody AuthRequest request, HttpServletResponse response) {
        UserDto user = authService.registerUser(request);

        String token = tokenProvider.createToken(request.getEmail());
        addAuthCookie(response, token);

        Map<String, Object> res = new HashMap<>();
        res.put("user", user);
        res.put("token", token);

        return ResponseEntity.ok(res);
    }


    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody AuthRequest request, HttpServletResponse response) {
        UserDto user = authService.login(request);
        
        // Generate JWT token
        String token = tokenProvider.createToken(request.getEmail());
        addAuthCookie(response, token);

        // Prepare response with user + token
        Map<String, Object> res = new HashMap<>();
        res.put("user", user);
        res.put("token", token);

        return ResponseEntity.ok(res);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        UserDto user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(user);
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<UserDto> getUserById(@PathVariable String userId) {
        UserDto user = authService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        // Clear the auth cookie
        Cookie cookie = new Cookie("auth_token", null);
        cookie.setPath("/");
        cookie.setHttpOnly(true);
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        
        return ResponseEntity.ok().build();
    }

    

    private void addAuthCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("odyssey-token", token); // Match name in resolveToken()
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(86400); // 1 hour
        response.addCookie(cookie);
    }
    
}
