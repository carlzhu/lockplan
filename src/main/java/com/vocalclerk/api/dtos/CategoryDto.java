package com.vocalclerk.api.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for transferring category data to and from the API.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
    private UUID id;
    private String name;
    private String color;
    private String icon;
    private boolean isDefault;
    private int taskCount;
}